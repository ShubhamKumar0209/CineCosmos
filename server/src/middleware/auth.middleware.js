import jwt from 'jsonwebtoken';
import User from '../features/auth/user.model.js';
import AppError from '../utils/AppError.js';
import config from '../config/index.js';
import { HTTP_STATUS, COOKIE_NAMES } from '../utils/constants.js';
import asyncHandler from '../utils/asyncHandler.js';

/**
 * Middleware to protect routes.
 * Checks if the user is authenticated via Access Token.
 */
export const protect = asyncHandler(async (req, res, next) => {
  // 1. Get token from cookies
  const token = req.cookies[COOKIE_NAMES.ACCESS_TOKEN];

  if (!token || token === 'loggedout') {
    return next(new AppError('You are not logged in. Please log in to get access.', HTTP_STATUS.UNAUTHORIZED));
  }

  // 2. Verify token
  let decoded;
  try {
    decoded = jwt.verify(token, config.jwt.secret);
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return next(new AppError('Your token has expired. Please log in again or refresh.', HTTP_STATUS.UNAUTHORIZED));
    }
    return next(new AppError('Invalid token. Please log in again.', HTTP_STATUS.UNAUTHORIZED));
  }

  // 3. Check if user still exists
  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return next(new AppError('The user belonging to this token no longer exists.', HTTP_STATUS.UNAUTHORIZED));
  }

  // 4. Grant access to protected route
  req.user = currentUser;
  next();
});
