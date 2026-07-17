import express from 'express';
import { initializeBooking, verifyPayment, getMyBookings, cancelBooking } from './booking.controller.js';
import { validate } from '../../middleware/validate.js';
import { protect } from '../../middleware/auth.middleware.js';
import { createBookingSchema, verifyPaymentSchema } from './booking.validation.js';
import asyncHandler from '../../utils/asyncHandler.js';

const router = express.Router();

router.use(protect);

router.get('/my-bookings', asyncHandler(getMyBookings));
router.post('/initialize', validate(createBookingSchema), asyncHandler(initializeBooking));
router.post('/:id/verify-payment', validate(verifyPaymentSchema), asyncHandler(verifyPayment));
router.patch('/:id/cancel', asyncHandler(cancelBooking));

export default router;
