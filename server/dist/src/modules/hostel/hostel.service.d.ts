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
    }>;
    getRooms(filters?: {
        status?: string;
        type?: string;
        floorId?: string;
        hostelId?: string;
        page?: number;
        limit?: number;
        search?: string;
    }): Promise<{
        rooms: ({
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
            allocations: ({
                student: {
                    user: {
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
    }): Promise<({
        floor: {
            block: {
                hostel: {
                    name: string;
                    id: string;
                    type: import("@prisma/client").$Enums.HostelType;
                    allowedYears: number[];
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
    })[]>;
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
                guardianName: string;
                guardianPhone: string;
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
    }>;
    getDashboardStats(): Promise<{
        totalStudents: number;
        totalHostels: number;
        totalRooms: number;
        availableRooms: number;
        pendingLeaves: number;
        openComplaints: number;
        pendingFees: number;
        recentAllocations: ({
            student: {
                user: {
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
            };
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
        occupiedRooms: number;
        occupancyRate: number;
    }>;
}
export declare const hostelService: HostelService;
//# sourceMappingURL=hostel.service.d.ts.map