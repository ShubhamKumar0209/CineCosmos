import { jest } from '@jest/globals';
import * as authService from '../../src/features/auth/auth.service.js';
import User from '../../src/features/auth/user.model.js';
import AppError from '../../src/utils/AppError.js';
import jwt from 'jsonwebtoken';
import config from '../../src/config/index.js';

// Mock the dependencies
jest.mock('../../src/features/auth/user.model.js');
jest.mock('jsonwebtoken');

describe('Auth Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('generateTokens', () => {
    it('should return access and refresh tokens', () => {
      jwt.sign.mockReturnValueOnce('mockAccessToken').mockReturnValueOnce('mockRefreshToken');

      const tokens = authService.generateTokens('user123');

      expect(tokens).toEqual({
        accessToken: 'mockAccessToken',
        refreshToken: 'mockRefreshToken',
      });
      expect(jwt.sign).toHaveBeenCalledTimes(2);
    });
  });

  describe('registerUser', () => {
    it('should throw an error if email is already in use', async () => {
      User.findOne.mockResolvedValue({ email: 'test@test.com' });

      await expect(
        authService.registerUser({ name: 'Test', email: 'test@test.com', password: 'password123' })
      ).rejects.toThrow(AppError);
    });

    it('should create a new user and not return the password', async () => {
      User.findOne.mockResolvedValue(null);
      User.create.mockResolvedValue({
        _id: 'user123',
        name: 'Test',
        email: 'test@test.com',
        password: 'hashedPassword',
      });

      const user = await authService.registerUser({
        name: 'Test',
        email: 'test@test.com',
        password: 'password123',
      });

      expect(User.create).toHaveBeenCalledWith({
        name: 'Test',
        email: 'test@test.com',
        password: 'password123',
      });
      expect(user.password).toBeUndefined();
    });
  });
});
