import { Router } from "express";
import { verifyService } from "./verify.service.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
const router = Router();
// PUBLIC — no authentication required
// This is intentional: anyone with the QR code URL can verify a student
router.get("/student/:token", async (req, res, next) => {
    try {
        const data = await verifyService.verifyStudent(req.params.token);
        ApiResponse.success({ res, data });
    }
    catch (error) {
        next(error);
    }
});
export default router;
//# sourceMappingURL=verify.routes.js.map