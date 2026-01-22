import express from "express";
import { getMe, updateMe } from "../controllers/me.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.get("/", authMiddleware, getMe);
router.patch("/", authMiddleware, updateMe);

export default router;
