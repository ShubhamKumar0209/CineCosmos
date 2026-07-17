import { getRedisClient } from '../../config/redis.js';
import config from '../../config/index.js';
import { REDIS_PREFIXES } from '../../utils/constants.js';
import AppError from '../../utils/AppError.js';
import { HTTP_STATUS } from '../../utils/constants.js';

/**
 * Lock seats temporarily in Redis for a specific showtime.
 * Uses atomic MSET with TTL.
 */
export const lockSeats = async (showtimeId, seats, userId) => {
  const redis = getRedisClient();
  const lockedKeys = [];
  
  // First, check if any of the seats are already locked
  for (const seat of seats) {
    const key = `${REDIS_PREFIXES.SEAT_LOCK}:${showtimeId}:${seat.row}:${seat.col}`;
    const exists = await redis.exists(key);
    if (exists) {
      throw new AppError('One or more selected seats are already locked by another user.', HTTP_STATUS.CONFLICT);
    }
    lockedKeys.push(key);
  }

  // Lock them
  const multi = redis.multi();
  for (const key of lockedKeys) {
    multi.setex(key, config.seatLockTtl, userId.toString());
  }
  
  await multi.exec();
};

/**
 * Release seat locks in Redis (called if payment fails or user cancels).
 */
export const releaseLocks = async (showtimeId, seats) => {
  const redis = getRedisClient();
  const keys = seats.map((seat) => `${REDIS_PREFIXES.SEAT_LOCK}:${showtimeId}:${seat.row}:${seat.col}`);
  
  if (keys.length > 0) {
    await redis.del(...keys);
  }
};
