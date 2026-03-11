const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const config = {
  port: parseInt(process.env.PORT, 10) || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',

  email: {
    user: process.env.EMAIL_USER,
    appPassword: process.env.EMAIL_APP_PASSWORD,
    fromName: process.env.EMAIL_FROM_NAME || 'Abhishek Raj',
  },

  redis: {
    url: process.env.REDIS_URL || undefined,
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: parseInt(process.env.REDIS_PORT, 10) || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
  },

  emailLimits: {
    maxPerHour: parseInt(process.env.MAX_EMAILS_PER_HOUR, 10) || 50,
    maxPerDay: parseInt(process.env.MAX_EMAILS_PER_DAY, 10) || 80,
    minDelaySeconds: parseInt(process.env.MIN_DELAY_SECONDS, 10) || 30,
    maxDelaySeconds: parseInt(process.env.MAX_DELAY_SECONDS, 10) || 60,
  },

  upload: {
    maxResumeSizeMB: parseInt(process.env.MAX_RESUME_SIZE_MB, 10) || 5,
    uploadDir: process.env.UPLOAD_DIR || './uploads',
  },

  duplicateCheckDays: parseInt(process.env.DUPLICATE_CHECK_DAYS, 10) || 7,

  retry: {
    maxRetries: parseInt(process.env.MAX_RETRIES, 10) || 3,
    delays: [
      parseInt(process.env.RETRY_DELAY_1, 10) || 300000,
      parseInt(process.env.RETRY_DELAY_2, 10) || 900000,
      parseInt(process.env.RETRY_DELAY_3, 10) || 1800000,
    ],
  },
};

module.exports = config;
