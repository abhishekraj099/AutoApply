const { queryAll, queryOne, runSql, getLastInsertId } = require('./init');

class TemplateModel {
  static getAll() {
    return queryAll('SELECT * FROM email_templates ORDER BY updated_at DESC');
  }

  static getById(id) {
    return queryOne('SELECT * FROM email_templates WHERE id = ?', [id]);
  }

  static create({ name, subject, body }) {
    runSql('INSERT INTO email_templates (name, subject, body) VALUES (?, ?, ?)', [name, subject, body]);
    const id = getLastInsertId();
    return this.getById(id);
  }

  static update(id, { name, subject, body }) {
    runSql('UPDATE email_templates SET name = ?, subject = ?, body = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [name, subject, body, id]);
    return this.getById(id);
  }

  static delete(id) {
    runSql('DELETE FROM email_templates WHERE id = ?', [id]);
  }
}

class EmailListModel {
  static getAll() {
    const lists = queryAll('SELECT * FROM email_lists ORDER BY updated_at DESC');
    return lists.map((list) => {
      const count = queryOne('SELECT COUNT(*) as count FROM email_contacts WHERE list_id = ?', [list.id]);
      return { ...list, contact_count: count ? count.count : 0 };
    });
  }

  static getById(id) {
    const list = queryOne('SELECT * FROM email_lists WHERE id = ?', [id]);
    if (!list) return null;
    const contacts = queryAll('SELECT * FROM email_contacts WHERE list_id = ? ORDER BY id ASC', [id]);
    return { ...list, contacts };
  }

  static create({ name, description }) {
    runSql('INSERT INTO email_lists (name, description) VALUES (?, ?)', [name, description || null]);
    return this.getById(getLastInsertId());
  }

  static update(id, { name, description }) {
    runSql('UPDATE email_lists SET name = ?, description = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [name, description || null, id]);
    return this.getById(id);
  }

  static delete(id) {
    runSql('DELETE FROM email_contacts WHERE list_id = ?', [id]);
    runSql('DELETE FROM email_lists WHERE id = ?', [id]);
  }

  static addContact(listId, { email, name, company }) {
    runSql('INSERT INTO email_contacts (list_id, email, name, company) VALUES (?, ?, ?, ?)', [listId, email, name || null, company || null]);
    return queryOne('SELECT * FROM email_contacts WHERE id = ?', [getLastInsertId()]);
  }

  static addContacts(listId, contacts) {
    for (const c of contacts) {
      runSql('INSERT INTO email_contacts (list_id, email, name, company) VALUES (?, ?, ?, ?)', [listId, c.email, c.name || null, c.company || null]);
    }
    return this.getById(listId);
  }

  static removeContact(contactId) {
    runSql('DELETE FROM email_contacts WHERE id = ?', [contactId]);
  }
}

class ResumeModel {
  static getAll() {
    return queryAll('SELECT * FROM resumes ORDER BY created_at DESC');
  }

  static getById(id) {
    return queryOne('SELECT * FROM resumes WHERE id = ?', [id]);
  }

  static getDefault() {
    return queryOne('SELECT * FROM resumes WHERE is_default = 1');
  }

  static create({ original_name, file_path, file_size, mime_type }) {
    runSql('INSERT INTO resumes (original_name, file_path, file_size, mime_type) VALUES (?, ?, ?, ?)', [original_name, file_path, file_size, mime_type || 'application/pdf']);
    return this.getById(getLastInsertId());
  }

  static setDefault(id) {
    runSql('UPDATE resumes SET is_default = 0');
    runSql('UPDATE resumes SET is_default = 1 WHERE id = ?', [id]);
    return this.getById(id);
  }

  static delete(id) {
    const resume = this.getById(id);
    if (resume) {
      const fs = require('fs');
      if (fs.existsSync(resume.file_path)) {
        fs.unlinkSync(resume.file_path);
      }
    }
    runSql('DELETE FROM resumes WHERE id = ?', [id]);
  }
}

class CampaignModel {
  static getAll() {
    return queryAll(`
      SELECT c.*, t.name as template_name, el.name as list_name, r.original_name as resume_name
      FROM campaigns c
      LEFT JOIN email_templates t ON c.template_id = t.id
      LEFT JOIN email_lists el ON c.email_list_id = el.id
      LEFT JOIN resumes r ON c.resume_id = r.id
      ORDER BY c.created_at DESC
    `);
  }

  static getById(id) {
    const campaign = queryOne(`
      SELECT c.*, t.name as template_name, el.name as list_name, r.original_name as resume_name
      FROM campaigns c
      LEFT JOIN email_templates t ON c.template_id = t.id
      LEFT JOIN email_lists el ON c.email_list_id = el.id
      LEFT JOIN resumes r ON c.resume_id = r.id
      WHERE c.id = ?
    `, [id]);
    if (!campaign) return null;
    const emails = queryAll('SELECT * FROM campaign_emails WHERE campaign_id = ? ORDER BY id ASC', [id]);
    return { ...campaign, emails };
  }

  static create({ name, mode, template_id, email_list_id, resume_id, subject, body, scheduled_at }) {
    runSql(
      `INSERT INTO campaigns (name, mode, template_id, email_list_id, resume_id, subject, body, scheduled_at, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'draft')`,
      [name, mode, template_id || null, email_list_id || null, resume_id || null, subject || null, body || null, scheduled_at || null]
    );
    return this.getById(getLastInsertId());
  }

  static update(id, fields) {
    const allowed = ['name', 'mode', 'template_id', 'email_list_id', 'resume_id', 'subject', 'body', 'scheduled_at', 'status', 'total_emails', 'sent_count', 'failed_count'];
    const updates = [];
    const values = [];
    for (const key of allowed) {
      if (fields[key] !== undefined) {
        updates.push(`${key} = ?`);
        values.push(fields[key]);
      }
    }
    if (updates.length === 0) return this.getById(id);
    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);
    runSql(`UPDATE campaigns SET ${updates.join(', ')} WHERE id = ?`, values);
    return this.getById(id);
  }

  static delete(id) {
    runSql('DELETE FROM campaign_emails WHERE campaign_id = ?', [id]);
    runSql('DELETE FROM email_logs WHERE campaign_id = ?', [id]);
    runSql('DELETE FROM campaigns WHERE id = ?', [id]);
  }

  static getScheduled() {
    return queryAll("SELECT * FROM campaigns WHERE status = 'scheduled' AND scheduled_at <= datetime('now')");
  }
}

class CampaignEmailModel {
  static create({ campaign_id, to_email, to_name, company, subject, body }) {
    runSql('INSERT INTO campaign_emails (campaign_id, to_email, to_name, company, subject, body) VALUES (?, ?, ?, ?, ?, ?)', [campaign_id, to_email, to_name || null, company || null, subject, body]);
    return queryOne('SELECT * FROM campaign_emails WHERE id = ?', [getLastInsertId()]);
  }

  static createBatch(emails) {
    for (const e of emails) {
      runSql('INSERT INTO campaign_emails (campaign_id, to_email, to_name, company, subject, body) VALUES (?, ?, ?, ?, ?, ?)', [e.campaign_id, e.to_email, e.to_name || null, e.company || null, e.subject, e.body]);
    }
  }

  static updateStatus(id, status, { errorMessage = null, messageId = null } = {}) {
    if (status === 'sent') {
      runSql(
        'UPDATE campaign_emails SET status = ?, sent_at = ?, smtp_message_id = ?, error_message = ? WHERE id = ?',
        [status, new Date().toISOString(), messageId, errorMessage, id]
      );
    } else if (errorMessage) {
      runSql('UPDATE campaign_emails SET status = ?, error_message = ? WHERE id = ?', [status, errorMessage, id]);
    } else {
      runSql('UPDATE campaign_emails SET status = ? WHERE id = ?', [status, id]);
    }
  }

  static incrementRetry(id) {
    runSql('UPDATE campaign_emails SET retry_count = retry_count + 1 WHERE id = ?', [id]);
  }

  static getByCampaign(campaignId) {
    return queryAll('SELECT * FROM campaign_emails WHERE campaign_id = ? ORDER BY id ASC', [campaignId]);
  }

  static getPending(campaignId) {
    return queryAll("SELECT * FROM campaign_emails WHERE campaign_id = ? AND status = 'pending' ORDER BY id ASC", [campaignId]);
  }

  static getById(id) {
    return queryOne('SELECT * FROM campaign_emails WHERE id = ?', [id]);
  }
}

class EmailLogModel {
  static create({ campaign_email_id, campaign_id, event, details }) {
    runSql('INSERT INTO email_logs (campaign_email_id, campaign_id, event, details) VALUES (?, ?, ?, ?)', [campaign_email_id || null, campaign_id || null, event, details || null]);
  }

  static getByCampaign(campaignId) {
    return queryAll('SELECT * FROM email_logs WHERE campaign_id = ? ORDER BY created_at DESC', [campaignId]);
  }

  static getAll(limit = 100) {
    return queryAll('SELECT * FROM email_logs ORDER BY created_at DESC LIMIT ?', [limit]);
  }
}

class SendTrackingModel {
  static record(toEmail) {
    runSql('INSERT INTO send_tracking (to_email) VALUES (?)', [toEmail]);
  }

  static getSentCountLastHour() {
    const row = queryOne("SELECT COUNT(*) as count FROM send_tracking WHERE sent_at >= datetime('now', '-1 hour')");
    return row ? row.count : 0;
  }

  static getSentCountToday() {
    const row = queryOne("SELECT COUNT(*) as count FROM send_tracking WHERE sent_at >= datetime('now', 'start of day')");
    return row ? row.count : 0;
  }

  static wasSentRecently(email, days = 7) {
    const row = queryOne(`SELECT COUNT(*) as count FROM send_tracking WHERE to_email = ? AND sent_at >= datetime('now', '-${days} days')`, [email]);
    return row ? row.count > 0 : false;
  }
}

module.exports = {
  TemplateModel,
  EmailListModel,
  ResumeModel,
  CampaignModel,
  CampaignEmailModel,
  EmailLogModel,
  SendTrackingModel,
};
