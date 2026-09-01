import { Prisma } from "@prisma/client";
import { prisma } from "../../config/db.js";
import { ApiError } from "../../utils/ApiError.js";
import type { CreateAnnouncementInput, UpdateAnnouncementInput } from "./announcement.schema.js";

export class AnnouncementService {
  /**
   * Helper to fetch student context (active hostel, year, department)
   */
  private async getStudentContext(userId: string) {
    const student = await prisma.studentProfile.findUnique({
      where: { userId },
      include: {
        roomAllocations: {
          where: { status: "ACTIVE" },
          include: {
            room: {
              include: {
                floor: {
                  include: {
                    block: {
                      include: {
                        hostel: { select: { id: true, name: true, type: true } },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!student) {
      throw ApiError.notFound("Student profile not found");
    }

    const activeHostel = student.roomAllocations?.[0]?.room?.floor?.block?.hostel;
    return {
      studentId: student.id,
      hostelId: activeHostel?.id,
      hostelName: activeHostel?.name,
      year: student.year,
      department: student.department,
    };
  }

  /**
   * Helper to get target student count for an announcement
   */
  private async calculateTargetCount(announcement: {
    targetAudience: string;
    targetHostelId?: string | null;
    targetYear?: number | null;
    targetDepartment?: string | null;
  }): Promise<number> {
    const where: Prisma.StudentProfileWhereInput = {};

    if (announcement.targetAudience === "SPECIFIC_HOSTEL" && announcement.targetHostelId) {
      where.roomAllocations = {
        some: {
          status: "ACTIVE",
          room: { floor: { block: { hostelId: announcement.targetHostelId } } },
        },
      };
    } else if (announcement.targetAudience === "SPECIFIC_YEAR" && announcement.targetYear) {
      where.year = announcement.targetYear;
    } else if (announcement.targetAudience === "SPECIFIC_DEPARTMENT" && announcement.targetDepartment) {
      where.department = { equals: announcement.targetDepartment, mode: "insensitive" };
    } else if (announcement.targetAudience === "CUSTOM_GROUP") {
      const andClauses: Prisma.StudentProfileWhereInput[] = [];
      if (announcement.targetHostelId) {
        andClauses.push({
          roomAllocations: {
            some: {
              status: "ACTIVE",
              room: { floor: { block: { hostelId: announcement.targetHostelId } } },
            },
          },
        });
      }
      if (announcement.targetYear) {
        andClauses.push({ year: announcement.targetYear });
      }
      if (announcement.targetDepartment) {
        andClauses.push({ department: { equals: announcement.targetDepartment, mode: "insensitive" } });
      }
      if (andClauses.length > 0) {
        where.AND = andClauses;
      }
    }

    return prisma.studentProfile.count({ where });
  }

  /**
   * Reconciles expired and scheduled announcements based on current timestamp
   */
  private async reconcileLifecycle() {
    const now = new Date();
    // 1. Move scheduled announcements whose publishAt has arrived to PUBLISHED
    await prisma.announcement.updateMany({
      where: {
        status: "SCHEDULED",
        publishAt: { lte: now },
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      },
      data: { status: "PUBLISHED" },
    });

    // 2. Move published or scheduled announcements whose expiresAt has passed to EXPIRED
    await prisma.announcement.updateMany({
      where: {
        status: { in: ["PUBLISHED", "SCHEDULED"] },
        expiresAt: { lte: now },
      },
      data: { status: "EXPIRED" },
    });
  }

  /**
   * List announcements for staff (Admin / Warden) with filters & read statistics
   */
  async listAnnouncements(
    userId: string,
    role: string,
    filters?: { status?: string; priority?: string; hostelId?: string; search?: string }
  ) {
    await this.reconcileLifecycle();

    const where: Prisma.AnnouncementWhereInput = {};

    // Role-based scope
    if (role === "WARDEN") {
      const wardenHostels = await prisma.hostel.findMany({
        where: { OR: [{ wardenId: userId }, { warden: { id: userId } }] },
        select: { id: true },
      });
      const hostelIds = wardenHostels.map((h) => h.id);

      where.OR = [
        { createdById: userId },
        { targetHostelId: { in: hostelIds } },
        { targetAudience: "ALL_HOSTELS" },
      ];
    }

    // Status filter
    if (filters?.status && filters.status !== "ALL") {
      where.status = filters.status as any;
    }

    // Priority filter
    if (filters?.priority && filters.priority !== "ALL") {
      where.priority = filters.priority as any;
    }

    // Hostel filter
    if (filters?.hostelId && filters.hostelId !== "ALL") {
      where.targetHostelId = filters.hostelId;
    }

    // Search filter
    if (filters?.search && filters.search.trim()) {
      const q = filters.search.trim();
      where.AND = [
        {
          OR: [
            { title: { contains: q, mode: "insensitive" } },
            { message: { contains: q, mode: "insensitive" } },
          ],
        },
      ];
    }

    const announcements = await prisma.announcement.findMany({
      where,
      include: {
        createdBy: {
          select: { id: true, firstName: true, lastName: true, email: true, role: true, avatarUrl: true },
        },
        targetHostel: { select: { id: true, name: true, type: true } },
        _count: { select: { reads: true } },
      },
      orderBy: [{ priority: "desc" }, { publishAt: "desc" }],
    });

    // Compute analytics for each announcement
    const enriched = await Promise.all(
      announcements.map(async (a) => {
        const targetCount = await this.calculateTargetCount({
          targetAudience: a.targetAudience,
          targetHostelId: a.targetHostelId,
          targetYear: a.targetYear,
          targetDepartment: a.targetDepartment,
        });
        const readCount = a._count.reads;
        const unreadCount = Math.max(0, targetCount - readCount);
        const readPercentage = targetCount > 0 ? Math.round((readCount / targetCount) * 100) : 0;

        return {
          ...a,
          targetCount,
          readCount,
          unreadCount,
          readPercentage,
        };
      })
    );

    return enriched;
  }

  /**
   * List announcements eligible for the logged in student
   */
  async getMyAnnouncements(
    userId: string,
    filters?: { unreadOnly?: boolean; priority?: string }
  ) {
    await this.reconcileLifecycle();
    const ctx = await this.getStudentContext(userId);
    const now = new Date();

    const orConditions: Prisma.AnnouncementWhereInput[] = [
      { targetAudience: "ALL_HOSTELS" },
    ];

    if (ctx.hostelId) {
      orConditions.push({
        targetAudience: "SPECIFIC_HOSTEL",
        targetHostelId: ctx.hostelId,
      });
    }

    if (ctx.year) {
      orConditions.push({
        targetAudience: "SPECIFIC_YEAR",
        targetYear: ctx.year,
      });
    }

    if (ctx.department) {
      orConditions.push({
        targetAudience: "SPECIFIC_DEPARTMENT",
        targetDepartment: { equals: ctx.department, mode: "insensitive" },
      });
    }

    if (ctx.hostelId || ctx.year || ctx.department) {
      const customAnd: Prisma.AnnouncementWhereInput[] = [];
      if (ctx.hostelId) {
        customAnd.push({ OR: [{ targetHostelId: ctx.hostelId }, { targetHostelId: null }] });
      }
      if (ctx.year) {
        customAnd.push({ OR: [{ targetYear: ctx.year }, { targetYear: null }] });
      }
      if (ctx.department) {
        customAnd.push({ OR: [{ targetDepartment: { equals: ctx.department, mode: "insensitive" } }, { targetDepartment: null }] });
      }
      if (customAnd.length > 0) {
        orConditions.push({
          targetAudience: "CUSTOM_GROUP",
          AND: customAnd,
        });
      }
    }

    const where: Prisma.AnnouncementWhereInput = {
      status: "PUBLISHED",
      publishAt: { lte: now },
      OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      AND: [{ OR: orConditions }],
    };

    if (filters?.priority && filters.priority !== "ALL") {
      where.priority = filters.priority as any;
    }

    const announcements = await prisma.announcement.findMany({
      where,
      include: {
        createdBy: {
          select: { id: true, firstName: true, lastName: true, email: true, role: true, avatarUrl: true },
        },
        targetHostel: { select: { id: true, name: true, type: true } },
        reads: {
          where: { userId },
          select: { readAt: true },
        },
      },
      orderBy: [{ priority: "desc" }, { publishAt: "desc" }],
    });

    let formatted = announcements.map((a) => ({
      id: a.id,
      title: a.title,
      message: a.message,
      priority: a.priority,
      targetAudience: a.targetAudience,
      targetHostelId: a.targetHostelId,
      targetHostel: a.targetHostel,
      targetYear: a.targetYear,
      targetDepartment: a.targetDepartment,
      status: a.status,
      publishAt: a.publishAt,
      expiresAt: a.expiresAt,
      createdById: a.createdById,
      createdBy: a.createdBy,
      createdAt: a.createdAt,
      updatedAt: a.updatedAt,
      isRead: a.reads.length > 0,
      readAt: a.reads[0]?.readAt || null,
    }));

    if (filters?.unreadOnly) {
      formatted = formatted.filter((a) => !a.isRead);
    }

    return formatted;
  }

  /**
   * Get announcement details + reader audit log (for Admin/Warden)
   */
  async getAnnouncementById(id: string, userId: string, role: string) {
    await this.reconcileLifecycle();

    const announcement = await prisma.announcement.findUnique({
      where: { id },
      include: {
        createdBy: {
          select: { id: true, firstName: true, lastName: true, email: true, role: true, avatarUrl: true },
        },
        targetHostel: { select: { id: true, name: true, type: true } },
        reads: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                studentProfile: {
                  select: { usn: true, department: true, year: true },
                },
              },
            },
          },
          orderBy: { readAt: "desc" },
        },
      },
    });

    if (!announcement) {
      throw ApiError.notFound("Announcement not found");
    }

    // Role checks
    if (role === "STUDENT") {
      const myAnnouncements = await this.getMyAnnouncements(userId);
      const isEligible = myAnnouncements.some((a) => a.id === id);
      if (!isEligible) {
        throw ApiError.forbidden("You are not authorized to view this announcement");
      }
      return {
        ...announcement,
        isRead: announcement.reads.some((r) => r.userId === userId),
      };
    }

    const targetCount = await this.calculateTargetCount({
      targetAudience: announcement.targetAudience,
      targetHostelId: announcement.targetHostelId,
      targetYear: announcement.targetYear,
      targetDepartment: announcement.targetDepartment,
    });
    const readCount = announcement.reads.length;
    const unreadCount = Math.max(0, targetCount - readCount);
    const readPercentage = targetCount > 0 ? Math.round((readCount / targetCount) * 100) : 0;

    return {
      ...announcement,
      targetCount,
      readCount,
      unreadCount,
      readPercentage,
    };
  }

  /**
   * Create an announcement (Admin / Warden)
   */
  async createAnnouncement(userId: string, role: string, data: CreateAnnouncementInput) {
    const now = new Date();
    let status = data.status || "PUBLISHED";

    if (data.status !== "DRAFT") {
      if (data.publishAt && new Date(data.publishAt) > now) {
        status = "SCHEDULED";
      } else {
        status = "PUBLISHED";
      }
    }

    // If warden, ensure target hostel is assigned to them
    if (role === "WARDEN" && data.targetHostelId) {
      const assigned = await prisma.hostel.findFirst({
        where: {
          id: data.targetHostelId,
          OR: [{ wardenId: userId }, { warden: { id: userId } }],
        },
      });
      if (!assigned) {
        throw ApiError.forbidden("You can only create announcements for hostels assigned to you");
      }
    }

    return prisma.announcement.create({
      data: {
        title: data.title,
        message: data.message,
        priority: data.priority || "NORMAL",
        targetAudience: data.targetAudience || "ALL_HOSTELS",
        targetHostelId: data.targetHostelId || null,
        targetYear: data.targetYear || null,
        targetDepartment: data.targetDepartment || null,
        status,
        publishAt: data.publishAt ? new Date(data.publishAt) : now,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
        createdById: userId,
      },
      include: {
        createdBy: {
          select: { id: true, firstName: true, lastName: true, email: true, role: true, avatarUrl: true },
        },
        targetHostel: { select: { id: true, name: true, type: true } },
      },
    });
  }

  /**
   * Update an announcement (Admin / Warden)
   */
  async updateAnnouncement(id: string, userId: string, role: string, data: UpdateAnnouncementInput) {
    const existing = await prisma.announcement.findUnique({ where: { id } });
    if (!existing) {
      throw ApiError.notFound("Announcement not found");
    }

    if (role === "WARDEN" && existing.createdById !== userId) {
      throw ApiError.forbidden("You can only edit announcements created by you");
    }

    const now = new Date();
    let nextStatus = data.status || existing.status;
    const nextPublishAt = data.publishAt ? new Date(data.publishAt) : existing.publishAt;

    if (nextStatus !== "DRAFT" && nextStatus !== "ARCHIVED" && nextStatus !== "EXPIRED") {
      if (nextPublishAt > now) {
        nextStatus = "SCHEDULED";
      } else {
        nextStatus = "PUBLISHED";
      }
    }

    return prisma.announcement.update({
      where: { id },
      data: {
        ...(data.title && { title: data.title }),
        ...(data.message && { message: data.message }),
        ...(data.priority && { priority: data.priority }),
        ...(data.targetAudience && { targetAudience: data.targetAudience }),
        ...(data.targetHostelId !== undefined && { targetHostelId: data.targetHostelId }),
        ...(data.targetYear !== undefined && { targetYear: data.targetYear }),
        ...(data.targetDepartment !== undefined && { targetDepartment: data.targetDepartment }),
        status: nextStatus,
        ...(data.publishAt !== undefined && { publishAt: data.publishAt ? new Date(data.publishAt) : now }),
        ...(data.expiresAt !== undefined && { expiresAt: data.expiresAt ? new Date(data.expiresAt) : null }),
      },
      include: {
        createdBy: {
          select: { id: true, firstName: true, lastName: true, email: true, role: true, avatarUrl: true },
        },
        targetHostel: { select: { id: true, name: true, type: true } },
      },
    });
  }

  /**
   * Delete an announcement
   */
  async deleteAnnouncement(id: string, userId: string, role: string) {
    const existing = await prisma.announcement.findUnique({ where: { id } });
    if (!existing) {
      throw ApiError.notFound("Announcement not found");
    }

    if (role === "WARDEN" && existing.createdById !== userId) {
      throw ApiError.forbidden("You can only delete announcements created by you");
    }

    await prisma.announcement.delete({ where: { id } });
    return { success: true, message: "Announcement deleted successfully" };
  }

  /**
   * Mark announcement as read for student
   */
  async markAsRead(announcementId: string, userId: string) {
    const announcement = await prisma.announcement.findUnique({ where: { id: announcementId } });
    if (!announcement) {
      throw ApiError.notFound("Announcement not found");
    }

    await prisma.announcementRead.upsert({
      where: {
        announcementId_userId: {
          announcementId,
          userId,
        },
      },
      create: {
        announcementId,
        userId,
      },
      update: {
        readAt: new Date(),
      },
    });

    return { success: true };
  }

  /**
   * Mark all eligible active announcements as read for student
   */
  async markAllAsRead(userId: string) {
    const activeAnnouncements = await this.getMyAnnouncements(userId, { unreadOnly: true });

    if (activeAnnouncements.length === 0) {
      return { count: 0 };
    }

    const operations = activeAnnouncements.map((a) =>
      prisma.announcementRead.upsert({
        where: {
          announcementId_userId: {
            announcementId: a.id,
            userId,
          },
        },
        create: {
          announcementId: a.id,
          userId,
        },
        update: {
          readAt: new Date(),
        },
      })
    );

    await prisma.$transaction(operations);
    return { count: activeAnnouncements.length };
  }

  /**
   * Overall metrics for Admin / Warden dashboard
   */
  async getStats(userId: string, role: string) {
    await this.reconcileLifecycle();

    const where: Prisma.AnnouncementWhereInput = {};
    if (role === "WARDEN") {
      const wardenHostels = await prisma.hostel.findMany({
        where: { OR: [{ wardenId: userId }, { warden: { id: userId } }] },
        select: { id: true },
      });
      const hostelIds = wardenHostels.map((h) => h.id);
      where.OR = [
        { createdById: userId },
        { targetHostelId: { in: hostelIds } },
        { targetAudience: "ALL_HOSTELS" },
      ];
    }

    const [total, active, urgent, totalReads] = await Promise.all([
      prisma.announcement.count({ where }),
      prisma.announcement.count({ where: { ...where, status: "PUBLISHED" } }),
      prisma.announcement.count({ where: { ...where, status: "PUBLISHED", priority: "URGENT" } }),
      prisma.announcementRead.count({
        where: {
          announcement: where,
        },
      }),
    ]);

    return {
      total,
      active,
      urgent,
      totalReads,
    };
  }
}

export const announcementService = new AnnouncementService();
