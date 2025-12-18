import { supabase } from "../config/supabase.js";
import { v4 as uuid } from "uuid";
import { db } from "../config/db.js";
import { umkmProfiles } from "../config/schema.js";
import { eq } from "drizzle-orm";

export const uploadProductImage = async (req, res, next) => {
  try {
    const file = req.file;

    if (!file) {
      return res.status(400).json({ message: "File tidak ditemukan" });
    }

    const fileExt = file.originalname.split(".").pop();
    const fileName = `${uuid()}.${fileExt}`;
    const filePath = `products/${fileName}`;

    const { error } = await supabase.storage
      .from("products")
      .upload(filePath, file.buffer, {
        contentType: file.mimetype,
      });

    if (error) throw error;

    const { data } = supabase.storage.from("products").getPublicUrl(filePath);

    res.json({
      message: "Upload berhasil",
      imageUrl: data.publicUrl,
    });
  } catch (err) {
    next(err);
  }
};

/* ======================
   UPLOAD LOGO UMKM
====================== */
export const uploadUmkmLogo = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ message: "File tidak ada" });
    }

    const [umkm] = await db
      .select()
      .from(umkmProfiles)
      .where(eq(umkmProfiles.userId, userId));

    if (!umkm) {
      return res.status(404).json({ message: "UMKM tidak ditemukan" });
    }

    const ext = file.originalname.split(".").pop();
    const path = `logos/${uuid()}.${ext}`;

    await supabase.storage.from("umkm").upload(path, file.buffer, {
      contentType: file.mimetype,
    });

    const { data } = supabase.storage.from("umkm").getPublicUrl(path);

    await db
      .update(umkmProfiles)
      .set({ logoUrl: data.publicUrl })
      .where(eq(umkmProfiles.id, umkm.id));

    res.json({
      message: "Logo UMKM berhasil diupload",
      logoUrl: data.publicUrl,
    });
  } catch (err) {
    next(err);
  }
};

/* ======================
   UPLOAD BANNER UMKM
====================== */
export const uploadUmkmBanner = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const file = req.file;

    const [umkm] = await db
      .select()
      .from(umkmProfiles)
      .where(eq(umkmProfiles.userId, userId));

    if (!umkm) {
      return res.status(404).json({ message: "UMKM tidak ditemukan" });
    }

    const ext = file.originalname.split(".").pop();
    const path = `banners/${uuid()}.${ext}`;

    await supabase.storage.from("umkm").upload(path, file.buffer, {
      contentType: file.mimetype,
    });

    const { data } = supabase.storage.from("umkm").getPublicUrl(path);

    await db
      .update(umkmProfiles)
      .set({ bannerUrl: data.publicUrl })
      .where(eq(umkmProfiles.id, umkm.id));

    res.json({
      message: "Banner UMKM berhasil diupload",
      bannerUrl: data.publicUrl,
    });
  } catch (err) {
    next(err);
  }
};
