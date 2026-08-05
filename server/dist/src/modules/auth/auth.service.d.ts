import { LoginInput, RegisterInput, ResetPasswordInput } from "./auth.schema.js";
export declare class AuthService {
    login(data: LoginInput): Promise<{
        user: {
            studentProfile: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                userId: string;
                usn: string;
                department: string;
                year: number;
                semester: number;
                guardianName: string;
                guardianPhone: string;
                permanentAddress: string;
                bloodGroup: string | null;
                dateOfBirth: Date;
                gender: import("@prisma/client").$Enums.Gender;
                qrCodeToken: string;
            } | null;
            id: string;
            email: string;
            role: import("@prisma/client").$Enums.Role;
            firstName: string;
            lastName: string;
            phone: string | null;
            avatarUrl: string | null;
            isActive: boolean;
            lastLoginAt: Date | null;
            createdAt: Date;
            updatedAt: Date;
        };
        accessToken: string;
        refreshToken: string;
    }>;
    register(data: RegisterInput): Promise<{
        id: string;
        email: string;
        role: import("@prisma/client").$Enums.Role;
        firstName: string;
        lastName: string;
        phone: string | null;
        avatarUrl: string | null;
        isActive: boolean;
        lastLoginAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    refreshToken(token: string): Promise<{
        accessToken: string;
        refreshToken: string;
    }>;
    logout(token: string): Promise<void>;
    resetPassword(data: ResetPasswordInput): Promise<{
        message: string;
    }>;
    getProfile(userId: string): Promise<{
        studentProfile: ({
            roomAllocations: ({
                room: {
                    floor: {
                        block: {
                            hostel: {
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
                            };
                        } & {
                            name: string;
                            id: string;
                            isActive: boolean;
                            createdAt: Date;
                            updatedAt: Date;
                            description: string | null;
                            hostelId: string;
                        };
                    } & {
                        name: string;
                        id: string;
                        createdAt: Date;
                        updatedAt: Date;
                        blockId: string;
                        floorNumber: number;
                    };
                } & {
                    id: string;
                    isActive: boolean;
                    createdAt: Date;
                    updatedAt: Date;
                    type: import("@prisma/client").$Enums.RoomType;
                    status: import("@prisma/client").$Enums.RoomStatus;
                    floorId: string;
                    roomNumber: string;
                    capacity: number;
                    occupiedBeds: number;
                    feePerSemester: import("@prisma/client/runtime/library").Decimal;
                    amenities: string | null;
                    version: number;
                };
            } & {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                studentId: string;
                status: import("@prisma/client").$Enums.AllocationStatus;
                roomId: string;
                bedNumber: number;
                allocatedFrom: Date;
                allocatedTo: Date | null;
            })[];
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            userId: string;
            usn: string;
            department: string;
            year: number;
            semester: number;
            guardianName: string;
            guardianPhone: string;
            permanentAddress: string;
            bloodGroup: string | null;
            dateOfBirth: Date;
            gender: import("@prisma/client").$Enums.Gender;
            qrCodeToken: string;
        }) | null;
        id: string;
        email: string;
        role: import("@prisma/client").$Enums.Role;
        firstName: string;
        lastName: string;
        phone: string | null;
        avatarUrl: string | null;
        isActive: boolean;
        lastLoginAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
}
export declare const authService: AuthService;
//# sourceMappingURL=auth.service.d.ts.map