/**
 * High-performance, in-memory rate limiter middleware.
 * Tracks requests per authenticated user ID (or client IP for unauthenticated routes).
 */
export function createRateLimiter(options) {
    const { windowMs, max, message } = options;
    const store = new Map();
    // Periodically clean up expired entries every minute
    const cleanup = setInterval(() => {
        const now = Date.now();
        for (const [key, record] of store.entries()) {
            if (now > record.resetAt) {
                store.delete(key);
            }
        }
    }, 60_000);
    if (cleanup.unref) {
        cleanup.unref();
    }
    return (req, res, next) => {
        const key = req.user?.id || req.ip || req.headers["x-forwarded-for"] || "global";
        const now = Date.now();
        const record = store.get(key);
        if (!record || now > record.resetAt) {
            store.set(key, {
                count: 1,
                resetAt: now + windowMs,
            });
            res.setHeader("X-RateLimit-Limit", max);
            res.setHeader("X-RateLimit-Remaining", max - 1);
            return next();
        }
        if (record.count >= max) {
            const retryAfterSec = Math.ceil((record.resetAt - now) / 1000);
            res.setHeader("Retry-After", retryAfterSec);
            res.setHeader("X-RateLimit-Limit", max);
            res.setHeader("X-RateLimit-Remaining", 0);
            return res.status(429).json({
                success: false,
                message: message || `Too many requests. Please wait ${retryAfterSec} second(s) before trying again.`,
            });
        }
        record.count++;
        res.setHeader("X-RateLimit-Limit", max);
        res.setHeader("X-RateLimit-Remaining", max - record.count);
        return next();
    };
}
// 10 attempts per minute for room reservations and order creation
export const bookingActionRateLimiter = createRateLimiter({
    windowMs: 60 * 1000,
    max: 10,
    message: "You are submitting booking requests too quickly. Please wait a moment.",
});
// 30 requests per minute for browsing room availability (allows polling while preventing spam)
export const browseRoomsRateLimiter = createRateLimiter({
    windowMs: 60 * 1000,
    max: 30,
    message: "Too many room availability requests. Please slow down.",
});
//# sourceMappingURL=rate-limit.middleware.js.map