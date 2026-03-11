const { Router } = require('express');
const DashboardController = require('../controllers/dashboardController');

const router = Router();

router.get('/stats', DashboardController.getStats);

module.exports = router;
