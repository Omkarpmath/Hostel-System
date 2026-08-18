import { ApiResponse } from "../../utils/ApiResponse.js";
import { bookingService } from "./booking.service.js";
export class BookingController {
    userId(req) { if (!req.user)
        throw new Error("Authentication required"); return req.user.userId; }
    async reserve(req, res, next) { try {
        ApiResponse.created({ res, message: "Room reserved for 10 minutes", data: await bookingService.reserve(this.userId(req), req.body.roomId) });
    }
    catch (error) {
        next(error);
    } }
    async active(req, res, next) { try {
        ApiResponse.success({ res, data: await bookingService.activeReservation(this.userId(req)) });
    }
    catch (error) {
        next(error);
    } }
    async order(req, res, next) { try {
        ApiResponse.success({ res, data: await bookingService.createOrder(this.userId(req), req.body.reservationId) });
    }
    catch (error) {
        next(error);
    } }
    async verify(req, res, next) { try {
        ApiResponse.success({ res, message: "Payment verified and room allocated", data: await bookingService.verifyAndAllocate(this.userId(req), req.body.razorpayOrderId, req.body.razorpayPaymentId, req.body.razorpaySignature) });
    }
    catch (error) {
        next(error);
    } }
    async cancel(req, res, next) { try {
        await bookingService.cancel(this.userId(req), req.body.reservationId);
        ApiResponse.success({ res, message: "Reservation cancelled" });
    }
    catch (error) {
        next(error);
    } }
}
export const bookingController = new BookingController();
//# sourceMappingURL=booking.controller.js.map