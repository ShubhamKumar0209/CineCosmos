/**
 * Custom application error class.
 *
 * Extends the native Error class to include:
 * - statusCode: HTTP status code to return
 * - status: 'fail' for 4xx, 'error' for 5xx
 * - isOperational: distinguishes expected errors from programming bugs
 *
 * Usage:
 *   throw new AppError('Movie not found', 404);
 */
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);

    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    // Capture stack trace, excluding this constructor from the trace
    Error.captureStackTrace(this, this.constructor);
  }
}

export default AppError;
