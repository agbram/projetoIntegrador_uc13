import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Decodifica o código base64 do arquivo de imagem, salva na pasta /imagens e retorna a URL.
 * 
 * @param {string} imagemData Código base64 do arquivo de imagem
 * @returns URL para acessar esse arquivo ou undefined se não for passado o imagemData
 */
export default function makeUrlFromImagemBase64(imagemData) {
  let imagemUrl;

  if (imagemData) {
    const [base64Pre, base64Data] = imagemData.split(",");
    // Converte Base64 para buffer binário
    const buffer = Buffer.from(base64Data, "base64");

    // Garante que a pasta uploads exista
    const uploadDir = path.join(__dirname, "../../imagens");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir);
    }
    const type = base64Pre.split(";")[0].split(":")[1];

    let extensao = "bin"; 

    if (type == "image/png") {
      extensao = "png"
    } else if (type == "image/jpg" || type == "image/jpeg") {
      extensao = "jpg"
    } else {
      return res.status(400).json({ error: "arquivo indesiflado" });
    }

    const filename = `produto-${Math.random()}.${extensao}`;
    // Cria o caminho final do arquivo
    const caminhoArquivo = path.join(uploadDir, filename);
    imagemUrl = `/imagens/${filename}`

    // Salva o arquivo
    fs.writeFileSync(caminhoArquivo, buffer);
  }

  return imagemUrl;
}