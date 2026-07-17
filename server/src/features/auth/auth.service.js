import jwt from 'jsonwebtoken';
import User from './user.model.js';
import config from '../../config/index.js';
import AppError from '../../utils/AppError.js';
import { HTTP_STATUS } from '../../utils/constants.js';

/**
 * Generate Access and Refresh Tokens for a user.
 * 
 * @param {string} userId 
 * @returns {Object} { accessToken, refreshToken }
 */
export const generateTokens = (userId) => {
  const accessToken = jwt.sign({ id: userId }, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
  });

  const refreshToken = jwt.sign({ id: userId }, config.jwt.refreshSecret, {
    expiresIn: config.jwt.refreshExpiresIn,
  });

  return { accessToken, refreshToken };
};

/**
 * Register a new user.
 * 
 * @param {Object} userData { name, email, password }
 * @returns {Object} Newly created user (without password)
 */
export const registerUser = async (userData) => {
  const existingUser = await User.findOne({ email: userData.email });
  if (existingUser) {
    throw new AppError('Email is already in use', HTTP_STATUS.CONFLICT);
  }

  const user = await User.create({
    name: userData.name,
    email: userData.email,
    password: userData.password,
  });

  // Remove password from the returned object
  user.password = undefined;
  return user;
};

/**
 * Authenticate a user and return their data.
 * 
 * @param {string} email 
 * @param {string} password 
 * @returns {Object} Authenticated user (without password)
 */
export const loginUser = async (email, password) => {
  // Explicitly select password since it has select: false in schema
  const user = await User.findOne({ email }).select('+password');
  
  if (!user || !(await user.comparePassword(password))) {
    throw new AppError('Incorrect email or password', HTTP_STATUS.UNAUTHORIZED);
  }

  user.password = undefined;
  return user;
};

/**
 * Verify a refresh token and return the user.
 * 
 * @param {string} token 
 * @returns {Object} User
 */
export const verifyRefreshToken = async (token) => {
  if (!token) {
    throw new AppError('Refresh token is missing', HTTP_STATUS.UNAUTHORIZED);
  }

  const decoded = jwt.verify(token, config.jwt.refreshSecret);
  const user = await User.findById(decoded.id);

  if (!user) {
    throw new AppError('User no longer exists', HTTP_STATUS.UNAUTHORIZED);
  }

  return user;
};
