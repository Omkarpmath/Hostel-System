import { prisma } from "../../config/db.js";
import { ApiError } from "../../utils/ApiError.js";

export class AttendanceService {
  /**
   * Get the hostelId a security user is assigned to.
   * Throws if the user is not assigned to any hostel.
   */
  private async getSecurityHostelId(userId: string): Promise<string> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { assignedHostelId: true },
    });
    if (!user?.assignedHostelId) {
      throw ApiError.forbidden("You are not assigned to any hostel. Contact admin.");
    }
    return user.assignedHostelId;
  }

  /**
   * Get today's date at midnight UTC (used as the unique session date key).
   */
  private todayDate(): Date {
    const now = new Date();
    return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
  }

  // ─── SESSION ──────────────────────────────────────────────

  /** Start a new attendance session for today + the security's assigned hostel. */
  async startSession(securityUserId: string) {
    const hostelId = await this.getSecurityHostelId(securityUserId);
    const date = this.todayDate();

    // Check if a session already exists for this hostel + date
    const existing = await prisma.attendanceSession.findUnique({
      where: { hostelId_date: { hostelId, date } },
      include: { hostel: { select: { name: true } } },
    });

    if (existing) {
      if (existing.status === "COMPLETED") {
        // Reopen the completed session so security can resume scanning
        const reopened = await prisma.attendanceSession.update({
          where: { id: existing.id },
          data: { status: "ACTIVE", endedAt: null },
          include: { hostel: { select: { name: true } } },
        });
        return reopened;
      }
      // Resume the existing active session
      return existing;
    }

    return prisma.attendanceSession.create({
      data: { hostelId, securityId: securityUserId, date },
      include: { hostel: { select: { name: true } } },
    });
  }

  /** Get the active session (if any) for the security user's hostel today. */
  async getActiveSession(securityUserId: string) {
    const hostelId = await this.getSecurityHostelId(securityUserId);
    const date = this.todayDate();

    return prisma.attendanceSession.findUnique({
      where: { hostelId_date: { hostelId, date } },
      include: {
        hostel: { select: { name: true } },
        _count: { select: { records: true } },
        records: {
          select: { id: true, studentId: true, scannedAt: true },
        },
      },
    });
  }

  /** End the active session and return a summary. */
  async endSession(securityUserId: string) {
    const hostelId = await this.getSecurityHostelId(securityUserId);
    const date = this.todayDate();

    const session = await prisma.attendanceSession.findUnique({
      where: { hostelId_date: { hostelId, date } },
    });

    if (!session) throw ApiError.notFound("No active session found for today.");
    if (session.status === "COMPLETED") throw ApiError.conflict("Session already completed.");
    if (session.securityId !== securityUserId) throw ApiError.forbidden("You did not start this session.");

    const updated = await prisma.attendanceSession.update({
      where: { id: session.id },
      data: { status: "COMPLETED", endedAt: new Date() },
      include: { hostel: { select: { name: true } } },
    });

    // Build summary
    const summary = await this.getRegister(hostelId, date);
    return { session: updated, summary };
  }

  // ─── QR SCAN ──────────────────────────────────────────────

  /** Scan a student's QR token and return the result. Optimized for minimal DB round-trips. */
  async scanStudent(securityUserId: string, qrToken: string) {
    const today = new Date();
    const date = this.todayDate();

    // 1. Fetch security user & student profile with leaves in parallel (1 DB round-trip)
    const [securityUser, student] = await Promise.all([
      prisma.user.findUnique({
        where: { id: securityUserId },
        select: { assignedHostelId: true },
      }),
      prisma.studentProfile.findUnique({
        where: { qrCodeToken: qrToken },
        include: {
          user: { select: { firstName: true, lastName: true } },
          roomAllocations: {
            where: { status: "ACTIVE" },
            take: 1,
            include: {
              room: {
                include: {
                  floor: {
                    include: {
                      block: {
                        include: { hostel: { select: { id: true, name: true } } },
                      },
                    },
                  },
                },
              },
            },
          },
          leaveRequests: {
            where: {
              status: "APPROVED",
              fromDate: { lte: today },
              toDate: { gte: today },
            },
            take: 1,
          },
        },
      }),
    ]);

    if (!securityUser?.assignedHostelId) {
      throw ApiError.forbidden("You are not assigned to any hostel. Contact admin.");
    }
    const hostelId = securityUser.assignedHostelId;

    if (!student) {
      return { status: "INVALID", message: "Invalid or unrecognized QR code." };
    }

    // 2. Verify active room allocation & hostel
    const allocation = student.roomAllocations[0];
    if (!allocation) {
      return { status: "ERROR", message: `${student.user.firstName} has no active room allocation.` };
    }

    const studentHostelId = allocation.room.floor.block.hostel.id;
    if (studentHostelId !== hostelId) {
      return {
        status: "WRONG_HOSTEL",
        message: `${student.user.firstName} belongs to ${allocation.room.floor.block.hostel.name}, not your hostel.`,
      };
    }

    // 3. Check for approved leave covering today (already fetched in parallel)
    if (student.leaveRequests && student.leaveRequests.length > 0) {
      return {
        status: "ON_LEAVE",
        message: `${student.user.firstName} ${student.user.lastName} is on approved leave.`,
        studentName: `${student.user.firstName} ${student.user.lastName}`,
        usn: student.usn,
      };
    }

    // 4. Find the active session for today
    const session = await prisma.attendanceSession.findUnique({
      where: { hostelId_date: { hostelId, date } },
      select: { id: true, status: true },
    });
    if (!session || session.status !== "ACTIVE") {
      throw ApiError.badRequest("No active attendance session. Start one first.");
    }

    // 5. Create attendance record directly (handles duplicate via unique constraint)
    try {
      await prisma.attendanceRecord.create({
        data: { sessionId: session.id, studentId: student.id },
      });
    } catch (err: any) {
      if (err?.code === "P2002") {
        return {
          status: "ALREADY_MARKED",
          message: `${student.user.firstName} ${student.user.lastName} is already marked present.`,
          studentName: `${student.user.firstName} ${student.user.lastName}`,
          usn: student.usn,
        };
      }
      throw err;
    }

    return {
      status: "PRESENT",
      message: `${student.user.firstName} ${student.user.lastName} marked PRESENT.`,
      studentName: `${student.user.firstName} ${student.user.lastName}`,
      usn: student.usn,
    };
  }

  // ─── REGISTER ─────────────────────────────────────────────

  /** Build the complete attendance register for a hostel on a given date. */
  async getRegister(hostelId: string, date?: Date) {
    const targetDate = date || this.todayDate();

    // 1. Get the hostel info
    const hostel = await prisma.hostel.findUnique({
      where: { id: hostelId },
      select: { id: true, name: true, type: true },
    });
    if (!hostel) throw ApiError.notFound("Hostel not found");

    // 2. Get all students with ACTIVE allocation in this hostel
    const allocations = await prisma.roomAllocation.findMany({
      where: {
        status: "ACTIVE",
        room: { floor: { block: { hostelId } } },
      },
      include: {
        student: {
          include: { user: { select: { firstName: true, lastName: true } } },
        },
        room: { select: { roomNumber: true } },
      },
    });

    // 3. Get the session for this date (if any)
    const session = await prisma.attendanceSession.findUnique({
      where: { hostelId_date: { hostelId, date: targetDate } },
      include: {
        records: { select: { studentId: true, scannedAt: true } },
        security: { select: { firstName: true, lastName: true } },
      },
    });

    // 4. Get all approved leaves covering this date
    const leaves = await prisma.leaveRequest.findMany({
      where: {
        status: "APPROVED",
        fromDate: { lte: targetDate },
        toDate: { gte: targetDate },
        studentId: { in: allocations.map((a) => a.studentId) },
      },
      select: { studentId: true },
    });

    const presentSet = new Set(session?.records.map((r) => r.studentId) || []);
    const leaveSet = new Set(leaves.map((l) => l.studentId));
    const scannedAtMap = new Map(session?.records.map((r) => [r.studentId, r.scannedAt]) || []);

    // 5. Build the register
    const register = allocations.map((a) => {
      let status: "PRESENT" | "ON_LEAVE" | "ABSENT";
      if (presentSet.has(a.studentId)) {
        status = "PRESENT";
      } else if (leaveSet.has(a.studentId)) {
        status = "ON_LEAVE";
      } else {
        status = "ABSENT";
      }

      return {
        studentId: a.studentId,
        studentName: `${a.student.user.firstName} ${a.student.user.lastName}`,
        usn: a.student.usn,
        roomNumber: a.room.roomNumber,
        status,
        scannedAt: scannedAtMap.get(a.studentId) || null,
      };
    });

    // Sort: ABSENT first, then ON_LEAVE, then PRESENT
    const statusOrder = { ABSENT: 0, ON_LEAVE: 1, PRESENT: 2 };
    register.sort((a, b) => statusOrder[a.status] - statusOrder[b.status]);

    const present = register.filter((r) => r.status === "PRESENT").length;
    const onLeave = register.filter((r) => r.status === "ON_LEAVE").length;
    const absent = register.filter((r) => r.status === "ABSENT").length;

    return {
      hostel,
      date: targetDate.toISOString(),
      session: session
        ? {
            id: session.id,
            status: session.status,
            securityName: `${session.security.firstName} ${session.security.lastName}`,
            startedAt: session.startedAt,
            endedAt: session.endedAt,
          }
        : null,
      summary: { total: register.length, present, onLeave, absent },
      register,
    };
  }

  /** Export the register as CSV text. */
  async exportRegisterCSV(hostelId: string, dateStr: string) {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) throw ApiError.badRequest("Invalid date");
    const data = await this.getRegister(hostelId, date);

    const header = "USN,Student Name,Room,Status,Scanned At";
    const rows = data.register.map((r) =>
      `${r.usn},"${r.studentName}",${r.roomNumber},${r.status},${r.scannedAt ? new Date(r.scannedAt).toLocaleString() : ""}`
    );

    return [header, ...rows].join("\n");
  }

  // ─── ADMIN: Assign security to hostel ─────────────────────

  /** Assign a SECURITY user to a hostel. */
  async assignSecurityToHostel(securityUserId: string, hostelId: string) {
    const user = await prisma.user.findUnique({ where: { id: securityUserId }, select: { role: true } });
    if (!user) throw ApiError.notFound("User not found");
    if (user.role !== "SECURITY") throw ApiError.badRequest("User is not a security personnel");

    const hostel = await prisma.hostel.findUnique({ where: { id: hostelId }, select: { id: true, name: true } });
    if (!hostel) throw ApiError.notFound("Hostel not found");

    const updated = await prisma.user.update({
      where: { id: securityUserId },
      data: { assignedHostelId: hostelId },
      select: {
        id: true, firstName: true, lastName: true, email: true,
        assignedHostel: { select: { id: true, name: true } },
      },
    });

    return updated;
  }

  /** Unassign a SECURITY user from their hostel. */
  async unassignSecurity(securityUserId: string) {
    return prisma.user.update({
      where: { id: securityUserId },
      data: { assignedHostelId: null },
      select: {
        id: true, firstName: true, lastName: true, email: true,
        assignedHostel: true,
      },
    });
  }

  /** List all security users with their hostel assignments. */
  async listSecurityUsers() {
    return prisma.user.findMany({
      where: { role: "SECURITY", isActive: true },
      select: {
        id: true, firstName: true, lastName: true, email: true, phone: true,
        assignedHostel: { select: { id: true, name: true, type: true } },
      },
      orderBy: { firstName: "asc" },
    });
  }

  /** List all attendance sessions with filters. */
  async listSessions(filters: { hostelId?: string; from?: string; to?: string }) {
    const where: any = {};
    if (filters.hostelId) where.hostelId = filters.hostelId;
    if (filters.from || filters.to) {
      where.date = {};
      if (filters.from) where.date.gte = new Date(filters.from);
      if (filters.to) where.date.lte = new Date(filters.to);
    }

    return prisma.attendanceSession.findMany({
      where,
      include: {
        hostel: { select: { name: true } },
        security: { select: { firstName: true, lastName: true } },
        _count: { select: { records: true } },
      },
      orderBy: { date: "desc" },
    });
  }

  // ─── STUDENT HISTORY ──────────────────────────────────────

  /**
   * Get a student's own attendance history for a given month.
   * Returns one entry per day that had a session in their hostel.
   */
  async getStudentHistory(userId: string, year: number, month: number) {
    // Find the student's profile
    const student = await prisma.studentProfile.findUnique({
      where: { userId },
      include: {
        roomAllocations: {
          where: { status: "ACTIVE" },
          take: 1,
          include: {
            room: {
              include: {
                floor: {
                  include: {
                    block: {
                      include: { hostel: { select: { id: true, name: true } } },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!student) return { hostel: null, days: [], summary: { total: 0, present: 0, onLeave: 0, absent: 0 } };
    const allocation = student.roomAllocations[0];
    if (!allocation) return { hostel: null, days: [], summary: { total: 0, present: 0, onLeave: 0, absent: 0 } };

    const hostelId = allocation.room.floor.block.hostelId;
    const hostelName = allocation.room.floor.block.hostel.name;

    // Date range for the month
    const startDate = new Date(Date.UTC(year, month - 1, 1));
    const endDate = new Date(Date.UTC(year, month, 0)); // last day of month

    // All sessions in this hostel for this month
    const sessions = await prisma.attendanceSession.findMany({
      where: {
        hostelId,
        date: { gte: startDate, lte: endDate },
        status: "COMPLETED",
      },
      include: {
        records: {
          where: { studentId: student.id },
          select: { scannedAt: true },
        },
      },
      orderBy: { date: "asc" },
    });

    // Get all approved leaves for this student in this month
    const leaves = await prisma.leaveRequest.findMany({
      where: {
        studentId: student.id,
        status: "APPROVED",
        fromDate: { lte: endDate },
        toDate: { gte: startDate },
      },
      select: { fromDate: true, toDate: true },
    });

    // Build a set of leave dates
    const leaveDates = new Set<string>();
    for (const leave of leaves) {
      const from = new Date(leave.fromDate);
      const to = new Date(leave.toDate);
      for (let d = new Date(from); d <= to; d.setDate(d.getDate() + 1)) {
        leaveDates.add(d.toISOString().slice(0, 10));
      }
    }

    // Build day entries
    const days = sessions.map((s) => {
      const dateStr = s.date.toISOString().slice(0, 10);
      const wasScanned = s.records.length > 0;
      const onLeave = leaveDates.has(dateStr);

      let status: "PRESENT" | "ON_LEAVE" | "ABSENT";
      if (wasScanned) status = "PRESENT";
      else if (onLeave) status = "ON_LEAVE";
      else status = "ABSENT";

      return {
        date: dateStr,
        status,
        scannedAt: wasScanned ? s.records[0].scannedAt : null,
      };
    });

    const present = days.filter((d) => d.status === "PRESENT").length;
    const onLeave = days.filter((d) => d.status === "ON_LEAVE").length;
    const absent = days.filter((d) => d.status === "ABSENT").length;

    return {
      hostel: { id: hostelId, name: hostelName },
      month: `${year}-${String(month).padStart(2, "0")}`,
      days,
      summary: { total: days.length, present, onLeave, absent },
    };
  }
}

export const attendanceService = new AttendanceService();
