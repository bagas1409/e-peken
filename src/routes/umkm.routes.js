import express from "express";
import {
  createUmkmProfile,
  getMyWallet,
  getWalletTransactions,
  updateUmkmProfile,
  requestWithdraw,
  getUmkmProfile
} from "../controllers/umkm.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { roleMiddleware } from "../middlewares/role.middleware.js";

const router = express.Router();

router.post(
  "/withdraw",
  authMiddleware,
  roleMiddleware(["UMKM"]),
  requestWithdraw
);

router.post(
  "/profile",
  authMiddleware,
  roleMiddleware(["USER", "UMKM", "ADMIN"]),
  createUmkmProfile,
  getUmkmProfile
);

router.get(
  "/profile",
  authMiddleware,
  roleMiddleware(["USER", "UMKM", "ADMIN"]),
  getUmkmProfile
);

router.get("/wallet", authMiddleware, roleMiddleware(["UMKM"]), getMyWallet);

router.get(
  "/wallet/transactions",
  authMiddleware,
  roleMiddleware(["UMKM"]),
  getWalletTransactions
);

router.patch(
  "/profile",
  authMiddleware,
  roleMiddleware(["UMKM"]),
  updateUmkmProfile
);

export default router;
