import { db } from "../config/db.js";
import {
  disputes,
  orders,
  wallets,
  walletTransactions,
} from "../config/schema.js";
import { eq } from "drizzle-orm";

/* List dispute OPEN */
export const getOpenDisputes = async (req, res, next) => {
  try {
    const result = await db
      .select()
      .from(disputes)
      .where(eq(disputes.status, "OPEN"));

    res.json(result);
  } catch (err) {
    next(err);
  }
};

/* Resolve dispute */
export const resolveDispute = async (req, res, next) => {
  try {
    const disputeId = Number(req.params.id);
    const { decision } = req.body; // REFUND | RELEASE

    const [dispute] = await db
      .select()
      .from(disputes)
      .where(eq(disputes.id, disputeId));

    if (!dispute) {
      return res.status(404).json({ message: "Dispute tidak ditemukan" });
    }

    const [order] = await db
      .select()
      .from(orders)
      .where(eq(orders.id, dispute.orderId));

    const [wallet] = await db
      .select()
      .from(wallets)
      .where(eq(wallets.umkmId, order.umkmId));

    if (decision === "REFUND") {
      // uang kembali ke user → pending berkurang
      await db
        .update(wallets)
        .set({
          balancePending:
            Number(wallet.balancePending) - Number(order.totalAmount),
        })
        .where(eq(wallets.id, wallet.id));

      await db.insert(walletTransactions).values({
        walletId: wallet.id,
        type: "OUT",
        amount: order.totalAmount,
        description: `Refund order #${order.id}`,
      });

      await db
        .update(orders)
        .set({ orderStatus: "REFUNDED" })
        .where(eq(orders.id, order.id));
    }

    if (decision === "RELEASE") {
      // cairkan ke UMKM
      await db
        .update(wallets)
        .set({
          balancePending:
            Number(wallet.balancePending) - Number(order.totalAmount),
          balanceAvailable:
            Number(wallet.balanceAvailable) + Number(order.totalAmount),
        })
        .where(eq(wallets.id, wallet.id));

      await db.insert(walletTransactions).values({
        walletId: wallet.id,
        type: "IN",
        amount: order.totalAmount,
        description: `Release dispute order #${order.id}`,
      });

      await db
        .update(orders)
        .set({ orderStatus: "COMPLETED" })
        .where(eq(orders.id, order.id));
    }

    await db
      .update(disputes)
      .set({ status: "RESOLVED", decision })
      .where(eq(disputes.id, disputeId));

    res.json({ message: "Dispute diselesaikan", decision });
  } catch (err) {
    next(err);
  }
};
