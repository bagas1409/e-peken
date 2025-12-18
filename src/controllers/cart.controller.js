import { db } from "../config/db.js";
import { carts, cartItems, products } from "../config/schema.js";
import { eq } from "drizzle-orm";

export const addToCart = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { productId, quantity } = req.body;

    let [cart] = await db.select().from(carts).where(eq(carts.userId, userId));

    if (!cart) {
      [cart] = await db.insert(carts).values({ userId }).returning();
    }

    await db.insert(cartItems).values({
      cartId: cart.id,
      productId,
      quantity,
    });

    res.json({ message: "Produk masuk keranjang" });
  } catch (err) {
    next(err);
  }
};

export const getMyCart = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const [cart] = await db
      .select()
      .from(carts)
      .where(eq(carts.userId, userId));

    if (!cart) return res.json([]);

    const items = await db
      .select()
      .from(cartItems)
      .where(eq(cartItems.cartId, cart.id));

    res.json(items);
  } catch (err) {
    next(err);
  }
};
