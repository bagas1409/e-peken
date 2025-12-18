import express from "express";
import { register, login } from "../controllers/auth.controller.js";
import { loginLimiter } from "../middlewares/rateLimit.middleware.js";

const router = express.Router();

router.post("/register", register);

router.post("/login", loginLimiter, login);

export default router;
