const { Worker } = require('bullmq');
const { redisConnection, addEmailToQueue } = require('./campaignQueue');
const {
  CampaignModel,
  CampaignEmailModel,
  ResumeModel,
  SendTrackingModel,
  EmailLogModel,
} = require('../database/models');
const config = require('../config');
const logger = require('../config/logger');

function getRandomDelay() {
  const min = config.emailLimits.minDelaySeconds * 1000;
  const max = config.emailLimits.maxDelaySeconds * 1000;
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function startCampaignWorker() {
  const worker = new Worker(
    'campaign-queue',
    async (job) => {
      const { campaignId } = job.data;
      logger.info('Processing campaign', { campaignId });

      try {
        const campaign = CampaignModel.getById(campaignId);
        if (!campaign) {
          logger.error('Campaign not found', { campaignId });
          return;
        }

        if (campaign.status === 'cancelled') {
          logger.info('Campaign was cancelled, skipping', { campaignId });
          return;
        }

        // Update campaign status to running
        CampaignModel.update(campaignId, { status: 'running' });
        EmailLogModel.create({
          campaign_id: campaignId,
          event: 'started',
          details: 'Campaign processing started',
        });

        // Get pending emails
        const pendingEmails = CampaignEmailModel.getPending(campaignId);
        if (pendingEmails.length === 0) {
          CampaignModel.update(campaignId, { status: 'completed' });
          return;
        }

        // Get resume path if applicable
        let resumePath = null;
        if (campaign.resume_id) {
          const resume = ResumeModel.getById(campaign.resume_id);
          if (resume) resumePath = resume.file_path;
        }

        // Queue individual emails with staggered delays
        let cumulativeDelay = 0;

        for (let i = 0; i < pendingEmails.length; i++) {
          const email = pendingEmails[i];

          // Check duplicate prevention
          if (SendTrackingModel.wasSentRecently(email.to_email, config.duplicateCheckDays)) {
            CampaignEmailModel.updateStatus(email.id, 'failed', { errorMessage: 'Duplicate: email sent to this address recently' });
            CampaignModel.update(campaignId, { failed_count: campaign.failed_count + 1 });
            EmailLogModel.create({
              campaign_email_id: email.id,
              campaign_id: campaignId,
              event: 'skipped_duplicate',
              details: `Skipped duplicate email to ${email.to_email}`,
            });
            continue;
          }

          const emailJobData = {
            campaignEmailId: email.id,
            campaignId,
            to: email.to_email,
            subject: email.subject,
            body: email.body,
            resumePath,
            retryCount: 0,
          };

          await addEmailToQueue(emailJobData, cumulativeDelay);
          cumulativeDelay += getRandomDelay();
        }

        logger.info('All emails queued for campaign', {
          campaignId,
          emailCount: pendingEmails.length,
          totalDelay: `${Math.round(cumulativeDelay / 1000)}s`,
        });
      } catch (error) {
        logger.error('Campaign processing failed', { campaignId, error: error.message });
        CampaignModel.update(campaignId, { status: 'failed' });
        EmailLogModel.create({
          campaign_id: campaignId,
          event: 'error',
          details: error.message,
        });
      }
    },
    { connection: redisConnection, concurrency: 1 }
  );

  worker.on('failed', (job, err) => {
    logger.error('Campaign job failed', { jobId: job?.id, error: err.message });
  });

  logger.info('Campaign worker started');
  return worker;
}

module.exports = { startCampaignWorker };
