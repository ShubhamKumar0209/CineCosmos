import * as bookingService from './booking.service.js';
import { HTTP_STATUS } from '../../utils/constants.js';

export const initializeBooking = async (req, res) => {
  const { showtimeId, seats } = req.body;
  const result = await bookingService.initializeBooking(req.user._id, showtimeId, seats);

  res.status(HTTP_STATUS.CREATED).json({
    status: 'success',
    data: result, // { booking, order }
  });
};

export const verifyPayment = async (req, res) => {
  const booking = await bookingService.verifyPayment(req.user._id, req.params.id, req.body);

  res.status(HTTP_STATUS.OK).json({
    status: 'success',
    message: 'Payment successful, booking confirmed',
    data: { booking },
  });
};

export const getMyBookings = async (req, res) => {
  const bookings = await bookingService.getMyBookings(req.user._id);

  res.status(HTTP_STATUS.OK).json({
    status: 'success',
    results: bookings.length,
    data: { bookings },
  });
};

export const cancelBooking = async (req, res) => {
  const booking = await bookingService.cancelBooking(req.user._id, req.params.id);

  res.status(HTTP_STATUS.OK).json({
    status: 'success',
    message: 'Booking cancelled successfully. Refund has been initiated.',
    data: { booking },
  });
};
