import { messFeeService } from "./mess-fee.service.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
export class MessFeeController {
    async getAmount(_req, res, next) {
        try {
            const amounts = await messFeeService.getAmounts();
            ApiResponse.success({
                res,
                data: {
                    amount: amounts.veg,
                    veg: amounts.veg,
                    nonVeg: amounts.nonVeg,
                    amounts,
                },
            });
        }
        catch (error) {
            next(error);
        }
    }
    async updateAmount(req, res, next) {
        try {
            const veg = req.body.veg !== undefined ? Number(req.body.veg) : Number(req.body.amount);
            const nonVeg = req.body.nonVeg !== undefined ? Number(req.body.nonVeg) : Number(req.body.amount);
            const updated = await messFeeService.updateAmounts(veg, nonVeg);
            ApiResponse.success({
                res,
                message: "Mess fee amounts updated successfully",
                data: {
                    amount: updated.veg,
                    veg: updated.veg,
                    nonVeg: updated.nonVeg,
                    amounts: updated,
                },
            });
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
            const mealPlan = req.body?.mealPlan === "NON_VEG" ? "NON_VEG" : "VEG";
            const order = await messFeeService.createOrder(req.user.userId, mealPlan);
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