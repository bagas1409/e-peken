import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import { db } from "./config/db.js";
import { users } from "./config/schema.js";
import { eq, sql } from "drizzle-orm";

let io;
const userTimeouts = new Map(); // Store timeouts: userId -> timeoutId

export const initSocket = (httpServer) => {
    io = new Server(httpServer, {
        cors: {
            origin: "*",
            methods: ["GET", "POST"]
        }
    });

    // MIDDLEWARE: Authentication
    io.use((socket, next) => {
        const token = socket.handshake.auth.token;
        if (!token) return next(new Error("Authentication error"));

        try {
            const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
            socket.user = decoded; // Attach user info to socket
            next();
        } catch (err) {
            next(new Error("Authentication error"));
        }
    });

    io.on("connection", async (socket) => {
        const userId = socket.user.id;
        console.log(`User connected: ${userId} (${socket.id})`);

        // 1. CANCEL GRACE TIMEOUT if exists (User reconnected within 45s)
        if (userTimeouts.has(userId)) {
            console.log(`User ${userId} reconnected within grace period.Cancelling offline timer.`);
            clearTimeout(userTimeouts.get(userId));
            userTimeouts.delete(userId);
        }

        // 2. MARK ONLINE IMMEDIATELY
        await setUserOnline(userId, true);
        socket.broadcast.emit("user_status", { userId, isOnline: true });

        // Join personal room for notifications
        socket.join(`user_${userId} `);

        // Join chat room logic
        socket.on("join_room", (room) => {
            socket.join(room);
            console.log(`User ${userId} joined room: ${room} `);
        });

        // DISCONNECT LOGIC
        socket.on("disconnect", () => {
            console.log(`User disconnecting: ${userId}... starting grace period (45s).`);

            // 3. START GRACE PERIOD (45 Seconds)
            const timeoutId = setTimeout(async () => {
                console.log(`[TIMEOUT FIRED] User ${userId} is officially OFFLINE (45s passed).`);
                await setUserOnline(userId, false);
                io.emit("user_status", { userId, isOnline: false, lastSeen: new Date() });
                userTimeouts.delete(userId);
            }, 45000); // 45 Detik

            userTimeouts.set(userId, timeoutId);
            console.log(`[TIMEOUT SET] Timer ID ${timeoutId} for User ${userId}`);
        });
    });

    return io;
};

// Helper to update DB
async function setUserOnline(userId, isOnline) {
    try {
        await db.update(users)
            .set({
                isOnline: isOnline,
                lastSeen: isOnline ? null : new Date()
            })
            .where(eq(users.id, userId));
    } catch (err) {
        console.error("Failed to update user status:", err);
    }
}

export const getIO = () => {
    if (!io) {
        throw new Error("Socket.io not initialized!");
    }
    return io;
};
