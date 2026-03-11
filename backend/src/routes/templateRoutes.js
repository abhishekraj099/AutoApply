const { Router } = require('express');
const { body } = require('express-validator');
const TemplateController = require('../controllers/templateController');

const router = Router();

const validateTemplate = [
  body('name').trim().notEmpty().withMessage('Template name is required'),
  body('subject').trim().notEmpty().withMessage('Subject is required'),
  body('body').trim().notEmpty().withMessage('Body is required'),
];

router.get('/', TemplateController.getAll);
router.get('/:id', TemplateController.getById);
router.post('/', validateTemplate, TemplateController.create);
router.put('/:id', validateTemplate, TemplateController.update);
router.delete('/:id', TemplateController.delete);

module.exports = router;
