import { db } from "../config/db.js";
import {
  carts,
  cartItems,
  products,
  orders,
  orderItems,
} from "../config/schema.js";
import { eq, inArray } from "drizzle-orm";

export const checkout = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // 1. ambil cart
    const [cart] = await db
      .select()
      .from(carts)
      .where(eq(carts.userId, userId));

    if (!cart) {
      return res.status(400).json({ message: "Cart kosong" });
    }

    // 2. ambil item cart
    const items = await db
      .select()
      .from(cartItems)
      .where(eq(cartItems.cartId, cart.id));

    if (items.length === 0) {
      return res.status(400).json({ message: "Cart kosong" });
    }

    // 3. ambil semua produk terkait
    const productIds = items.map((i) => i.productId);

    const productRows = await db
      .select()
      .from(products)
      .where(inArray(products.id, productIds));

    // 4. group item by UMKM
    const grouped = {};
    for (const item of items) {
      const product = productRows.find((p) => p.id === item.productId);
      if (!product) continue;

      if (!grouped[product.umkmId]) {
        grouped[product.umkmId] = [];
      }

      grouped[product.umkmId].push({
        product,
        quantity: item.quantity,
      });
    }

    // 5. buat order per UMKM
    const createdOrders = [];

    for (const umkmId of Object.keys(grouped)) {
      let total = 0;

      for (const row of grouped[umkmId]) {
        total += Number(row.product.price) * row.quantity;
      }

      const [order] = await db
        .insert(orders)
        .values({
          userId,
          umkmId: Number(umkmId),
          totalAmount: total,
          orderStatus: "PENDING",
          paymentStatus: "UNPAID",
        })
        .returning();

      // order items
      for (const row of grouped[umkmId]) {
        await db.insert(orderItems).values({
          orderId: order.id,
          productId: row.product.id,
          price: row.product.price,
          quantity: row.quantity,
        });
      }

      createdOrders.push(order);
    }

    // 6. (opsional) kosongkan cart
    await db.delete(cartItems).where(eq(cartItems.cartId, cart.id));

    res.json({
      message: "Checkout berhasil",
      orders: createdOrders,
    });
  } catch (err) {
    next(err);
  }
};
