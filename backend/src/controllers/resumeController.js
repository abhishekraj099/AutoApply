const { ResumeModel } = require('../database/models');
const path = require('path');

class ResumeController {
  static async getAll(req, res) {
    try {
      const resumes = ResumeModel.getAll();
      res.json(resumes);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async upload(req, res) {
    try {
      if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

      const resume = ResumeModel.create({
        original_name: req.file.originalname,
        file_path: req.file.path,
        file_size: req.file.size,
        mime_type: req.file.mimetype,
      });

      res.status(201).json(resume);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async setDefault(req, res) {
    try {
      const resume = ResumeModel.getById(req.params.id);
      if (!resume) return res.status(404).json({ error: 'Resume not found' });

      const updated = ResumeModel.setDefault(req.params.id);
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async delete(req, res) {
    try {
      const resume = ResumeModel.getById(req.params.id);
      if (!resume) return res.status(404).json({ error: 'Resume not found' });

      ResumeModel.delete(req.params.id);
      res.json({ message: 'Resume deleted' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async download(req, res) {
    try {
      const resume = ResumeModel.getById(req.params.id);
      if (!resume) return res.status(404).json({ error: 'Resume not found' });

      res.download(resume.file_path, resume.original_name);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = ResumeController;
