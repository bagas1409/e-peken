import express from "express";
import { checkout } from "../controllers/checkout.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { roleMiddleware } from "../middlewares/role.middleware.js";

const router = express.Router();

router.post("/", authMiddleware, roleMiddleware(["USER"]), checkout);

export default router;
