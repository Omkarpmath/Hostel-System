import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware.js";
import { authorize } from "../../middleware/rbac.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import { bookingActionRateLimiter } from "../../middleware/rate-limit.middleware.js";
import { bookingController as c } from "./booking.controller.js";
import { cancelSchema, orderSchema, reserveSchema, verifySchema } from "./booking.schema.js";

const router = Router();
router.use(authenticate, authorize("STUDENT"));
router.get("/my-reservation", c.active.bind(c));
router.post("/reserve", bookingActionRateLimiter, validate(reserveSchema), c.reserve.bind(c));
router.post("/create-order", bookingActionRateLimiter, validate(orderSchema), c.order.bind(c));
router.post("/verify-payment", validate(verifySchema), c.verify.bind(c));
router.post("/cancel-reservation", validate(cancelSchema), c.cancel.bind(c));
export default router;
