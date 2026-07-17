import Redis from 'ioredis';
import logger from '../utils/logger.js';
import config from './index.js';

let redisClient = null;

/**
 * Create and return a Redis client with retry strategy.
 * Returns the same instance on subsequent calls (singleton).
 */
const connectRedis = () => {
  if (redisClient) {
    return redisClient;
  }

  redisClient = new Redis(config.redis.url, {
    maxRetriesPerRequest: 3,
    retryStrategy(times) {
      if (times > 5) {
        logger.error('Redis max retries reached. Stopping reconnection.');
        return null; // stop retrying
      }
      const delay = Math.min(times * 1000, 5000);
      logger.info(`Redis reconnecting in ${delay}ms (attempt ${times})...`);
      return delay;
    },
    lazyConnect: false,
  });

  redisClient.on('connect', () => {
    logger.info('Redis client connected.');
  });

  redisClient.on('ready', () => {
    logger.info('Redis client ready.');
  });

  redisClient.on('error', (error) => {
    logger.error(`Redis client error: ${error.message}`);
  });

  redisClient.on('close', () => {
    logger.warn('Redis connection closed.');
  });

  return redisClient;
};

/**
 * Gracefully disconnect from Redis.
 */
const disconnectRedis = async () => {
  if (redisClient) {
    try {
      await redisClient.quit();
      redisClient = null;
      logger.info('Redis disconnected gracefully.');
    } catch (error) {
      logger.error(`Redis disconnect error: ${error.message}`);
    }
  }
};

/**
 * Get the current Redis client instance.
 * Throws if Redis has not been connected yet.
 */
const getRedisClient = () => {
  if (!redisClient) {
    throw new Error('Redis client not initialized. Call connectRedis() first.');
  }
  return redisClient;
};

export { connectRedis, disconnectRedis, getRedisClient };
