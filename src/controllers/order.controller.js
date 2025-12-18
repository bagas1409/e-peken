import { db } from "../config/db.js";
import {
  orders,
  wallets,
  walletTransactions,
  umkmProfiles,
} from "../config/schema.js";
import { eq, and } from "drizzle-orm";

/* =========================
   UMKM KIRIM BARANG
========================= */
export const shipOrder = async (req, res, next) => {
  try {
    const orderId = Number(req.params.id);
    const userId = req.user.id;

    // ambil UMKM milik user
    const [umkm] = await db
      .select()
      .from(umkmProfiles)
      .where(eq(umkmProfiles.userId, userId));

    if (!umkm) {
      return res.status(403).json({ message: "Bukan akun UMKM" });
    }

    // ambil order milik UMKM tsb
    const [order] = await db
      .select()
      .from(orders)
      .where(and(eq(orders.id, orderId), eq(orders.umkmId, umkm.id)));

    if (!order) {
      return res.status(404).json({ message: "Order tidak ditemukan" });
    }

    if (order.paymentStatus !== "PAID") {
      return res.status(400).json({
        message: "Order belum dibayar",
      });
    }

    // update status → SHIPPED
    await db
      .update(orders)
      .set({ orderStatus: "SHIPPED" })
      .where(eq(orders.id, orderId));

    res.json({ message: "Order berhasil dikirim" });
  } catch (err) {
    next(err);
  }
};

/* =========================
   USER KONFIRMASI TERIMA
========================= */
export const completeOrder = async (req, res, next) => {
  try {
    const orderId = Number(req.params.id);
    const userId = req.user.id;

    const [order] = await db
      .select()
      .from(orders)
      .where(eq(orders.id, orderId));

    if (!order || order.userId !== userId) {
      return res.status(404).json({ message: "Order tidak ditemukan" });
    }

    if (order.orderStatus !== "SHIPPED") {
      return res.status(400).json({
        message: "Order belum dikirim",
      });
    }

    // update status → COMPLETED
    await db
      .update(orders)
      .set({ orderStatus: "COMPLETED" })
      .where(eq(orders.id, orderId));

    // ambil wallet UMKM
    const [wallet] = await db
      .select()
      .from(wallets)
      .where(eq(wallets.umkmId, order.umkmId));

    // pindahkan saldo escrow
    await db
      .update(wallets)
      .set({
        balancePending:
          Number(wallet.balancePending) - Number(order.totalAmount),
        balanceAvailable:
          Number(wallet.balanceAvailable) + Number(order.totalAmount),
      })
      .where(eq(wallets.id, wallet.id));

    // catat transaksi
    await db.insert(walletTransactions).values({
      walletId: wallet.id,
      type: "IN",
      amount: order.totalAmount,
      description: `Order #${order.id} selesai`,
    });

    res.json({
      message: "Order selesai, saldo UMKM cair",
    });
  } catch (err) {
    next(err);
  }
};

export const getMyOrders = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const data = await db
      .select()
      .from(orders)
      .where(eq(orders.userId, userId))
      .orderBy(orders.createdAt);

    res.json(data);
  } catch (err) {
    next(err);
  }
};
