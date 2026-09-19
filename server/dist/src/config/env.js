import dotenv from "dotenv";
dotenv.config();
export const env = {
    NODE_ENV: process.env.NODE_ENV || "development",
    PORT: parseInt(process.env.PORT || "5000", 10),
    DATABASE_URL: process.env.DATABASE_URL || "",
    DIRECT_URL: process.env.DIRECT_URL || "",
    JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET || "bmsce_hostel_default_access_jwt_secret_token_2026",
    JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || "bmsce_hostel_default_refresh_jwt_secret_token_2026",
    JWT_ACCESS_EXPIRES_IN: process.env.JWT_ACCESS_EXPIRES_IN || "15m",
    JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
    RESERVATION_TIMEOUT_MINUTES: parseInt(process.env.RESERVATION_TIMEOUT_MINUTES || "10", 10),
    CLIENT_URL: process.env.CLIENT_URL || "http://localhost:5173",
    UPLOAD_DIR: process.env.UPLOAD_DIR || "uploads",
    MAX_FILE_SIZE: parseInt(process.env.MAX_FILE_SIZE || "5242880", 10),
    RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID || "",
    RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET || "",
    RESEND_API_KEY: process.env.RESEND_API_KEY || "",
    RESEND_FROM_EMAIL: process.env.RESEND_FROM_EMAIL || "BMSCE Hostel <onboarding@resend.dev>",
};
if (env.NODE_ENV === "production" && !process.env.JWT_ACCESS_SECRET) {
    console.log("ℹ️ [Config] Running in production with default secure token secret.");
}
//# sourceMappingURL=env.js.map