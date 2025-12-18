import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import meRoutes from "./routes/me.routes.js";
import authRoutes from "./routes/auth.routes.js";
import umkmRoutes from "./routes/umkm.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import productRoutes from "./routes/product.routes.js";
import publicRoutes from "./routes/public.routes.js";
import cartRoutes from "./routes/cart.routes.js";
import checkoutRoutes from "./routes/checkout.routes.js";
import orderRoutes from "./routes/order.routes.js";
import disputeRoutes from "./routes/dispute.routes.js";
import paymentRoutes from "./routes/payment.routes.js";
import midtransRoutes from "./routes/midtrans.routes.js";
import uploadRoutes from "./routes/upload.routes.js";
import { generalLimiter } from "./middlewares/rateLimit.middleware.js";

const app = express();

app.use(helmet());
// ⬇️ INI YANG DIUBAH
app.use(
  cors({
    origin: "*",
  })
);
app.use(morgan("dev"));
app.use(express.json());

// routes
app.use("/auth", authRoutes);
app.use("/me", meRoutes);
app.use("/umkm", umkmRoutes);
app.use("/admin", adminRoutes);
app.use("/public", publicRoutes);
app.use("/products", productRoutes);

app.use("/cart", cartRoutes);
app.use("/checkout", checkoutRoutes);
app.use("/orders", orderRoutes);
app.use("/disputes", disputeRoutes);
app.use("/payments", paymentRoutes);
app.use("/midtrans", midtransRoutes);
app.use("/upload", uploadRoutes);
app.use(generalLimiter);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

export default app;
