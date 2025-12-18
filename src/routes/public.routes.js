import express from "express";
import {
  getActiveUmkm,
  getUmkmBySlug,
  getProductsByUmkm,
  getProductDetail,
} from "../controllers/public.controller.js";

const router = express.Router();

// UMKM
router.get("/umkm", getActiveUmkm);
router.get("/umkm/:slug", getUmkmBySlug);
router.get("/umkm/:slug/products", getProductsByUmkm);

// Produk
router.get("/products/:id", getProductDetail);

export default router;
