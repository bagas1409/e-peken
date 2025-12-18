import express from "express";
import {
  createProduct,
  getMyProducts,
  updateProduct,
  deleteProduct,
  toggleProductStatus,
} from "../controllers/product.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { roleMiddleware } from "../middlewares/role.middleware.js";

const router = express.Router();

// semua route produk: UMKM only
router.use(authMiddleware, roleMiddleware(["UMKM"]));

router.post("/", createProduct);
router.get("/my", getMyProducts);
router.put("/:id", updateProduct);
router.delete("/:id", deleteProduct);

router.patch(
  "/:id/toggle",
  authMiddleware,
  roleMiddleware(["UMKM"]),
  toggleProductStatus
);

export default router;
