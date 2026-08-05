import app from "./app.js";
import { env } from "./config/env.js";
import { prisma } from "./config/db.js";
async function main() {
    try {
        // Test database connection
        await prisma.$connect();
        console.log("✅ Database connected successfully");
        app.listen(env.PORT, () => {
            console.log(`
╔══════════════════════════════════════════════════╗
║    BMSCE Hostel Management System — API Server   ║
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
// Graceful shutdown
process.on("SIGINT", async () => {
    console.log("\n🛑 Shutting down gracefully...");
    await prisma.$disconnect();
    process.exit(0);
});
process.on("SIGTERM", async () => {
    await prisma.$disconnect();
    process.exit(0);
});
main();
//# sourceMappingURL=server.js.map