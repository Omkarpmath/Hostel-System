import app from "./app.js";
import { env } from "./config/env.js";
import { prisma } from "./config/db.js";
import { startReservationCleanupJob } from "./jobs/reservation-cleanup.job.js";
let server = null;
async function main() {
    try {
        // Test database connection
        await prisma.$connect();
        console.log("✅ Database connected successfully");
        // Start background jobs
        startReservationCleanupJob();
        server = app.listen(env.PORT, () => {
            console.log(`
╔══════════════════════════════════════════════════╗
║    BMSET Hostel Management System — API Server   ║
╠══════════════════════════════════════════════════╣
║  🚀 Server running on port ${env.PORT}                 ║
║  🌍 Environment: ${env.NODE_ENV.padEnd(28)}  ║
║  📡 API: http://localhost:${env.PORT}/api/v1           ║
║  🏥 Health: http://localhost:${env.PORT}/api/v1/health ║
╚══════════════════════════════════════════════════╝
      `);
        });
    }
    catch (error) {
        console.error("❌ Failed to start server:", error);
        process.exit(1);
    }
}
// Graceful shutdown with in-flight connection draining
let isShuttingDown = false;
async function gracefulShutdown(signal) {
    if (isShuttingDown)
        return;
    isShuttingDown = true;
    console.log(`\n🛑 Received ${signal}. Draining active HTTP connections...`);
    // Force exit after 10 seconds if connections fail to drain
    const forceTimeout = setTimeout(() => {
        console.error("⚠️ Forceful shutdown triggered after timeout.");
        process.exit(1);
    }, 10_000);
    forceTimeout.unref();
    try {
        if (server) {
            await new Promise((resolve) => {
                server?.close(() => {
                    console.log("🔌 All HTTP connections drained cleanly.");
                    resolve();
                });
            });
        }
        await prisma.$disconnect();
        console.log("📦 Database disconnected cleanly. Process exit 0.");
        process.exit(0);
    }
    catch (err) {
        console.error("❌ Error during graceful shutdown:", err);
        process.exit(1);
    }
}
process.on("SIGINT", () => gracefulShutdown("SIGINT"));
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
main();
//# sourceMappingURL=server.js.map