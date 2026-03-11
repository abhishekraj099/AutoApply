const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const path = require('path');
const config = require('./config');
const logger = require('./config/logger');
const { initializeDatabase, closeDatabase } = require('./database/init');

// Routes
const dashboardRoutes = require('./routes/dashboardRoutes');
const templateRoutes = require('./routes/templateRoutes');
const emailListRoutes = require('./routes/emailListRoutes');
const resumeRoutes = require('./routes/resumeRoutes');
const campaignRoutes = require('./routes/campaignRoutes');

// Workers
const { startCampaignWorker } = require('./queue/campaignWorker');
const { startEmailWorker } = require('./queue/emailWorker');

const app = express();

// Middleware
app.use(cors({ origin: config.frontendUrl, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// API rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { error: 'Too many requests, please try again later' },
});
app.use('/api/', apiLimiter);

// API Routes
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/templates', templateRoutes);
app.use('/api/email-lists', emailListRoutes);
app.use('/api/resumes', resumeRoutes);
app.use('/api/campaigns', campaignRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error('Unhandled error', { error: err.message, stack: err.stack });

  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ error: 'File too large. Maximum size is 5MB.' });
  }
  if (err.message === 'Only PDF files are allowed') {
    return res.status(400).json({ error: err.message });
  }

  res.status(500).json({ error: 'Internal server error' });
});

// Start server
async function start() {
  try {
    // Initialize database (async — sql.js needs to load WASM)
    await initializeDatabase();

    // Start queue workers
    let campaignWorker, emailWorker;
    try {
      campaignWorker = startCampaignWorker();
      emailWorker = startEmailWorker();
      logger.info('Queue workers started');
    } catch (err) {
      logger.warn('Redis not available — queue workers disabled. Emails won\'t be sent automatically.', { error: err.message });
    }

    app.listen(config.port, () => {
      logger.info(`Server running on port ${config.port}`);
      console.log(`\n🚀 AutoApply Backend running at http://localhost:${config.port}`);
      console.log(`📊 Dashboard API: http://localhost:${config.port}/api/dashboard/stats`);
      console.log(`❤️  Health check:  http://localhost:${config.port}/api/health\n`);
    });

    // Graceful shutdown
    const shutdown = () => {
      logger.info('Shutting down...');
      if (campaignWorker) campaignWorker.close();
      if (emailWorker) emailWorker.close();
      closeDatabase();
      process.exit(0);
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
  } catch (error) {
    logger.error('Failed to start server', { error: error.message });
    process.exit(1);
  }
}

start();

module.exports = app;
