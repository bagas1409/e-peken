import crypto from "crypto";
import { db } from "../config/db.js";
import {
  orders,
  payments,
  wallets,
  walletTransactions,
} from "../config/schema.js";
import { eq } from "drizzle-orm";

export const midtransCallback = async (req, res) => {
  try {
    const {
      order_id,
      status_code,
      gross_amount,
      signature_key,
      transaction_status,
    } = req.body;

    const serverKey = process.env.MIDTRANS_SERVER_KEY;

    const payload = order_id + status_code + gross_amount + serverKey;

    const expectedSignature = crypto
      .createHash("sha512")
      .update(payload)
      .digest("hex");

    if (signature_key !== expectedSignature) {
      return res.status(403).json({ message: "Invalid signature" });
    }

    // ambil order ID asli
    const realOrderId = Number(order_id.split("-")[1]);

    const [order] = await db
      .select()
      .from(orders)
      .where(eq(orders.id, realOrderId));

    if (!order) {
      return res.status(404).json({ message: "Order tidak ditemukan" });
    }

    if (transaction_status === "settlement") {
      // update order
      await db
        .update(orders)
        .set({ paymentStatus: "PAID" })
        .where(eq(orders.id, order.id));

      // escrow → wallet pending
      const [wallet] = await db
        .select()
        .from(wallets)
        .where(eq(wallets.umkmId, order.umkmId));

      await db
        .update(wallets)
        .set({
          balancePending:
            Number(wallet.balancePending) + Number(order.totalAmount),
        })
        .where(eq(wallets.id, wallet.id));

      await db.insert(walletTransactions).values({
        walletId: wallet.id,
        type: "IN",
        amount: order.totalAmount,
        description: `Midtrans payment order #${order.id}`,
      });

      await db.insert(payments).values({
        orderId: order.id,
        amount: order.totalAmount,
        status: "PAID",
      });
    }

    res.status(200).json({ message: "Callback processed" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
