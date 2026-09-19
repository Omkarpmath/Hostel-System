import { prisma } from "../../config/db.js";
import { ApiError } from "../../utils/ApiError.js";
import { hashPassword } from "../../utils/hash.js";
import { Prisma, Role } from "@prisma/client";
import { logAuditEvent } from "../../utils/audit.js";
import { parseCsv } from "../../utils/csv.js";

export class UserService {
  async createStudent(data: {
    email: string; password: string; firstName: string; lastName: string; phone?: string;
    usn: string; department: string; year: number; semester: number; guardianName?: string;
    guardianPhone?: string; permanentAddress: string; dateOfBirth: string; gender: "MALE" | "FEMALE" | "OTHER";
  }) {
    const passwordHash = await hashPassword(data.password);
    return prisma.$transaction(async (tx) => {
      const user = await tx.user.create({ data: { email: data.email, passwordHash, firstName: data.firstName, lastName: data.lastName, phone: data.phone, role: "STUDENT" } });
      return tx.studentProfile.create({ data: { userId: user.id, usn: data.usn, department: data.department, year: data.year, semester: data.semester, guardianName: data.guardianName || null, guardianPhone: data.guardianPhone || null, permanentAddress: data.permanentAddress, dateOfBirth: new Date(data.dateOfBirth), gender: data.gender }, include: { user: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } } } });
    });
  }

  async getCurrentStudent(userId: string) {
    const student = await prisma.studentProfile.findUnique({
      where: { userId },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true, phone: true, avatarUrl: true } },
        roomAllocations: { where: { status: "ACTIVE" }, include: { room: { include: { floor: { include: { block: { include: { hostel: true } } } } } } } },
      },
    });
    if (!student) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, firstName: true, lastName: true, email: true, phone: true, avatarUrl: true },
      });
      if (!user) throw ApiError.notFound("User not found");
      return {
        id: null,
        userId: user.id,
        user,
        usn: null,
        department: null,
        year: null,
        semester: null,
        guardianName: null,
        guardianPhone: null,
        permanentAddress: null,
        bloodGroup: null,
        gender: null,
        dateOfBirth: null,
        roomAllocations: [],
        isProfileIncomplete: true,
      };
    }
    return student;
  }
  async getUsers(filters?: {
    role?: string;
    search?: string;
    page?: number;
    limit?: number;
    isActive?: boolean;
  }) {
    const page = filters?.page || 1;
    const limit = filters?.limit || 20;
    const skip = (page - 1) * limit;

    const where: Prisma.UserWhereInput = {};
    if (filters?.role) where.role = filters.role as Role;
    if (filters?.isActive !== undefined) where.isActive = filters.isActive;
    if (filters?.search) {
      where.OR = [
        { firstName: { contains: filters.search, mode: "insensitive" } },
        { lastName: { contains: filters.search, mode: "insensitive" } },
        { email: { contains: filters.search, mode: "insensitive" } },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          role: true,
          firstName: true,
          lastName: true,
          phone: true,
          avatarUrl: true,
          isActive: true,
          lastLoginAt: true,
          createdAt: true,
          studentProfile: true,
        },
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.user.count({ where }),
    ]);

    return {
      users,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async getUserById(id: string) {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        role: true,
        firstName: true,
        lastName: true,
        phone: true,
        avatarUrl: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
        studentProfile: {
          include: {
            roomAllocations: {
              where: { status: "ACTIVE" },
              include: {
                room: {
                  include: {
                    floor: {
                      include: {
                        block: {
                          include: { hostel: true },
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

    if (!user) throw ApiError.notFound("User not found");
    return user;
  }

  async createUser(data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
    role: Role;
  }) {
    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) throw ApiError.conflict("Email already exists");

    const passwordHash = await hashPassword(data.password);
    return prisma.user.create({
      data: {
        email: data.email,
        passwordHash,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        role: data.role,
      },
      select: {
        id: true,
        email: true,
        role: true,
        firstName: true,
        lastName: true,
        phone: true,
        isActive: true,
        createdAt: true,
      },
    });
  }

  async updateUser(id: string, data: Partial<{
    firstName: string;
    lastName: string;
    phone: string;
    isActive: boolean;
    avatarUrl: string;
  }>) {
    return prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        email: true,
        role: true,
        firstName: true,
        lastName: true,
        phone: true,
        avatarUrl: true,
        isActive: true,
      },
    });
  }

  async createStudentProfile(userId: string, data: {
    usn: string;
    department: string;
    year: number;
    semester: number;
    guardianName?: string;
    guardianPhone?: string;
    permanentAddress: string;
    bloodGroup?: string;
    dateOfBirth: string;
    gender: "MALE" | "FEMALE" | "OTHER";
  }) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw ApiError.notFound("User not found");
    if (user.role !== "STUDENT") throw ApiError.badRequest("User is not a student");

    const existing = await prisma.studentProfile.findUnique({ where: { userId } });
    if (existing) throw ApiError.conflict("Student profile already exists");

    return prisma.studentProfile.create({
      data: {
        userId,
        usn: data.usn,
        department: data.department,
        year: data.year,
        semester: data.semester,
        guardianName: data.guardianName || null,
        guardianPhone: data.guardianPhone || null,
        permanentAddress: data.permanentAddress,
        bloodGroup: data.bloodGroup,
        dateOfBirth: new Date(data.dateOfBirth),
        gender: data.gender,
      },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });
  }

  async updateCurrentStudent(userId: string, data: {
    firstName?: string;
    lastName?: string;
    phone?: string;
    avatarUrl?: string;
    usn?: string;
    department?: string;
    year?: number;
    semester?: number;
    guardianName?: string;
    guardianPhone?: string;
    permanentAddress?: string;
    bloodGroup?: string;
    gender?: "MALE" | "FEMALE" | "OTHER";
    dateOfBirth?: string | Date;
  }) {
    try {
      return await prisma.$transaction(async (tx) => {
        // 1. Update User info if provided
        const userData: Prisma.UserUpdateInput = {};
        if (data.firstName !== undefined && data.firstName.trim()) userData.firstName = data.firstName.trim();
        if (data.lastName !== undefined && data.lastName.trim()) userData.lastName = data.lastName.trim();
        if (data.phone !== undefined) userData.phone = data.phone.trim();
        if (data.avatarUrl !== undefined) userData.avatarUrl = data.avatarUrl;

        if (Object.keys(userData).length > 0) {
          await tx.user.update({
            where: { id: userId },
            data: userData,
          });
        }

        // 2. Check if student profile exists
        const existingProfile = await tx.studentProfile.findUnique({ where: { userId } });

        if (existingProfile) {
          const profileData: Prisma.StudentProfileUpdateInput = {};
          if (data.usn !== undefined && data.usn.trim()) profileData.usn = data.usn.trim().toUpperCase();
          if (data.department !== undefined && data.department.trim()) profileData.department = data.department.trim();
          if (data.year !== undefined && !isNaN(Number(data.year))) profileData.year = Number(data.year);
          if (data.semester !== undefined && !isNaN(Number(data.semester))) profileData.semester = Number(data.semester);
          if (data.guardianName !== undefined) profileData.guardianName = data.guardianName.trim() || null;
          if (data.guardianPhone !== undefined) profileData.guardianPhone = data.guardianPhone.trim() || null;
          if (data.permanentAddress !== undefined) profileData.permanentAddress = data.permanentAddress.trim();
          if (data.bloodGroup !== undefined) profileData.bloodGroup = data.bloodGroup ? data.bloodGroup.trim() : null;
          if (data.gender !== undefined) profileData.gender = data.gender;
          if (data.dateOfBirth !== undefined && data.dateOfBirth) {
            profileData.dateOfBirth = new Date(data.dateOfBirth);
          }

          return tx.studentProfile.update({
            where: { userId },
            data: profileData,
            include: {
              user: { select: { id: true, firstName: true, lastName: true, email: true, phone: true, avatarUrl: true } },
              roomAllocations: { where: { status: "ACTIVE" }, include: { room: { include: { floor: { include: { block: { include: { hostel: true } } } } } } } },
            },
          });
        } else {
          if (!data.usn?.trim()) throw ApiError.badRequest("USN / Roll Number is required");
          if (!data.department?.trim()) throw ApiError.badRequest("Department / Branch is required");
          if (!data.gender) throw ApiError.badRequest("Gender is required");
          if (!data.year || isNaN(Number(data.year))) throw ApiError.badRequest("Academic year is required");
          if (!data.semester || isNaN(Number(data.semester))) throw ApiError.badRequest("Semester is required");
          if (!data.permanentAddress?.trim()) throw ApiError.badRequest("Permanent address is required");
          if (!data.dateOfBirth) throw ApiError.badRequest("Date of birth is required");

          return tx.studentProfile.create({
            data: {
              userId,
              usn: data.usn.trim().toUpperCase(),
              department: data.department.trim(),
              year: Number(data.year),
              semester: Number(data.semester),
              guardianName: data.guardianName?.trim() || null,
              guardianPhone: data.guardianPhone?.trim() || null,
              permanentAddress: data.permanentAddress.trim(),
              bloodGroup: data.bloodGroup?.trim() || null,
              gender: data.gender,
              dateOfBirth: new Date(data.dateOfBirth),
            },
            include: {
              user: { select: { id: true, firstName: true, lastName: true, email: true, phone: true, avatarUrl: true } },
              roomAllocations: { where: { status: "ACTIVE" }, include: { room: { include: { floor: { include: { block: { include: { hostel: true } } } } } } } },
            },
          });
        }
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        throw ApiError.conflict("The provided USN is already registered to another student");
      }
      throw error;
    }
  }

  async getStudents(filters?: {
    search?: string;
    department?: string;
    year?: number;
    gender?: string;
    allocated?: string;
    hostelId?: string;
    page?: number;
    limit?: number;
  }, wardenId?: string) {
    const page = filters?.page || 1;
    const limit = filters?.limit || 20;
    const skip = (page - 1) * limit;

    const where: Prisma.UserWhereInput = { role: "STUDENT" };
    const studentProfileWhere: Prisma.StudentProfileWhereInput = {};

    if (filters?.department) {
      studentProfileWhere.department = filters.department;
    }
    if (filters?.year) {
      studentProfileWhere.year = Number(filters.year);
    }
    if (filters?.gender) {
      studentProfileWhere.gender = filters.gender.toUpperCase() as any;
    }
    if (filters?.allocated === "true") {
      studentProfileWhere.roomAllocations = {
        some: { status: "ACTIVE" },
      };
    } else if (filters?.allocated === "false") {
      studentProfileWhere.roomAllocations = {
        none: { status: "ACTIVE" },
      };
    }
    if (filters?.hostelId) {
      studentProfileWhere.roomAllocations = {
        some: {
          status: "ACTIVE",
          room: {
            floor: {
              block: {
                hostelId: filters.hostelId,
              },
            },
          },
        },
      };
    }
    if (wardenId) {
      studentProfileWhere.roomAllocations = {
        some: {
          status: "ACTIVE",
          room: { floor: { block: { hostel: { wardenId } } } },
        },
      };
    }

    if (Object.keys(studentProfileWhere).length > 0) {
      where.studentProfile = studentProfileWhere;
    }

    if (filters?.search) {
      const s = filters.search.trim();
      where.OR = [
        { firstName: { contains: s, mode: "insensitive" } },
        { lastName: { contains: s, mode: "insensitive" } },
        { email: { contains: s, mode: "insensitive" } },
        { studentProfile: { usn: { contains: s, mode: "insensitive" } } },
        { studentProfile: { department: { contains: s, mode: "insensitive" } } },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true, firstName: true, lastName: true, email: true, phone: true,
          avatarUrl: true, isActive: true, createdAt: true,
          studentProfile: {
            include: {
              roomAllocations: {
                where: { status: "ACTIVE" },
                include: {
                  room: {
                    include: {
                      floor: {
                        include: {
                          block: { include: { hostel: { select: { name: true } } } },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.user.count({ where }),
    ]);

    const students = users.map(({ studentProfile, ...user }) => ({
      id: studentProfile?.id ?? user.id,
      user,
      usn: studentProfile?.usn ?? null,
      gender: studentProfile?.gender ?? null,
      department: studentProfile?.department ?? null,
      year: studentProfile?.year ?? null,
      semester: studentProfile?.semester ?? null,
      roomAllocations: studentProfile?.roomAllocations ?? [],
      profileComplete: Boolean(studentProfile),
    }));

    return {
      students,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  // ============ BULK STUDENT ONBOARDING ============

  async bulkImportStudents(
    csvText: string,
    actorId: string,
    actorRole: any = "ADMIN"
  ) {
    const rows = parseCsv(csvText);
    if (rows.length === 0) {
      throw ApiError.badRequest("CSV file is empty or missing headers");
    }

    let created = 0;
    let skipped = 0;
    const errors: string[] = [];

    const existingEmails = new Set(
      (await prisma.user.findMany({ select: { email: true } })).map((u) => u.email.toLowerCase())
    );
    const existingUsns = new Set(
      (await prisma.studentProfile.findMany({ select: { usn: true } })).map((s) => s.usn.toLowerCase())
    );

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 2;

      const usn = (row.usn || "").toUpperCase().trim();
      const firstName = (row.firstname || row.first_name || row.name || "").trim();
      const lastName = (row.lastname || row.last_name || "").trim();
      const email = (row.email || "").toLowerCase().trim();
      const phone = (row.phone || row.mobilenumber || "").trim();
      const rawGender = (row.gender || "MALE").toUpperCase().trim();
      const gender = rawGender === "FEMALE" ? "FEMALE" : rawGender === "OTHER" ? "OTHER" : "MALE";
      const department = (row.department || row.dept || "Computer Science").trim();
      const year = parseInt(row.year || "1", 10) || 1;
      const semester = parseInt(row.semester || row.sem || String(year * 2 - 1), 10) || 1;
      const guardianName = (row.guardianname || row.guardian_name || row.parentname || "").trim() || null;
      const guardianPhone = (row.guardianphone || row.guardian_phone || row.parentphone || "").trim() || null;
      const permanentAddress = (row.permanentaddress || row.address || "Bangalore, Karnataka").trim();
      const rawDob = (row.dateofbirth || row.dob || "2004-01-01").trim();
      const rawPassword = (row.password || `BMSET@${year}`).trim();

      if (!usn || !email || !firstName) {
        errors.push(`Row ${rowNum}: USN, Email, and First Name are required.`);
        skipped++;
        continue;
      }

      if (existingEmails.has(email)) {
        errors.push(`Row ${rowNum}: Email '${email}' already registered.`);
        skipped++;
        continue;
      }

      if (existingUsns.has(usn.toLowerCase())) {
        errors.push(`Row ${rowNum}: USN '${usn}' already registered.`);
        skipped++;
        continue;
      }

      try {
        const passwordHash = await hashPassword(rawPassword);
        const dateOfBirth = new Date(rawDob);

        await prisma.$transaction(async (tx) => {
          const user = await tx.user.create({
            data: {
              email,
              passwordHash,
              firstName,
              lastName: lastName || "",
              phone: phone || null,
              role: "STUDENT",
            },
          });

          await tx.studentProfile.create({
            data: {
              userId: user.id,
              usn,
              department,
              year,
              semester,
              guardianName,
              guardianPhone,
              permanentAddress,
              dateOfBirth: isNaN(dateOfBirth.getTime()) ? new Date("2004-01-01") : dateOfBirth,
              gender,
            },
          });
        });

        existingEmails.add(email);
        existingUsns.add(usn.toLowerCase());
        created++;
      } catch (err: any) {
        errors.push(`Row ${rowNum} (${usn}): ${err.message}`);
        skipped++;
      }
    }

    await logAuditEvent({
      actorId,
      actorRole,
      action: "BULK_STUDENT_IMPORT",
      entityType: "StudentProfile",
      details: {
        totalRows: rows.length,
        created,
        skipped,
        errorCount: errors.length,
      },
    });

    return {
      processed: rows.length,
      created,
      skipped,
      errors,
    };
  }

  async getWardens() {
    return prisma.user.findMany({
      where: { role: "WARDEN", isActive: true },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
      },
    });
  }
}

export const userService = new UserService();
