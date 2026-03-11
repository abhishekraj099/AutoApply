const { Router } = require('express');
const { body } = require('express-validator');
const CampaignController = require('../controllers/campaignController');

const router = Router();

const validateCampaign = [
  body('name').trim().notEmpty().withMessage('Campaign name is required'),
  body('mode').isIn(['bulk', 'custom']).withMessage('Mode must be bulk or custom'),
];

router.get('/', CampaignController.getAll);
router.get('/history', CampaignController.getHistory);
router.get('/:id', CampaignController.getById);
router.post('/', validateCampaign, CampaignController.create);
router.put('/:id', CampaignController.update);
router.delete('/:id', CampaignController.delete);
router.post('/:id/schedule', CampaignController.schedule);
router.post('/:id/cancel', CampaignController.cancel);
router.get('/:id/preview', CampaignController.preview);
router.post('/:id/test', CampaignController.sendTest);
router.get('/:id/logs', CampaignController.getLogs);

module.exports = router;
