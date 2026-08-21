import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "path";
import { fileURLToPath } from "url";
import { env } from "./config/env.js";
import { errorHandler } from "./middleware/error.middleware.js";
// Routes
import authRoutes from "./modules/auth/auth.routes.js";
import hostelRoutes from "./modules/hostel/hostel.routes.js";
import userRoutes from "./modules/user/user.routes.js";
import operationsRoutes from "./modules/operations/operations.routes.js";
import bookingRoutes from "./modules/booking/booking.routes.js";
import messFeeRoutes from "./modules/mess-fee/mess-fee.routes.js";
import verifyRoutes from "./modules/verify/verify.routes.js";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
// ============ MIDDLEWARE ============
app.use(cors({
    origin: env.CLIENT_URL,
    credentials: true,
}));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
// Static files for uploads
app.use("/uploads", express.static(path.join(__dirname, "..", env.UPLOAD_DIR)));
// ============ ROUTES ============
app.get("/api/v1/health", (_req, res) => {
    res.json({
        success: true,
        message: "BMSCE Hostel Management API is running",
        timestamp: new Date().toISOString(),
    });
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
//# sourceMappingURL=app.js.map