import { prisma } from "../../config/db.js";
import { Prisma } from "@prisma/client";
import { v4 as uuidv4 } from "uuid";
import { ApiError } from "../../utils/ApiError.js";
import { verifyQrToken } from "../../utils/dynamicQr.js";

// In-memory cache for security user -> assigned mess mapping
const securityMessCache = new Map<
  string,
  { messId: string; messName: string; expiresAt: number }
>();

export function clearSecurityMessCache(userId?: string) {
  if (userId) {
    securityMessCache.delete(userId);
  } else {
    securityMessCache.clear();
  }
}

interface ScanDbRow {
  student_id: string;
  usn: string;
  first_name: string;
  last_name: string;
  hostel_id: string | null;
  hostel_name: string | null;
  room_number: string | null;
  inserted_record_id: string | null;
}

export class MessEntryService {
  /**
   * Resolve the mess assigned to the security guard.
   * Cached in-memory with 5-minute TTL.
   */
  async getSecurityMess(securityUserId: string): Promise<{ messId: string; messName: string }> {
    const cached = securityMessCache.get(securityUserId);
    if (cached && cached.expiresAt > Date.now()) {
      return { messId: cached.messId, messName: cached.messName };
    }

    const user = await prisma.user.findUnique({
      where: { id: securityUserId },
      select: {
        assignedMessId: true,
        assignmentType: true,
        assignedMess: { select: { id: true, name: true, isActive: true } },
      },
    });

    if (!user || user.assignmentType !== "MESS" || !user.assignedMessId || !user.assignedMess) {
      throw ApiError.forbidden("You are not assigned to any mess. Contact admin.");
    }

    if (!user.assignedMess.isActive) {
      throw ApiError.forbidden("Assigned mess is currently inactive. Contact admin.");
    }

    const messInfo = {
      messId: user.assignedMess.id,
      messName: user.assignedMess.name,
    };

    securityMessCache.set(securityUserId, {
      ...messInfo,
      expiresAt: Date.now() + 300_000, // 5 min TTL
    });

    return messInfo;
  }

  /**
   * Main scan verification method.
   * Verifies dynamic QR token, checks student has active room allocation in any hostel,
   * logs entry in mess_entries table.
   */
  async verifyMessEntry(securityUserId: string, qrToken: string) {
    const t0 = performance.now();

    // 1. Verify cryptographic token signature & expiration
    const check = verifyQrToken(qrToken);
    const tQr = performance.now();

    if (!check.valid) {
      if (check.error === "EXPIRED") {
        return {
          status: "EXPIRED" as const,
          message: "QR code has expired. Please ask student to show current dynamic QR.",
        };
      }
      if (check.error === "TAMPERED") {
        return {
          status: "INVALID" as const,
          message: "QR code verification failed. This token appears to be modified or invalid.",
        };
      }
      return {
        status: "INVALID" as const,
        message: check.message || "Invalid or unrecognized QR code.",
      };
    }

    // 2. Resolve security mess assignment (cached)
    const { messId, messName } = await this.getSecurityMess(securityUserId);
    const tMess = performance.now();

    try {
      // 3. Fast-path: Single database round-trip to verify active hostel allocation & increment counter
      const isDynamic = Boolean(check.isDynamic && check.studentProfileId);
      const whereClause = isDynamic
        ? Prisma.sql`sp.id = ${check.studentProfileId}`
        : Prisma.sql`sp.qr_code_token = ${qrToken}`;

      const rows = await prisma.$queryRaw<ScanDbRow[]>`
        SELECT
          sp.id as student_id,
          sp.usn,
          u.first_name,
          u.last_name,
          h.id as hostel_id,
          h.name as hostel_name,
          r.room_number
        FROM student_profiles sp
        JOIN users u ON u.id = sp.user_id
        LEFT JOIN room_allocations ra ON ra.student_id = sp.id AND ra.status = 'ACTIVE'
        LEFT JOIN rooms r ON r.id = ra.room_id
        LEFT JOIN floors f ON f.id = r.floor_id
        LEFT JOIN blocks b ON b.id = f.block_id
        LEFT JOIN hostels h ON h.id = b.hostel_id
        WHERE ${whereClause}
        LIMIT 1;
      `;

      if (rows.length === 0) {
        return {
          status: "INVALID" as const,
          message: "Student record not found for this QR code.",
        };
      }

      const row = rows[0];

      if (!row.hostel_name) {
        return {
          status: "NOT_ELIGIBLE" as const,
          message: `${row.first_name} ${row.last_name} has no active hostel room allocation.`,
          studentName: `${row.first_name} ${row.last_name}`,
          usn: row.usn,
        };
      }

      // 4. Atomically increment today's scan counter for this mess (zero individual scan logs stored)
      const countResult = await prisma.$queryRaw<{ count: number }[]>`
        INSERT INTO mess_daily_counts (id, mess_id, date, count, created_at, updated_at)
        VALUES (gen_random_uuid(), ${messId}, CURRENT_DATE, 1, NOW(), NOW())
        ON CONFLICT (mess_id, date)
        DO UPDATE SET count = mess_daily_counts.count + 1, updated_at = NOW()
        RETURNING count;
      `;

      const tDb = performance.now();
      const updatedCount = countResult[0]?.count ?? 1;

      console.log(
        `[MESS SCAN FAST-PATH] qrValidation: ${(tQr - t0).toFixed(1)}ms | messLookup: ${(tMess - tQr).toFixed(1)}ms | dbTrip: ${(tDb - tMess).toFixed(1)}ms | total: ${(tDb - t0).toFixed(1)}ms | status: ENTRY_ALLOWED | todayCount: ${updatedCount}`
      );

      return {
        status: "ENTRY_ALLOWED" as const,
        message: `Entry verified for ${row.first_name} ${row.last_name}`,
        studentName: `${row.first_name} ${row.last_name}`,
        usn: row.usn,
        hostelName: row.hostel_name,
        roomNumber: row.room_number || "N/A",
        messName,
        todayCount: updatedCount,
        scannedAt: new Date().toISOString(),
      };
    } catch (dbError) {
      console.warn("[MESS SCAN] Fast-path failed, falling back to standard verification:", dbError);

      const student = await prisma.studentProfile.findFirst({
        where: check.isDynamic && check.studentProfileId
          ? { id: check.studentProfileId }
          : { qrCodeToken: qrToken },
        include: {
          user: { select: { firstName: true, lastName: true } },
          roomAllocations: {
            where: { status: "ACTIVE" },
            include: {
              room: {
                include: {
                  floor: {
                    include: {
                      block: {
                        include: {
                          hostel: { select: { name: true } },
                        },
                      },
                    },
                  },
                },
              },
            },
            take: 1,
          },
        },
      });

      if (!student) {
        return {
          status: "INVALID" as const,
          message: "Student record not found for this QR code.",
        };
      }

      const allocation = student.roomAllocations[0];
      const hostelName = allocation?.room?.floor?.block?.hostel?.name;
      const roomNumber = allocation?.room?.roomNumber;
      const studentName = `${student.user.firstName} ${student.user.lastName}`;

      if (!hostelName) {
        return {
          status: "NOT_ELIGIBLE" as const,
          message: `${studentName} has no active hostel room allocation.`,
          studentName,
          usn: student.usn,
        };
      }

      const today = new Date();
      const dateOnly = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()));

      const daily = await prisma.messDailyCount.upsert({
        where: {
          messId_date: {
            messId,
            date: dateOnly,
          },
        },
        create: {
          messId,
          date: dateOnly,
          count: 1,
        },
        update: {
          count: { increment: 1 },
        },
        select: { count: true },
      });

      return {
        status: "ENTRY_ALLOWED" as const,
        message: `Entry verified for ${studentName}`,
        studentName,
        usn: student.usn,
        hostelName,
        roomNumber: roomNumber || "N/A",
        messName,
        todayCount: daily.count,
        scannedAt: new Date().toISOString(),
      };
    }
  }

  /**
   * Get today's scan count for the security guard's assigned mess in single-digit milliseconds.
   */
  async getTodayStats(securityUserId: string) {
    const { messId, messName } = await this.getSecurityMess(securityUserId);

    const rows = await prisma.$queryRaw<{ count: number }[]>`
      SELECT count FROM mess_daily_counts
      WHERE mess_id = ${messId} AND date = CURRENT_DATE
      LIMIT 1;
    `;

    const todayCount = rows[0]?.count ?? 0;

    return {
      mess: { id: messId, name: messName },
      todayCount,
    };
  }

  /**
   * Ensure default mess exists and list all active messes for dropdowns.
   */
  async listMesses() {
    let messes = await prisma.mess.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
    });

    if (messes.length === 0) {
      const defaultMess = await prisma.mess.create({
        data: {
          name: "Main Campus Mess",
          description: "Central dining mess for all hostel residents",
          isActive: true,
        },
      });
      messes = [defaultMess];
    }

    return messes;
  }

  /**
   * Get mess entries (for admin view/history).
   */
  async getEntries(filters: { messId?: string; date?: string; limit?: number }) {
    const where: any = {};
    if (filters.messId) where.messId = filters.messId;
    if (filters.date) {
      const targetDate = new Date(filters.date);
      const start = new Date(targetDate.setHours(0, 0, 0, 0));
      const end = new Date(targetDate.setHours(23, 59, 59, 999));
      where.scannedAt = { gte: start, lte: end };
    }

    const entries = await prisma.messEntry.findMany({
      where,
      orderBy: { scannedAt: "desc" },
      take: filters.limit || 100,
      include: {
        mess: { select: { id: true, name: true } },
        security: { select: { id: true, firstName: true, lastName: true } },
        student: {
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
                    roomNumber: true,
                    floor: {
                      select: {
                        block: {
                          select: {
                            hostel: { select: { name: true } },
                          },
                        },
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

    return entries.map((e) => {
      const allocation = e.student.roomAllocations[0];
      return {
        id: e.id,
        scannedAt: e.scannedAt,
        messName: e.mess.name,
        securityName: `${e.security.firstName} ${e.security.lastName}`,
        studentName: `${e.student.user.firstName} ${e.student.user.lastName}`,
        usn: e.student.usn,
        roomNumber: allocation?.room?.roomNumber || "N/A",
        hostelName: allocation?.room?.floor?.block?.hostel?.name || "N/A",
      };
    });
  }
}

export const messEntryService = new MessEntryService();
