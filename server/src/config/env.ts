import dotenv from "dotenv";
dotenv.config();

export const env = {
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: parseInt(process.env.PORT || "5000", 10),
  DATABASE_URL: process.env.DATABASE_URL || "",
  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET || "dev_access_secret_change_me",
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || "dev_refresh_secret_change_me",
  JWT_ACCESS_EXPIRES_IN: process.env.JWT_ACCESS_EXPIRES_IN || "15m",
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
  RESERVATION_TIMEOUT_MINUTES: parseInt(process.env.RESERVATION_TIMEOUT_MINUTES || "4", 10),
  CLIENT_URL: process.env.CLIENT_URL || "http://localhost:5173",
  UPLOAD_DIR: process.env.UPLOAD_DIR || "uploads",
  MAX_FILE_SIZE: parseInt(process.env.MAX_FILE_SIZE || "5242880", 10),
} as const;
