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
        bannerUrl: umkmProfiles.bannerUrl,
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
   DETAIL UMKM (PUBLIC)
========================= */
export const getUmkmBySlug = async (req, res, next) => {
  try {
    const { slug } = req.params;

    const [umkm] = await db
      .select({
        id: umkmProfiles.id,
        storeName: umkmProfiles.storeName,
        slug: umkmProfiles.slug,
        description: umkmProfiles.description,
        address: umkmProfiles.address,
        openTime: umkmProfiles.openTime,
        closeTime: umkmProfiles.closeTime,

        // ✅ LOGO & BANNER
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
   PRODUK UMKM (PUBLIC)
========================= */
export const getProductsByUmkm = async (req, res, next) => {
  try {
    const { slug } = req.params;

    const [umkm] = await db
      .select({
        id: umkmProfiles.id,
      })
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
   DETAIL PRODUK (PUBLIC)
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
        imageUrl: products.imageUrl,
        umkmId: products.umkmId,
        categoryId: products.categoryId,
        umkm: {
          id: umkmProfiles.id,
          storeName: umkmProfiles.storeName,
          slug: umkmProfiles.slug,
          address: umkmProfiles.address,
          logoUrl: umkmProfiles.logoUrl,
          bannerUrl: umkmProfiles.bannerUrl,
        },
        category: {
          name: categories.name,
        },
      })
      .from(products)
      .leftJoin(umkmProfiles, eq(products.umkmId, umkmProfiles.id))
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .where(and(eq(products.id, productId), eq(products.isActive, true)));

    if (!product) {
      return res.status(404).json({ message: "Produk tidak ditemukan" });
    }

    res.json(product);
  } catch (err) {
    next(err);
  }
};

/* =========================
   PUBLIC CATEGORIES
========================= */
/* =========================
   PUBLIC CATEGORIES
========================= */
export const getPublicCategories = async (req, res, next) => {
  try {
    const result = await db
      .select({
        id: categories.id,
        name: categories.name,
        slug: categories.slug,
        parentId: categories.parentId,
      })
      .from(categories);

    res.json(result);
  } catch (err) {
    next(err);
  }
};

/* =========================
   PRODUK PER KATEGORI (PUBLIC)
========================= */
export const getProductsByCategory = async (req, res, next) => {
  try {
    const { slug } = req.params;

    // 1. Cari Category ID berdasarkan slug
    const [category] = await db
      .select({ id: categories.id, name: categories.name })
      .from(categories)
      .where(eq(categories.slug, slug));

    if (!category) {
      return res.status(404).json({ message: "Kategori tidak ditemukan" });
    }

    // 2. Ambil produk aktif di kategori ini
    const result = await db
      .select({
        id: products.id,
        name: products.name,
        price: products.price,
        stock: products.stock,
        imageUrl: products.imageUrl,
        umkmId: products.umkmId,
        umkmName: umkmProfiles.storeName,
        umkmSlug: umkmProfiles.slug,
      })
      .from(products)
      .leftJoin(umkmProfiles, eq(products.umkmId, umkmProfiles.id))
      .where(
        and(
          eq(products.categoryId, category.id),
          eq(products.isActive, true),
          eq(umkmProfiles.status, 'ACTIVE')
        )
      );

    res.json({ category, products: result });
  } catch (err) {
    next(err);
  }
};
