import express from "express";
import { addToCart, getMyCart } from "../controllers/cart.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { roleMiddleware } from "../middlewares/role.middleware.js";

const router = express.Router();

router.use(authMiddleware, roleMiddleware(["USER"]));

router.post("/", addToCart);
router.get("/", getMyCart);

export default router;
