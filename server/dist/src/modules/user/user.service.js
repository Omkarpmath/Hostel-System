import { prisma } from "../../config/db.js";
import { ApiError } from "../../utils/ApiError.js";
import { hashPassword } from "../../utils/hash.js";
export class UserService {
    async getUsers(filters) {
        const page = filters?.page || 1;
        const limit = filters?.limit || 20;
        const skip = (page - 1) * limit;
        const where = {};
        if (filters?.role)
            where.role = filters.role;
        if (filters?.isActive !== undefined)
            where.isActive = filters.isActive;
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
    async getUserById(id) {
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
        if (!user)
            throw ApiError.notFound("User not found");
        return user;
    }
    async createUser(data) {
        const existing = await prisma.user.findUnique({ where: { email: data.email } });
        if (existing)
            throw ApiError.conflict("Email already exists");
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
    async updateUser(id, data) {
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
    async createStudentProfile(userId, data) {
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user)
            throw ApiError.notFound("User not found");
        if (user.role !== "STUDENT")
            throw ApiError.badRequest("User is not a student");
        const existing = await prisma.studentProfile.findUnique({ where: { userId } });
        if (existing)
            throw ApiError.conflict("Student profile already exists");
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
    async getStudents(filters) {
        const page = filters?.page || 1;
        const limit = filters?.limit || 20;
        const skip = (page - 1) * limit;
        const where = {};
        if (filters?.department)
            where.department = filters.department;
        if (filters?.year)
            where.year = filters.year;
        if (filters?.search) {
            where.OR = [
                { usn: { contains: filters.search, mode: "insensitive" } },
                { user: { firstName: { contains: filters.search, mode: "insensitive" } } },
                { user: { lastName: { contains: filters.search, mode: "insensitive" } } },
                { user: { email: { contains: filters.search, mode: "insensitive" } } },
            ];
        }
        const [students, total] = await Promise.all([
            prisma.studentProfile.findMany({
                where,
                include: {
                    user: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            email: true,
                            phone: true,
                            avatarUrl: true,
                            isActive: true,
                        },
                    },
                    roomAllocations: {
                        where: { status: "ACTIVE" },
                        include: {
                            room: {
                                include: {
                                    floor: {
                                        include: {
                                            block: {
                                                include: { hostel: { select: { name: true } } },
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
            prisma.studentProfile.count({ where }),
        ]);
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
//# sourceMappingURL=user.service.js.map