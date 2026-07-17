import * as authService from './auth.service.js';
import { HTTP_STATUS, COOKIE_NAMES } from '../../utils/constants.js';
import config from '../../config/index.js';

const cookieOptions = {
  httpOnly: true,
  secure: config.env === 'production',
  sameSite: 'lax',
  path: '/',
};

// Convert string duration (e.g., '15m', '7d') to milliseconds
const getCookieMaxAge = (durationStr) => {
  const value = parseInt(durationStr);
  const unit = durationStr.slice(-1);
  if (unit === 'm') return value * 60 * 1000;
  if (unit === 'h') return value * 60 * 60 * 1000;
  if (unit === 'd') return value * 24 * 60 * 60 * 1000;
  return value; // fallback
};

/**
 * Helper to attach tokens to response cookies.
 */
const attachTokensToCookie = (res, accessToken, refreshToken) => {
  res.cookie(COOKIE_NAMES.ACCESS_TOKEN, accessToken, {
    ...cookieOptions,
    maxAge: getCookieMaxAge(config.jwt.expiresIn),
  });

  res.cookie(COOKIE_NAMES.REFRESH_TOKEN, refreshToken, {
    ...cookieOptions,
    maxAge: getCookieMaxAge(config.jwt.refreshExpiresIn),
  });
};

/**
 * Register user
 */
export const register = async (req, res) => {
  const user = await authService.registerUser(req.body);
  const { accessToken, refreshToken } = authService.generateTokens(user);

  attachTokensToCookie(res, accessToken, refreshToken);

  res.status(HTTP_STATUS.CREATED).json({
    status: 'success',
    data: { user },
  });
};

/**
 * Login user
 */
export const login = async (req, res) => {
  const { email, password } = req.body;
  const user = await authService.loginUser(email, password);
  const { accessToken, refreshToken } = authService.generateTokens(user);

  attachTokensToCookie(res, accessToken, refreshToken);

  res.status(HTTP_STATUS.OK).json({
    status: 'success',
    data: { user },
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

  res.cookie(COOKIE_NAMES.ACCESS_TOKEN, 'loggedout', {
    ...cookieOptions,
    maxAge: 10 * 1000, // expire in 10 seconds
  });
  res.cookie(COOKIE_NAMES.REFRESH_TOKEN, 'loggedout', {
    ...cookieOptions,
    maxAge: 10 * 1000,
  });

  res.status(HTTP_STATUS.OK).json({
    status: 'success',
    message: 'Logged out successfully',
  });
};

/**
 * Refresh access token
 */
export const refresh = async (req, res) => {
  const token = req.cookies[COOKIE_NAMES.REFRESH_TOKEN];
  const user = await authService.verifyRefreshToken(token);
  
  const { accessToken, refreshToken } = authService.generateTokens(user);
  attachTokensToCookie(res, accessToken, refreshToken);

  res.status(HTTP_STATUS.OK).json({
    status: 'success',
    data: { user },
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
