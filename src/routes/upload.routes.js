import express from "express";
import {
  uploadProductImage,
  uploadUmkmLogo,
  uploadUmkmBanner,
  uploadChatImage,
} from "../controllers/upload.controller.js";
import { upload } from "../middlewares/upload.middleware.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { roleMiddleware } from "../middlewares/role.middleware.js";

const router = express.Router();

router.post(
  "/product-image",
  authMiddleware,
  roleMiddleware(["UMKM"]),
  upload.single("image"),
  uploadProductImage
);

router.post(
  "/umkm/logo",
  authMiddleware,
  roleMiddleware(["UMKM"]),
  upload.single("image"),
  uploadUmkmLogo
);

router.post(
  "/umkm/banner",
  authMiddleware,
  roleMiddleware(["UMKM"]),
  upload.single("image"),
  uploadUmkmBanner
);

router.post(
  "/chat-image",
  authMiddleware,
  upload.single("image"),
  uploadChatImage
);

export default router;
