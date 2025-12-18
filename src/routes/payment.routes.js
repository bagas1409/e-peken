import express from "express";
import { createMidtransPayment } from "../controllers/payment.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { roleMiddleware } from "../middlewares/role.middleware.js";

const router = express.Router();

router.post(
  "/midtrans/:orderId",
  authMiddleware,
  roleMiddleware(["USER"]),
  createMidtransPayment
);

export default router;
