import { db } from "../config/db.js";
import { umkmProfiles, products, categories } from "../config/schema.js";
import { eq, and } from "drizzle-orm";

/* =========================
   LIST UMKM AKTIF
========================= */
export const getActiveUmkm = async (req, res, next) => {
  try {
    const result = await db
      .select({
        id: umkmProfiles.id,
        storeName: umkmProfiles.storeName,
        slug: umkmProfiles.slug,
        logoUrl: umkmProfiles.logoUrl,
        address: umkmProfiles.address,
      })
      .from(umkmProfiles)
      .where(eq(umkmProfiles.status, "ACTIVE"));

    res.json(result);
  } catch (err) {
    next(err);
  }
};

/* =========================
   DETAIL UMKM
========================= */
export const getUmkmBySlug = async (req, res, next) => {
  try {
    const { slug } = req.params;

    const [umkm] = await db
      .select({
        id: umkmProfiles.id,
        storeName: umkmProfiles.storeName,
        description: umkmProfiles.description,
        logoUrl: umkmProfiles.logoUrl,
        bannerUrl: umkmProfiles.bannerUrl,
        address: umkmProfiles.address,
        openTime: umkmProfiles.openTime,
        closeTime: umkmProfiles.closeTime,
        logoUrl: umkmProfiles.logoUrl,
        bannerUrl: umkmProfiles.bannerUrl,
      })
      .from(umkmProfiles)
      .where(
        and(eq(umkmProfiles.slug, slug), eq(umkmProfiles.status, "ACTIVE"))
      );

    if (!umkm) {
      return res.status(404).json({ message: "UMKM tidak ditemukan" });
    }

    res.json(umkm);
  } catch (err) {
    next(err);
  }
};

/* =========================
   PRODUK UMKM
========================= */
export const getProductsByUmkm = async (req, res, next) => {
  try {
    const { slug } = req.params;

    const [umkm] = await db
      .select()
      .from(umkmProfiles)
      .where(
        and(eq(umkmProfiles.slug, slug), eq(umkmProfiles.status, "ACTIVE"))
      );

    if (!umkm) {
      return res.status(404).json({ message: "UMKM tidak ditemukan" });
    }

    const result = await db
      .select({
        id: products.id,
        name: products.name,
        price: products.price,
        stock: products.stock,
        imageUrl: products.imageUrl,
      })
      .from(products)
      .where(and(eq(products.umkmId, umkm.id), eq(products.isActive, true)));

    res.json(result);
  } catch (err) {
    next(err);
  }
};

/* =========================
   DETAIL PRODUK
========================= */
export const getProductDetail = async (req, res, next) => {
  try {
    const productId = Number(req.params.id);

    const [product] = await db
      .select({
        id: products.id,
        name: products.name,
        description: products.description,
        price: products.price,
        stock: products.stock,
        umkmId: products.umkmId,
        categoryId: products.categoryId,
        imageUrl: products.imageUrl,
      })
      .from(products)
      .where(and(eq(products.id, productId), eq(products.isActive, true)));

    if (!product) {
      return res.status(404).json({ message: "Produk tidak ditemukan" });
    }

    res.json(product);
  } catch (err) {
    next(err);
  }
};
