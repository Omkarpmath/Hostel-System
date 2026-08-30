import { Prisma, Role } from "@prisma/client";
export declare class UserService {
    createStudent(data: {
        email: string;
        password: string;
        firstName: string;
        lastName: string;
        phone?: string;
        usn: string;
        department: string;
        year: number;
        semester: number;
        guardianName: string;
        guardianPhone: string;
        permanentAddress: string;
        dateOfBirth: string;
        gender: "MALE" | "FEMALE" | "OTHER";
    }): Promise<{
        user: {
            id: string;
            email: string;
            firstName: string;
            lastName: string;
            phone: string | null;
        };
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
    }>;
    getCurrentStudent(userId: string): Promise<({
        user: {
            id: string;
            email: string;
            firstName: string;
            lastName: string;
            phone: string | null;
            avatarUrl: string | null;
        };
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
                feePerSemester: Prisma.Decimal;
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
    }) | {
        id: null;
        userId: string;
        user: {
            id: string;
            email: string;
            firstName: string;
            lastName: string;
            phone: string | null;
            avatarUrl: string | null;
        };
        usn: string;
        department: string;
        year: number;
        semester: number;
        guardianName: string;
        guardianPhone: string;
        permanentAddress: string;
        bloodGroup: null;
        gender: string;
        dateOfBirth: null;
        roomAllocations: never[];
        isProfileIncomplete: boolean;
    }>;
    getUsers(filters?: {
        role?: string;
        search?: string;
        page?: number;
        limit?: number;
        isActive?: boolean;
    }): Promise<{
        users: {
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
        }[];
        meta: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    getUserById(id: string): Promise<{
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
                    feePerSemester: Prisma.Decimal;
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
    }>;
    createUser(data: {
        email: string;
        password: string;
        firstName: string;
        lastName: string;
        phone?: string;
        role: Role;
    }): Promise<{
        id: string;
        email: string;
        role: import("@prisma/client").$Enums.Role;
        firstName: string;
        lastName: string;
        phone: string | null;
        isActive: boolean;
        createdAt: Date;
    }>;
    updateUser(id: string, data: Partial<{
        firstName: string;
        lastName: string;
        phone: string;
        isActive: boolean;
        avatarUrl: string;
    }>): Promise<{
        id: string;
        email: string;
        role: import("@prisma/client").$Enums.Role;
        firstName: string;
        lastName: string;
        phone: string | null;
        avatarUrl: string | null;
        isActive: boolean;
    }>;
    createStudentProfile(userId: string, data: {
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
    }): Promise<{
        user: {
            id: string;
            email: string;
            firstName: string;
            lastName: string;
        };
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
    }>;
    updateCurrentStudent(userId: string, data: {
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
    }): Promise<{
        user: {
            id: string;
            email: string;
            firstName: string;
            lastName: string;
            phone: string | null;
            avatarUrl: string | null;
        };
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
                feePerSemester: Prisma.Decimal;
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
    }>;
    getStudents(filters?: {
        search?: string;
        department?: string;
        year?: number;
        page?: number;
        limit?: number;
    }, wardenId?: string): Promise<{
        students: {
            id: string;
            user: {
                id: string;
                email: string;
                firstName: string;
                lastName: string;
                phone: string | null;
                avatarUrl: string | null;
                isActive: boolean;
                createdAt: Date;
            };
            usn: string | null;
            department: string | null;
            year: number | null;
            semester: number | null;
            roomAllocations: ({
                room: {
                    floor: {
                        block: {
                            hostel: {
                                name: string;
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
                    feePerSemester: Prisma.Decimal;
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
            profileComplete: boolean;
        }[];
        meta: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    getWardens(): Promise<{
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        phone: string | null;
    }[]>;
}
export declare const userService: UserService;
//# sourceMappingURL=user.service.d.ts.map