import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { db } from "../config/db.js";
import { users, roles, userRoles, refreshTokens } from "../config/schema.js";
import { eq } from "drizzle-orm";

/* =========================
   HELPER TOKEN
========================= */
const generateAccessToken = (user) =>
  jwt.sign(
    {
      id: user.id,
      role: user.role,
    },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: "15m" }
  );

const generateRefreshToken = (user) =>
  jwt.sign(
    {
      id: user.id,
    },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: "7d" }
  );

/* =========================
   REGISTER
========================= */
export const register = async (req, res, next) => {
  try {
    const { name, email, password, role = "USER" } = req.body;

    // cek user sudah ada
    const existing = await db
      .select()
      .from(users)
      .where(eq(users.email, email));

    if (existing.length > 0) {
      return res.status(400).json({ message: "Email sudah terdaftar" });
    }

    // hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // insert user
    const [newUser] = await db
      .insert(users)
      .values({
        name,
        email,
        password: hashedPassword,
        status: "ACTIVE",
      })
      .returning();

    // ambil role
    const [roleRow] = await db.select().from(roles).where(eq(roles.name, role));

    if (!roleRow) {
      return res.status(400).json({ message: "Role tidak valid" });
    }

    // assign role
    await db.insert(userRoles).values({
      userId: newUser.id,
      roleId: roleRow.id,
    });

    res.status(201).json({
      message: "Register berhasil",
      userId: newUser.id,
      role,
    });
  } catch (err) {
    next(err);
  }
};

/* =========================
   LOGIN
========================= */
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const result = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        password: users.password,
        status: users.status,
        role: roles.name,
      })
      .from(users)
      .leftJoin(userRoles, eq(users.id, userRoles.userId))
      .leftJoin(roles, eq(userRoles.roleId, roles.id))
      .where(eq(users.email, email));

    if (result.length === 0) {
      return res.status(401).json({ message: "Email tidak ditemukan" });
    }

    const user = result[0];

    // 🔴 CEK BANNED
    if (user.status === "BANNED") {
      return res.status(403).json({
        message: "Akun dibanned oleh admin",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Password salah" });
    }

    // buat token
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // simpan refresh token ke DB
    await db.insert(refreshTokens).values({
      userId: user.id,
      token: refreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    res.json({
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    next(err);
  }
};

/* =========================
   REFRESH ACCESS TOKEN
========================= */
export const refreshAccessToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({ message: "Refresh token diperlukan" });
    }

    // verify refresh token JWT
    const payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

    // cek refresh token di DB
    const [stored] = await db
      .select()
      .from(refreshTokens)
      .where(eq(refreshTokens.token, refreshToken));

    if (!stored) {
      return res.status(403).json({ message: "Refresh token tidak valid" });
    }

    // ambil role user
    const [userRole] = await db
      .select({
        role: roles.name,
      })
      .from(userRoles)
      .leftJoin(roles, eq(userRoles.roleId, roles.id))
      .where(eq(userRoles.userId, payload.id));

    const newAccessToken = jwt.sign(
      {
        id: payload.id,
        role: userRole.role,
      },
      process.env.JWT_ACCESS_SECRET,
      { expiresIn: "15m" }
    );

    res.json({ accessToken: newAccessToken });
  } catch (err) {
    return res.status(403).json({ message: "Refresh token expired / invalid" });
  }
};

/* =========================
   LOGOUT
========================= */
export const logout = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ message: "Refresh token diperlukan" });
    }

    await db.delete(refreshTokens).where(eq(refreshTokens.token, refreshToken));

    res.json({ message: "Logout berhasil" });
  } catch (err) {
    next(err);
  }
};
