import { db } from "../config/db.js";
import {
  umkmProfiles,
  wallets,
  users,
  userRoles,
  roles,
  orders,
  auditLogs,
} from "../config/schema.js";
import { eq } from "drizzle-orm";
import { logAdminAction } from "../utils/auditLogger.js";

/* =========================
   LIST UMKM PENDING
========================= */
export const getPendingUmkm = async (req, res, next) => {
  try {
    const result = await db
      .select()
      .from(umkmProfiles)
      .where(eq(umkmProfiles.status, "PENDING"));

    res.json(result);
  } catch (err) {
    next(err);
  }
};

/* =========================
   APPROVE UMKM
========================= */
export const approveUmkm = async (req, res, next) => {
  try {
    const umkmId = Number(req.params.id);

    // update status UMKM
    const [updated] = await db
      .update(umkmProfiles)
      .set({ status: "ACTIVE" })
      .where(eq(umkmProfiles.id, umkmId))
      .returning();

    if (!updated) {
      return res.status(404).json({ message: "UMKM tidak ditemukan" });
    }

    // cek apakah wallet sudah ada
    const [existingWallet] = await db
      .select()
      .from(wallets)
      .where(eq(wallets.umkmId, umkmId));

    // buat wallet jika belum ada
    if (!existingWallet) {
      await db.insert(wallets).values({
        umkmId,
        balancePending: "0",
        balanceAvailable: "0",
      });
    }

    res.json({
      message: "UMKM berhasil di-approve & wallet dibuat",
      umkm: updated,
    });
  } catch (err) {
    next(err);
  }
};

/* =========================
   REJECT UMKM
========================= */
export const rejectUmkm = async (req, res, next) => {
  try {
    const umkmId = Number(req.params.id);
    const { reason } = req.body;

    const [updated] = await db
      .update(umkmProfiles)
      .set({ status: "REJECTED" })
      .where(eq(umkmProfiles.id, umkmId))
      .returning();

    if (!updated) {
      return res.status(404).json({ message: "UMKM tidak ditemukan" });
    }

    res.json({
      message: "UMKM ditolak",
      reason,
    });
  } catch (err) {
    next(err);
  }
};

export const getAllUsers = async (req, res, next) => {
  try {
    const data = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        status: users.status,
        role: roles.name,
        createdAt: users.createdAt,
      })
      .from(users)
      .leftJoin(userRoles, eq(users.id, userRoles.userId))
      .leftJoin(roles, eq(userRoles.roleId, roles.id))
      .orderBy(users.createdAt);

    res.json(data);
  } catch (err) {
    next(err);
  }
};

export const unbanUser = async (req, res, next) => {
  try {
    const userId = Number(req.params.id);

    await db
      .update(users)
      .set({ status: "ACTIVE" })
      .where(eq(users.id, userId));

    res.json({ message: "User berhasil diaktifkan kembali" });
  } catch (err) {
    next(err);
  }
};

export const getAllOrders = async (req, res, next) => {
  try {
    const data = await db
      .select({
        orderId: orders.id,
        totalAmount: orders.totalAmount,
        orderStatus: orders.orderStatus,
        paymentStatus: orders.paymentStatus,
        createdAt: orders.createdAt,
        userName: users.name,
        userEmail: users.email,
        umkmName: umkmProfiles.storeName,
      })
      .from(orders)
      .leftJoin(users, eq(orders.userId, users.id))
      .leftJoin(umkmProfiles, eq(orders.umkmId, umkmProfiles.id))
      .orderBy(orders.createdAt);

    res.json(data);
  } catch (err) {
    next(err);
  }
};

export const getOrderDetail = async (req, res, next) => {
  try {
    const orderId = Number(req.params.id);

    const [order] = await db
      .select({
        orderId: orders.id,
        totalAmount: orders.totalAmount,
        orderStatus: orders.orderStatus,
        paymentStatus: orders.paymentStatus,
        createdAt: orders.createdAt,
        userName: users.name,
        userEmail: users.email,
        umkmName: umkmProfiles.storeName,
      })
      .from(orders)
      .leftJoin(users, eq(orders.userId, users.id))
      .leftJoin(umkmProfiles, eq(orders.umkmId, umkmProfiles.id))
      .where(eq(orders.id, orderId));

    if (!order) {
      return res.status(404).json({ message: "Order tidak ditemukan" });
    }

    res.json(order);
  } catch (err) {
    next(err);
  }
};

export const banUser = async (req, res, next) => {
  try {
    const adminId = req.user.id;
    const userId = Number(req.params.id);

    await db
      .update(users)
      .set({ status: "BANNED" })
      .where(eq(users.id, userId));

    await logAdminAction({
      adminId,
      action: "BAN_USER",
      target: `user:${userId}`,
    });

    res.json({ message: "User berhasil dibanned" });
  } catch (err) {
    next(err);
  }
};

export const updateUserRole = async (req, res, next) => {
  try {
    const adminId = req.user.id;
    const userId = Number(req.params.id);
    const { role } = req.body; // Expect "USER" or "UMKM" or "ADMIN"

    // Cari ID Role berdasarkan nama
    const [roleData] = await db
      .select()
      .from(roles)
      .where(eq(roles.name, role));

    if (!roleData) {
      return res.status(400).json({ message: "Role tidak valid" });
    }

    // Update di tabel user_roles
    // Cek dulu apakah user_roles sudah ada entry buat user ini?
    const [existingRole] = await db
      .select()
      .from(userRoles)
      .where(eq(userRoles.userId, userId));

    if (existingRole) {
      await db
        .update(userRoles)
        .set({ roleId: roleData.id })
        .where(eq(userRoles.userId, userId));
    } else {
      await db.insert(userRoles).values({
        userId,
        roleId: roleData.id,
      });
    }

    await logAdminAction({
      adminId,
      action: "UPDATE_ROLE",
      target: `user:${userId}`,
      metadata: { newRole: role },
    });

    res.json({ message: `Role user berhasil diubah menjadi ${role}` });
  } catch (err) {
    next(err);
  }
};

export const getAuditLogs = async (req, res, next) => {
  try {
    const logs = await db
      .select({
        id: auditLogs.id,
        action: auditLogs.action,
        target: auditLogs.target,
        metadata: auditLogs.metadata,
        createdAt: auditLogs.createdAt,
        adminName: users.name,
        adminEmail: users.email,
      })
      .from(auditLogs)
      .leftJoin(users, eq(auditLogs.adminId, users.id))
      .orderBy(auditLogs.createdAt);

    res.json(logs);
  } catch (err) {
    next(err);
  }
};
