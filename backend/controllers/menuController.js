const fs = require('fs');
const path = require('path');
const { readTable, writeTable } = require('../config/db');

function listMenu(req, res) {
  const menu = readTable('menu').filter((item) => item.available);
  res.json({ menu });
}

// Admin-only: full menu including unavailable items, so the dashboard can toggle them.
function listMenuAdmin(req, res) {
  const menu = readTable('menu');
  res.json({ menu });
}

function updateMenuItem(req, res) {
  const { id } = req.params;
  const { name, description, category, price, available } = req.body;

  const menu = readTable('menu');
  const idx = menu.findIndex((m) => m.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Menu item not found.' });

  if (name !== undefined) menu[idx].name = String(name).trim();
  if (description !== undefined) menu[idx].description = String(description).trim();
  if (category !== undefined) menu[idx].category = String(category).trim();
  if (available !== undefined) menu[idx].available = Boolean(available);

  if (price !== undefined) {
    const parsed = Number(price);
    if (!Number.isFinite(parsed) || parsed < 0) {
      return res.status(400).json({ error: 'Price must be a non-negative number.' });
    }
    menu[idx].price = Math.round(parsed * 100) / 100;
  }

  writeTable('menu', menu);
  res.json({ item: menu[idx] });
}

function uploadMenuImage(req, res) {
  const { id } = req.params;
  if (!req.file) return res.status(400).json({ error: 'No image file was uploaded.' });

  const menu = readTable('menu');
  const idx = menu.findIndex((m) => m.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Menu item not found.' });

  // Remove the old image file if one exists, to avoid orphaned uploads piling up.
  const previous = menu[idx].image;
  if (previous) {
    const previousPath = path.join(__dirname, '..', previous.replace(/^\/uploads\//, 'uploads/'));
    fs.unlink(previousPath, () => {});
  }

  const publicPath = `/uploads/menu/${req.file.filename}`;
  menu[idx].image = publicPath;
  writeTable('menu', menu);

  res.json({ item: menu[idx] });
}

// Admin-only: create a brand new menu item.
function createMenuItem(req, res) {
  const { name, description, category, price } = req.body;
  if (!name || price === undefined) {
    return res.status(400).json({ error: 'name and price are required.' });
  }
  const parsedPrice = Number(price);
  if (!Number.isFinite(parsedPrice) || parsedPrice < 0) {
    return res.status(400).json({ error: 'Price must be a non-negative number.' });
  }

  const menu = readTable('menu');
  const id = 'm' + (Date.now().toString(36));
  const item = {
    id,
    name: String(name).trim(),
    category: category ? String(category).trim() : 'Mains',
    price: Math.round(parsedPrice * 100) / 100,
    description: description ? String(description).trim() : '',
    available: true,
    image: null,
  };
  menu.push(item);
  writeTable('menu', menu);
  res.status(201).json({ item });
}

module.exports = { listMenu, listMenuAdmin, updateMenuItem, uploadMenuImage, createMenuItem };
