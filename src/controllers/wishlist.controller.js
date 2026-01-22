import { db } from "../config/db.js";
import { wishlist, products } from "../config/schema.js";
import { eq, and, desc } from "drizzle-orm";

export const getWishlist = async (req, res, next) => {
    try {
        const userId = req.user.id;

        // Join with products to get details
        const rows = await db
            .select({
                id: wishlist.id,
                productId: wishlist.productId,
                createdAt: wishlist.createdAt,
                product: products
            })
            .from(wishlist)
            .leftJoin(products, eq(wishlist.productId, products.id))
            .where(eq(wishlist.userId, userId))
            .orderBy(desc(wishlist.createdAt));

        // Format response
        const data = rows.map(row => ({
            ...row.product,
            wishlistId: row.id,
            addedAt: row.createdAt
        }));

        res.json(data);
    } catch (err) {
        next(err);
    }
};

export const addToWishlist = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { productId } = req.body;

        // Check availability
        const existing = await db
            .select()
            .from(wishlist)
            .where(and(eq(wishlist.userId, userId), eq(wishlist.productId, productId)));

        if (existing.length > 0) {
            return res.status(400).json({ message: "Produk sudah ada di wishlist" });
        }

        await db.insert(wishlist).values({
            userId,
            productId
        });

        res.status(201).json({ message: "Berhasil ditambahkan ke wishlist" });
    } catch (err) {
        next(err);
    }
};

export const removeFromWishlist = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const productId = Number(req.params.id);

        await db
            .delete(wishlist)
            .where(and(eq(wishlist.userId, userId), eq(wishlist.productId, productId)));

        res.json({ message: "Berhasil dihapus dari wishlist" });
    } catch (err) {
        next(err);
    }
};
