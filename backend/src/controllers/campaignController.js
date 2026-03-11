const {
  CampaignModel,
  CampaignEmailModel,
  EmailListModel,
  TemplateModel,
  ResumeModel,
  SendTrackingModel,
  EmailLogModel,
} = require('../database/models');
const { validationResult } = require('express-validator');
const { addCampaignToQueue } = require('../queue/campaignQueue');
const { sendTestEmail } = require('../services/emailService');
const config = require('../config');
const logger = require('../config/logger');

function personalize(text, data) {
  if (!text) return text;
  return text
    .replace(/\{\{name\}\}/gi, data.name || '')
    .replace(/\{\{company\}\}/gi, data.company || '');
}

class CampaignController {
  static async getAll(req, res) {
    try {
      const campaigns = CampaignModel.getAll();
      res.json(campaigns);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async getById(req, res) {
    try {
      const campaign = CampaignModel.getById(req.params.id);
      if (!campaign) return res.status(404).json({ error: 'Campaign not found' });
      res.json(campaign);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async create(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

      const { name, mode, template_id, email_list_id, resume_id, subject, body, scheduled_at, custom_emails } = req.body;

      // Create the campaign
      const campaign = CampaignModel.create({
        name,
        mode,
        template_id,
        email_list_id,
        resume_id,
        subject,
        body,
        scheduled_at,
      });

      // Prepare individual emails
      const emailsToCreate = [];

      if (mode === 'bulk' && email_list_id) {
        const list = EmailListModel.getById(email_list_id);
        if (!list || !list.contacts || list.contacts.length === 0) {
          return res.status(400).json({ error: 'Email list is empty or not found' });
        }

        const templateSubject = subject || (template_id ? TemplateModel.getById(template_id)?.subject : '');
        const templateBody = body || (template_id ? TemplateModel.getById(template_id)?.body : '');

        for (const contact of list.contacts) {
          emailsToCreate.push({
            campaign_id: campaign.id,
            to_email: contact.email,
            to_name: contact.name,
            company: contact.company,
            subject: personalize(templateSubject, { name: contact.name, company: contact.company }),
            body: personalize(templateBody, { name: contact.name, company: contact.company }),
          });
        }
      } else if (mode === 'custom' && custom_emails) {
        for (const ce of custom_emails) {
          emailsToCreate.push({
            campaign_id: campaign.id,
            to_email: ce.email,
            to_name: ce.name,
            company: ce.company,
            subject: personalize(ce.subject || subject, { name: ce.name, company: ce.company }),
            body: personalize(ce.body || body, { name: ce.name, company: ce.company }),
          });
        }
      }

      if (emailsToCreate.length > 0) {
        CampaignEmailModel.createBatch(emailsToCreate);
        CampaignModel.update(campaign.id, { total_emails: emailsToCreate.length });
      }

      const fullCampaign = CampaignModel.getById(campaign.id);
      res.status(201).json(fullCampaign);
    } catch (error) {
      logger.error('Campaign creation failed', { error: error.message });
      res.status(500).json({ error: error.message });
    }
  }

  static async update(req, res) {
    try {
      const existing = CampaignModel.getById(req.params.id);
      if (!existing) return res.status(404).json({ error: 'Campaign not found' });
      if (existing.status !== 'draft') {
        return res.status(400).json({ error: 'Can only edit draft campaigns' });
      }

      const updated = CampaignModel.update(req.params.id, req.body);
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async delete(req, res) {
    try {
      const existing = CampaignModel.getById(req.params.id);
      if (!existing) return res.status(404).json({ error: 'Campaign not found' });
      if (existing.status === 'running') {
        return res.status(400).json({ error: 'Cannot delete a running campaign' });
      }

      CampaignModel.delete(req.params.id);
      res.json({ message: 'Campaign deleted' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async schedule(req, res) {
    try {
      const campaign = CampaignModel.getById(req.params.id);
      if (!campaign) return res.status(404).json({ error: 'Campaign not found' });
      if (campaign.status !== 'draft') {
        return res.status(400).json({ error: 'Can only schedule draft campaigns' });
      }
      if (!campaign.emails || campaign.emails.length === 0) {
        return res.status(400).json({ error: 'Campaign has no emails to send' });
      }

      const scheduledAt = req.body.scheduled_at || campaign.scheduled_at;
      if (!scheduledAt) {
        return res.status(400).json({ error: 'Scheduled time is required' });
      }

      // Smart send window warning
      const scheduledDate = new Date(scheduledAt);
      const hour = scheduledDate.getHours();
      let warning = null;
      if (!((hour >= 8 && hour < 10) || (hour >= 13 && hour < 15))) {
        warning = 'Warning: Scheduling outside recommended send windows (8-10 AM, 1-3 PM). Emails may have lower engagement.';
      }

      // Check daily limit
      const sentToday = SendTrackingModel.getSentCountToday();
      const pendingCount = campaign.emails.filter((e) => e.status === 'pending').length;
      if (sentToday + pendingCount > config.emailLimits.maxPerDay) {
        return res.status(400).json({
          error: `Daily limit would be exceeded. Sent today: ${sentToday}, Pending: ${pendingCount}, Limit: ${config.emailLimits.maxPerDay}`,
        });
      }

      CampaignModel.update(campaign.id, {
        status: 'scheduled',
        scheduled_at: scheduledAt,
      });

      // Add to queue
      await addCampaignToQueue(campaign.id, scheduledAt);

      EmailLogModel.create({
        campaign_id: campaign.id,
        event: 'scheduled',
        details: `Campaign scheduled for ${scheduledAt}`,
      });

      const updated = CampaignModel.getById(campaign.id);
      res.json({ campaign: updated, warning });
    } catch (error) {
      logger.error('Campaign scheduling failed', { error: error.message });
      res.status(500).json({ error: error.message });
    }
  }

  static async cancel(req, res) {
    try {
      const campaign = CampaignModel.getById(req.params.id);
      if (!campaign) return res.status(404).json({ error: 'Campaign not found' });
      if (!['scheduled', 'running'].includes(campaign.status)) {
        return res.status(400).json({ error: 'Can only cancel scheduled or running campaigns' });
      }

      CampaignModel.update(campaign.id, { status: 'cancelled' });

      // Cancel pending emails
      const { runSql } = require('../database/init');
      runSql("UPDATE campaign_emails SET status = 'cancelled' WHERE campaign_id = ? AND status = 'pending'", [campaign.id]);

      EmailLogModel.create({
        campaign_id: campaign.id,
        event: 'cancelled',
        details: 'Campaign cancelled by user',
      });

      const updated = CampaignModel.getById(campaign.id);
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async preview(req, res) {
    try {
      const campaign = CampaignModel.getById(req.params.id);
      if (!campaign) return res.status(404).json({ error: 'Campaign not found' });

      const previewEmails = (campaign.emails || []).slice(0, 5).map((e) => ({
        to_email: e.to_email,
        to_name: e.to_name,
        company: e.company,
        subject: e.subject,
        body: e.body,
      }));

      let resumeInfo = null;
      if (campaign.resume_id) {
        resumeInfo = ResumeModel.getById(campaign.resume_id);
      }

      res.json({
        campaign_name: campaign.name,
        mode: campaign.mode,
        total_emails: campaign.total_emails,
        scheduled_at: campaign.scheduled_at,
        resume: resumeInfo ? { name: resumeInfo.original_name, size: resumeInfo.file_size } : null,
        sample_emails: previewEmails,
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async sendTest(req, res) {
    try {
      const { test_email } = req.body;
      if (!test_email) return res.status(400).json({ error: 'Test email address is required' });

      const campaign = CampaignModel.getById(req.params.id);
      if (!campaign) return res.status(404).json({ error: 'Campaign not found' });

      const sampleEmail = campaign.emails && campaign.emails[0];
      const subject = sampleEmail ? sampleEmail.subject : campaign.subject || 'Test Email';
      const body = sampleEmail ? sampleEmail.body : campaign.body || 'This is a test email.';

      let resumePath = null;
      if (campaign.resume_id) {
        const resume = ResumeModel.getById(campaign.resume_id);
        if (resume) resumePath = resume.file_path;
      }

      await sendTestEmail(test_email, subject, body, resumePath);
      res.json({ message: 'Test email sent successfully' });
    } catch (error) {
      logger.error('Test email failed', { error: error.message });
      res.status(500).json({ error: error.message });
    }
  }

  static async getLogs(req, res) {
    try {
      const logs = EmailLogModel.getByCampaign(req.params.id);
      res.json(logs);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async getHistory(req, res) {
    try {
      const { queryOne, queryAll } = require('../database/init');
      const page = parseInt(req.query.page, 10) || 1;
      const limit = parseInt(req.query.limit, 10) || 50;
      const offset = (page - 1) * limit;

      const total = (queryOne('SELECT COUNT(*) as count FROM campaign_emails') || { count: 0 }).count;

      const emails = queryAll(`
        SELECT ce.*, c.name as campaign_name
        FROM campaign_emails ce
        JOIN campaigns c ON ce.campaign_id = c.id
        ORDER BY ce.created_at DESC
        LIMIT ? OFFSET ?
      `, [limit, offset]);

      res.json({
        emails,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = CampaignController;
