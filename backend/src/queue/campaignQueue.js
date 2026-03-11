const { Queue, Worker, QueueEvents } = require('bullmq');
const config = require('../config');
const logger = require('../config/logger');

const redisConnection = {
  host: config.redis.host,
  port: config.redis.port,
  password: config.redis.password,
  maxRetriesPerRequest: null,
};

// Campaign queue — schedules the campaign start
const campaignQueue = new Queue('campaign-queue', { connection: redisConnection });

// Email queue — individual email sending jobs
const emailQueue = new Queue('email-queue', { connection: redisConnection });

async function addCampaignToQueue(campaignId, scheduledAt) {
  const delay = Math.max(0, new Date(scheduledAt).getTime() - Date.now());

  await campaignQueue.add(
    'process-campaign',
    { campaignId },
    {
      delay,
      jobId: `campaign-${campaignId}`,
      removeOnComplete: true,
      removeOnFail: false,
    }
  );

  logger.info('Campaign added to queue', { campaignId, delay, scheduledAt });
}

async function addEmailToQueue(emailJobData, delay = 0) {
  await emailQueue.add('send-email', emailJobData, {
    delay,
    attempts: 1, // We handle retries manually
    removeOnComplete: true,
    removeOnFail: false,
  });
}

async function addRetryEmailToQueue(emailJobData, retryDelay) {
  await emailQueue.add('send-email', emailJobData, {
    delay: retryDelay,
    attempts: 1,
    removeOnComplete: true,
    removeOnFail: false,
  });
}

module.exports = {
  campaignQueue,
  emailQueue,
  redisConnection,
  addCampaignToQueue,
  addEmailToQueue,
  addRetryEmailToQueue,
};
