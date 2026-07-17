import mongoose from 'mongoose';
import logger from '../utils/logger.js';
import config from './index.js';

const RETRY_DELAY_MS = 5000;
const MAX_RETRIES = 5;

/**
 * Connect to MongoDB with retry logic.
 * Retries up to MAX_RETRIES times with a delay between attempts.
 */
const connectDB = async () => {
  let retries = 0;

  while (retries < MAX_RETRIES) {
    try {
      const conn = await mongoose.connect(config.mongo.uri, {
        serverSelectionTimeoutMS: 5000,
      });

      logger.info(`MongoDB connected: ${conn.connection.host}:${conn.connection.port}/${conn.connection.name}`);
      return conn;
    } catch (error) {
      retries += 1;
      logger.error(`MongoDB connection attempt ${retries}/${MAX_RETRIES} failed: ${error.message}`);

      if (retries >= MAX_RETRIES) {
        logger.error('MongoDB max retries reached. Exiting process.');
        process.exit(1);
      }

      logger.info(`Retrying MongoDB connection in ${RETRY_DELAY_MS / 1000}s...`);
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
    }
  }
};

/**
 * Gracefully disconnect from MongoDB.
 */
const disconnectDB = async () => {
  try {
    await mongoose.disconnect();
    logger.info('MongoDB disconnected gracefully.');
  } catch (error) {
    logger.error(`MongoDB disconnect error: ${error.message}`);
  }
};

export { connectDB, disconnectDB };
