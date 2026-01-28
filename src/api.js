import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

import swaggerJSDoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";

// Routes
import userRoutes from "./routes/user.js";
import orderRoutes from "./routes/order.js";
import productRoutes from "./routes/product.js";
import fixedExpenseRoutes from "./routes/fixedexpense.js";
import customerRoutes from "./routes/customer.js";
import taskRoutes from "./routes/tasks.js";
import supplyRoutes from "./routes/supply.js";
import supplyPurchaseRoutes from "./routes/supplyPurchase.js";
import pricingRoutes from "./routes/pricing.js";

// Middlewares
import { verificaToken } from "./middlewares/auth.js";
import { verificaRule } from "./middlewares/rules.js";

// __dirname fix (ESM)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// App
const app = express();

// Defina allowedOrigins primeiro
const allowedOrigins = [
  'https://santsaporemanager.netlify.app', // Seu domínio Netlify
  'http://localhost:3000'             // Para desenvolvimento
];

// Middleware CORS simplificado - REMOVA a rota app.options('*', ...)
// O middleware cors já cuida das requisições OPTIONS automaticamente
app.use(cors({
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));

// Swagger
const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "API Sant Sapore",
      version: "1.0.0",
      description: "Documentação da API",
    },
    servers: [
      {
        url: process.env.API_URL || "http://localhost:4000",
        description: "Servidor",
      },
    ],
  },
  apis: ["./src/routes/*.js"],
};

const swaggerSpecs = swaggerJSDoc(swaggerOptions);
app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpecs));

// Rotas
app.use("/users", userRoutes);
app.use("/orders", verificaToken, orderRoutes);
app.use("/products", verificaToken, productRoutes);
app.use(
  "/fixedExpenses",
  verificaToken,
  verificaRule("ADM"),
  fixedExpenseRoutes
);
app.use(
  "/customers",
  verificaToken,
  verificaRule("ADM"),
  customerRoutes
);
app.use("/supply", verificaToken, supplyRoutes);
app.use("/task", verificaToken, taskRoutes);
app.use("/supplyPurchases", verificaToken, supplyPurchaseRoutes);
app.use("/pricing", pricingRoutes);

// Arquivos estáticos
app.use("/imagens", express.static(path.join(__dirname, "../imagens")));

// Health check endpoint
app.get("/health", (_req, res) => {
  res.json({ 
    status: "online",
    timestamp: new Date().toISOString(),
    cors: {
      allowedOrigins: allowedOrigins
    }
  });
});

app.get("/", (req, res) => {
  res.json({
    status: "API online",
    message: "Backend rodando corretamente 🚀",
    cors: {
      allowedOrigins: allowedOrigins
    }
  });
});

// Tratamento de erros
app.use((err, _req, res, _next) => {
  console.error(err);

  if (err.code === "P2002") {
    return res.status(409).json({ error: "Registro duplicado" });
  }

  if (err.code === "P2025") {
    return res.status(404).json({ error: "Registro não encontrado" });
  }

  res.status(500).json({ error: "Erro interno do servidor" });
});

console.log("DATABASE_URL:", process.env.DATABASE_URL);

// Server
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`🚀 API rodando na porta ${PORT}`);
  console.log(`✅ CORS configurado para: ${allowedOrigins.join(', ')}`);
});