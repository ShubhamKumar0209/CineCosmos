import AppError from '../utils/AppError.js';
import logger from '../utils/logger.js';
import config from '../config/index.js';
import { HTTP_STATUS } from '../utils/constants.js';

/**
 * Handle Mongoose CastError (invalid ObjectId).
 */
const handleCastError = (err) => {
  const message = `Invalid value '${err.value}' for field '${err.path}'.`;
  return new AppError(message, HTTP_STATUS.BAD_REQUEST);
};

/**
 * Handle Mongoose duplicate key error (code 11000).
 */
const handleDuplicateKeyError = (err) => {
  const field = Object.keys(err.keyValue)[0];
  const message = `Duplicate value for '${field}': '${err.keyValue[field]}'. Please use a different value.`;
  return new AppError(message, HTTP_STATUS.CONFLICT);
};

/**
 * Handle Mongoose validation errors.
 */
const handleValidationError = (err) => {
  const messages = Object.values(err.errors).map((e) => e.message);
  const message = `Validation failed: ${messages.join('. ')}`;
  return new AppError(message, HTTP_STATUS.BAD_REQUEST);
};

/**
 * Handle invalid JWT errors.
 */
const handleJWTError = () =>
  new AppError('Invalid token. Please log in again.', HTTP_STATUS.UNAUTHORIZED);

/**
 * Handle expired JWT errors.
 */
const handleJWTExpiredError = () =>
  new AppError('Token has expired. Please log in again.', HTTP_STATUS.UNAUTHORIZED);

/**
 * Send detailed error response in development.
 */
const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack,
  });
};

/**
 * Send sanitized error response in production.
 * Only operational (expected) errors expose their message to the client.
 */
const sendErrorProd = (err, res) => {
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
  } else {
    // Programming / unknown errors — don't leak details
    logger.error('UNEXPECTED ERROR:', err);
    res.status(HTTP_STATUS.INTERNAL_SERVER).json({
      status: 'error',
      message: 'Something went wrong. Please try again later.',
    });
  }
};

/**
 * Centralized Express error-handling middleware.
 * Must have 4 parameters for Express to recognize it as an error handler.
 */
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, _next) => {
  err.statusCode = err.statusCode || HTTP_STATUS.INTERNAL_SERVER;
  err.status = err.status || 'error';

  logger.error(`${err.statusCode} - ${err.message} - ${req.originalUrl} - ${req.method} - ${req.ip}`);

  if (config.env === 'development') {
    sendErrorDev(err, res);
    return;
  }

  // Production: transform known error types into AppErrors
  let error = { ...err, message: err.message, name: err.name };

  if (error.name === 'CastError') error = handleCastError(error);
  if (error.code === 11000) error = handleDuplicateKeyError(error);
  if (error.name === 'ValidationError') error = handleValidationError(error);
  if (error.name === 'JsonWebTokenError') error = handleJWTError();
  if (error.name === 'TokenExpiredError') error = handleJWTExpiredError();

  sendErrorProd(error, res);
};

export default errorHandler;
