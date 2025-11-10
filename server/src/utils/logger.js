const winston = require('winston');
const path = require('path');

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Define colors for each level
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'blue',
};

winston.addColors(colors);

// Define the format for logs
const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.colorize({ all: true })
);

// Define which transports the logger must use
const transports = [
  // Console transport for development
  new winston.transports.Console({
    level: process.env.LOG_LEVEL || 'debug',
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    ),
  }),

  // File transport for all logs
  new winston.transports.File({
    filename: path.join(__dirname, '../../logs/all.log'),
    level: 'info',
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.json()
    ),
  }),

  // File transport for error logs
  new winston.transports.File({
    filename: path.join(__dirname, '../../logs/error.log'),
    level: 'error',
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.errors({ stack: true }),
      winston.format.json()
    ),
  }),

  // File transport for HTTP request logs
  new winston.transports.File({
    filename: path.join(__dirname, '../../logs/http.log'),
    level: 'http',
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.json()
    ),
  }),
];

// Create the logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  levels,
  format,
  transports,
  exitOnError: false,
});

// Create a stream object for Morgan HTTP logger
logger.stream = {
  write: (message) => {
    logger.http(message.trim());
  },
};

// Custom middleware for request logging
const requestLogger = (req, res, next) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.http(`${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms - ${req.ip}`);
  });

  next();
};

// Performance monitoring logger
const performanceLogger = (label, startTime, metadata = {}) => {
  const duration = Date.now() - startTime;
  logger.info(`Performance: ${label}`, {
    duration: `${duration}ms`,
    ...metadata,
  });
};

// Error logger with context
const errorLogger = (error, context = {}) => {
  logger.error('Application Error', {
    message: error.message,
    stack: error.stack,
    ...context,
  });
};

// Database operation logger
const dbLogger = (operation, collection, query = {}, result = null, error = null) => {
  const logData = {
    operation,
    collection,
    query: JSON.stringify(query),
  };

  if (error) {
    logData.error = error.message;
    logger.error('Database Error', logData);
  } else {
    logData.result = result ? 'success' : 'no result';
    logger.debug('Database Operation', logData);
  }
};

module.exports = {
  logger,
  requestLogger,
  performanceLogger,
  errorLogger,
  dbLogger,
};
