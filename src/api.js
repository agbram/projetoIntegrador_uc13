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

// Configuração CORS temporária
app.use(cors({
  origin: 'https://santsaporemanager.netlify.app',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  preflightContinue: false,
  optionsSuccessStatus: 204
}));

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));

// Middleware de log para debug
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.url}`);
  console.log('Origin:', req.headers.origin);
  console.log('Headers:', req.headers);
  next();
});

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

// Health check melhorado
app.get("/health", (_req, res) => {
  res.header('Access-Control-Allow-Origin', 'https://santsaporemanager.netlify.app');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.json({ 
    status: "online",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    cors: {
      origin: 'https://santsaporemanager.netlify.app'
    }
  });
});

app.get("/", (req, res) => {
  res.header('Access-Control-Allow-Origin', 'https://santsaporemanager.netlify.app');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.json({
    status: "API online",
    message: "Backend rodando corretamente 🚀",
    version: "1.0.0"
  });
});

// Tratamento de erros CORS
app.use((err, req, res, next) => {
  if (err.message && err.message.includes('CORS')) {
    console.error('Erro CORS:', err.message);
    return res.status(403).json({ 
      error: "Erro CORS", 
      message: "Acesso não permitido para esta origem",
      allowedOrigin: 'https://santsaporemanager.netlify.app'
    });
  }
  next(err);
});

// Tratamento de erros geral
app.use((err, _req, res, _next) => {
  console.error('Erro interno:', err);

  if (err.code === "P2002") {
    return res.status(409).json({ error: "Registro duplicado" });
  }

  if (err.code === "P2025") {
    return res.status(404).json({ error: "Registro não encontrado" });
  }

  res.status(500).json({ error: "Erro interno do servidor" });
});

console.log("Iniciando servidor...");
console.log("NODE_ENV:", process.env.NODE_ENV);
console.log("PORT:", process.env.PORT);

// Server
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`🚀 API rodando na porta ${PORT}`);
  console.log(`✅ CORS configurado para: https://santsaporemanager.netlify.app`);
  console.log(`📄 Documentação: http://localhost:${PORT}/docs`);
});