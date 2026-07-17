import Joi from 'joi';
import mongoose from 'mongoose';
import config from '../../config/index.js';

const objectIdValidator = (value, helpers) => {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    return helpers.message('Invalid ID format');
  }
  return value;
};

const seatSchema = Joi.object({
  row: Joi.number().integer().min(1).required(),
  col: Joi.number().integer().min(1).required(),
  label: Joi.string().required(),
});

export const createBookingSchema = Joi.object({
  showtimeId: Joi.string().custom(objectIdValidator).required(),
  seats: Joi.array()
    .items(seatSchema)
    .min(1)
    .max(config.maxTicketsPerBooking)
    .required()
    .messages({
      'array.min': 'Select at least one seat',
      'array.max': `You cannot book more than ${config.maxTicketsPerBooking} seats`,
    }),
});

export const verifyPaymentSchema = Joi.object({
  razorpay_order_id: Joi.string().required(),
  razorpay_payment_id: Joi.string().required(),
  razorpay_signature: Joi.string().required(),
});
