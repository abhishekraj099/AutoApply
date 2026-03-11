const { TemplateModel } = require('../database/models');
const { validationResult } = require('express-validator');

class TemplateController {
  static async getAll(req, res) {
    try {
      const templates = TemplateModel.getAll();
      res.json(templates);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async getById(req, res) {
    try {
      const template = TemplateModel.getById(req.params.id);
      if (!template) return res.status(404).json({ error: 'Template not found' });
      res.json(template);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async create(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

      const { name, subject, body } = req.body;
      const template = TemplateModel.create({ name, subject, body });
      res.status(201).json(template);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async update(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

      const existing = TemplateModel.getById(req.params.id);
      if (!existing) return res.status(404).json({ error: 'Template not found' });

      const { name, subject, body } = req.body;
      const template = TemplateModel.update(req.params.id, { name, subject, body });
      res.json(template);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async delete(req, res) {
    try {
      const existing = TemplateModel.getById(req.params.id);
      if (!existing) return res.status(404).json({ error: 'Template not found' });

      TemplateModel.delete(req.params.id);
      res.json({ message: 'Template deleted' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = TemplateController;
