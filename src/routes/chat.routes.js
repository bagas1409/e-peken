import express from "express";
import {
    createChat,
    getMyChats,
    getMessages,
    sendMessage,
} from "../controllers/chat.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const router = express.Router();

// Protected: All chat routes require login
router.use(authMiddleware);

// Start chat (or get existing)
router.post("/", createChat);

// Get my chat list
router.get("/", getMyChats);

// Get messages in a room
router.get("/:id/messages", getMessages);

// Send message
router.post("/:id/messages", sendMessage);

export default router;
