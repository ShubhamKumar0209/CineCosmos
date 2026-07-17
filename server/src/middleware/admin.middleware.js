import AppError from '../utils/AppError.js';
import { HTTP_STATUS, USER_ROLES } from '../utils/constants.js';

/**
 * Middleware to restrict route access to Admin users only.
 * MUST be used after the `protect` middleware (which sets req.user).
 */
export const restrictToAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== USER_ROLES.ADMIN) {
    return next(new AppError('You do not have permission to perform this action', HTTP_STATUS.FORBIDDEN));
  }
  next();
};
