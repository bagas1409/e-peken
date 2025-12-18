import express from "express";
import { midtransCallback } from "../controllers/midtrans.callback.controller.js";

const router = express.Router();

// TIDAK pakai auth (dari Midtrans)
router.post("/callback", midtransCallback);

export default router;
