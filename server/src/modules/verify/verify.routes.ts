import { Router, Request, Response, NextFunction } from "express";
import { verifyService } from "./verify.service.js";
import { ApiResponse } from "../../utils/ApiResponse.js";

const router = Router();

// PUBLIC — no authentication required
// This is intentional: anyone with the QR code URL can verify a student
router.get("/student/:token", async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Explicitly prevent browser or proxy caching of verification responses
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");

    const data = await verifyService.verifyStudent(req.params.token as string);
    ApiResponse.success({ res, data });
  } catch (error) {
    next(error);
  }
});

export default router;
