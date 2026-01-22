import { db } from "../config/db.js";
import {
  carts,
  cartItems,
  products,
  orders,
  orderItems,
  users,
} from "../config/schema.js";
import { eq, inArray } from "drizzle-orm";
import { snap } from "../config/midtrans.js"; // Import Midtrans Snap

export const checkout = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const { shippingInfo } = req.body;

    // 0. Ambil data user untuk fallback & customer_details Midtrans
    const [user] = await db.select().from(users).where(eq(users.id, userId));

    // Validasi Data Pengiriman (Priority: Body > Profile > Error)
    const receiverName = shippingInfo?.receiverName || user.receiverName;
    const receiverPhone = shippingInfo?.receiverPhone || user.receiverPhone;
    const shippingAddress = shippingInfo?.shippingAddress || user.defaultAddress;

    if (!receiverName || !receiverPhone || !shippingAddress) {
      return res.status(400).json({
        message: "Data pengiriman tidak lengkap. Mohon lengkapi profil atau form checkout.",
      });
    }

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

    // 5. buat order per UMKM & Hitung Grand Total
    const createdOrders = [];
    let grandTotal = 0;
    const itemDetails = []; // Untuk Midtrans

    for (const umkmId of Object.keys(grouped)) {
      let total = 0;

      for (const row of grouped[umkmId]) {
        const itemTotal = Number(row.product.price) * row.quantity;
        total += itemTotal;

        // Add to item_details
        itemDetails.push({
          id: row.product.id.toString(),
          price: Number(row.product.price),
          quantity: row.quantity,
          name: row.product.name.substring(0, 50), // Midtrans max 50 chars
        });
      }

      grandTotal += total;

      const [order] = await db
        .insert(orders)
        .values({
          userId,
          umkmId: Number(umkmId),
          totalAmount: total.toString(),
          orderStatus: "PENDING",
          paymentStatus: "UNPAID",
          receiverName,
          receiverPhone,
          shippingAddress,
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

    // 6. Integrasi Midtrans
    // Buat satu Transaction yang menaungi beberapa Order (Multi-Vendor)
    const orderIds = createdOrders.map((o) => o.id);
    const trxId = `TRX-${Date.now()}-${userId}`; // Unique Transaction ID

    const parameter = {
      transaction_details: {
        order_id: trxId,
        gross_amount: grandTotal,
      },
      customer_details: {
        first_name: receiverName,
        email: user?.email,
        phone: receiverPhone,
        billing_address: {
          first_name: receiverName,
          phone: receiverPhone,
          address: shippingAddress,
        },
        shipping_address: {
          first_name: receiverName,
          phone: receiverPhone,
          address: shippingAddress,
        },
      },
      item_details: itemDetails,
      // Gunakan custom_field1 untuk menyimpan Array of Order IDs
      custom_field1: JSON.stringify(orderIds),
      callbacks: {
        finish: "http://localhost:5173/orders",
      },
    };

    const transaction = await snap.createTransaction(parameter);

    // 7. Hapus Cart items
    await db.delete(cartItems).where(eq(cartItems.cartId, cart.id));

    res.json({
      message: "Checkout berhasil",
      snapToken: transaction.token,
      redirectUrl: transaction.redirect_url,
      orders: createdOrders,
    });
  } catch (err) {
    next(err);
  }
};
