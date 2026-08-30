export declare class AttendanceService {
    /**
     * Get the hostelId a security user is assigned to.
     * Throws if the user is not assigned to any hostel.
     */
    private getSecurityHostelId;
    /**
     * Get today's date at midnight UTC (used as the unique session date key).
     */
    private todayDate;
    /** Start a new attendance session for today + the security's assigned hostel. */
    startSession(securityUserId: string): Promise<{
        hostel: {
            name: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import("@prisma/client").$Enums.AttendanceSessionStatus;
        securityId: string;
        hostelId: string;
        date: Date;
        startedAt: Date;
        endedAt: Date | null;
    }>;
    /** Get the active session (if any) for the security user's hostel today. */
    getActiveSession(securityUserId: string): Promise<({
        hostel: {
            name: string;
        };
        _count: {
            records: number;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import("@prisma/client").$Enums.AttendanceSessionStatus;
        securityId: string;
        hostelId: string;
        date: Date;
        startedAt: Date;
        endedAt: Date | null;
    }) | null>;
    /** End the active session and return a summary. */
    endSession(securityUserId: string): Promise<{
        session: {
            hostel: {
                name: string;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            status: import("@prisma/client").$Enums.AttendanceSessionStatus;
            securityId: string;
            hostelId: string;
            date: Date;
            startedAt: Date;
            endedAt: Date | null;
        };
        summary: {
            hostel: {
                name: string;
                id: string;
                type: import("@prisma/client").$Enums.HostelType;
            };
            date: string;
            session: {
                id: string;
                status: import("@prisma/client").$Enums.AttendanceSessionStatus;
                securityName: string;
                startedAt: Date;
                endedAt: Date | null;
            } | null;
            summary: {
                total: number;
                present: number;
                onLeave: number;
                absent: number;
            };
            register: {
                studentId: string;
                studentName: string;
                usn: string;
                roomNumber: string;
                status: "PRESENT" | "ON_LEAVE" | "ABSENT";
                scannedAt: Date | null;
            }[];
        };
    }>;
    /** Scan a student's QR token and return the result. */
    scanStudent(securityUserId: string, qrToken: string): Promise<{
        status: string;
        message: string;
        studentName?: undefined;
        usn?: undefined;
    } | {
        status: string;
        message: string;
        studentName: string;
        usn: string;
    }>;
    /** Build the complete attendance register for a hostel on a given date. */
    getRegister(hostelId: string, date?: Date): Promise<{
        hostel: {
            name: string;
            id: string;
            type: import("@prisma/client").$Enums.HostelType;
        };
        date: string;
        session: {
            id: string;
            status: import("@prisma/client").$Enums.AttendanceSessionStatus;
            securityName: string;
            startedAt: Date;
            endedAt: Date | null;
        } | null;
        summary: {
            total: number;
            present: number;
            onLeave: number;
            absent: number;
        };
        register: {
            studentId: string;
            studentName: string;
            usn: string;
            roomNumber: string;
            status: "PRESENT" | "ON_LEAVE" | "ABSENT";
            scannedAt: Date | null;
        }[];
    }>;
    /** Export the register as CSV text. */
    exportRegisterCSV(hostelId: string, dateStr: string): Promise<string>;
    /** Assign a SECURITY user to a hostel. */
    assignSecurityToHostel(securityUserId: string, hostelId: string): Promise<{
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        assignedHostel: {
            name: string;
            id: string;
        } | null;
    }>;
    /** Unassign a SECURITY user from their hostel. */
    unassignSecurity(securityUserId: string): Promise<{
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        assignedHostel: {
            name: string;
            id: string;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            type: import("@prisma/client").$Enums.HostelType;
            address: string | null;
            description: string | null;
            wardenId: string | null;
            allowedYears: number[];
            deletedAt: Date | null;
        } | null;
    }>;
    /** List all security users with their hostel assignments. */
    listSecurityUsers(): Promise<{
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        phone: string | null;
        assignedHostel: {
            name: string;
            id: string;
            type: import("@prisma/client").$Enums.HostelType;
        } | null;
    }[]>;
    /** List all attendance sessions with filters. */
    listSessions(filters: {
        hostelId?: string;
        from?: string;
        to?: string;
    }): Promise<({
        hostel: {
            name: string;
        };
        _count: {
            records: number;
        };
        security: {
            firstName: string;
            lastName: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import("@prisma/client").$Enums.AttendanceSessionStatus;
        securityId: string;
        hostelId: string;
        date: Date;
        startedAt: Date;
        endedAt: Date | null;
    })[]>;
    /**
     * Get a student's own attendance history for a given month.
     * Returns one entry per day that had a session in their hostel.
     */
    getStudentHistory(userId: string, year: number, month: number): Promise<{
        hostel: null;
        days: never[];
        summary: {
            total: number;
            present: number;
            onLeave: number;
            absent: number;
        };
        month?: undefined;
    } | {
        hostel: {
            id: string;
            name: string;
        };
        month: string;
        days: {
            date: string;
            status: "PRESENT" | "ON_LEAVE" | "ABSENT";
            scannedAt: Date | null;
        }[];
        summary: {
            total: number;
            present: number;
            onLeave: number;
            absent: number;
        };
    }>;
}
export declare const attendanceService: AttendanceService;
//# sourceMappingURL=attendance.service.d.ts.map