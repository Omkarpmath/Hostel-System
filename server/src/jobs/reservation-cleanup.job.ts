import cron from "node-cron";
import { bookingService } from "../modules/booking/booking.service.js";

/**
 * Proactive background cleanup job for expired reservations.
 * Runs every 60 seconds (* * * * *).
 * 
 * Expiring stale pending reservations frees held beds immediately
 * so other students see accurate live availability without waiting
 * for individual students to refresh or initiate actions.
 */
export function startReservationCleanupJob() {
  const task = cron.schedule("* * * * *", async () => {
    try {
      const expiredCount = await bookingService.expireReservations();
      if (expiredCount > 0) {
        console.log(`[ReservationCleanupJob] Automatically expired ${expiredCount} stale reservation(s)`);
      }
    } catch (error) {
      console.error("[ReservationCleanupJob] Error cleaning up expired reservations:", error);
    }
  });

  console.log("⏱️  Reservation cleanup background job scheduled (every 60s)");
  return task;
}
