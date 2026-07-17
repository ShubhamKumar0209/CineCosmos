import crypto from 'crypto';
import Booking from './booking.model.js';
import Showtime from '../showtime/showtime.model.js';
import * as seatLockService from './seatLock.service.js';
import * as razorpayService from '../payment/razorpay.service.js';
import AppError from '../../utils/AppError.js';
import { HTTP_STATUS, BOOKING_STATUS } from '../../utils/constants.js';
import logger from '../../utils/logger.js';

/**
 * 1. Validate seats
 * 2. Lock them in Redis
 * 3. Create a pending booking in DB
 * 4. Create Razorpay order
 */
export const initializeBooking = async (userId, showtimeId, seats) => {
  const showtime = await Showtime.findById(showtimeId);
  if (!showtime) throw new AppError('Showtime not found', HTTP_STATUS.NOT_FOUND);

  // Check if seats are already permanently booked in DB
  const permanentlyBooked = showtime.bookedSeats.some((booked) =>
    seats.some((s) => s.row === booked.row && s.col === booked.col)
  );
  if (permanentlyBooked) {
    throw new AppError('One or more seats are already booked', HTTP_STATUS.CONFLICT);
  }

  // Lock seats in Redis
  await seatLockService.lockSeats(showtimeId, seats, userId);

  // Calculate amount (seats * price)
  const totalAmount = seats.length * showtime.price;

  // Generate a random booking reference
  const bookingRef = crypto.randomBytes(4).toString('hex').toUpperCase();

  // Create pending booking
  const booking = await Booking.create({
    user: userId,
    showtime: showtimeId,
    seats,
    totalAmount,
    bookingRef,
    status: BOOKING_STATUS.PENDING,
  });

  // Create Razorpay order
  const order = await razorpayService.createOrder(totalAmount, booking._id.toString());

  booking.razorpayOrderId = order.id;
  await booking.save();

  return { booking, order };
};

/**
 * Verify Razorpay payment signature and confirm booking
 */
export const verifyPayment = async (userId, bookingId, razorpayData) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = razorpayData;

  const booking = await Booking.findOne({ _id: bookingId, user: userId });
  if (!booking) throw new AppError('Booking not found', HTTP_STATUS.NOT_FOUND);

  if (booking.status === BOOKING_STATUS.CONFIRMED) {
    throw new AppError('Booking is already confirmed', HTTP_STATUS.BAD_REQUEST);
  }

  const isValid = razorpayService.verifyPaymentSignature(
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature
  );

  if (!isValid) {
    booking.status = BOOKING_STATUS.FAILED;
    await booking.save();
    
    // Release locks so others can buy
    await seatLockService.releaseLocks(booking.showtime, booking.seats);
    
    throw new AppError('Payment verification failed', HTTP_STATUS.BAD_REQUEST);
  }

  // Payment is valid!
  booking.status = BOOKING_STATUS.CONFIRMED;
  booking.razorpayPaymentId = razorpay_payment_id;
  booking.razorpaySignature = razorpay_signature;
  await booking.save();

  // Permanently book seats in the Showtime document
  await Showtime.updateOne(
    { _id: booking.showtime },
    { $push: { bookedSeats: { $each: booking.seats } } }
  );

  // Release the Redis locks since they are now permanently in DB
  await seatLockService.releaseLocks(booking.showtime, booking.seats);

  // Log e-ticket (since no SMTP is configured)
  logger.info(`E-Ticket Confirmed! Ref: ${booking.bookingRef}, User: ${userId}, Seats: ${booking.seats.map(s => s.label).join(', ')}`);

  return booking;
};

export const getMyBookings = async (userId) => {
  return await Booking.find({ user: userId })
    .populate({
      path: 'showtime',
      populate: [
        { path: 'movie', select: 'title posterPath' },
        { path: 'theater', select: 'name address' },
        { path: 'screen', select: 'name' }
      ]
    })
    .sort({ createdAt: -1 });
};

/**
 * Cancel a booking if requested within 5 minutes of creation.
 */
export const cancelBooking = async (userId, bookingId) => {
  const booking = await Booking.findOne({ _id: bookingId, user: userId });
  if (!booking) throw new AppError('Booking not found', HTTP_STATUS.NOT_FOUND);

  if (booking.status !== BOOKING_STATUS.CONFIRMED) {
    throw new AppError('Only confirmed bookings can be cancelled', HTTP_STATUS.BAD_REQUEST);
  }

  const timeSinceBooking = Date.now() - new Date(booking.createdAt).getTime();
  const FIVE_MINUTES_IN_MS = 5 * 60 * 1000;

  if (timeSinceBooking > FIVE_MINUTES_IN_MS) {
    throw new AppError('Bookings can only be cancelled within 5 minutes of creation', HTTP_STATUS.BAD_REQUEST);
  }

  // Update status locally
  booking.status = BOOKING_STATUS.CANCELLED;
  await booking.save();

  // Free the permanently booked seats in the Showtime
  // booking.seats is an array like [{ row: 1, col: 2, label: 'A1' }]
  // We need to pull these from the showtime.bookedSeats array
  const seatFilters = booking.seats.map(s => ({ row: s.row, col: s.col }));
  
  await Showtime.updateOne(
    { _id: booking.showtime },
    { $pull: { bookedSeats: { $or: seatFilters } } }
  );

  // In a real environment, we would trigger a Razorpay refund here:
  // await razorpayService.refundPayment(booking.razorpayPaymentId);
  logger.info(`Booking Cancelled! Ref: ${booking.bookingRef}, User: ${userId}`);

  return booking;
};
