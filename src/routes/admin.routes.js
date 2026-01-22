import express from "express";
import {
  getPendingUmkm,
  approveUmkm,
  rejectUmkm,
  getAllUsers,
  banUser,
  unbanUser,
  getAllOrders,
  getOrderDetail,
  getAuditLogs,
  updateUserRole,
} from "../controllers/admin.controller.js";
import {
  getOpenDisputes,
  resolveDispute,
} from "../controllers/admin.dispute.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { roleMiddleware } from "../middlewares/role.middleware.js";

const router = express.Router();

// hanya ADMIN
router.use(authMiddleware, roleMiddleware(["ADMIN"]));

// list UMKM pending
router.get("/umkm/pending", getPendingUmkm);

// approve UMKM
router.patch("/umkm/:id/approve", approveUmkm);

// reject UMKM
router.patch("/umkm/:id/reject", rejectUmkm);

router.get("/disputes", getOpenDisputes);
router.patch("/disputes/:id/resolve", resolveDispute);

router.get("/users", authMiddleware, roleMiddleware(["ADMIN"]), getAllUsers);

router.patch(
  "/users/:id/ban",
  authMiddleware,
  roleMiddleware(["ADMIN"]),
  banUser
);

router.patch(
  "/users/:id/unban",
  authMiddleware,
  roleMiddleware(["ADMIN"]),
  unbanUser
);

router.patch(
  "/users/:id/role",
  authMiddleware,
  roleMiddleware(["ADMIN"]),
  updateUserRole
);

router.get("/orders", authMiddleware, roleMiddleware(["ADMIN"]), getAllOrders);

router.get(
  "/orders/:id",
  authMiddleware,
  roleMiddleware(["ADMIN"]),
  getOrderDetail
);

router.get(
  "/audit-logs",
  authMiddleware,
  roleMiddleware(["ADMIN"]),
  getAuditLogs
);

export default router;
