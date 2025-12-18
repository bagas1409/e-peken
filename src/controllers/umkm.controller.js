import { db } from "../config/db.js";
import { wallets, walletTransactions, umkmProfiles } from "../config/schema.js";
import { eq } from "drizzle-orm";

export const createUmkmProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { storeName, slug, description, address, openTime, closeTime } =
      req.body;

    // Cek apakah sudah punya toko
    const existing = await db
      .select()
      .from(umkmProfiles)
      .where(eq(umkmProfiles.userId, userId));

    if (existing.length > 0) {
      return res.status(400).json({ message: "UMKM profile sudah ada" });
    }

    const [profile] = await db
      .insert(umkmProfiles)
      .values({
        userId,
        storeName,
        slug,
        description,
        address,
        openTime,
        closeTime,
        status: "PENDING",
      })
      .returning();

    res.status(201).json({
      message: "Profil UMKM berhasil dibuat, menunggu verifikasi admin",
      profile,
    });
  } catch (err) {
    next(err);
  }
};

export const getMyWallet = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const [umkm] = await db
      .select()
      .from(umkmProfiles)
      .where(eq(umkmProfiles.userId, userId));

    if (!umkm) {
      return res.status(404).json({ message: "UMKM tidak ditemukan" });
    }

    const [wallet] = await db
      .select()
      .from(wallets)
      .where(eq(wallets.umkmId, umkm.id));

    res.json(wallet);
  } catch (err) {
    next(err);
  }
};

export const getWalletTransactions = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const [umkm] = await db
      .select()
      .from(umkmProfiles)
      .where(eq(umkmProfiles.userId, userId));

    const tx = await db
      .select()
      .from(walletTransactions)
      .where(eq(walletTransactions.walletId, umkm.id))
      .orderBy(walletTransactions.createdAt);

    res.json(tx);
  } catch (err) {
    next(err);
  }
};
