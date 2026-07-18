import config from './config/index.js';
import { connectDB, disconnectDB } from './config/db.js';
import { connectRedis, disconnectRedis } from './config/redis.js';
import createApp from './app.js';
import logger from './utils/logger.js';

/**
 * Bootstrap the server:
 * 1. Connect to MongoDB (with retries)
 * 2. Connect to Redis (with retries)
 * 3. Create Express app
 * 4. Start listening
 * 5. Register graceful shutdown handlers
 */
const startServer = async () => {
  try {
    // ── Connect to databases ──────────────────────────────────
    await connectDB();
    connectRedis();

    // ── Create and start Express app ──────────────────────────
    const app = createApp();

    const server = app.listen(config.port, () => {
      logger.info(`Server running in ${config.env} mode on port ${config.port}`);
    });

    // ── Automatic Movie Fetching & Showtime Generation (Runs every 24 hours) ────────
    // We dynamically import to avoid circular dependencies at startup
    Promise.all([
      import('./features/movie/movie.service.js'),
      import('./features/showtime/showtime.service.js')
    ]).then(([{ syncMoviesFromTMDB, promoteAndRotateMovies }, { generateRollingShowtimes }]) => {
      const ONE_DAY_MS = 24 * 60 * 60 * 1000;
      
      const runDailyTasks = async () => {
        try {
          logger.info('Running scheduled TMDB sync to fetch new movies...');
          await syncMoviesFromTMDB();
          
          logger.info('Running movie promotion and rotation...');
          await promoteAndRotateMovies();

          logger.info('Running rolling showtime generator...');
          await generateRollingShowtimes();
        } catch (err) {
          logger.error('Scheduled tasks failed:', err);
        }
      };

      // Run interval
      setInterval(runDailyTasks, ONE_DAY_MS);
    });

    // ── Graceful Shutdown ─────────────────────────────────────
    const gracefulShutdown = async (signal) => {
      logger.info(`${signal} received. Starting graceful shutdown...`);

      server.close(async () => {
        logger.info('HTTP server closed.');

        await disconnectDB();
        await disconnectRedis();

        logger.info('All connections closed. Exiting process.');
        process.exit(0);
      });

      // Force exit if graceful shutdown takes too long
      setTimeout(() => {
        logger.error('Graceful shutdown timed out. Forcing exit.');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason) => {
      logger.error('UNHANDLED REJECTION:', reason);
      gracefulShutdown('UNHANDLED_REJECTION');
    });

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      logger.error('UNCAUGHT EXCEPTION:', error);
      gracefulShutdown('UNCAUGHT_EXCEPTION');
    });
  } catch (error) {
    logger.error(`Failed to start server: ${error.message}`);
    process.exit(1);
  }
};

startServer();
