declare class MemoryCache {
    private store;
    private cleanupInterval;
    constructor();
    get<T>(key: string): T | null;
    set<T>(key: string, data: T, ttlMs: number): void;
    delete(key: string): void;
    invalidate(pattern?: string): void;
    size(): number;
}
export declare const roomCache: MemoryCache;
export declare const dashboardCache: MemoryCache;
export {};
//# sourceMappingURL=cache.d.ts.map