import { Router } from "express";
import { hostelController } from "./hostel.controller.js";
import { authenticate } from "../../middleware/auth.middleware.js";
import { authorize } from "../../middleware/rbac.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import {
  createHostelSchema,
  updateHostelSchema,
  createBlockSchema,
  createFloorSchema,
  createRoomSchema,
  updateRoomSchema,
} from "./hostel.schema.js";

const router = Router();

// All routes require authentication
router.use(authenticate);

// Dashboard
router.get("/dashboard/stats", authorize("ADMIN", "WARDEN", "ACCOUNTANT"), hostelController.getDashboardStats);

// Hostel CRUD
router.post("/hostels", authorize("ADMIN"), validate(createHostelSchema), hostelController.createHostel);
router.get("/hostels", hostelController.getHostels);
router.get("/hostels/:id", hostelController.getHostelById);
router.patch("/hostels/:id", authorize("ADMIN"), validate(updateHostelSchema), hostelController.updateHostel);
router.delete("/hostels/:id", authorize("ADMIN"), hostelController.deleteHostel);

// Block CRUD
router.post("/hostels/:hostelId/blocks", authorize("ADMIN"), validate(createBlockSchema), hostelController.createBlock);
router.get("/hostels/:hostelId/blocks", hostelController.getBlocks);

// Floor CRUD
router.post("/blocks/:blockId/floors", authorize("ADMIN"), validate(createFloorSchema), hostelController.createFloor);
router.get("/blocks/:blockId/floors", hostelController.getFloors);

// Room CRUD
router.post("/floors/:floorId/rooms", authorize("ADMIN"), validate(createRoomSchema), hostelController.createRoom);
router.get("/rooms", hostelController.getRooms);
router.get("/rooms/available", hostelController.getAvailableRooms);
router.get("/rooms/:id", hostelController.getRoomById);
router.patch("/rooms/:id", authorize("ADMIN"), validate(updateRoomSchema), hostelController.updateRoom);

export default router;
