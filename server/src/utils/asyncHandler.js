/**
 * Wraps an async route handler to catch rejected promises
 * and forward them to Express's error handling middleware.
 *
 * Eliminates the need for try/catch blocks in every controller.
 *
 * Usage:
 *   router.get('/movies', asyncHandler(movieController.getAll));
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

export default asyncHandler;
