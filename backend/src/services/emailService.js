const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');
const config = require('../config');
const logger = require('../config/logger');

// Gmail SMTP transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: config.email.user,
    pass: config.email.appPassword,
  },
});

// Verify SMTP connection on startup
transporter.verify()
  .then(() => logger.info('Gmail SMTP connection verified', { user: config.email.user }))
  .catch((err) => logger.error('Gmail SMTP connection failed', { error: err.message }));

/**
 * Check if current time is within business hours (9 AM – 7 PM).
 * Returns { allowed, currentHour } so caller can decide to defer.
 */
function isWithinBusinessHours() {
  const now = new Date();
  const hour = now.getHours();
  return { allowed: hour >= 9 && hour < 19, currentHour: hour };
}

/**
 * Send an email via Gmail SMTP.
 *
 * @param {Object} params
 * @param {string} params.to          - Recipient email
 * @param {string} params.subject     - Email subject
 * @param {string} params.body        - Email body (HTML or plain text)
 * @param {string} [params.resumePath] - Optional path to PDF resume to attach
 * @returns {Promise<{ success: boolean, id: string }>}
 */
async function sendEmail({ to, subject, body, resumePath }) {
  const mailOptions = {
    from: `${config.email.fromName} <${config.email.user}>`,
    to,
    subject,
    html: body.replace(/\n/g, '<br>'),
    text: body.replace(/<[^>]*>/g, ''),
    attachments: [],
  };

  // Attach resume PDF if provided
  if (resumePath && fs.existsSync(resumePath)) {
    mailOptions.attachments.push({
      filename: path.basename(resumePath),
      path: resumePath,
    });
  }

  try {
    const info = await transporter.sendMail(mailOptions);
    logger.info('Email sent successfully', {
      to,
      subject,
      messageId: info.messageId,
      from: mailOptions.from,
    });
    return { success: true, id: info.messageId };
  } catch (error) {
    const errorMessage = error.message || 'Unknown email error';
    logger.error('Email send failed', { to, subject, error: errorMessage });
    throw new Error(errorMessage);
  }
}

/**
 * Send a test email (prefixed with [TEST]).
 */
async function sendTestEmail(to, subject, body, resumePath) {
  return sendEmail({
    to,
    subject: `[TEST] ${subject}`,
    body: `<p><strong>⚠️ This is a test email</strong></p><hr>${body}`,
    resumePath,
  });
}

module.exports = { sendEmail, sendTestEmail, isWithinBusinessHours };
