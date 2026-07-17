import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { getRedisClient } from '../config/redis.js';
import config from '../config/index.js';
import { HTTP_STATUS } from '../utils/constants.js';

/**
 * Create a rate limiter middleware backed by Redis.
 *
 * Uses Redis as the store so rate limits are shared across
 * multiple server instances (horizontal scaling).
 *
 * @param {object} options - Override default rate limit settings.
 * @returns {Function} Express rate-limiting middleware.
 */
const createRateLimiter = (options = {}) => {
  // ── Bypass Rate Limiter entirely in development to prevent 429 errors ──
  if (config.env === 'development') {
    return (req, res, next) => next();
  }

  const redisClient = getRedisClient();

  return rateLimit({
    windowMs: options.windowMs || config.rateLimit.windowMs,
    max: options.max || config.rateLimit.maxRequests,
    standardHeaders: true,  
    legacyHeaders: false,   
    passOnStoreError: true, 
    store: new RedisStore({
      sendCommand: (...args) => redisClient.call(...args),
    }),
    message: {
      status: 'fail',
      message: 'Too many requests. Please try again later.',
    },
    statusCode: HTTP_STATUS.TOO_MANY_REQUESTS,
    ...options,
  });
};

export default createRateLimiter;
