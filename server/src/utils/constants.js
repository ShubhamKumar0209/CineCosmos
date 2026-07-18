/**
 * Application-wide constants.
 * Centralizes magic strings and numbers to prevent typos and ease refactoring.
 */

export const USER_ROLES = Object.freeze({
  USER: 'user',
  ADMIN: 'admin',
});

export const BOOKING_STATUS = Object.freeze({
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
});

export const MOVIE_STATUS = Object.freeze({
  NOW_SHOWING: 'now_showing',
  COMING_SOON: 'coming_soon',
  ARCHIVED: 'archived',
});

export const COOKIE_NAMES = Object.freeze({
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
});

export const REDIS_PREFIXES = Object.freeze({
  SEAT_LOCK: 'seat-lock',
  RATE_LIMIT: 'rate-limit',
});

export const HTTP_STATUS = Object.freeze({
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER: 500,
  SERVICE_UNAVAILABLE: 503,
});

export const TMDB_CACHE_TTL_HOURS = 24;
