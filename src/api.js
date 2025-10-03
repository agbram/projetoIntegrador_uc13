import "dotenv/config";
import express from "express";
import cors from "cors";

import userRoutes from "./routes/user.js";
import orderRoutes from "./routes/order.js";
import productRoutes from "./routes/product.js";
import fixedExpenseRouter from "./routes/fixedExpense.js";
import { verificaToken } from "./middlewares/auth.js";
import customerController from "./controllers/customer.js";


const app = express();
app.use(cors());
app.use(express.json());

app.use("/users", userRoutes);
app.use("/orders", verificaToken, orderRoutes);
app.use("/products", verificaToken, productRoutes);
app.use("/fixedExpenses", fixedExpenseRouter);


app.use("/customers", customerController)

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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`http://localhost:${PORT}`));