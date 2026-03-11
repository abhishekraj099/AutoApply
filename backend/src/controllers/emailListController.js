const { EmailListModel } = require('../database/models');
const { validationResult } = require('express-validator');
const csv = require('csv-parser');
const { Readable } = require('stream');

class EmailListController {
  static async getAll(req, res) {
    try {
      const lists = EmailListModel.getAll();
      res.json(lists);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async getById(req, res) {
    try {
      const list = EmailListModel.getById(req.params.id);
      if (!list) return res.status(404).json({ error: 'Email list not found' });
      res.json(list);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async create(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

      const { name, description } = req.body;
      const list = EmailListModel.create({ name, description });
      res.status(201).json(list);
    } catch (error) {
      if (error.message.includes('UNIQUE constraint')) {
        return res.status(409).json({ error: 'A list with this name already exists' });
      }
      res.status(500).json({ error: error.message });
    }
  }

  static async update(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

      const existing = EmailListModel.getById(req.params.id);
      if (!existing) return res.status(404).json({ error: 'Email list not found' });

      const { name, description } = req.body;
      const list = EmailListModel.update(req.params.id, { name, description });
      res.json(list);
    } catch (error) {
      if (error.message.includes('UNIQUE constraint')) {
        return res.status(409).json({ error: 'A list with this name already exists' });
      }
      res.status(500).json({ error: error.message });
    }
  }

  static async delete(req, res) {
    try {
      const existing = EmailListModel.getById(req.params.id);
      if (!existing) return res.status(404).json({ error: 'Email list not found' });

      EmailListModel.delete(req.params.id);
      res.json({ message: 'Email list deleted' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async addContact(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

      const list = EmailListModel.getById(req.params.id);
      if (!list) return res.status(404).json({ error: 'Email list not found' });

      const { email, name, company } = req.body;
      const contact = EmailListModel.addContact(req.params.id, { email, name, company });
      res.status(201).json(contact);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async removeContact(req, res) {
    try {
      EmailListModel.removeContact(req.params.contactId);
      res.json({ message: 'Contact removed' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async importCSV(req, res) {
    try {
      const list = EmailListModel.getById(req.params.id);
      if (!list) return res.status(404).json({ error: 'Email list not found' });

      if (!req.file) return res.status(400).json({ error: 'No CSV file uploaded' });

      const contacts = [];
      const stream = Readable.from(req.file.buffer.toString());

      await new Promise((resolve, reject) => {
        stream
          .pipe(csv())
          .on('data', (row) => {
            const email = row.email || row.Email || row.EMAIL;
            if (email && email.includes('@')) {
              contacts.push({
                email: email.trim(),
                name: (row.name || row.Name || row.NAME || '').trim(),
                company: (row.company || row.Company || row.COMPANY || '').trim(),
              });
            }
          })
          .on('end', resolve)
          .on('error', reject);
      });

      if (contacts.length === 0) {
        return res.status(400).json({ error: 'No valid contacts found in CSV' });
      }

      const updatedList = EmailListModel.addContacts(req.params.id, contacts);
      res.json({ message: `${contacts.length} contacts imported`, list: updatedList });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = EmailListController;
