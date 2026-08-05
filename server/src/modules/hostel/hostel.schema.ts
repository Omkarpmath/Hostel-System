import { z } from "zod";

export const createHostelSchema = z.object({
  body: z.object({
    name: z.string().min(1, "Hostel name is required"),
    type: z.enum(["BOYS", "GIRLS"]),
    address: z.string().optional(),
    description: z.string().optional(),
    wardenId: z.string().uuid().optional(),
    allowedYears: z.array(z.number().int().min(1).max(5)).min(1, "At least one year must be selected"),
  }),
});

export const updateHostelSchema = z.object({
  body: z.object({
    name: z.string().min(1).optional(),
    type: z.enum(["BOYS", "GIRLS"]).optional(),
    address: z.string().optional(),
    description: z.string().optional(),
    wardenId: z.string().uuid().nullable().optional(),
    isActive: z.boolean().optional(),
    allowedYears: z.array(z.number().int().min(1).max(5)).optional(),
  }),
  params: z.object({
    id: z.string().uuid(),
  }),
});

export const createBlockSchema = z.object({
  body: z.object({
    name: z.string().min(1, "Block name is required"),
    description: z.string().optional(),
  }),
  params: z.object({
    hostelId: z.string().uuid(),
  }),
});

export const createFloorSchema = z.object({
  body: z.object({
    floorNumber: z.number().int().min(0, "Floor number must be 0 or greater"),
    name: z.string().min(1, "Floor name is required"),
  }),
  params: z.object({
    blockId: z.string().uuid(),
  }),
});

export const createRoomSchema = z.object({
  body: z.object({
    roomNumber: z.string().min(1, "Room number is required"),
    capacity: z.number().int().min(1, "Capacity must be at least 1"),
    type: z.enum(["SINGLE", "DOUBLE", "TRIPLE", "DORMITORY"]),
    feePerSemester: z.number().min(0, "Fee must be non-negative"),
    amenities: z.array(z.string()).optional(),
  }),
  params: z.object({
    floorId: z.string().uuid(),
  }),
});

export const updateRoomSchema = z.object({
  body: z.object({
    roomNumber: z.string().min(1).optional(),
    capacity: z.number().int().min(1).optional(),
    type: z.enum(["SINGLE", "DOUBLE", "TRIPLE", "DORMITORY"]).optional(),
    feePerSemester: z.number().min(0).optional(),
    amenities: z.array(z.string()).optional(),
    status: z.enum(["AVAILABLE", "PARTIALLY_OCCUPIED", "FULL", "MAINTENANCE", "RESERVED"]).optional(),
    isActive: z.boolean().optional(),
  }),
  params: z.object({
    id: z.string().uuid(),
  }),
});
