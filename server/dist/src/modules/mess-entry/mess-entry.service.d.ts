export declare function clearSecurityMessCache(userId?: string): void;
export declare class MessEntryService {
    /**
     * Resolve the mess assigned to the security guard.
     * Cached in-memory with 5-minute TTL.
     */
    getSecurityMess(securityUserId: string): Promise<{
        messId: string;
        messName: string;
    }>;
    /**
     * Ultra-fast scan verification (< 1ms server execution).
     * Verifies dynamic rotating QR token cryptographically, validates active hostel resident status
     * via in-memory lookup, and increments daily scan count asynchronously.
     */
    verifyMessEntry(securityUserId: string, qrToken: string): Promise<{
        status: "EXPIRED";
        message: string;
        studentName?: undefined;
        usn?: undefined;
        hostelName?: undefined;
        roomNumber?: undefined;
        mealPlan?: undefined;
        messName?: undefined;
        todayCount?: undefined;
        scannedAt?: undefined;
    } | {
        status: "INVALID";
        message: string;
        studentName?: undefined;
        usn?: undefined;
        hostelName?: undefined;
        roomNumber?: undefined;
        mealPlan?: undefined;
        messName?: undefined;
        todayCount?: undefined;
        scannedAt?: undefined;
    } | {
        status: "NOT_ELIGIBLE";
        message: string;
        studentName: string;
        usn: string;
        hostelName?: undefined;
        roomNumber?: undefined;
        mealPlan?: undefined;
        messName?: undefined;
        todayCount?: undefined;
        scannedAt?: undefined;
    } | {
        status: "ENTRY_ALLOWED";
        message: string;
        studentName: string;
        usn: string;
        hostelName: string;
        roomNumber: string | undefined;
        mealPlan: "VEG" | "NON_VEG";
        messName: string;
        todayCount: number;
        scannedAt: string;
    }>;
    /**
     * Get today's scan count for the security guard's assigned mess instantly from memory.
     */
    getTodayStats(securityUserId: string): Promise<{
        mess: {
            id: string;
            name: string;
        };
        todayCount: number;
    }>;
    /**
     * Ensure default mess exists and list all active messes for dropdowns.
     */
    listMesses(): Promise<{
        name: string;
        id: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
    }[]>;
    /**
     * Get mess entries (for admin view/history).
     */
    getEntries(filters: {
        messId?: string;
        date?: string;
        limit?: number;
    }): Promise<{
        id: string;
        scannedAt: Date;
        messName: string;
        securityName: string;
        studentName: string;
        usn: string;
        roomNumber: string;
        hostelName: string;
    }[]>;
}
export declare const messEntryService: MessEntryService;
//# sourceMappingURL=mess-entry.service.d.ts.map