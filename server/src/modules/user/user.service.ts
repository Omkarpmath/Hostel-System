import { prisma } from "../../config/db.js";
import { ApiError } from "../../utils/ApiError.js";
import { hashPassword } from "../../utils/hash.js";
import { Prisma, Role } from "@prisma/client";

export class UserService {
  async createStudent(data: {
    email: string; password: string; firstName: string; lastName: string; phone?: string;
    usn: string; department: string; year: number; semester: number; guardianName: string;
    guardianPhone: string; permanentAddress: string; dateOfBirth: string; gender: "MALE" | "FEMALE" | "OTHER";
  }) {
    const passwordHash = await hashPassword(data.password);
    return prisma.$transaction(async (tx) => {
      const user = await tx.user.create({ data: { email: data.email, passwordHash, firstName: data.firstName, lastName: data.lastName, phone: data.phone, role: "STUDENT" } });
      return tx.studentProfile.create({ data: { userId: user.id, usn: data.usn, department: data.department, year: data.year, semester: data.semester, guardianName: data.guardianName, guardianPhone: data.guardianPhone, permanentAddress: data.permanentAddress, dateOfBirth: new Date(data.dateOfBirth), gender: data.gender }, include: { user: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } } } });
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
    if (!student) throw ApiError.notFound("Student profile has not been created yet");
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
    guardianName: string;
    guardianPhone: string;
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
        guardianName: data.guardianName,
        guardianPhone: data.guardianPhone,
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

  async getStudents(filters?: {
    search?: string;
    department?: string;
    year?: number;
    page?: number;
    limit?: number;
  }, wardenId?: string) {
    const page = filters?.page || 1;
    const limit = filters?.limit || 20;
    const skip = (page - 1) * limit;

    // Query User, not StudentProfile: accounts can exist before an administrator
    // completes their profile, and must not disappear from the admin roster.
    const where: Prisma.UserWhereInput = { role: "STUDENT" };
    if (filters?.department) where.studentProfile = { department: filters.department };
    if (filters?.year) where.studentProfile = { year: filters.year };
    if (wardenId) where.studentProfile = { roomAllocations: { some: { status: "ACTIVE", room: { floor: { block: { hostel: { wardenId } } } } } } };
    if (filters?.search) {
      where.OR = [
        { firstName: { contains: filters.search, mode: "insensitive" } },
        { lastName: { contains: filters.search, mode: "insensitive" } },
        { email: { contains: filters.search, mode: "insensitive" } },
        { studentProfile: { usn: { contains: filters.search, mode: "insensitive" } } },
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
