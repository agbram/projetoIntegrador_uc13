import "dotenv/config";
import express from "express";
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

// MIDDLEWARE CORS MANUAL - MUITO IMPORTANTE
app.use((req, res, next) => {
  const allowedOrigins = ['https://santsaporemanager.netlify.app', 'http://localhost:3000'];
  const origin = req.headers.origin;
  
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Max-Age', '86400'); // 24 hours
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  next();
});

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));

// Middleware de log para debug
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.url}`);
  console.log(`Origin: ${req.headers.origin}`);
  console.log(`User-Agent: ${req.headers['user-agent']}`);
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

// Rotas - IMPORTANTE: A rota /users deve vir primeiro (sem auth)
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
app.get("/health", (req, res) => {
  res.json({
    status: "online",
    timestamp: new Date().toISOString(),
    cors: {
      allowedOrigin: req.headers.origin || "none",
      method: req.method
    }
  });
});

// Root endpoint
app.get("/", (req, res) => {
  res.json({
    message: "API Sant Sapore - Backend Online",
    version: "1.0.0",
    endpoints: {
      login: "/users/login",
      health: "/health",
      docs: "/docs"
    }
  });
});

// Tratamento de erros
app.use((err, req, res, next) => {
  console.error("Erro:", {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    origin: req.headers.origin
  });

  if (err.name === "ValidationError") {
    return res.status(400).json({ error: err.message });
  }

  if (err.code === "P2002") {
    return res.status(409).json({ error: "Registro duplicado" });
  }

  if (err.code === "P2025") {
    return res.status(404).json({ error: "Registro não encontrado" });
  }

  res.status(500).json({ error: "Erro interno do servidor" });
});

// Log de inicialização
console.log("=".repeat(50));
console.log("🚀 Iniciando API Sant Sapore");
console.log("📁 Diretório:", __dirname);
console.log("🌐 Ambiente:", process.env.NODE_ENV || "development");
console.log("🔗 CORS Permitido:");
console.log("   - https://santsaporemanager.netlify.app");
console.log("   - http://localhost:3000");
console.log("=".repeat(50));

// Server
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`✅ Servidor rodando na porta ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`📚 Documentação: http://localhost:${PORT}/docs`);
});