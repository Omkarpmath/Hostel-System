import { prisma } from "../../config/db.js";
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

// In-memory active resident cache: studentProfileId -> CachedResident
interface CachedResident {
  isActive: boolean;
  studentName?: string;
  usn?: string;
  roomNumber?: string;
  hostelName?: string;
  expiresAt: number;
}

const activeResidentCache = new Map<string, CachedResident>();
let lastResidentSyncTime = 0;
const RESIDENT_SYNC_INTERVAL_MS = 15 * 60 * 1000; // 15 minutes

// In-memory daily count cache: messId -> { dateStr: string, count: number }
const dailyCountCache = new Map<string, { dateStr: string; count: number }>();

function getTodayDateStr(): string {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
}

/**
 * Pre-warm active resident cache on startup and periodically in background.
 * Preloads resident names, USNs, and hostel details in RAM so scan verification
 * executes in < 1ms with ZERO database round-trips.
 */
async function warmActiveResidents(force = false) {
  const now = Date.now();
  if (!force && now - lastResidentSyncTime < RESIDENT_SYNC_INTERVAL_MS && activeResidentCache.size > 0) {
    return;
  }
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [activeAllocations, dailyCounts] = await Promise.all([
      prisma.roomAllocation.findMany({
        where: { status: "ACTIVE" },
        select: {
          studentId: true,
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
          student: {
            select: {
              usn: true,
              user: { select: { firstName: true, lastName: true } },
            },
          },
        },
      }),
      prisma.messDailyCount.findMany({
        where: { date: today },
        select: { messId: true, count: true },
      }),
    ]);

    const expiry = now + RESIDENT_SYNC_INTERVAL_MS + 120_000;
    for (const item of activeAllocations) {
      const studentUser = item.student?.user;
      const studentName = studentUser ? `${studentUser.firstName} ${studentUser.lastName}`.trim() : undefined;
      const hostelName = item.room?.floor?.block?.hostel?.name;
      const roomNumber = item.room?.roomNumber;

      activeResidentCache.set(item.studentId, {
        isActive: true,
        studentName,
        usn: item.student?.usn,
        roomNumber,
        hostelName,
        expiresAt: expiry,
      });
    }

    const todayStr = getTodayDateStr();
    for (const d of dailyCounts) {
      const existing = dailyCountCache.get(d.messId);
      if (!existing || existing.dateStr !== todayStr || existing.count < d.count) {
        dailyCountCache.set(d.messId, { dateStr: todayStr, count: d.count });
      }
    }

    lastResidentSyncTime = now;
  } catch (e) {
    console.warn("[MESS SERVICE] Background warm active residents failed:", e);
  }
}

// Kick off initial warm-up in background
warmActiveResidents().catch(() => {});

/**
 * Fast in-memory check to verify if student belongs to a hostel (< 0.01ms)
 */
async function getActiveResidentInfo(studentProfileId: string): Promise<CachedResident | null> {
  const now = Date.now();
  const cached = activeResidentCache.get(studentProfileId);
  if (cached && cached.expiresAt > now) {
    return cached.isActive ? cached : null;
  }

  // Fast fallback if cache miss
  try {
    const allocation = await prisma.roomAllocation.findFirst({
      where: {
        studentId: studentProfileId,
        status: "ACTIVE",
      },
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
        student: {
          select: {
            usn: true,
            user: { select: { firstName: true, lastName: true } },
          },
        },
      },
    });

    if (!allocation) {
      activeResidentCache.set(studentProfileId, {
        isActive: false,
        expiresAt: now + RESIDENT_SYNC_INTERVAL_MS,
      });
      return null;
    }

    const studentUser = allocation.student?.user;
    const studentName = studentUser ? `${studentUser.firstName} ${studentUser.lastName}`.trim() : undefined;
    const hostelName = allocation.room?.floor?.block?.hostel?.name;
    const roomNumber = allocation.room?.roomNumber;

    const info: CachedResident = {
      isActive: true,
      studentName,
      usn: allocation.student?.usn,
      roomNumber,
      hostelName,
      expiresAt: now + RESIDENT_SYNC_INTERVAL_MS,
    };
    activeResidentCache.set(studentProfileId, info);
    return info;
  } catch (err) {
    console.warn("[MESS SERVICE] Resident check DB fallback error:", err);
    return cached && cached.isActive ? cached : null;
  }
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
   * Ultra-fast scan verification (< 1ms server execution).
   * Verifies dynamic rotating QR token cryptographically, validates active hostel resident status
   * via in-memory lookup, and increments daily scan count asynchronously.
   */
  async verifyMessEntry(securityUserId: string, qrToken: string) {
    const t0 = performance.now();

    // 1. Verify cryptographic token signature & expiration in-memory (0.1ms)
    const check = verifyQrToken(qrToken);

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

    // 2. Resolve security mess assignment (in-memory cached, 0.01ms)
    const { messId, messName } = await this.getSecurityMess(securityUserId);

    // 3. Ultra-fast resident check (< 0.01ms in memory)
    let residentInfo: CachedResident | null = null;
    let studentUsn = check.usn || "";

    if (check.isDynamic && check.studentProfileId) {
      residentInfo = await getActiveResidentInfo(check.studentProfileId);
    } else {
      // Legacy static token fallback
      const student = await prisma.studentProfile.findFirst({
        where: { qrCodeToken: qrToken },
        select: { id: true, usn: true },
      });
      if (student) {
        studentUsn = student.usn;
        residentInfo = await getActiveResidentInfo(student.id);
      }
    }

    if (!residentInfo || !residentInfo.isActive) {
      return {
        status: "NOT_ELIGIBLE" as const,
        message: "Student has no active hostel room allocation.",
        studentName: studentUsn ? `Student (${studentUsn})` : "Student",
        usn: studentUsn,
      };
    }

    // 4. Update in-memory daily count instantly (0.01ms)
    const todayStr = getTodayDateStr();
    let current = dailyCountCache.get(messId);
    if (!current || current.dateStr !== todayStr) {
      current = { dateStr: todayStr, count: 0 };
    }
    current.count += 1;
    dailyCountCache.set(messId, current);
    const updatedCount = current.count;

    // 5. Asynchronously persist count to PostgreSQL (non-blocking fire-and-forget)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    void prisma.messDailyCount.upsert({
      where: {
        messId_date: {
          messId,
          date: today,
        },
      },
      update: {
        count: { increment: 1 },
      },
      create: {
        messId,
        date: today,
        count: 1,
      },
    }).catch((err) => console.warn("[MESS DB SYNC] Asynchronous count update error:", err));

    const tEnd = performance.now();
    console.log(
      `[MESS SCAN ULTRA-FAST] total: ${(tEnd - t0).toFixed(2)}ms | student: ${studentUsn} | todayCount: ${updatedCount}`
    );

    // 6. Return response immediately without waiting for cross-region database network
    return {
      status: "ENTRY_ALLOWED" as const,
      message: "Student belongs to hostel. Entry verified.",
      studentName: residentInfo.studentName || (studentUsn ? `Student (${studentUsn})` : "Hostel Resident"),
      usn: residentInfo.usn || studentUsn,
      hostelName: residentInfo.hostelName || "BMSCE Hostel Resident",
      roomNumber: residentInfo.roomNumber,
      messName,
      todayCount: updatedCount,
      scannedAt: new Date().toISOString(),
    };
  }

  /**
   * Get today's scan count for the security guard's assigned mess instantly from memory.
   */
  async getTodayStats(securityUserId: string) {
    const { messId, messName } = await this.getSecurityMess(securityUserId);
    const todayStr = getTodayDateStr();

    let cached = dailyCountCache.get(messId);
    if (cached && cached.dateStr === todayStr) {
      return {
        mess: { id: messId, name: messName },
        todayCount: cached.count,
      };
    }

    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const record = await prisma.messDailyCount.findUnique({
        where: {
          messId_date: {
            messId,
            date: today,
          },
        },
        select: { count: true },
      });
      const count = record?.count ?? 0;
      dailyCountCache.set(messId, { dateStr: todayStr, count });
      return {
        mess: { id: messId, name: messName },
        todayCount: count,
      };
    } catch {
      return {
        mess: { id: messId, name: messName },
        todayCount: cached?.count ?? 0,
      };
    }
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
