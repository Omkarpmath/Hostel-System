import { Prisma } from "@prisma/client";
export declare class OperationsService {
    private wardenStudents;
    private studentId;
    private getWardenIdsForStudent;
    getMyOverview(userId: string): Promise<{
        profile: {
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
        };
        fees: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            type: import("@prisma/client").$Enums.FeeType;
            studentId: string;
            status: import("@prisma/client").$Enums.PaymentStatus;
            razorpayOrderId: string | null;
            allocationId: string | null;
            amount: Prisma.Decimal;
            transactionId: string | null;
            paymentMethod: string | null;
            receiptNumber: string | null;
            receiptEmail: string | null;
            emailSent: boolean;
            emailSentAt: Date | null;
            emailError: string | null;
            screenshotUrl: string | null;
            paidAt: Date | null;
            dueDate: Date;
        }[];
        leaves: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            type: import("@prisma/client").$Enums.LeaveType;
            studentId: string;
            reason: string;
            fromDate: Date;
            toDate: Date;
            status: import("@prisma/client").$Enums.LeaveStatus;
            approvedBy: string | null;
            rejectionReason: string | null;
            approvedAt: Date | null;
        }[];
        complaints: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            description: string;
            studentId: string;
            status: import("@prisma/client").$Enums.ComplaintStatus;
            title: string;
            category: import("@prisma/client").$Enums.ComplaintCategory;
            priority: import("@prisma/client").$Enums.ComplaintPriority;
            assignedTo: string | null;
            resolution: string | null;
            resolvedAt: Date | null;
        }[];
        visitors: ({
            student: {
                user: {
                    id: string;
                    email: string;
                    firstName: string;
                    lastName: string;
                    phone: string | null;
                };
                roomAllocations: ({
                    room: {
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
            };
            approver: {
                id: string;
                role: import("@prisma/client").$Enums.Role;
                firstName: string;
                lastName: string;
            } | null;
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            studentId: string;
            status: import("@prisma/client").$Enums.VisitorStatus;
            approvedBy: string | null;
            visitorName: string;
            visitorPhone: string;
            relationship: string;
            purpose: string;
            idProofType: string | null;
            idProofNumber: string | null;
            checkInTime: Date | null;
            checkOutTime: Date | null;
        })[];
    }>;
    listAllocations(): Promise<({
        student: {
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
        };
        room: {
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
    })[]>;
    allocate(studentId: string, roomId: string, requestedBed?: number): Promise<{
        student: {
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
        };
        room: {
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
    }>;
    listLeaves(userId: string, role: string, filters?: {
        hostelId?: string;
    }): Promise<({
        student: {
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
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        type: import("@prisma/client").$Enums.LeaveType;
        studentId: string;
        reason: string;
        fromDate: Date;
        toDate: Date;
        status: import("@prisma/client").$Enums.LeaveStatus;
        approvedBy: string | null;
        rejectionReason: string | null;
        approvedAt: Date | null;
    })[]>;
    createLeave(userId: string, data: any): Promise<{
        student: {
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
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        type: import("@prisma/client").$Enums.LeaveType;
        studentId: string;
        reason: string;
        fromDate: Date;
        toDate: Date;
        status: import("@prisma/client").$Enums.LeaveStatus;
        approvedBy: string | null;
        rejectionReason: string | null;
        approvedAt: Date | null;
    }>;
    decideLeave(id: string, approverId: string, role: string, data: any): Promise<{
        student: {
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
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        type: import("@prisma/client").$Enums.LeaveType;
        studentId: string;
        reason: string;
        fromDate: Date;
        toDate: Date;
        status: import("@prisma/client").$Enums.LeaveStatus;
        approvedBy: string | null;
        rejectionReason: string | null;
        approvedAt: Date | null;
    }>;
    listComplaints(userId: string, role: string, filters?: {
        hostelId?: string;
    }): Promise<({
        student: {
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
        };
        images: {
            id: string;
            createdAt: Date;
            complaintId: string;
            imageUrl: string;
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        description: string;
        studentId: string;
        status: import("@prisma/client").$Enums.ComplaintStatus;
        title: string;
        category: import("@prisma/client").$Enums.ComplaintCategory;
        priority: import("@prisma/client").$Enums.ComplaintPriority;
        assignedTo: string | null;
        resolution: string | null;
        resolvedAt: Date | null;
    })[]>;
    createComplaint(userId: string, data: any, files?: Express.Multer.File[]): Promise<({
        student: {
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
        };
        images: {
            id: string;
            createdAt: Date;
            complaintId: string;
            imageUrl: string;
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        description: string;
        studentId: string;
        status: import("@prisma/client").$Enums.ComplaintStatus;
        title: string;
        category: import("@prisma/client").$Enums.ComplaintCategory;
        priority: import("@prisma/client").$Enums.ComplaintPriority;
        assignedTo: string | null;
        resolution: string | null;
        resolvedAt: Date | null;
    }) | null>;
    updateComplaint(id: string, approverId: string, role: string, data: any): Promise<{
        student: {
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
        };
        images: {
            id: string;
            createdAt: Date;
            complaintId: string;
            imageUrl: string;
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        description: string;
        studentId: string;
        status: import("@prisma/client").$Enums.ComplaintStatus;
        title: string;
        category: import("@prisma/client").$Enums.ComplaintCategory;
        priority: import("@prisma/client").$Enums.ComplaintPriority;
        assignedTo: string | null;
        resolution: string | null;
        resolvedAt: Date | null;
    }>;
    listVisitors(userId: string, role: string, filters?: {
        hostelId?: string;
        date?: string;
    }): Promise<({
        student: {
            user: {
                id: string;
                email: string;
                firstName: string;
                lastName: string;
                phone: string | null;
            };
            roomAllocations: ({
                room: {
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
        };
        approver: {
            id: string;
            role: import("@prisma/client").$Enums.Role;
            firstName: string;
            lastName: string;
        } | null;
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        studentId: string;
        status: import("@prisma/client").$Enums.VisitorStatus;
        approvedBy: string | null;
        visitorName: string;
        visitorPhone: string;
        relationship: string;
        purpose: string;
        idProofType: string | null;
        idProofNumber: string | null;
        checkInTime: Date | null;
        checkOutTime: Date | null;
    })[]>;
    createVisitor(userId: string, role: string, data: any): Promise<{
        student: {
            user: {
                id: string;
                email: string;
                firstName: string;
                lastName: string;
                phone: string | null;
            };
            roomAllocations: ({
                room: {
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
        };
        approver: {
            id: string;
            role: import("@prisma/client").$Enums.Role;
            firstName: string;
            lastName: string;
        } | null;
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        studentId: string;
        status: import("@prisma/client").$Enums.VisitorStatus;
        approvedBy: string | null;
        visitorName: string;
        visitorPhone: string;
        relationship: string;
        purpose: string;
        idProofType: string | null;
        idProofNumber: string | null;
        checkInTime: Date | null;
        checkOutTime: Date | null;
    }>;
    listHostelStudents(userId: string, role: string, queryHostelId?: string): Promise<({
        user: {
            id: string;
            email: string;
            firstName: string;
            lastName: string;
            phone: string | null;
        };
        roomAllocations: ({
            room: {
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
    })[]>;
    listFees(userId: string, role: string, filters?: {
        hostelId?: string;
    }): Promise<({
        student: {
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
        };
        allocation: ({
            room: {
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
        }) | null;
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        type: import("@prisma/client").$Enums.FeeType;
        studentId: string;
        status: import("@prisma/client").$Enums.PaymentStatus;
        razorpayOrderId: string | null;
        allocationId: string | null;
        amount: Prisma.Decimal;
        transactionId: string | null;
        paymentMethod: string | null;
        receiptNumber: string | null;
        receiptEmail: string | null;
        emailSent: boolean;
        emailSentAt: Date | null;
        emailError: string | null;
        screenshotUrl: string | null;
        paidAt: Date | null;
        dueDate: Date;
    })[]>;
}
export declare const operationsService: OperationsService;
//# sourceMappingURL=operations.service.d.ts.map