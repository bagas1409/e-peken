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
import healthRoutes from "./routes/health.routes.js";
import wishlistRoutes from "./routes/wishlist.routes.js";
import chatRoutes from "./routes/chat.routes.js";

import { generalLimiter } from "./middlewares/rateLimit.middleware.js";

const app = express();

/* 🔴 WAJIB PALING ATAS (SEBELUM RATE LIMIT) */
app.set("trust proxy", 1);

/* 🔐 SECURITY */
app.use(helmet());
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);

      const allowedOrigins = process.env.CORS_ORIGIN
        ? process.env.CORS_ORIGIN.split(",").map((o) => o.trim())
        : ["*"];

      if (allowedOrigins.includes("*") || allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);
app.use(morgan("dev"));
app.use(express.json());

/* 🧪 ROOT + HEALTH (SEBELUM RATE LIMIT) */
app.get("/", (req, res) => {
  res.json({
    status: "ok",
    message: "API is running",
    env: process.env.NODE_ENV,
  });
});

app.use("/health", healthRoutes);

/* 🚦 RATE LIMIT (SETELAH trust proxy) */
app.use(generalLimiter);

/* 🔗 ROUTES UTAMA */
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
app.use("/wishlist", wishlistRoutes);
app.use("/chats", chatRoutes);

/* ❌ 404 HANDLER (PALING BAWAH) */
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

export default app;
