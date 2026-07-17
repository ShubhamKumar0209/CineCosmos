import * as authService from './auth.service.js';
import { HTTP_STATUS, COOKIE_NAMES } from '../../utils/constants.js';
import config from '../../config/index.js';

// Tokens are now returned in JSON payload to support mobile browsers (Safari ITP bypass)

/**
 * Register user
 */
export const register = async (req, res) => {
  const user = await authService.registerUser(req.body);
  const { accessToken, refreshToken } = authService.generateTokens(user);

  res.status(HTTP_STATUS.CREATED).json({
    status: 'success',
    data: { user, accessToken, refreshToken },
  });
};

/**
 * Login user
 */
export const login = async (req, res) => {
  const { email, password } = req.body;
  const user = await authService.loginUser(email, password);
  const { accessToken, refreshToken } = authService.generateTokens(user);

  res.status(HTTP_STATUS.OK).json({
    status: 'success',
    data: { user, accessToken, refreshToken },
  });
};

/**
 * Logout user
 */
export const logout = async (req, res) => {
  if (req.user) {
    req.user.tokenVersion = (req.user.tokenVersion || 0) + 1;
    await req.user.save();
  }

  // Cookies are no longer set, so we don't need to clear them here.
  // The frontend handles clearing localStorage.

  res.status(HTTP_STATUS.OK).json({
    status: 'success',
    message: 'Logged out successfully',
  });
};

/**
 * Refresh access token
 */
export const refresh = async (req, res) => {
  const token = req.body.refreshToken;
  const user = await authService.verifyRefreshToken(token);
  
  const { accessToken, refreshToken } = authService.generateTokens(user);

  res.status(HTTP_STATUS.OK).json({
    status: 'success',
    data: { user, accessToken, refreshToken },
  });
};

/**
 * Get current user details
 */
export const getMe = (req, res) => {
  res.status(HTTP_STATUS.OK).json({
    status: 'success',
    data: { user: req.user },
  });
};
