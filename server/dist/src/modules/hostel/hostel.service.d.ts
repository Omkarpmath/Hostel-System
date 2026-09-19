import { Prisma } from "@prisma/client";
export declare class HostelService {
    createHostel(data: {
        name: string;
        type: "BOYS" | "GIRLS";
        address?: string;
        description?: string;
        wardenId?: string;
        allowedYears: number[];
    }): Promise<{
        warden: {
            id: string;
            email: string;
            firstName: string;
            lastName: string;
        } | null;
    } & {
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
    }>;
    getHostels(filters?: {
        type?: string;
        isActive?: boolean;
    }): Promise<({
        warden: {
            id: string;
            email: string;
            firstName: string;
            lastName: string;
        } | null;
        blocks: ({
            floors: ({
                rooms: {
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
                    blockedAt: Date | null;
                    blockedById: string | null;
                    blockedReason: string | null;
                }[];
            } & {
                name: string;
                id: string;
                createdAt: Date;
                updatedAt: Date;
                blockId: string;
                floorNumber: number;
            })[];
        } & {
            name: string;
            id: string;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            description: string | null;
            hostelId: string;
        })[];
    } & {
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
    })[]>;
    getHostelById(id: string): Promise<{
        warden: {
            id: string;
            email: string;
            firstName: string;
            lastName: string;
        } | null;
        blocks: ({
            floors: ({
                rooms: {
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
                    blockedAt: Date | null;
                    blockedById: string | null;
                    blockedReason: string | null;
                }[];
            } & {
                name: string;
                id: string;
                createdAt: Date;
                updatedAt: Date;
                blockId: string;
                floorNumber: number;
            })[];
        } & {
            name: string;
            id: string;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            description: string | null;
            hostelId: string;
        })[];
    } & {
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
    }>;
    updateHostel(id: string, data: Partial<{
        name: string;
        type: "BOYS" | "GIRLS";
        address: string;
        description: string;
        wardenId: string | null;
        isActive: boolean;
        allowedYears: number[];
    }>): Promise<{
        warden: {
            id: string;
            email: string;
            firstName: string;
            lastName: string;
        } | null;
    } & {
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
    }>;
    deleteHostel(id: string): Promise<{
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
    }>;
    createBlock(hostelId: string, data: {
        name: string;
        description?: string;
    }): Promise<{
        name: string;
        id: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        hostelId: string;
    }>;
    getBlocks(hostelId: string): Promise<({
        floors: ({
            rooms: {
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
                blockedAt: Date | null;
                blockedById: string | null;
                blockedReason: string | null;
            }[];
        } & {
            name: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            blockId: string;
            floorNumber: number;
        })[];
    } & {
        name: string;
        id: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        hostelId: string;
    })[]>;
    createFloor(blockId: string, data: {
        floorNumber: number;
        name: string;
    }): Promise<{
        rooms: {
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
            blockedAt: Date | null;
            blockedById: string | null;
            blockedReason: string | null;
        }[];
    } & {
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        blockId: string;
        floorNumber: number;
    }>;
    getFloors(blockId: string): Promise<({
        rooms: {
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
            blockedAt: Date | null;
            blockedById: string | null;
            blockedReason: string | null;
        }[];
    } & {
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        blockId: string;
        floorNumber: number;
    })[]>;
    createRoom(floorId: string, data: {
        roomNumber: string;
        capacity: number;
        type: "SINGLE" | "DOUBLE" | "TRIPLE" | "DORMITORY";
        feePerSemester: number;
        amenities?: string[];
    }): Promise<{
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
        blockedAt: Date | null;
        blockedById: string | null;
        blockedReason: string | null;
    }>;
    getRooms(filters?: {
        status?: string;
        type?: string;
        floorId?: string;
        hostelId?: string;
        hostelType?: string;
        year?: number;
        page?: number;
        limit?: number;
        search?: string;
    }, userRole?: string): Promise<{
        rooms: (({
            floor: {
                block: {
                    hostel: {
                        name: string;
                        id: string;
                        type: import("@prisma/client").$Enums.HostelType;
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
            blockedBy: {
                id: string;
                email: string;
                firstName: string;
                lastName: string;
            } | null;
            allocations: ({
                student: {
                    user: {
                        id: string;
                        email: string;
                        firstName: string;
                        lastName: string;
                        phone: string | null;
                        avatarUrl: string | null;
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
                    guardianName: string | null;
                    guardianPhone: string | null;
                    permanentAddress: string;
                    bloodGroup: string | null;
                    dateOfBirth: Date;
                    gender: import("@prisma/client").$Enums.Gender;
                    qrCodeToken: string;
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
            blockedAt: Date | null;
            blockedById: string | null;
            blockedReason: string | null;
        }) | {
            status: any;
            occupiedBeds: number;
            blockedAt: null;
            blockedById: null;
            blockedReason: null;
            blockedBy: null;
            allocations: never[];
            floor: {
                block: {
                    hostel: {
                        name: string;
                        id: string;
                        type: import("@prisma/client").$Enums.HostelType;
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
            id: string;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            type: import("@prisma/client").$Enums.RoomType;
            floorId: string;
            roomNumber: string;
            capacity: number;
            feePerSemester: Prisma.Decimal;
            amenities: string | null;
            version: number;
        })[];
        meta: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    getAvailableRooms(hostelId?: string, eligibility?: {
        year: number;
        gender: "MALE" | "FEMALE" | "OTHER";
    }): Promise<any[]>;
    getRoomById(id: string): Promise<{
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
        allocations: ({
            student: {
                user: {
                    id: string;
                    email: string;
                    firstName: string;
                    lastName: string;
                    avatarUrl: string | null;
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
                guardianName: string | null;
                guardianPhone: string | null;
                permanentAddress: string;
                bloodGroup: string | null;
                dateOfBirth: Date;
                gender: import("@prisma/client").$Enums.Gender;
                qrCodeToken: string;
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
        blockedAt: Date | null;
        blockedById: string | null;
        blockedReason: string | null;
    }>;
    updateRoom(id: string, data: Partial<{
        roomNumber: string;
        capacity: number;
        type: string;
        feePerSemester: number;
        amenities: string[];
        status: string;
        isActive: boolean;
    }>): Promise<{
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
        blockedAt: Date | null;
        blockedById: string | null;
        blockedReason: string | null;
    }>;
    blockRoom(id: string, adminUserId: string, reason?: string): Promise<{
        blockedBy: {
            id: string;
            email: string;
            firstName: string;
            lastName: string;
        } | null;
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
        blockedAt: Date | null;
        blockedById: string | null;
        blockedReason: string | null;
    }>;
    unblockRoom(id: string, actorId?: string): Promise<{
        blockedBy: {
            id: string;
            email: string;
            firstName: string;
            lastName: string;
        } | null;
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
        blockedAt: Date | null;
        blockedById: string | null;
        blockedReason: string | null;
    }>;
    bulkImportRooms(csvText: string, actorId: string, actorRole?: any): Promise<{
        processed: number;
        createdRooms: number;
        updatedRooms: number;
        errors: string[];
    }>;
    getDashboardStats(user?: {
        userId: string;
        role: string;
    }): Promise<any>;
}
export declare const hostelService: HostelService;
//# sourceMappingURL=hostel.service.d.ts.map