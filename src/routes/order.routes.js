import express from "express";
import {
  shipOrder,
  completeOrder,
  getMyOrders,
  getOrderById,
  updateOrderTracking,
  getUmkmOrders,
} from "../controllers/order.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { roleMiddleware } from "../middlewares/role.middleware.js";

const router = express.Router();


// UMKM Actions
router.patch("/:id/ship", authMiddleware, roleMiddleware(["UMKM"]), shipOrder);
router.patch(
  "/:id/tracking",
  authMiddleware,
  roleMiddleware(["UMKM"]),
  updateOrderTracking
);

router.get(
  "/incoming",
  authMiddleware,
  roleMiddleware(["UMKM"]),
  getUmkmOrders
);

// USER konfirmasi terima
router.patch(
  "/:id/complete",
  authMiddleware,
  roleMiddleware(["USER", "UMKM"]),
  completeOrder
);

router.get("/my", authMiddleware, roleMiddleware(["USER", "UMKM"]), getMyOrders);
router.get("/:id", authMiddleware, roleMiddleware(["USER", "UMKM"]), getOrderById);

export default router;
