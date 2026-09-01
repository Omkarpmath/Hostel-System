import { Router } from "express";
import { announcementController } from "./announcement.controller.js";
import { authenticate } from "../../middleware/auth.middleware.js";
import { authorize } from "../../middleware/rbac.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import {
  createAnnouncementSchema,
  updateAnnouncementSchema,
} from "./announcement.schema.js";

const router = Router();

// All announcement routes require authentication
router.use(authenticate);

// Student specific routes
router.get("/my", authorize("STUDENT"), announcementController.my.bind(announcementController));
router.post("/read-all", authorize("STUDENT"), announcementController.markAllRead.bind(announcementController));
router.post("/:id/read", authorize("STUDENT"), announcementController.markRead.bind(announcementController));

// Management & shared routes
router.get("/stats", authorize("ADMIN", "WARDEN"), announcementController.stats.bind(announcementController));
router.get("/", authorize("ADMIN", "WARDEN"), announcementController.list.bind(announcementController));
router.post("/", authorize("ADMIN", "WARDEN"), validate(createAnnouncementSchema), announcementController.create.bind(announcementController));
router.get("/:id", announcementController.getById.bind(announcementController));
router.patch("/:id", authorize("ADMIN", "WARDEN"), validate(updateAnnouncementSchema), announcementController.update.bind(announcementController));
router.delete("/:id", authorize("ADMIN", "WARDEN"), announcementController.delete.bind(announcementController));

export default router;
