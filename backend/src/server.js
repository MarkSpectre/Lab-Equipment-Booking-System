import cors from "cors";
import express from "express";
import morgan from "morgan";
import { env } from "./config/env.js";
import { prisma } from "./config/prisma.js";
import { requireAuth } from "./middleware/authMiddleware.js";
import { errorHandler } from "./middleware/errorHandler.js";
import adminRoutes from "./routes/adminRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import equipmentRoutes from "./routes/equipmentRoutes.js";
import labRoutes from "./routes/labRoutes.js";
import requestRoutes from "./routes/requestRoutes.js";

const app = express();

app.use(
  cors({
    origin: ["http://localhost:5173", env.frontendOrigin],
    methods: ["GET", "POST", "PATCH", "DELETE"],
    credentials: true,
  })
);
app.use(express.json());
app.use(morgan("dev"));

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", service: "lab-borrowing-api" });
});

app.use("/api/auth", authRoutes);
app.use("/api/admin", requireAuth, adminRoutes);
app.use("/api/labs", requireAuth, labRoutes);
app.use("/api/equipment", requireAuth, equipmentRoutes);
app.use("/api/requests", requireAuth, requestRoutes);
app.use(errorHandler);

async function startServer() {
  try {
    await prisma.$connect();
    console.log("✅ Successfully connected to RDS");
  } catch (error) {
    console.error("❌ RDS Connection Failed", error);
    process.exit(1);
  }

  app.listen(5000, "0.0.0.0", () => {
    console.log("Server running on http://0.0.0.0:5000");
  });
}

startServer();
