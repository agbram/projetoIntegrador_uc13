import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default function makeUrlFromImagemBase64(imagemData) {
  if (!imagemData) {
    console.log("⚠️ Nenhuma imagem fornecida");
    return null;
  }

  try {
    const [base64Pre, base64Data] = imagemData.split(",");
    const buffer = Buffer.from(base64Data, "base64");

    const uploadDir = path.join(__dirname, "../../imagens");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    const type = base64Pre.split(";")[0].split(":")[1];

    let extensao = "jpg";

    if (type == "image/png") {
      extensao = "png";
    } else if (type == "image/jpg" || type == "image/jpeg") {
      extensao = "jpg";
    } else if (type == "image/gif") {
      extensao = "gif";
    } else if (type == "image/webp") {
      extensao = "webp";
    } else {
      console.warn("⚠️ Tipo de imagem não suportado:", type);
      return null; // ⚠️ MUDANÇA AQUI: Retorna null em vez de usar res
    }

    const filename = `produto-${Date.now()}-${Math.random().toString(36).substring(2, 10)}.${extensao}`;
    const caminhoArquivo = path.join(uploadDir, filename);
    
    fs.writeFileSync(caminhoArquivo, buffer);
    console.log("✅ Imagem salva:", filename);
    
    return filename; // ⚠️ MUDANÇA AQUI: Retorna apenas o nome do arquivo
  } catch (error) {
    console.error("❌ Erro ao salvar imagem:", error);
    return null;
  }
}