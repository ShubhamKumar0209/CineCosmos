import Joi from 'joi';
import mongoose from 'mongoose';

// Helper to validate MongoDB ObjectId
const objectIdValidator = (value, helpers) => {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    return helpers.message('Invalid ID format');
  }
  return value;
};

export const createTheaterSchema = Joi.object({
  name: Joi.string().trim().required().messages({
    'string.empty': 'Theater name is required',
  }),
  city: Joi.string().custom(objectIdValidator).required().messages({
    'any.required': 'City ID is required',
  }),
  address: Joi.string().trim().required().messages({
    'string.empty': 'Address is required',
  }),
  isActive: Joi.boolean().default(true),
});

const seatSchema = Joi.object({
  row: Joi.number().integer().min(1).required(),
  col: Joi.number().integer().min(1).required(),
});

export const addScreenSchema = Joi.object({
  name: Joi.string().trim().required().messages({
    'string.empty': 'Screen name is required',
  }),
  seatLayout: Joi.object({
    rows: Joi.number().integer().min(1).required(),
    columns: Joi.number().integer().min(1).required(),
    aisleAfterRows: Joi.array().items(Joi.number().integer().min(1)).default([]),
    aisleAfterColumns: Joi.array().items(Joi.number().integer().min(1)).default([]),
    unavailableSeats: Joi.array().items(seatSchema).default([]),
  }).required(),
});
