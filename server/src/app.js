import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import hpp from 'hpp';
import cookieParser from 'cookie-parser';
import mongoSanitize from 'express-mongo-sanitize';
import config from './config/index.js';
import errorHandler from './middleware/errorHandler.js';
import createRateLimiter from './middleware/rateLimiter.js';
import AppError from './utils/AppError.js';
import { HTTP_STATUS } from './utils/constants.js';
import authRoutes from './features/auth/auth.routes.js';
import cityRoutes from './features/city/city.routes.js';
import theaterRoutes from './features/theater/theater.routes.js';
import movieRoutes from './features/movie/movie.routes.js';
import showtimeRoutes from './features/showtime/showtime.routes.js';
import bookingRoutes from './features/booking/booking.routes.js';

/**
 * Create and configure the Express application.
 *
 * Middleware stack (in order):
 * 1. Helmet — Security headers
 * 2. CORS — Cross-origin resource sharing
 * 3. Rate Limiter — Abuse prevention (Redis-backed)
 * 4. JSON & URL-encoded body parsers
 * 5. Cookie Parser — Parse httpOnly cookies for JWT
 * 6. HPP — HTTP parameter pollution protection
 * 7. Mongo Sanitize — Prevent NoSQL injection
 * 8. Routes (mounted externally)
 * 9. 404 handler
 * 10. Centralized error handler
 */
const createApp = () => {
  const app = express();

  // ── Security Headers ──────────────────────────────────────
  app.use(helmet());

  // ── CORS ──────────────────────────────────────────────────
  app.use(
    cors({
      origin: config.clientUrl,
      credentials: true, // Allow cookies
    })
  );

  // ── Health Check ──────────────────────────────────────────
  app.get('/api/health', (req, res) => {
    res.status(HTTP_STATUS.OK).json({
      status: 'success',
      message: 'Server is running',
      timestamp: new Date().toISOString(),
      environment: config.env,
    });
  });

  // ── Rate Limiting ─────────────────────────────────────────
  app.use('/api', createRateLimiter());

  // ── Body Parsing ──────────────────────────────────────────
  app.use(express.json({ limit: '10kb' }));
  app.use(express.urlencoded({ extended: true, limit: '10kb' }));

  // ── Cookie Parser ─────────────────────────────────────────
  app.use(cookieParser());

  // ── HTTP Parameter Pollution Protection ───────────────────
  app.use(hpp());

  // ── NoSQL Injection Prevention ────────────────────────────
  app.use(mongoSanitize());

  // ── Temporary Seed Trigger ────────────────────────────────
  app.get('/api/trigger-seed', (req, res) => {
    res.json({ message: 'Triggering seeder in background...' });
    import('./seed-infra.js').catch(console.error);
  });

  // ── API Routes (mounted in server.js after DB connection) ─
  app.use('/api/auth', authRoutes);
  app.use('/api/cities', cityRoutes);
  app.use('/api/movies', movieRoutes);
  app.use('/api/theaters', theaterRoutes);
  app.use('/api/showtimes', showtimeRoutes);
  app.use('/api/bookings', bookingRoutes);

  // ── 404 Handler ───────────────────────────────────────────
  app.all('*', (req, res, next) => {
    next(new AppError(`Cannot find ${req.method} ${req.originalUrl} on this server.`, HTTP_STATUS.NOT_FOUND));
  });

  // ── Centralized Error Handler ─────────────────────────────
  app.use(errorHandler);

  return app;
};

export default createApp;
