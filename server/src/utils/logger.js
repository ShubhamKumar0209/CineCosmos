import winston from 'winston';
import config from '../config/index.js';

const { combine, timestamp, printf, colorize, errors } = winston.format;

/**
 * Custom log format for readable console output.
 */
const devFormat = printf(({ level, message, timestamp: ts, stack }) => {
  return `${ts} [${level}]: ${stack || message}`;
});

/**
 * JSON format for production (structured logging for log aggregation).
 */
const prodFormat = combine(
  timestamp(),
  errors({ stack: true }),
  winston.format.json()
);

/**
 * Winston logger instance.
 * - Development: colorized, readable console output.
 * - Production: JSON-structured output for log aggregation.
 */
const logger = winston.createLogger({
  level: config.env === 'development' ? 'debug' : 'info',
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    errors({ stack: true })
  ),
  defaultMeta: { service: 'ticket-booking-api' },
  transports: [
    new winston.transports.Console({
      format:
        config.env === 'development'
          ? combine(colorize(), devFormat)
          : prodFormat,
    }),
  ],
});

export default logger;
