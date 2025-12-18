import express from "express";
import {
  shipOrder,
  completeOrder,
  getMyOrders,
} from "../controllers/order.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { roleMiddleware } from "../middlewares/role.middleware.js";

const router = express.Router();

// UMKM kirim barang
router.patch("/:id/ship", authMiddleware, roleMiddleware(["UMKM"]), shipOrder);

// USER konfirmasi terima
router.patch(
  "/:id/complete",
  authMiddleware,
  roleMiddleware(["USER"]),
  completeOrder
);

router.get("/my", authMiddleware, roleMiddleware(["USER"]), getMyOrders);

export default router;
