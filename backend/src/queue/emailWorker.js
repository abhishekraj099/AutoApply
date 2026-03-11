const { Worker } = require('bullmq');
const { redisConnection, addRetryEmailToQueue } = require('./campaignQueue');
const { sendEmail, isWithinBusinessHours } = require('../services/emailService');
const {
  CampaignModel,
  CampaignEmailModel,
  SendTrackingModel,
  EmailLogModel,
} = require('../database/models');
const config = require('../config');
const logger = require('../config/logger');

function startEmailWorker() {
  const worker = new Worker(
    'email-queue',
    async (job) => {
      const { campaignEmailId, campaignId, to, subject, body, resumePath, retryCount } = job.data;

      logger.info('Sending email', { campaignEmailId, to, retryCount });

      try {
        // Check business hours (9 AM – 7 PM)
        const { allowed, currentHour } = isWithinBusinessHours();
        if (!allowed) {
          // Calculate ms until 9 AM next window
          const hoursUntil9AM = currentHour >= 19 ? (24 - currentHour + 9) : (9 - currentHour);
          const delayMs = hoursUntil9AM * 60 * 60 * 1000;
          logger.warn('Outside business hours (9AM–7PM), deferring email', { currentHour, delayMs });
          await addRetryEmailToQueue(job.data, delayMs);
          return;
        }

        // Check hourly rate limit
        const sentLastHour = SendTrackingModel.getSentCountLastHour();
        if (sentLastHour >= config.emailLimits.maxPerHour) {
          logger.warn('Hourly rate limit reached, re-queuing', { sentLastHour });
          await addRetryEmailToQueue(job.data, 60000); // Retry in 1 minute
          return;
        }

        // Check daily limit
        const sentToday = SendTrackingModel.getSentCountToday();
        if (sentToday >= config.emailLimits.maxPerDay) {
          logger.warn('Daily rate limit reached', { sentToday });
          CampaignEmailModel.updateStatus(campaignEmailId, 'failed', { errorMessage: 'Daily email limit reached' });
          updateCampaignCounts(campaignId);
          EmailLogModel.create({
            campaign_email_id: campaignEmailId,
            campaign_id: campaignId,
            event: 'rate_limited',
            details: 'Daily email limit reached',
          });
          return;
        }

        // Check if campaign is still active
        const campaign = CampaignModel.getById(campaignId);
        if (!campaign || campaign.status === 'cancelled') {
          CampaignEmailModel.updateStatus(campaignEmailId, 'cancelled');
          return;
        }

        // Send the email
        const result = await sendEmail({ to, subject, body, resumePath });

        // Record success with SMTP message ID
        CampaignEmailModel.updateStatus(campaignEmailId, 'sent', {
          messageId: result.id,
        });
        SendTrackingModel.record(to);
        EmailLogModel.create({
          campaign_email_id: campaignEmailId,
          campaign_id: campaignId,
          event: 'sent',
          details: `Email sent to ${to} | messageId: ${result.id}`,
        });

        // Update campaign counts
        updateCampaignCounts(campaignId);

        logger.info('Email sent successfully', { campaignEmailId, to });
      } catch (error) {
        logger.error('Email sending failed', { campaignEmailId, to, error: error.message, retryCount });

        // Handle retries
        if (retryCount < config.retry.maxRetries) {
          const retryDelay = config.retry.delays[retryCount];
          CampaignEmailModel.incrementRetry(campaignEmailId);
          EmailLogModel.create({
            campaign_email_id: campaignEmailId,
            campaign_id: campaignId,
            event: 'retry',
            details: `Retry ${retryCount + 1}/${config.retry.maxRetries} after ${retryDelay / 1000}s — ${error.message}`,
          });

          await addRetryEmailToQueue(
            { ...job.data, retryCount: retryCount + 1 },
            retryDelay
          );
        } else {
          // Mark as failed after max retries
          CampaignEmailModel.updateStatus(campaignEmailId, 'failed', { errorMessage: error.message });
          EmailLogModel.create({
            campaign_email_id: campaignEmailId,
            campaign_id: campaignId,
            event: 'failed',
            details: `Failed after ${config.retry.maxRetries} retries: ${error.message}`,
          });
          updateCampaignCounts(campaignId);
        }
      }
    },
    {
      connection: redisConnection,
      concurrency: 1, // Process one email at a time for rate limiting
      limiter: {
        max: 1,
        duration: 1000,
      },
    }
  );

  worker.on('failed', (job, err) => {
    logger.error('Email job failed', { jobId: job?.id, error: err.message });
  });

  logger.info('Email worker started');
  return worker;
}

function updateCampaignCounts(campaignId) {
  const { queryOne } = require('../database/init');

  const sent = (queryOne("SELECT COUNT(*) as count FROM campaign_emails WHERE campaign_id = ? AND status = 'sent'", [campaignId]) || { count: 0 }).count;
  const failed = (queryOne("SELECT COUNT(*) as count FROM campaign_emails WHERE campaign_id = ? AND status = 'failed'", [campaignId]) || { count: 0 }).count;
  const pending = (queryOne("SELECT COUNT(*) as count FROM campaign_emails WHERE campaign_id = ? AND status = 'pending'", [campaignId]) || { count: 0 }).count;

  CampaignModel.update(campaignId, {
    sent_count: sent,
    failed_count: failed,
  });

  // If no more pending emails, mark campaign as completed
  if (pending === 0) {
    CampaignModel.update(campaignId, { status: 'completed' });
    EmailLogModel.create({
      campaign_id: campaignId,
      event: 'completed',
      details: `Campaign completed: ${sent} sent, ${failed} failed`,
    });
    logger.info('Campaign completed', { campaignId, sent, failed });
  }
}

module.exports = { startEmailWorker };
