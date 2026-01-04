import winston from 'winston';

const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

export const logger = winston.createLogger({
  level: 'info',
  format: logFormat,
  defaultMeta: { service: 'readmint-backend' },
  transports: [
    // In Cloud Functions, use Console which maps to Cloud Logging
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

// Optionally add file logging only in dev if needed,
// but local dev usually likes console too.
// Keeping it simple: Console for all environments is safest for serverless.