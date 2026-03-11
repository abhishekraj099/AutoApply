const { queryOne, queryAll } = require('../database/init');
const { CampaignModel, CampaignEmailModel, SendTrackingModel } = require('../database/models');

class DashboardController {
  static async getStats(req, res) {
    try {
      const totalSent = (queryOne("SELECT COUNT(*) as count FROM campaign_emails WHERE status = 'sent'") || { count: 0 }).count;
      const scheduledCampaigns = (queryOne("SELECT COUNT(*) as count FROM campaigns WHERE status = 'scheduled'") || { count: 0 }).count;
      const pendingEmails = (queryOne("SELECT COUNT(*) as count FROM campaign_emails WHERE status = 'pending'") || { count: 0 }).count;
      const failedEmails = (queryOne("SELECT COUNT(*) as count FROM campaign_emails WHERE status = 'failed'") || { count: 0 }).count;
      const runningCampaigns = (queryOne("SELECT COUNT(*) as count FROM campaigns WHERE status = 'running'") || { count: 0 }).count;
      const completedCampaigns = (queryOne("SELECT COUNT(*) as count FROM campaigns WHERE status = 'completed'") || { count: 0 }).count;
      const totalCampaigns = (queryOne('SELECT COUNT(*) as count FROM campaigns') || { count: 0 }).count;

      const sentToday = SendTrackingModel.getSentCountToday();
      const sentLastHour = SendTrackingModel.getSentCountLastHour();

      const recentCampaigns = queryAll(`
        SELECT c.id, c.name, c.status, c.total_emails, c.sent_count, c.failed_count, c.scheduled_at, c.created_at
        FROM campaigns c
        ORDER BY c.created_at DESC
        LIMIT 5
      `);

      const recentEmails = queryAll(`
        SELECT ce.to_email, ce.company, ce.status, ce.sent_at, c.name as campaign_name
        FROM campaign_emails ce
        JOIN campaigns c ON ce.campaign_id = c.id
        ORDER BY ce.created_at DESC
        LIMIT 10
      `);

      res.json({
        stats: {
          totalSent,
          scheduledCampaigns,
          pendingEmails,
          failedEmails,
          runningCampaigns,
          completedCampaigns,
          totalCampaigns,
          sentToday,
          sentLastHour,
        },
        recentCampaigns,
        recentEmails,
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = DashboardController;
