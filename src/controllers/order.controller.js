import { db } from "../config/db.js";
import {
  orders,
  wallets,
  walletTransactions,
  umkmProfiles,
  products,
  orderItems,
  orderStatusLogs,
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

// 3. User Lihat History Pesanan
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

export const getOrderById = async (req, res, next) => {
  try {
    const orderId = Number(req.params.id);
    const userId = req.user.id;

    // 1. Ambil Order
    const [order] = await db
      .select()
      .from(orders)
      .where(and(eq(orders.id, orderId), eq(orders.userId, userId)));

    if (!order) {
      return res.status(404).json({ message: "Order tidak ditemukan" });
    }

    // 2. Ambil Store (UMKM)
    const [store] = await db
      .select({ name: umkmProfiles.storeName })
      .from(umkmProfiles)
      .where(eq(umkmProfiles.id, order.umkmId));

    // 3. Ambil Items & Product info
    const items = await db
      .select({
        name: products.name,
        price: orderItems.price,
        quantity: orderItems.quantity,
      })
      .from(orderItems)
      .innerJoin(products, eq(orderItems.productId, products.id))
      .where(eq(orderItems.orderId, orderId));

    // 4. Cek Payment Method
    // (Simplifikasi: cek table payments, atau ambil default logic)
    // Disini kita return dummy atau ambil dari payment record jika ada
    // Tapi user minta response simple, kita sesuaikan.

    const response = {
      id: order.id,
      createdAt: order.createdAt,
      store: {
        name: store?.name || "UMKM Store",
      },
      items: items.map((item) => ({
        name: item.name,
        price: item.price,
        quantity: item.quantity,
      })),
      shippingCost: order.shippingCost || "0",
      totalAmount: order.totalAmount,
      paymentMethod: "QRIS / GOPAY", // Default for now
      paymentStatus: order.paymentStatus,
      orderStatus: order.orderStatus,
      receiverName: order.receiverName,
      receiverPhone: order.receiverPhone,
      shippingAddress: order.shippingAddress,
    };

    res.json(response);
  } catch (err) {
    next(err);
  }
};
// ... existing code ...

// 4. UMKM Lihat Pesanan Masuk
export const getUmkmOrders = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Cek UMKM
    const [umkm] = await db
      .select({ id: umkmProfiles.id })
      .from(umkmProfiles)
      .where(eq(umkmProfiles.userId, userId));

    if (!umkm) {
      return res.status(403).json({ message: "Bukan akun UMKM" });
    }

    const data = await db
      .select({
        id: orders.id,
        userId: orders.userId,
        totalAmount: orders.totalAmount,
        orderStatus: orders.orderStatus,
        paymentStatus: orders.paymentStatus,
        createdAt: orders.createdAt,
        receiverName: orders.receiverName,
        trackingNumber: orders.trackingNumber,
      })
      .from(orders)
      .where(eq(orders.umkmId, umkm.id))
      .orderBy(orders.createdAt);

    // Map to include placeholder buyerName if needed, or just return data
    const formattedData = data.map(order => ({
      ...order,
      buyerName: "User"
    }));

    res.json(formattedData);
  } catch (err) {
    next(err);
  }
};

export const updateOrderTracking = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const orderId = Number(req.params.id);
    const { trackingNumber } = req.body;

    if (!trackingNumber) {
      return res.status(400).json({ message: "Nomor resi wajib diisi" });
    }

    // Cek UMKM User
    const [umkm] = await db
      .select()
      .from(umkmProfiles)
      .where(eq(umkmProfiles.userId, userId));

    if (!umkm) return res.status(403).json({ message: "Akses ditolak" });

    // Updates
    const [updated] = await db
      .update(orders)
      .set({
        trackingNumber,
        orderStatus: "SHIPPED",
      })
      .where(and(eq(orders.id, orderId), eq(orders.umkmId, umkm.id)))
      .returning();

    if (!updated) return res.status(404).json({ message: "Order tidak ditemukan" });

    // Log
    await db.insert(orderStatusLogs).values({
      orderId,
      status: "SHIPPED",
      note: `Resi diinput: ${trackingNumber}`,
    });

    res.json({ message: "Resi berhasil diinput", order: updated });
  } catch (err) {
    next(err);
  }
};
