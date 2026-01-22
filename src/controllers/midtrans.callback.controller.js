import crypto from "crypto";
import { db } from "../config/db.js";
import {
  orders,
  payments,
  wallets,
  walletTransactions,
} from "../config/schema.js";
import { eq, inArray } from "drizzle-orm";

export const midtransCallback = async (req, res) => {
  try {
    console.log("=== MIDTRANS CALLBACK HIT ===");
    console.log(req.body);

    const {
      order_id,
      status_code,
      gross_amount,
      signature_key,
      transaction_status,
      custom_field1, // JSON string: [orderId1, orderId2, ...]
    } = req.body;

    console.log("🔔 [Midtrans Callback] Received:", JSON.stringify(req.body, null, 2));
    console.log(`🔍 [Midtrans Parse] OrderID=${order_id}, Status=${transaction_status}, Signature=${signature_key}`);

    const serverKey = process.env.MIDTRANS_SERVER_KEY;

    /* =========================
       1. VERIFIKASI SIGNATURE
    ========================= */
    const payload = order_id + status_code + gross_amount + serverKey;

    const expectedSignature = crypto
      .createHash("sha512")
      .update(payload)
      .digest("hex");

    console.log("Signature received :", signature_key);
    console.log("Signature expected :", expectedSignature);
    const cleanSignatureKey = signature_key?.trim();
    if (signature_key !== expectedSignature) {
      return res.status(403).json({ message: "Invalid signature" });
    }

    /* =========================
       2. MAP STATUS MIDTRANS
    ========================= */
    let paymentStatus = "PENDING";
    let orderStatus = "PENDING";

    if (
      transaction_status === "capture" ||
      transaction_status === "settlement"
    ) {
      paymentStatus = "PAID";
      orderStatus = "PENDING"; // menunggu UMKM kirim barang
    } else if (
      transaction_status === "deny" ||
      transaction_status === "cancel" ||
      transaction_status === "expire"
    ) {
      paymentStatus = "FAILED";
      orderStatus = "CANCELLED";
    }

    if (paymentStatus === "PENDING") {
      return res.status(200).json({ message: "Transaction pending" });
    }

    /* =========================
       3. AMBIL ORDER IDS
    ========================= */
    let targetOrderIds = [];

    if (custom_field1) {
      try {
        targetOrderIds = JSON.parse(custom_field1);
      } catch (err) {
        console.error("Failed to parse custom_field1:", err);
        return res
          .status(400)
          .json({ message: "Invalid custom_field1 format" });
      }
    }

    if (!targetOrderIds.length) {
      return res.status(404).json({ message: "No related orders found" });
    }

    /* =========================
       4. AMBIL SEMUA ORDER
    ========================= */
    const relatedOrders = await db
      .select()
      .from(orders)
      .where(inArray(orders.id, targetOrderIds));

    /* =========================
       5. PROSES SETIAP ORDER
    ========================= */
    for (const order of relatedOrders) {
      // 🔐 Idempotency: jika sudah PAID, skip
      if (order.paymentStatus === "PAID") {
        continue;
      }

      // Update order status
      await db
        .update(orders)
        .set({
          paymentStatus,
          orderStatus,
        })
        .where(eq(orders.id, order.id));

      if (paymentStatus !== "PAID") continue;

      /* =========================
         6. CEK PAYMENT DUPLIKAT
      ========================= */
      const [existingPayment] = await db
        .select()
        .from(payments)
        .where(eq(payments.orderId, order.id));

      if (existingPayment) continue;

      /* =========================
         7. INSERT PAYMENT
      ========================= */
      await db.insert(payments).values({
        orderId: order.id,
        paymentMethod: "midtrans",
        amount: order.totalAmount,
        status: "PAID",
        paidAt: new Date(),
      });

      /* =========================
         8. UPDATE WALLET UMKM
      ========================= */
      let [wallet] = await db
        .select()
        .from(wallets)
        .where(eq(wallets.umkmId, order.umkmId));

      if (!wallet) {
        const [newWallet] = await db
          .insert(wallets)
          .values({ umkmId: order.umkmId })
          .returning();
        wallet = newWallet;
      }

      const newPendingBalance =
        Number(wallet.balancePending || 0) + Number(order.totalAmount);

      await db
        .update(wallets)
        .set({
          balancePending: newPendingBalance.toString(),
        })
        .where(eq(wallets.id, wallet.id));

      await db.insert(walletTransactions).values({
        walletId: wallet.id,
        type: "IN",
        amount: order.totalAmount,
        description: `Payment Order #${order.id}`,
      });
    }

    return res.status(200).json({
      message: "Midtrans callback processed successfully",
    });
  } catch (err) {
    console.error("Midtrans Callback Error:", err);
    return res.status(500).json({ message: err.message });
  }
};
