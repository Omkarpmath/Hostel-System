import cron from "node-cron";
/**
 * Proactive background cleanup job for expired reservations.
 * Runs every 60 seconds (* * * * *).
 *
 * Expiring stale pending reservations frees held beds immediately
 * so other students see accurate live availability without waiting
 * for individual students to refresh or initiate actions.
 */
export declare function startReservationCleanupJob(): cron.ScheduledTask;
//# sourceMappingURL=reservation-cleanup.job.d.ts.map