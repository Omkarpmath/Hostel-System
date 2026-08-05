import { z } from "zod";
export declare const createHostelSchema: z.ZodObject<{
    body: z.ZodObject<{
        name: z.ZodString;
        type: z.ZodEnum<["BOYS", "GIRLS"]>;
        address: z.ZodOptional<z.ZodString>;
        description: z.ZodOptional<z.ZodString>;
        wardenId: z.ZodOptional<z.ZodString>;
        allowedYears: z.ZodArray<z.ZodNumber, "many">;
    }, "strip", z.ZodTypeAny, {
        name: string;
        type: "BOYS" | "GIRLS";
        allowedYears: number[];
        address?: string | undefined;
        description?: string | undefined;
        wardenId?: string | undefined;
    }, {
        name: string;
        type: "BOYS" | "GIRLS";
        allowedYears: number[];
        address?: string | undefined;
        description?: string | undefined;
        wardenId?: string | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    body: {
        name: string;
        type: "BOYS" | "GIRLS";
        allowedYears: number[];
        address?: string | undefined;
        description?: string | undefined;
        wardenId?: string | undefined;
    };
}, {
    body: {
        name: string;
        type: "BOYS" | "GIRLS";
        allowedYears: number[];
        address?: string | undefined;
        description?: string | undefined;
        wardenId?: string | undefined;
    };
}>;
export declare const updateHostelSchema: z.ZodObject<{
    body: z.ZodObject<{
        name: z.ZodOptional<z.ZodString>;
        type: z.ZodOptional<z.ZodEnum<["BOYS", "GIRLS"]>>;
        address: z.ZodOptional<z.ZodString>;
        description: z.ZodOptional<z.ZodString>;
        wardenId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        isActive: z.ZodOptional<z.ZodBoolean>;
        allowedYears: z.ZodOptional<z.ZodArray<z.ZodNumber, "many">>;
    }, "strip", z.ZodTypeAny, {
        name?: string | undefined;
        isActive?: boolean | undefined;
        type?: "BOYS" | "GIRLS" | undefined;
        address?: string | undefined;
        description?: string | undefined;
        wardenId?: string | null | undefined;
        allowedYears?: number[] | undefined;
    }, {
        name?: string | undefined;
        isActive?: boolean | undefined;
        type?: "BOYS" | "GIRLS" | undefined;
        address?: string | undefined;
        description?: string | undefined;
        wardenId?: string | null | undefined;
        allowedYears?: number[] | undefined;
    }>;
    params: z.ZodObject<{
        id: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        id: string;
    }, {
        id: string;
    }>;
}, "strip", z.ZodTypeAny, {
    params: {
        id: string;
    };
    body: {
        name?: string | undefined;
        isActive?: boolean | undefined;
        type?: "BOYS" | "GIRLS" | undefined;
        address?: string | undefined;
        description?: string | undefined;
        wardenId?: string | null | undefined;
        allowedYears?: number[] | undefined;
    };
}, {
    params: {
        id: string;
    };
    body: {
        name?: string | undefined;
        isActive?: boolean | undefined;
        type?: "BOYS" | "GIRLS" | undefined;
        address?: string | undefined;
        description?: string | undefined;
        wardenId?: string | null | undefined;
        allowedYears?: number[] | undefined;
    };
}>;
export declare const createBlockSchema: z.ZodObject<{
    body: z.ZodObject<{
        name: z.ZodString;
        description: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        name: string;
        description?: string | undefined;
    }, {
        name: string;
        description?: string | undefined;
    }>;
    params: z.ZodObject<{
        hostelId: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        hostelId: string;
    }, {
        hostelId: string;
    }>;
}, "strip", z.ZodTypeAny, {
    params: {
        hostelId: string;
    };
    body: {
        name: string;
        description?: string | undefined;
    };
}, {
    params: {
        hostelId: string;
    };
    body: {
        name: string;
        description?: string | undefined;
    };
}>;
export declare const createFloorSchema: z.ZodObject<{
    body: z.ZodObject<{
        floorNumber: z.ZodNumber;
        name: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        name: string;
        floorNumber: number;
    }, {
        name: string;
        floorNumber: number;
    }>;
    params: z.ZodObject<{
        blockId: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        blockId: string;
    }, {
        blockId: string;
    }>;
}, "strip", z.ZodTypeAny, {
    params: {
        blockId: string;
    };
    body: {
        name: string;
        floorNumber: number;
    };
}, {
    params: {
        blockId: string;
    };
    body: {
        name: string;
        floorNumber: number;
    };
}>;
export declare const createRoomSchema: z.ZodObject<{
    body: z.ZodObject<{
        roomNumber: z.ZodString;
        capacity: z.ZodNumber;
        type: z.ZodEnum<["SINGLE", "DOUBLE", "TRIPLE", "DORMITORY"]>;
        feePerSemester: z.ZodNumber;
        amenities: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        type: "SINGLE" | "DOUBLE" | "TRIPLE" | "DORMITORY";
        roomNumber: string;
        capacity: number;
        feePerSemester: number;
        amenities?: string[] | undefined;
    }, {
        type: "SINGLE" | "DOUBLE" | "TRIPLE" | "DORMITORY";
        roomNumber: string;
        capacity: number;
        feePerSemester: number;
        amenities?: string[] | undefined;
    }>;
    params: z.ZodObject<{
        floorId: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        floorId: string;
    }, {
        floorId: string;
    }>;
}, "strip", z.ZodTypeAny, {
    params: {
        floorId: string;
    };
    body: {
        type: "SINGLE" | "DOUBLE" | "TRIPLE" | "DORMITORY";
        roomNumber: string;
        capacity: number;
        feePerSemester: number;
        amenities?: string[] | undefined;
    };
}, {
    params: {
        floorId: string;
    };
    body: {
        type: "SINGLE" | "DOUBLE" | "TRIPLE" | "DORMITORY";
        roomNumber: string;
        capacity: number;
        feePerSemester: number;
        amenities?: string[] | undefined;
    };
}>;
export declare const updateRoomSchema: z.ZodObject<{
    body: z.ZodObject<{
        roomNumber: z.ZodOptional<z.ZodString>;
        capacity: z.ZodOptional<z.ZodNumber>;
        type: z.ZodOptional<z.ZodEnum<["SINGLE", "DOUBLE", "TRIPLE", "DORMITORY"]>>;
        feePerSemester: z.ZodOptional<z.ZodNumber>;
        amenities: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        status: z.ZodOptional<z.ZodEnum<["AVAILABLE", "PARTIALLY_OCCUPIED", "FULL", "MAINTENANCE", "RESERVED"]>>;
        isActive: z.ZodOptional<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        isActive?: boolean | undefined;
        type?: "SINGLE" | "DOUBLE" | "TRIPLE" | "DORMITORY" | undefined;
        status?: "AVAILABLE" | "PARTIALLY_OCCUPIED" | "FULL" | "MAINTENANCE" | "RESERVED" | undefined;
        roomNumber?: string | undefined;
        capacity?: number | undefined;
        feePerSemester?: number | undefined;
        amenities?: string[] | undefined;
    }, {
        isActive?: boolean | undefined;
        type?: "SINGLE" | "DOUBLE" | "TRIPLE" | "DORMITORY" | undefined;
        status?: "AVAILABLE" | "PARTIALLY_OCCUPIED" | "FULL" | "MAINTENANCE" | "RESERVED" | undefined;
        roomNumber?: string | undefined;
        capacity?: number | undefined;
        feePerSemester?: number | undefined;
        amenities?: string[] | undefined;
    }>;
    params: z.ZodObject<{
        id: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        id: string;
    }, {
        id: string;
    }>;
}, "strip", z.ZodTypeAny, {
    params: {
        id: string;
    };
    body: {
        isActive?: boolean | undefined;
        type?: "SINGLE" | "DOUBLE" | "TRIPLE" | "DORMITORY" | undefined;
        status?: "AVAILABLE" | "PARTIALLY_OCCUPIED" | "FULL" | "MAINTENANCE" | "RESERVED" | undefined;
        roomNumber?: string | undefined;
        capacity?: number | undefined;
        feePerSemester?: number | undefined;
        amenities?: string[] | undefined;
    };
}, {
    params: {
        id: string;
    };
    body: {
        isActive?: boolean | undefined;
        type?: "SINGLE" | "DOUBLE" | "TRIPLE" | "DORMITORY" | undefined;
        status?: "AVAILABLE" | "PARTIALLY_OCCUPIED" | "FULL" | "MAINTENANCE" | "RESERVED" | undefined;
        roomNumber?: string | undefined;
        capacity?: number | undefined;
        feePerSemester?: number | undefined;
        amenities?: string[] | undefined;
    };
}>;
//# sourceMappingURL=hostel.schema.d.ts.map