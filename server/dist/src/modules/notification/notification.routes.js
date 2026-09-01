import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware.js";
import { notificationController as c } from "./notification.controller.js";
const router = Router();
// All notification routes require authentication
router.use(authenticate);
router.get("/", c.list.bind(c));
router.get("/unread-count", c.unreadCount.bind(c));
router.patch("/read-all", c.markAllRead.bind(c));
router.patch("/:id/read", c.markRead.bind(c));
router.delete("/:id", c.delete.bind(c));
export default router;
//# sourceMappingURL=notification.routes.js.map