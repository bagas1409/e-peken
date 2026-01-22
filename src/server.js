import app from "./app.js";
import { env } from "./config/env.js";
import "dotenv/config";
import { createServer } from "http";
import { initSocket } from "./socket.js";

const PORT = process.env.PORT || 4000;

// Create HTTP server from Express app
const httpServer = createServer(app);

// Initialize Socket.io
initSocket(httpServer);

const server = httpServer.listen(PORT, () => {
  console.log(`Server running in ${env.NODE_ENV} mode on port ${PORT}`);
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM signal received: closing HTTP server");
  server.close(() => {
    console.log("HTTP server closed");
  });
});
