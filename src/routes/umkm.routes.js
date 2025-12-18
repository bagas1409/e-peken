import express from "express";
import {
  createUmkmProfile,
  getMyWallet,
  getWalletTransactions,
} from "../controllers/umkm.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { roleMiddleware } from "../middlewares/role.middleware.js";

const router = express.Router();

router.post(
  "/profile",
  authMiddleware,
  roleMiddleware(["UMKM"]),
  createUmkmProfile
);

router.get("/wallet", authMiddleware, roleMiddleware(["UMKM"]), getMyWallet);

router.get(
  "/wallet/transactions",
  authMiddleware,
  roleMiddleware(["UMKM"]),
  getWalletTransactions
);

export default router;
