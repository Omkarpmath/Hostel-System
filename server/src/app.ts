import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import compression from "compression";
import path from "path";
import { fileURLToPath } from "url";
import helmet from "helmet";
import { env } from "./config/env.js";
import { prisma } from "./config/db.js";
import { errorHandler } from "./middleware/error.middleware.js";
import { apiGlobalRateLimiter } from "./middleware/rate-limit.middleware.js";

// Routes
import authRoutes from "./modules/auth/auth.routes.js";
import hostelRoutes from "./modules/hostel/hostel.routes.js";
import userRoutes from "./modules/user/user.routes.js";
import operationsRoutes from "./modules/operations/operations.routes.js";
import bookingRoutes from "./modules/booking/booking.routes.js";
import messFeeRoutes from "./modules/mess-fee/mess-fee.routes.js";
import verifyRoutes from "./modules/verify/verify.routes.js";
import attendanceRoutes from "./modules/attendance/attendance.routes.js";
import announcementRoutes from "./modules/announcement/announcement.routes.js";
import notificationRoutes from "./modules/notification/notification.routes.js";
import messEntryRoutes from "./modules/mess-entry/mess-entry.routes.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Trust reverse proxy for correct client IP detection behind Cloudflare / Render / Nginx
app.set("trust proxy", 1);

// Security HTTP headers (crossOriginResourcePolicy: false allows static asset delivery)
app.use(helmet({ crossOriginResourcePolicy: false }));

// ============ MIDDLEWARE ============

const allowedOrigins = [
  env.CLIENT_URL,
  "http://localhost:5173",
  "http://localhost:3000",
  "http://127.0.0.1:5173",
  "https://frontend-4onm.onrender.com",
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV !== "production") {
      callback(null, true);
    } else {
      callback(null, origin === env.CLIENT_URL);
    }
  },
  credentials: true,
}));

app.use(compression());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use("/api/v1", apiGlobalRateLimiter);

// Static files for uploads
const uploadDir = path.resolve(env.UPLOAD_DIR);
app.use("/uploads", express.static(uploadDir));
app.use("/api/v1/uploads", express.static(uploadDir));

// ============ ROUTES ============

app.get("/api/v1/health", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({
      success: true,
      message: "BMSET Hostel Management API is running",
      database: "connected",
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    res.status(503).json({
      success: false,
      message: "BMSET Hostel API — Database unavailable",
      database: "disconnected",
      timestamp: new Date().toISOString(),
    });
  }
});

app.get("/api/ping", (_req, res) => {
  res.json({ status: "ok", message: "Hostel-System backend is running" });
});

// Alias for /api/dashboard/stats -> /api/v1/dashboard/stats
app.get("/api/dashboard/stats", (req, res, next) => {
  req.url = "/dashboard/stats";
  hostelRoutes(req, res, next);
});

app.use("/api/v1/auth", authRoutes);
// This endpoint is intentionally public: security/warden staff scan a student's
// QR code without signing in. It must be registered before the routers mounted
// at `/api/v1`, whose authentication middleware otherwise intercepts it.
app.use("/api/v1/verify", verifyRoutes);
app.use("/api/v1", hostelRoutes);
app.use("/api/v1", userRoutes);
app.use("/api/v1", operationsRoutes);
app.use("/api/v1/booking", bookingRoutes);
app.use("/api/v1/mess-fee", messFeeRoutes);
app.use("/api/v1/attendance", attendanceRoutes);
app.use("/api/v1/mess-entry", messEntryRoutes);
app.use("/api/v1/announcements", announcementRoutes);
app.use("/api/v1/notifications", notificationRoutes);

// ============ ERROR HANDLING ============

app.use(errorHandler);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

export default app;
