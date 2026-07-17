import AppError from '../utils/AppError.js';
import { HTTP_STATUS } from '../utils/constants.js';

/**
 * Middleware to validate request body against a Joi schema.
 * 
 * @param {import('joi').ObjectSchema} schema 
 * @returns Express middleware function
 */
export const validate = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true, // Remove properties not defined in the schema
  });

  if (error) {
    const errorMessage = error.details.map((detail) => detail.message).join(', ');
    return next(new AppError(errorMessage, HTTP_STATUS.BAD_REQUEST));
  }

  // Replace req.body with the sanitized/validated value
  req.body = value;
  next();
};
