import bcrypt from "bcryptjs";
import { db } from "../config/db.js";
import { users, roles, userRoles } from "../config/schema.js";
import { eq } from "drizzle-orm";

export const getMe = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const rows = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: roles.name,
        receiverName: users.receiverName,
        receiverPhone: users.receiverPhone,
        defaultAddress: users.defaultAddress,
        avatarUrl: users.avatarUrl,
      })
      .from(users)
      .leftJoin(userRoles, eq(users.id, userRoles.userId))
      .leftJoin(roles, eq(userRoles.roleId, roles.id))
      .where(eq(users.id, userId));

    if (rows.length === 0) {
      return res.status(404).json({ message: "User tidak ditemukan" });
    }

    const user = {
      id: rows[0].id,
      name: rows[0].name,
      email: rows[0].email,
      receiverName: rows[0].receiverName,
      receiverPhone: rows[0].receiverPhone,
      defaultAddress: rows[0].defaultAddress,
      avatarUrl: rows[0].avatarUrl,
      roles: rows.map((r) => r.role).filter(Boolean),
    };

    res.json(user);
  } catch (err) {
    next(err);
  }
};

export const updateMe = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const {
      name,
      email,
      password,
      receiverName,
      receiverPhone,
      defaultAddress,
      avatarUrl
    } = req.body;

    // Build update object dynamically (only update provided fields)
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (receiverName !== undefined) updateData.receiverName = receiverName;
    if (receiverPhone !== undefined) updateData.receiverPhone = receiverPhone;
    if (defaultAddress !== undefined) updateData.defaultAddress = defaultAddress;
    if (avatarUrl !== undefined) updateData.avatarUrl = avatarUrl;

    // Handle password update (hash it)
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      updateData.password = hashedPassword;
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ message: "Tidak ada data yang diupdate" });
    }

    await db.update(users).set(updateData).where(eq(users.id, userId));

    res.json({ message: "Profil berhasil diupdate" });
  } catch (err) {
    next(err);
  }
};
