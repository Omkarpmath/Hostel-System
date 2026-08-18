import { Prisma } from "@prisma/client";
export declare class BookingService {
    private studentId;
    private expireReservations;
    reserve(userId: string, roomId: string): Promise<{
        room: {
            floor: {
                block: {
                    hostel: {
                        name: string;
                        id: string;
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
        status: import("@prisma/client").$Enums.ReservationStatus;
        expiresAt: Date;
        roomId: string;
        razorpayOrderId: string | null;
    }>;
    activeReservation(userId: string): Promise<({
        room: {
            floor: {
                block: {
                    hostel: {
                        name: string;
                        id: string;
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
        status: import("@prisma/client").$Enums.ReservationStatus;
        expiresAt: Date;
        roomId: string;
        razorpayOrderId: string | null;
    }) | null>;
    createOrder(userId: string, reservationId: string): Promise<{
        reservationId: string;
        orderId: string;
        amount: number;
        currency: string;
        keyId: string;
        reused: boolean;
    } | {
        reservationId: string;
        orderId: string;
        amount: number;
        currency: string;
        keyId: string;
        reused?: undefined;
    }>;
    verifyAndAllocate(userId: string, orderId: string, paymentId: string, signature: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        studentId: string;
        status: import("@prisma/client").$Enums.AllocationStatus;
        roomId: string;
        bedNumber: number;
        allocatedFrom: Date;
        allocatedTo: Date | null;
    }>;
    private allocatePaidReservation;
    cancel(userId: string, reservationId: string): Promise<void>;
}
export declare const bookingService: BookingService;
//# sourceMappingURL=booking.service.d.ts.map