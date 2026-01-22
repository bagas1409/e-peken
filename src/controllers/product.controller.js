import { db } from "../config/db.js";
import { products, umkmProfiles } from "../config/schema.js";
import { eq, and } from "drizzle-orm";

/* =========================
   CREATE PRODUCT
========================= */
export const createProduct = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { name, description, price, stock, categoryId, imageUrl } = req.body;

    // cek UMKM milik user & status ACTIVE
    const [umkm] = await db
      .select()
      .from(umkmProfiles)
      .where(
        and(eq(umkmProfiles.userId, userId), eq(umkmProfiles.status, "ACTIVE"))
      );

    if (!umkm) {
      return res.status(403).json({
        message: "UMKM belum aktif / belum di-approve admin",
      });
    }

    const [product] = await db
      .insert(products)
      .values({
        umkmId: umkm.id,
        categoryId,
        name,
        description,
        price,
        stock,
        imageUrl,
      })
      .returning();

    res.status(201).json({
      message: "Produk berhasil ditambahkan",
      product,
    });
  } catch (err) {
    next(err);
  }
};

/* =========================
   GET MY PRODUCTS
========================= */
export const getMyProducts = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const [umkm] = await db
      .select()
      .from(umkmProfiles)
      .where(eq(umkmProfiles.userId, userId));

    if (!umkm) {
      return res.status(404).json({ message: "UMKM tidak ditemukan" });
    }

    const result = await db
      .select()
      .from(products)
      .where(eq(products.umkmId, umkm.id));

    res.json(result);
  } catch (err) {
    next(err);
  }
};

/* =========================
   UPDATE PRODUCT
========================= */
export const updateProduct = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const productId = Number(req.params.id);

    const {
      name,
      description,
      price,
      stock,
      imageUrl,
      categoryId, // ✅ Fix: Add categoryId
    } = req.body;

    const [umkm] = await db
      .select()
      .from(umkmProfiles)
      .where(eq(umkmProfiles.userId, userId));

    if (!umkm) {
      return res.status(404).json({ message: "UMKM tidak ditemukan" });
    }

    // 🔑 KUMPULKAN FIELD YANG VALID SAJA
    const updateData = {};

    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (price !== undefined) updateData.price = price;
    if (stock !== undefined) updateData.stock = stock;
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl;
    if (categoryId !== undefined) updateData.categoryId = categoryId; // ✅ Fix: Add to updateData

    // 🚨 GUARD (WAJIB)
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        message: "Tidak ada data untuk diupdate",
      });
    }

    const [updated] = await db
      .update(products)
      .set(updateData)
      .where(and(eq(products.id, productId), eq(products.umkmId, umkm.id)))
      .returning();

    if (!updated) {
      return res.status(404).json({ message: "Produk tidak ditemukan" });
    }

    res.json({
      message: "Produk berhasil diupdate",
      product: updated,
    });
  } catch (err) {
    next(err);
  }
};

/* =========================
   DELETE PRODUCT
========================= */
export const deleteProduct = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const productId = Number(req.params.id);

    const [umkm] = await db
      .select()
      .from(umkmProfiles)
      .where(eq(umkmProfiles.userId, userId));

    if (!umkm) {
      return res.status(404).json({ message: "UMKM tidak ditemukan" });
    }

    const [deleted] = await db
      .delete(products)
      .where(and(eq(products.id, productId), eq(products.umkmId, umkm.id)))
      .returning();

    if (!deleted) {
      return res.status(404).json({ message: "Produk tidak ditemukan" });
    }

    res.json({ message: "Produk berhasil dihapus" });
  } catch (err) {
    next(err);
  }
};

export const toggleProductStatus = async (req, res, next) => {
  try {
    const productId = Number(req.params.id);
    const userId = req.user.id;

    // ambil UMKM milik user
    const [umkm] = await db
      .select()
      .from(umkmProfiles)
      .where(eq(umkmProfiles.userId, userId));

    if (!umkm) {
      return res.status(403).json({ message: "Bukan UMKM" });
    }

    // ambil produk milik UMKM
    const [product] = await db
      .select()
      .from(products)
      .where(and(eq(products.id, productId), eq(products.umkmId, umkm.id)));

    if (!product) {
      return res.status(404).json({ message: "Produk tidak ditemukan" });
    }

    const newStatus = !product.isActive;

    await db
      .update(products)
      .set({ isActive: newStatus })
      .where(eq(products.id, productId));

    res.json({
      message: `Produk berhasil ${newStatus ? "diaktifkan" : "dinonaktifkan"}`,
      isActive: newStatus,
    });
  } catch (err) {
    next(err);
  }
};
