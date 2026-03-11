const { Router } = require('express');
const { body } = require('express-validator');
const multer = require('multer');
const EmailListController = require('../controllers/emailListController');

const router = Router();
const csvUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 2 * 1024 * 1024 } });

const validateList = [
  body('name').trim().notEmpty().withMessage('List name is required'),
];

const validateContact = [
  body('email').isEmail().withMessage('Valid email is required'),
];

router.get('/', EmailListController.getAll);
router.get('/:id', EmailListController.getById);
router.post('/', validateList, EmailListController.create);
router.put('/:id', validateList, EmailListController.update);
router.delete('/:id', EmailListController.delete);
router.post('/:id/contacts', validateContact, EmailListController.addContact);
router.delete('/:id/contacts/:contactId', EmailListController.removeContact);
router.post('/:id/import', csvUpload.single('file'), EmailListController.importCSV);

module.exports = router;
