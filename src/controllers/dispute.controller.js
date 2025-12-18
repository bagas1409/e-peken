import { db } from "../config/db.js";
import { disputes, orders } from "../config/schema.js";
import { eq } from "drizzle-orm";

export const createDispute = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { orderId, reason } = req.body;

    const [order] = await db
      .select()
      .from(orders)
      .where(eq(orders.id, orderId));

    if (!order || order.userId !== userId) {
      return res.status(404).json({ message: "Order tidak ditemukan" });
    }

    if (order.orderStatus !== "SHIPPED") {
      return res
        .status(400)
        .json({ message: "Dispute hanya bisa saat order dikirim" });
    }

    // ubah status order → DISPUTED
    await db
      .update(orders)
      .set({ orderStatus: "DISPUTED" })
      .where(eq(orders.id, orderId));

    const [dispute] = await db
      .insert(disputes)
      .values({ orderId, userId, reason })
      .returning();

    res.status(201).json({
      message: "Dispute berhasil diajukan",
      dispute,
    });
  } catch (err) {
    next(err);
  }
};
