import express from "express";
import { createDispute } from "../controllers/dispute.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { roleMiddleware } from "../middlewares/role.middleware.js";

const router = express.Router();

router.post("/", authMiddleware, roleMiddleware(["USER"]), createDispute);

export default router;
