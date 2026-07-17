import Joi from 'joi';
import mongoose from 'mongoose';

const objectIdValidator = (value, helpers) => {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    return helpers.message('Invalid ID format');
  }
  return value;
};

export const createShowtimeSchema = Joi.object({
  movie: Joi.string().custom(objectIdValidator).required(),
  screen: Joi.string().custom(objectIdValidator).required(),
  startTime: Joi.date().iso().greater('now').required(),
  price: Joi.number().integer().min(100).required(), // In paise
});
