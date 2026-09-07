import { prisma } from "../../config/db.js";
import { Prisma } from "@prisma/client";
import { v4 as uuidv4 } from "uuid";
import { ApiError } from "../../utils/ApiError.js";
import { notificationService } from "../notification/notification.service.js";
import { verifyQrToken } from "../../utils/dynamicQr.js";

// In-memory cache for security hostel assignments and active sessions
const securityHostelCache = new Map<string, { hostelId: string; expiresAt: number }>();
const activeSessionCache = new Map<string, { session: { id: string; status: string }; expiresAt: number }>();

interface ScanDbRow {
  student_id: string;
  usn: string;
  first_name: string;
  last_name: string;
  student_hostel_id: string | null;
  hostel_name: string | null;
  on_leave: boolean;
  inserted_record_id: string | null;
  already_marked: boolean;
}

export class AttendanceService {
  /**
   * Get the hostelId a security user is assigned to.
   * Cached in-memory with a 5-minute TTL to reduce repeated DB queries.
   */
  private async getSecurityHostelId(userId: string): Promise<string> {
    const cached = securityHostelCache.get(userId);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.hostelId;
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { assignedHostelId: true },
    });
    if (!user?.assignedHostelId) {
      throw ApiError.forbidden("You are not assigned to any hostel. Contact admin.");
    }

    securityHostelCache.set(userId, {
      hostelId: user.assignedHostelId,
      expiresAt: Date.now() + 300_000, // 5 min TTL
    });

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
    const sessionKey = `${hostelId}_${date.toISOString().slice(0, 10)}`;
    activeSessionCache.delete(sessionKey);

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
      select: {
        id: true,
        hostelId: true,
        securityId: true,
        date: true,
        status: true,
        startedAt: true,
        endedAt: true,
        hostel: { select: { name: true } },
        _count: { select: { records: true } },
      },
    });
  }

  /** End the active session and return a summary. */
  async endSession(securityUserId: string) {
    const hostelId = await this.getSecurityHostelId(securityUserId);
    const date = this.todayDate();
    const sessionKey = `${hostelId}_${date.toISOString().slice(0, 10)}`;
    activeSessionCache.delete(sessionKey);

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

    // Asynchronously notify absent students (non-blocking)
    (async () => {
      try {
        const absents = summary.register.filter((r: { status: string }) => r.status === "ABSENT");
        if (absents.length > 0) {
          const studentProfiles = await prisma.studentProfile.findMany({
            where: { id: { in: absents.map((a: { studentId: string }) => a.studentId) } },
            select: { id: true, userId: true },
          });
          const userMap = new Map(studentProfiles.map((sp: { id: string; userId: string }) => [sp.id, sp.userId]));
          const dateStr = date.toLocaleDateString("en-IN", { month: "short", day: "numeric" });
          const notifications = absents
            .map((a: { studentId: string }) => {
              const uId = userMap.get(a.studentId);
              if (!uId) return null;
              return {
                userId: uId,
                title: "Attendance Not Recorded",
                message: `Night attendance for ${summary.hostel.name} was not recorded for you on ${dateStr}. If you were present, contact hostel security.`,
                type: "ATTENDANCE_NOT_RECORDED" as const,
                relatedId: session.id,
                relatedType: "ATTENDANCE",
              };
            })
            .filter((n: any): n is NonNullable<typeof n> => Boolean(n));

          if (notifications.length > 0) {
            await notificationService.createNotificationsMany(notifications);
          }
        }
      } catch (err) {
        console.error("[AttendanceService] Failed to notify absent students:", err);
      }
    })();

    return { session: updated, summary };
  }

  // ─── QR SCAN ──────────────────────────────────────────────

  /** Scan a student's QR token and return the result. Optimized for minimal DB round-trips. */
  async scanStudent(securityUserId: string, qrToken: string) {
    const t0 = performance.now();
    const today = new Date();
    const date = this.todayDate();

    // 0. Validate token (dynamic QR expiration and signature check)
    const check = verifyQrToken(qrToken);
    const tQr = performance.now();

    if (!check.valid) {
      if (check.error === "EXPIRED") {
        return {
          status: "EXPIRED",
          message: check.message || "QR code has expired. Please scan the live QR code on the student's screen.",
        };
      }
      if (check.error === "TAMPERED") {
        return {
          status: "INVALID",
          message: "QR code verification failed. This token appears to be modified or invalid.",
        };
      }
      return { status: "INVALID", message: "Invalid or unrecognized QR code." };
    }

    // 1. Resolve security hostel ID (in-memory cached, 0ms on repeat scans)
    const hostelId = await this.getSecurityHostelId(securityUserId);

    // 2. Resolve active session (in-memory cached, 0ms on repeat scans)
    const sessionKey = `${hostelId}_${date.toISOString().slice(0, 10)}`;
    let session = activeSessionCache.get(sessionKey)?.session;
    if (!session || session.status !== "ACTIVE") {
      const dbSession = await prisma.attendanceSession.findUnique({
        where: { hostelId_date: { hostelId, date } },
        select: { id: true, status: true },
      });
      if (!dbSession || dbSession.status !== "ACTIVE") {
        throw ApiError.badRequest("No active attendance session. Start one first.");
      }
      session = dbSession;
      activeSessionCache.set(sessionKey, { session: dbSession, expiresAt: Date.now() + 60_000 });
    }
    const tSession = performance.now();

    // 3. Fast-path: Single database round-trip for student lookup, allocation check, leave check, and attendance insert
    try {
      const recordId = uuidv4();
      const isDynamic = Boolean(check.isDynamic && check.studentProfileId);
      const whereClause = isDynamic
        ? Prisma.sql`sp.id = ${check.studentProfileId}`
        : Prisma.sql`sp.qr_code_token = ${qrToken}`;

      const rows = await prisma.$queryRaw<ScanDbRow[]>`
        WITH student_data AS (
          SELECT
            sp.id as student_id,
            sp.usn,
            u.first_name,
            u.last_name,
            b.hostel_id as student_hostel_id,
            h.name as hostel_name,
            EXISTS(
              SELECT 1 FROM leave_requests lr
              WHERE lr.student_id = sp.id
                AND lr.status = 'APPROVED'
                AND lr.from_date <= ${today}
                AND lr.to_date >= ${today}
            ) as on_leave
          FROM student_profiles sp
          JOIN users u ON u.id = sp.user_id
          LEFT JOIN room_allocations ra ON ra.student_id = sp.id AND ra.status = 'ACTIVE'
          LEFT JOIN rooms r ON r.id = ra.room_id
          LEFT JOIN floors f ON f.id = r.floor_id
          LEFT JOIN blocks b ON b.id = f.block_id
          LEFT JOIN hostels h ON h.id = b.hostel_id
          WHERE ${whereClause}
          LIMIT 1
        ),
        insert_record AS (
          INSERT INTO attendance_records (id, session_id, student_id, scanned_at, created_at)
          SELECT ${recordId}, ${session.id}, sd.student_id, NOW(), NOW()
          FROM student_data sd
          WHERE sd.student_hostel_id = ${hostelId}
            AND NOT sd.on_leave
          ON CONFLICT (session_id, student_id) DO NOTHING
          RETURNING id
        )
        SELECT
          sd.student_id,
          sd.usn,
          sd.first_name,
          sd.last_name,
          sd.student_hostel_id,
          sd.hostel_name,
          sd.on_leave,
          (SELECT id FROM insert_record) as inserted_record_id,
          EXISTS(
            SELECT 1 FROM attendance_records ar
            WHERE ar.session_id = ${session.id} AND ar.student_id = sd.student_id
          ) as already_marked
        FROM student_data sd;
      `;

      const tDb = performance.now();

      if (rows.length === 0) {
        return { status: "INVALID", message: "Invalid or unrecognized QR code." };
      }

      const row = rows[0];
      if (!row.student_hostel_id) {
        return { status: "ERROR", message: `${row.first_name} has no active room allocation.` };
      }

      if (row.student_hostel_id !== hostelId) {
        return {
          status: "WRONG_HOSTEL",
          message: `${row.first_name} belongs to ${row.hostel_name}, not your hostel.`,
        };
      }

      if (row.on_leave) {
        return {
          status: "ON_LEAVE",
          message: `${row.first_name} ${row.last_name} is on approved leave.`,
          studentName: `${row.first_name} ${row.last_name}`,
          usn: row.usn,
        };
      }

      if (row.inserted_record_id) {
        console.log(
          `[SCAN PERF FAST-PATH] qrValidation: ${(tQr - t0).toFixed(1)}ms | sessionLookup: ${(tSession - tQr).toFixed(1)}ms | singleDbTrip: ${(tDb - tSession).toFixed(1)}ms | total: ${(tDb - t0).toFixed(1)}ms | status: PRESENT`
        );
        return {
          status: "PRESENT",
          message: `${row.first_name} ${row.last_name} marked PRESENT.`,
          studentName: `${row.first_name} ${row.last_name}`,
          usn: row.usn,
        };
      }

      console.log(
        `[SCAN PERF FAST-PATH] qrValidation: ${(tQr - t0).toFixed(1)}ms | sessionLookup: ${(tSession - tQr).toFixed(1)}ms | singleDbTrip: ${(tDb - tSession).toFixed(1)}ms | total: ${(tDb - t0).toFixed(1)}ms | status: ALREADY_MARKED`
      );
      return {
        status: "ALREADY_MARKED",
        message: `${row.first_name} ${row.last_name} is already marked present.`,
        studentName: `${row.first_name} ${row.last_name}`,
        usn: row.usn,
      };
    } catch (err) {
      console.warn("[SCAN FALLBACK] Fast-path failed, executing safe fallback:", err);
    }

    // ─── SAFE FALLBACK: Original Prisma queries (guarantees zero breakage risk) ───
    const studentWhere = check.isDynamic && check.studentProfileId
      ? { id: check.studentProfileId }
      : { qrCodeToken: qrToken };

    const student = await prisma.studentProfile.findUnique({
      where: studentWhere,
      select: {
        id: true,
        usn: true,
        user: { select: { firstName: true, lastName: true } },
        roomAllocations: {
          where: { status: "ACTIVE" },
          take: 1,
          select: {
            room: {
              select: {
                floor: {
                  select: {
                    block: {
                      select: {
                        hostelId: true,
                        hostel: { select: { id: true, name: true } },
                      },
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
          select: { id: true },
        },
      },
    });

    if (!student) {
      return { status: "INVALID", message: "Invalid or unrecognized QR code." };
    }

    const allocation = student.roomAllocations[0];
    if (!allocation) {
      return { status: "ERROR", message: `${student.user.firstName} has no active room allocation.` };
    }

    const studentHostelId = allocation.room.floor.block.hostelId;
    if (studentHostelId !== hostelId) {
      return {
        status: "WRONG_HOSTEL",
        message: `${student.user.firstName} belongs to ${allocation.room.floor.block.hostel.name}, not your hostel.`,
      };
    }

    if (student.leaveRequests && student.leaveRequests.length > 0) {
      return {
        status: "ON_LEAVE",
        message: `${student.user.firstName} ${student.user.lastName} is on approved leave.`,
        studentName: `${student.user.firstName} ${student.user.lastName}`,
        usn: student.usn,
      };
    }

    let writeStatus: "PRESENT" | "ALREADY_MARKED" = "PRESENT";
    try {
      await prisma.attendanceRecord.create({
        data: { sessionId: session.id, studentId: student.id },
      });
    } catch (err: any) {
      if (err?.code === "P2002") {
        writeStatus = "ALREADY_MARKED";
      } else {
        throw err;
      }
    }

    const tFallback = performance.now();
    console.log(
      `[SCAN PERF FALLBACK] total: ${(tFallback - t0).toFixed(1)}ms | status: ${writeStatus}`
    );

    if (writeStatus === "ALREADY_MARKED") {
      return {
        status: "ALREADY_MARKED",
        message: `${student.user.firstName} ${student.user.lastName} is already marked present.`,
        studentName: `${student.user.firstName} ${student.user.lastName}`,
        usn: student.usn,
      };
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

  // ─── ADMIN: Assign security to hostel or mess ─────────────

  /** Assign a SECURITY user to a hostel. */
  async assignSecurityToHostel(securityUserId: string, hostelId: string) {
    const user = await prisma.user.findUnique({ where: { id: securityUserId }, select: { role: true } });
    if (!user) throw ApiError.notFound("User not found");
    if (user.role !== "SECURITY") throw ApiError.badRequest("User is not a security personnel");

    const hostel = await prisma.hostel.findUnique({ where: { id: hostelId }, select: { id: true, name: true } });
    if (!hostel) throw ApiError.notFound("Hostel not found");

    securityHostelCache.delete(securityUserId);

    const updated = await prisma.user.update({
      where: { id: securityUserId },
      data: {
        assignedHostelId: hostelId,
        assignedMessId: null,
        assignmentType: "HOSTEL",
      },
      select: {
        id: true, firstName: true, lastName: true, email: true,
        assignmentType: true,
        assignedHostel: { select: { id: true, name: true } },
        assignedMess: { select: { id: true, name: true } },
      },
    });

    return updated;
  }

  /** Assign a SECURITY user to a mess. */
  async assignSecurityToMess(securityUserId: string, messId: string) {
    const user = await prisma.user.findUnique({ where: { id: securityUserId }, select: { role: true } });
    if (!user) throw ApiError.notFound("User not found");
    if (user.role !== "SECURITY") throw ApiError.badRequest("User is not a security personnel");

    const mess = await prisma.mess.findUnique({ where: { id: messId }, select: { id: true, name: true } });
    if (!mess) throw ApiError.notFound("Mess not found");

    securityHostelCache.delete(securityUserId);

    const updated = await prisma.user.update({
      where: { id: securityUserId },
      data: {
        assignedMessId: messId,
        assignedHostelId: null,
        assignmentType: "MESS",
      },
      select: {
        id: true, firstName: true, lastName: true, email: true,
        assignmentType: true,
        assignedHostel: { select: { id: true, name: true } },
        assignedMess: { select: { id: true, name: true } },
      },
    });

    return updated;
  }

  /** Unassign a SECURITY user from their hostel or mess. */
  async unassignSecurity(securityUserId: string) {
    securityHostelCache.delete(securityUserId);
    return prisma.user.update({
      where: { id: securityUserId },
      data: {
        assignedHostelId: null,
        assignedMessId: null,
        assignmentType: null,
      },
      select: {
        id: true, firstName: true, lastName: true, email: true,
        assignmentType: true,
        assignedHostel: true,
        assignedMess: true,
      },
    });
  }

  /** List all security users with their hostel and mess assignments. */
  async listSecurityUsers() {
    return prisma.user.findMany({
      where: { role: "SECURITY", isActive: true },
      select: {
        id: true, firstName: true, lastName: true, email: true, phone: true,
        assignmentType: true,
        assignedHostel: { select: { id: true, name: true, type: true } },
        assignedMess: { select: { id: true, name: true } },
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
