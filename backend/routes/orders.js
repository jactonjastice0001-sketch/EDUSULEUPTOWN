const express = require("express");
const { v4: uuid } = require("uuid");
const { body, validationResult } = require("express-validator");

const db = require("../db");
const { requireAuth } = require("../middleware/auth");
const { buildClickToChatLink } = require("../services/whatsapp");

const router = express.Router();

function rowToOrder(row) {
  return {
    id: row.id,
    items: JSON.parse(row.items_json),
    totalKes: row.total_kes,
    deliveryHostel: row.delivery_hostel,
    deliveryAddress: row.delivery_address,
    deliveryNotes: row.delivery_notes,
    latitude: row.latitude,
    longitude: row.longitude,
    status: row.status,
    paymentStatus: row.payment_status,
    mpesaReceipt: row.mpesa_receipt,
    createdAt: row.created_at
  };
}

router.post(
  "/",
  requireAuth,
  [
    body("items").isArray({ min: 1 }).withMessage("Your cart is empty"),
    body("items.*.id").isString(),
    body("items.*.quantity").isInt({ min: 1 }),
    body("deliveryHostel").optional().trim(),
    body("deliveryAddress").optional().trim(),
    body("deliveryNotes").optional().trim(),
    body("latitude").optional().isFloat({ min: -90, max: 90 }),
    body("longitude").optional().isFloat({ min: -180, max: 180 })
  ],
  (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ error: errors.array()[0].msg });

      const { items, deliveryHostel, deliveryAddress, deliveryNotes, latitude, longitude } = req.body;

      const menuRows = db.prepare("SELECT * FROM menu_items WHERE id IN (" + items.map(() => "?").join(",") + ")").all(
        items.map((i) => i.id)
      );
      const menuById = Object.fromEntries(menuRows.map((m) => [m.id, m]));

      const orderItems = [];
      let total = 0;
      for (const i of items) {
        const menuItem = menuById[i.id];
        if (!menuItem || !menuItem.available) {
          return res.status(400).json({ error: `Item unavailable: ${i.id}` });
        }
        const qty = parseInt(i.quantity, 10);
        orderItems.push({ id: menuItem.id, name: menuItem.name, price: menuItem.price_kes, quantity: qty });
        total += menuItem.price_kes * qty;
      }

      const id = uuid();
      db.prepare(
        `INSERT INTO orders (id, user_id, items_json, total_kes, delivery_hostel, delivery_address, delivery_notes, latitude, longitude)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).run(
        id,
        req.user.id,
        JSON.stringify(orderItems),
        total,
        deliveryHostel || null,
        deliveryAddress || null,
        deliveryNotes || null,
        latitude ?? null,
        longitude ?? null
      );

      const row = db.prepare("SELECT * FROM orders WHERE id = ?").get(id);
      const order = rowToOrder(row);

      const userRow = db.prepare("SELECT * FROM users WHERE id = ?").get(req.user.id);
      const user = {
        fullName: userRow.full_name,
        phone: userRow.phone,
        hostelName: userRow.hostel_name
      };

      const whatsappLink = buildClickToChatLink({ order, user });

      res.status(201).json({ order, whatsappLink });
    } catch (err) {
      next(err);
    }
  }
);

router.get("/", requireAuth, (req, res, next) => {
  try {
    const rows = db
      .prepare("SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC")
      .all(req.user.id);
    res.json({ orders: rows.map(rowToOrder) });
  } catch (err) {
    next(err);
  }
});

router.get("/:id", requireAuth, (req, res, next) => {
  try {
    const row = db.prepare("SELECT * FROM orders WHERE id = ? AND user_id = ?").get(req.params.id, req.user.id);
    if (!row) return res.status(404).json({ error: "Order not found." });
    res.json({ order: rowToOrder(row) });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
