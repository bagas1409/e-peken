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
      roles: rows.map((r) => r.role).filter(Boolean),
    };

    res.json(user);
  } catch (err) {
    next(err);
  }
};
