import type { CreateAnnouncementInput, UpdateAnnouncementInput } from "./announcement.schema.js";
export declare class AnnouncementService {
    /**
     * Helper to fetch student context (active hostel, year, department)
     */
    private getStudentContext;
    /**
     * Helper to get target student count for an announcement
     */
    private calculateTargetCount;
    /**
     * Reconciles expired and scheduled announcements based on current timestamp
     */
    private reconcileLifecycle;
    /**
     * List announcements for staff (Admin / Warden) with filters & read statistics
     */
    listAnnouncements(userId: string, role: string, filters?: {
        status?: string;
        priority?: string;
        hostelId?: string;
        search?: string;
    }): Promise<{
        targetCount: number;
        readCount: number;
        unreadCount: number;
        readPercentage: number;
        _count: {
            reads: number;
        };
        createdBy: {
            id: string;
            email: string;
            role: import("@prisma/client").$Enums.Role;
            firstName: string;
            lastName: string;
            avatarUrl: string | null;
        };
        targetHostel: {
            name: string;
            id: string;
            type: import("@prisma/client").$Enums.HostelType;
        } | null;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import("@prisma/client").$Enums.AnnouncementStatus;
        title: string;
        priority: import("@prisma/client").$Enums.AnnouncementPriority;
        message: string;
        targetAudience: import("@prisma/client").$Enums.AnnouncementTarget;
        targetHostelId: string | null;
        targetYear: number | null;
        targetDepartment: string | null;
        publishAt: Date;
        expiresAt: Date | null;
        createdById: string;
    }[]>;
    /**
     * List announcements eligible for the logged in student
     */
    getMyAnnouncements(userId: string, filters?: {
        unreadOnly?: boolean;
        priority?: string;
    }): Promise<{
        id: string;
        title: string;
        message: string;
        priority: import("@prisma/client").$Enums.AnnouncementPriority;
        targetAudience: import("@prisma/client").$Enums.AnnouncementTarget;
        targetHostelId: string | null;
        targetHostel: {
            name: string;
            id: string;
            type: import("@prisma/client").$Enums.HostelType;
        } | null;
        targetYear: number | null;
        targetDepartment: string | null;
        status: import("@prisma/client").$Enums.AnnouncementStatus;
        publishAt: Date;
        expiresAt: Date | null;
        createdById: string;
        createdBy: {
            id: string;
            email: string;
            role: import("@prisma/client").$Enums.Role;
            firstName: string;
            lastName: string;
            avatarUrl: string | null;
        };
        createdAt: Date;
        updatedAt: Date;
        isRead: boolean;
        readAt: Date;
    }[]>;
    /**
     * Get announcement details + reader audit log (for Admin/Warden)
     */
    getAnnouncementById(id: string, userId: string, role: string): Promise<{
        isRead: boolean;
        createdBy: {
            id: string;
            email: string;
            role: import("@prisma/client").$Enums.Role;
            firstName: string;
            lastName: string;
            avatarUrl: string | null;
        };
        targetHostel: {
            name: string;
            id: string;
            type: import("@prisma/client").$Enums.HostelType;
        } | null;
        reads: ({
            user: {
                id: string;
                email: string;
                firstName: string;
                lastName: string;
                studentProfile: {
                    usn: string;
                    department: string;
                    year: number;
                } | null;
            };
        } & {
            id: string;
            announcementId: string;
            userId: string;
            readAt: Date;
        })[];
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import("@prisma/client").$Enums.AnnouncementStatus;
        title: string;
        priority: import("@prisma/client").$Enums.AnnouncementPriority;
        message: string;
        targetAudience: import("@prisma/client").$Enums.AnnouncementTarget;
        targetHostelId: string | null;
        targetYear: number | null;
        targetDepartment: string | null;
        publishAt: Date;
        expiresAt: Date | null;
        createdById: string;
    } | {
        targetCount: number;
        readCount: number;
        unreadCount: number;
        readPercentage: number;
        createdBy: {
            id: string;
            email: string;
            role: import("@prisma/client").$Enums.Role;
            firstName: string;
            lastName: string;
            avatarUrl: string | null;
        };
        targetHostel: {
            name: string;
            id: string;
            type: import("@prisma/client").$Enums.HostelType;
        } | null;
        reads: ({
            user: {
                id: string;
                email: string;
                firstName: string;
                lastName: string;
                studentProfile: {
                    usn: string;
                    department: string;
                    year: number;
                } | null;
            };
        } & {
            id: string;
            announcementId: string;
            userId: string;
            readAt: Date;
        })[];
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import("@prisma/client").$Enums.AnnouncementStatus;
        title: string;
        priority: import("@prisma/client").$Enums.AnnouncementPriority;
        message: string;
        targetAudience: import("@prisma/client").$Enums.AnnouncementTarget;
        targetHostelId: string | null;
        targetYear: number | null;
        targetDepartment: string | null;
        publishAt: Date;
        expiresAt: Date | null;
        createdById: string;
    }>;
    /**
     * Create an announcement (Admin / Warden)
     */
    createAnnouncement(userId: string, role: string, data: CreateAnnouncementInput): Promise<{
        createdBy: {
            id: string;
            email: string;
            role: import("@prisma/client").$Enums.Role;
            firstName: string;
            lastName: string;
            avatarUrl: string | null;
        };
        targetHostel: {
            name: string;
            id: string;
            type: import("@prisma/client").$Enums.HostelType;
        } | null;
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import("@prisma/client").$Enums.AnnouncementStatus;
        title: string;
        priority: import("@prisma/client").$Enums.AnnouncementPriority;
        message: string;
        targetAudience: import("@prisma/client").$Enums.AnnouncementTarget;
        targetHostelId: string | null;
        targetYear: number | null;
        targetDepartment: string | null;
        publishAt: Date;
        expiresAt: Date | null;
        createdById: string;
    }>;
    /**
     * Helper to notify targeted students about an announcement
     */
    private notifyTargetedStudents;
    /**
     * Update an announcement (Admin / Warden)
     */
    updateAnnouncement(id: string, userId: string, role: string, data: UpdateAnnouncementInput): Promise<{
        createdBy: {
            id: string;
            email: string;
            role: import("@prisma/client").$Enums.Role;
            firstName: string;
            lastName: string;
            avatarUrl: string | null;
        };
        targetHostel: {
            name: string;
            id: string;
            type: import("@prisma/client").$Enums.HostelType;
        } | null;
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import("@prisma/client").$Enums.AnnouncementStatus;
        title: string;
        priority: import("@prisma/client").$Enums.AnnouncementPriority;
        message: string;
        targetAudience: import("@prisma/client").$Enums.AnnouncementTarget;
        targetHostelId: string | null;
        targetYear: number | null;
        targetDepartment: string | null;
        publishAt: Date;
        expiresAt: Date | null;
        createdById: string;
    }>;
    /**
     * Delete an announcement
     */
    deleteAnnouncement(id: string, userId: string, role: string): Promise<{
        success: boolean;
        message: string;
    }>;
    /**
     * Mark announcement as read for student
     */
    markAsRead(announcementId: string, userId: string): Promise<{
        success: boolean;
    }>;
    /**
     * Mark all eligible active announcements as read for student
     */
    markAllAsRead(userId: string): Promise<{
        count: number;
    }>;
    /**
     * Overall metrics for Admin / Warden dashboard
     */
    getStats(userId: string, role: string): Promise<{
        total: number;
        active: number;
        urgent: number;
        totalReads: number;
    }>;
}
export declare const announcementService: AnnouncementService;
//# sourceMappingURL=announcement.service.d.ts.map