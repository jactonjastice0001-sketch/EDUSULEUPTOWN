const express = require('express');
const { v4: uuid } = require('uuid');
const { body, validationResult } = require('express-validator');

const { readTable, writeTable } = require('../config/db');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const { upload } = require('../middleware/upload');

const router = express.Router();

// Public: browse the menu (only items currently available)
router.get('/', (req, res, next) => {
  try {
    const menu = readTable('menu').filter((item) => item.available);
    res.json({ menu });
  } catch (err) {
    next(err);
  }
});

// Admin: see every item, including hidden/unavailable ones, for management
router.get('/admin/all', requireAuth, requireAdmin, (req, res, next) => {
  try {
    const menu = readTable('menu');
    res.json({ menu });
  } catch (err) {
    next(err);
  }
});

const itemValidation = [
  body('name').trim().isLength({ min: 2 }).withMessage('Name is required'),
  body('description').optional({ checkFalsy: true }).trim(),
  body('price').isFloat({ min: 1 }).withMessage('Price must be a positive number'),
  body('category').trim().isLength({ min: 2 }).withMessage('Category is required'),
];

// Admin: add a new menu item
router.post('/', requireAuth, requireAdmin, itemValidation, (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ error: errors.array()[0].msg });

    const { name, description, price, category } = req.body;
    const item = {
      id: uuid(),
      name,
      description: description || '',
      price: Number(price),
      category,
      image: null,
      available: true,
    };

    const menu = readTable('menu');
    menu.push(item);
    writeTable('menu', menu);

    res.status(201).json({ item });
  } catch (err) {
    next(err);
  }
});

// Admin: edit an existing menu item (partial update — price, availability, etc.)
router.patch('/:id', requireAuth, requireAdmin, (req, res, next) => {
  try {
    const menu = readTable('menu');
    const idx = menu.findIndex((m) => m.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Menu item not found.' });

    const { name, description, price, category, available } = req.body;
    if (name !== undefined) menu[idx].name = name;
    if (description !== undefined) menu[idx].description = description;
    if (price !== undefined) menu[idx].price = Number(price);
    if (category !== undefined) menu[idx].category = category;
    if (available !== undefined) menu[idx].available = Boolean(available);

    writeTable('menu', menu);
    res.json({ item: menu[idx] });
  } catch (err) {
    next(err);
  }
});

// Admin: upload/replace a menu item's photo
router.post('/:id/image', requireAuth, requireAdmin, upload.single('image'), (req, res, next) => {
  try {
    const menu = readTable('menu');
    const idx = menu.findIndex((m) => m.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Menu item not found.' });
    if (!req.file) return res.status(400).json({ error: 'No image uploaded.' });

    menu[idx].image = `/uploads/menu/${req.file.filename}`;
    writeTable('menu', menu);

    res.json({ item: menu[idx] });
  } catch (err) {
    next(err);
  }
});

// Admin: remove a menu item. We soft-delete (mark unavailable) rather than
// hard-delete so past orders that reference it still display correctly.
router.delete('/:id', requireAuth, requireAdmin, (req, res, next) => {
  try {
    const menu = readTable('menu');
    const idx = menu.findIndex((m) => m.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Menu item not found.' });

    menu[idx].available = false;
    writeTable('menu', menu);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;