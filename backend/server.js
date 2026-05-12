import "./config/env.js";

import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import connect_DB from "./config/db.js";
import { initChromaCollections } from "./config/initChroma.js";
import authRoutes from "./routers/authRoutes.js";
import fileRoutes from "./routers/fileRoutes.js";
import chatRoutes from "./routers/chatRoutes.js";  
const app = express();

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors({
  origin: "http://localhost:5173",
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

// ── Routes ────────────────────────────────────────────────────────────────────
app.use("/api/auth",      authRoutes);
app.use("/uploads",       express.static("uploads"));
app.use("/api/documents", fileRoutes);
app.use("/api/chat",   chatRoutes);  

const PORT = process.env.PORT || 5000;

(async () => {
  try {
    await connect_DB();
    await initChromaCollections();

    app.listen(PORT, () => {
      console.log(`[Server] Running on port ${PORT}`);
    });

  } catch (error) {
    console.error("[Server] Startup failed:", error.message);
    process.exit(1);
  }
})();