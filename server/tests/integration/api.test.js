import request from 'supertest';
import { jest } from '@jest/globals';
import createApp from '../../src/app.js';
import { connectRedis, disconnectRedis } from '../../src/config/redis.js';

// Mock Redis connection so it doesn't crash if Redis is unavailable in CI
jest.mock('ioredis', () => {
  return jest.fn().mockImplementation(() => {
    return {
      on: jest.fn(),
      get: jest.fn(),
      set: jest.fn(),
      quit: jest.fn().mockResolvedValue(true),
      call: jest.fn(),
      defineCommand: jest.fn(),
    };
  });
});

// Mock Mongoose connection
jest.mock('mongoose', () => {
  return {
    connect: jest.fn().mockResolvedValue(true),
    connection: {
      on: jest.fn(),
      close: jest.fn(),
    },
    Schema: class {},
    model: jest.fn(),
  };
});

describe('API Integration Tests', () => {
  let app;

  beforeAll(() => {
    // Set environment to test
    process.env.NODE_ENV = 'test';
    connectRedis();
    app = createApp();
  });

  afterAll(async () => {
    await disconnectRedis();
  });

  describe('GET /api/health', () => {
    it('should return 200 OK and server status', async () => {
      const res = await request(app).get('/api/health');
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('status', 'success');
      expect(res.body).toHaveProperty('message', 'Server is running');
    });
  });

  describe('404 Handler', () => {
    it('should return 404 for unknown routes', async () => {
      const res = await request(app).get('/api/unknown-route-xyz');
      expect(res.statusCode).toEqual(404);
      expect(res.body).toHaveProperty('status', 'fail');
      expect(res.body.message).toMatch(/Cannot find/);
    });
  });
});
