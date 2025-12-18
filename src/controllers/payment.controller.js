import { snap } from "../config/midtrans.js";
import { db } from "../config/db.js";
import { orders } from "../config/schema.js";
import { eq } from "drizzle-orm";

export const createMidtransPayment = async (req, res, next) => {
  try {
    const orderId = Number(req.params.orderId);

    const [order] = await db
      .select()
      .from(orders)
      .where(eq(orders.id, orderId));

    if (!order) {
      return res.status(404).json({ message: "Order tidak ditemukan" });
    }

    if (order.paymentStatus === "PAID") {
      return res.status(400).json({ message: "Order sudah dibayar" });
    }

    const transaction = {
      transaction_details: {
        order_id: `ORDER-${order.id}-${Date.now()}`,
        gross_amount: Number(order.totalAmount),
      },
      credit_card: {
        secure: true,
      },
    };

    const snapResponse = await snap.createTransaction(transaction);

    res.json({
      snapToken: snapResponse.token,
      redirectUrl: snapResponse.redirect_url,
    });
  } catch (err) {
    next(err);
  }
};
