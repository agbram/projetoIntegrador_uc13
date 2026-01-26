import "dotenv/config";
import express from "express";
import cors from "cors";

import userRoutes from "./routes/user.js";
import orderRoutes from "./routes/order.js";
import productRoutes from "./routes/product.js";
import fixedExpenseRoutes from "./routes/fixedExpense.js";
import customerRoutes from "./routes/customer.js";
import taskRoutes from "./routes/tasks.js"
import { verificaToken } from "./middlewares/auth.js";
import { verificaRule } from "./middlewares/rules.js";
import  supplyRoutes  from "./routes/supply.js";
import  supplyPurchaseRoutes  from "./routes/supplyPurchase.js";
import swaggerJSDoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import path from "path";
import { fileURLToPath } from "url";
import pricingRoutes from './routes/pricing.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


const app = express();
app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API Sant Sapore',           // créditos e versão (visível na UI)
      version: '1.0.0',
      description: 'Documentação gerada com swagger-jsdoc',
    },

    servers: [{ url: 'http://localhost:4000', description: 'Local' }]
  },
  // aponte para os arquivos onde você vai colocar os comentários @openapi
  apis: ['./src/routes/*.js'] // se não usar subpastas
};

const swaggerSpecs = swaggerJSDoc(swaggerOptions);

app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs));




app.use("/users", userRoutes);
app.use("/orders", verificaToken, orderRoutes);
app.use("/products", verificaToken, productRoutes);
app.use("/fixedExpenses", verificaToken, verificaRule("ADM"), fixedExpenseRoutes);
app.use("/customers", verificaToken, verificaRule("ADM"), customerRoutes);
app.use("/supply", verificaToken, supplyRoutes);
app.use("/task", verificaToken, taskRoutes);
app.use("/supplyPurchases", verificaToken, supplyPurchaseRoutes);
app.use("/imagens", express.static(path.join(__dirname, "../imagens")));
app.use('/pricing', pricingRoutes);




app.use((err, _req, res, _next) => {
  console.error(err);
  if (err.code === "P2002") {
    return res.status(409).json({
      error: "Registro duplicado (unique)",
    });
  }

  if (err.code === "P2025") {
    return res.status(404).json({
      error: "Registro não encontrado",
    });
  }
  res.status(500).json({ error: "Erro interno" });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`http://localhost:${PORT}`));