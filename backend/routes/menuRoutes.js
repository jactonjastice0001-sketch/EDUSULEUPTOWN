const express = require("express");
const { v4: uuid } = require("uuid");
const { body, validationResult } = require("express-validator");

const db = require("../db");
const { requireAuth, requireAdmin } = require("../middleware/auth");

const router = express.Router();

function rowToItem(row) {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    price_kes: row.price_kes,
    category: row.category,
    image_url: row.image_url,
    available: !!row.available
  };
}

// Public: browse the menu (only items currently available)
router.get("/", (req, res, next) => {
  try {
    const items = db.prepare("SELECT * FROM menu_items WHERE available = 1 ORDER BY category, name").all();
    res.json({ items: items.map(rowToItem) });
  } catch (err) {
    next(err);
  }
});

// Admin: see every item, including hidden/unavailable ones, for management
router.get("/all", requireAuth, requireAdmin, (req, res, next) => {
  try {
    const items = db.prepare("SELECT * FROM menu_items ORDER BY category, name").all();
    res.json({ items: items.map(rowToItem) });
  } catch (err) {
    next(err);
  }
});

const itemValidation = [
  body("name").trim().isLength({ min: 2 }).withMessage("Name is required"),
  body("description").optional({ checkFalsy: true }).trim(),
  body("price_kes").isInt({ min: 1 }).withMessage("Price must be a positive number"),
  body("category").trim().isLength({ min: 2 }).withMessage("Category is required"),
  body("image_url").optional({ checkFalsy: true }).trim().isURL().withMessage("Image URL must be a valid URL"),
  body("available").optional().isBoolean()
];

// Admin: add a new menu item
router.post("/", requireAuth, requireAdmin, itemValidation, (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ error: errors.array()[0].msg });

    const { name, description, price_kes, category, image_url, available } = req.body;
    const id = uuid();

    db.prepare(
      `INSERT INTO menu_items (id, name, description, price_kes, category, image_url, available)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).run(id, name, description || null, price_kes, category, image_url || null, available === false ? 0 : 1);

    const row = db.prepare("SELECT * FROM menu_items WHERE id = ?").get(id);
    res.status(201).json({ item: rowToItem(row) });
  } catch (err) {
    next(err);
  }
});

// Admin: edit an existing menu item (partial update)
router.put("/:id", requireAuth, requireAdmin, itemValidation.map((v) => v.optional()), (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ error: errors.array()[0].msg });

    const current = db.prepare("SELECT * FROM menu_items WHERE id = ?").get(req.params.id);
    if (!current) return res.status(404).json({ error: "Menu item not found." });

    const { name, description, price_kes, category, image_url, available } = req.body;

    db.prepare(
      `UPDATE menu_items SET name = ?, description = ?, price_kes = ?, category = ?, image_url = ?, available = ? WHERE id = ?`
    ).run(
      name ?? current.name,
      description ?? current.description,
      price_kes ?? current.price_kes,
      category ?? current.category,
      image_url ?? current.image_url,
      available === undefined ? current.available : available ? 1 : 0,
      req.params.id
    );

    const row = db.prepare("SELECT * FROM menu_items WHERE id = ?").get(req.params.id);
    res.json({ item: rowToItem(row) });
  } catch (err) {
    next(err);
  }
});

// Admin: remove a menu item. We soft-delete (mark unavailable) rather than
// hard-delete so past orders that reference it still display correctly.
router.delete("/:id", requireAuth, requireAdmin, (req, res, next) => {
  try {
    const current = db.prepare("SELECT * FROM menu_items WHERE id = ?").get(req.params.id);
    if (!current) return res.status(404).json({ error: "Menu item not found." });

    db.prepare("UPDATE menu_items SET available = 0 WHERE id = ?").run(req.params.id);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
