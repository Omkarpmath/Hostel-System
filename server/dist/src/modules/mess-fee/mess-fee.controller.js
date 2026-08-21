import { messFeeService } from "./mess-fee.service.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
export class MessFeeController {
    async getAmount(_req, res, next) {
        try {
            const amount = await messFeeService.getAmount();
            ApiResponse.success({ res, data: { amount } });
        }
        catch (error) {
            next(error);
        }
    }
    async updateAmount(req, res, next) {
        try {
            await messFeeService.updateAmount(req.body.amount);
            ApiResponse.success({ res, message: "Mess fee amount updated successfully", data: { amount: req.body.amount } });
        }
        catch (error) {
            next(error);
        }
    }
    async getMyStatus(req, res, next) {
        try {
            const status = await messFeeService.getMyStatus(req.user.userId);
            ApiResponse.success({ res, data: status });
        }
        catch (error) {
            next(error);
        }
    }
    async createOrder(req, res, next) {
        try {
            const order = await messFeeService.createOrder(req.user.userId);
            ApiResponse.success({ res, data: order });
        }
        catch (error) {
            next(error);
        }
    }
    async verifyPayment(req, res, next) {
        try {
            const result = await messFeeService.verifyPayment(req.user.userId, req.body.razorpayOrderId, req.body.razorpayPaymentId, req.body.razorpaySignature);
            ApiResponse.success({ res, message: "Mess fee payment verified", data: result });
        }
        catch (error) {
            next(error);
        }
    }
}
export const messFeeController = new MessFeeController();
//# sourceMappingURL=mess-fee.controller.js.map