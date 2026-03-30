import "dotenv/config";
import express from "express";
import path from "path";
import { fileURLToPath } from "url";

import swaggerJSDoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import helmet from "helmet";

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
export { app };

// app.use(helmet()); // Desativado temporariamente para permitir conexão do Electron

// ============================================
// MIDDLEWARE CORS PRINCIPAL
// ============================================
app.use((req, res, next) => {
  const allowedOrigins = [
    "http://localhost:3000",
    "http://localhost:5173",
    "https://santsaporemanager.netlify.app",
    "http://localhost:3333",
    "http://127.0.0.1:3333"
  ];

  const origin = req.headers.origin;

  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }

  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS, PATCH"
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, X-Requested-With, Accept"
  );
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Max-Age", "86400");

  console.log(
    `[${new Date().toISOString()}] ${req.method} ${req.url} - Origin: ${origin}`
  );

  if (req.method === "OPTIONS") {
    console.log(`✅ Respondendo OPTIONS para ${req.url}`);
    return res.status(200).end();
  }

  next();
});

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
app.use("/users", verificaToken, userRoutes);
app.use("/orders", verificaToken, orderRoutes);
app.use("/products", verificaToken, productRoutes);
app.use(
  "/fixedExpenses",
  verificaToken,
  verificaRule("ADM"),
  fixedExpenseRoutes
);
app.use("/customers",verificaToken, verificaRule("ADM"),
  customerRoutes
);
app.use("/supply", verificaToken, supplyRoutes);
app.use("/task", verificaToken, taskRoutes);
app.use("/supplyPurchases", verificaToken, supplyPurchaseRoutes);
app.use("/pricing",verificaToken, pricingRoutes);

// Arquivos estáticos
app.use("/imagens", express.static(path.join(__dirname, "../imagens")));

// Health check
app.get("/health", (req, res) => {
  res.json({
    status: "online",
    timestamp: new Date().toISOString(),
    cors: "configurado",
    origin: req.headers.origin,
  });
});

app.get("/", (req, res) => {
  res.json({
    status: "API online",
    message: "Backend rodando corretamente 🚀",
    login: "/users/login",
  });
});

// Tratamento de erros
app.use((err, req, res, next) => {
  console.error("ERRO:", err.message);

  if (err.code === "P2002") {
    return res.status(409).json({ error: "Registro duplicado" });
  }

  if (err.code === "P2025") {
    return res.status(404).json({ error: "Registro não encontrado" });
  }

  res.status(500).json({ error: "Erro interno do servidor" });
});

// Server
const PORT = process.env.PORT || 4000;

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`🚀 API rodando na porta ${PORT}`);
    console.log(
      `✅ CORS permitido para: http://localhost:3000, http://localhost:3333, http://localhost:5173 e https://santsaporemanager.netlify.app`
    );
  });
}

export default app;