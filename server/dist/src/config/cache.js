class MemoryCache {
    store = new Map();
    cleanupInterval = null;
    constructor() {
        // Periodically sweep expired entries every 30 seconds to keep memory lean
        this.cleanupInterval = setInterval(() => {
            const now = Date.now();
            for (const [key, entry] of this.store.entries()) {
                if (now > entry.expiresAt) {
                    this.store.delete(key);
                }
            }
        }, 30_000);
        // Don't prevent Node process from exiting
        if (this.cleanupInterval.unref) {
            this.cleanupInterval.unref();
        }
    }
    get(key) {
        const entry = this.store.get(key);
        if (!entry)
            return null;
        if (Date.now() > entry.expiresAt) {
            this.store.delete(key);
            return null;
        }
        return entry.data;
    }
    set(key, data, ttlMs) {
        this.store.set(key, {
            data,
            expiresAt: Date.now() + ttlMs,
        });
    }
    delete(key) {
        this.store.delete(key);
    }
    invalidate(pattern) {
        if (!pattern) {
            this.store.clear();
            return;
        }
        for (const key of this.store.keys()) {
            if (key.includes(pattern)) {
                this.store.delete(key);
            }
        }
    }
    size() {
        return this.store.size;
    }
}
export const roomCache = new MemoryCache();
export const dashboardCache = new MemoryCache();
//# sourceMappingURL=cache.js.map