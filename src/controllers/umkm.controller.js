import { db } from "../config/db.js";
import { wallets, walletTransactions, umkmProfiles, withdrawRequests } from "../config/schema.js";
import { eq, desc } from "drizzle-orm";

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


export const getUmkmProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const [profile] = await db
      .select()
      .from(umkmProfiles)
      .where(eq(umkmProfiles.userId, userId));

    if (!profile) return res.json(null); // Return null if not found (frontend expects this or 404 handled)

    res.json(profile);
  } catch (err) {
    next(err);
  }
};

export const getMyWallet = async (req, res, next) => {
  // ... existing code ...
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

    if (!umkm) return res.json([]);

    const [wallet] = await db
      .select()
      .from(wallets)
      .where(eq(wallets.umkmId, umkm.id));

    if (!wallet) return res.json([]);

    const tx = await db
      .select()
      .from(walletTransactions)
      .where(eq(walletTransactions.walletId, wallet.id))
      .orderBy(desc(walletTransactions.createdAt));

    res.json(tx);
  } catch (err) {
    next(err);
  }
};

export const updateUmkmProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const {
      logoUrl,
      bannerUrl,
      storeName,
      description,
      address,
      openTime,
      closeTime,
    } = req.body;

    // ambil UMKM milik user
    const [umkm] = await db
      .select()
      .from(umkmProfiles)
      .where(eq(umkmProfiles.userId, userId));

    if (!umkm) {
      return res.status(404).json({ message: "UMKM tidak ditemukan" });
    }

    const updateData = {};
    if (logoUrl) updateData.logoUrl = logoUrl;
    if (bannerUrl) updateData.bannerUrl = bannerUrl;
    if (storeName) updateData.storeName = storeName;
    if (description) updateData.description = description;
    if (address) updateData.address = address;
    if (openTime) updateData.openTime = openTime;
    if (closeTime) updateData.closeTime = closeTime;

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        message: "Tidak ada data untuk diupdate",
      });
    }

    const [updated] = await db
      .update(umkmProfiles)
      .set(updateData)
      .where(eq(umkmProfiles.id, umkm.id))
      .returning();

    res.json({
      message: "Profil UMKM berhasil diupdate",
      umkm: updated,
    });
  } catch (err) {
    next(err);
  }
};
// ... existing code ...

export const requestWithdraw = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { amount, bankName, bankAccount } = req.body;
    const withdrawAmount = Number(amount);

    if (isNaN(withdrawAmount) || withdrawAmount < 10000) {
      return res.status(400).json({ message: "Minimal penarikan Rp 10.000" });
    }

    const [umkm] = await db
      .select()
      .from(umkmProfiles)
      .where(eq(umkmProfiles.userId, userId));

    if (!umkm) return res.status(404).json({ message: "UMKM tidak ditemukan" });

    // Cek Wallet
    const [wallet] = await db
      .select()
      .from(wallets)
      .where(eq(wallets.umkmId, umkm.id));

    if (!wallet || Number(wallet.balanceAvailable) < withdrawAmount) {
      return res.status(400).json({ message: "Saldo tidak mencukupi" });
    }

    // Database Transaction: Create Request & Deduct Balance
    await db.transaction(async (tx) => {
      // 1. Create Request
      await tx.insert(withdrawRequests).values({
        umkmId: umkm.id,
        amount: withdrawAmount.toString(),
        bankName,
        bankAccount,
        status: "PENDING",
      });

      // 2. Update Wallet (Move to Pending)
      const newAvailable = Number(wallet.balanceAvailable) - withdrawAmount;
      const newPending = Number(wallet.balancePending) + withdrawAmount;

      await tx
        .update(wallets)
        .set({
          balanceAvailable: newAvailable.toString(),
          balancePending: newPending.toString(),
        })
        .where(eq(wallets.id, wallet.id));

      // 3. Log Transaction (Optional but good)
      await tx.insert(walletTransactions).values({
        walletId: wallet.id,
        type: "OUT",
        amount: withdrawAmount.toString(),
        description: `Penarikan ke ${bankName} (${bankAccount})`,
      });
    });

    res.status(201).json({ message: "Permintaan penarikan berhasil dikirim" });
  } catch (err) {
    next(err);
  }
};
