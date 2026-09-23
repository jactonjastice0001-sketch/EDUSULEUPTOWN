const express = require("express");
const { body, validationResult } = require("express-validator");
const rateLimit = require("express-rate-limit");

const db = require("../db");
const { requireAuth } = require("../middleware/auth");
const { stkPush, stkQuery } = require("../services/daraja");

const router = express.Router();

const payLimiter = rateLimit({ windowMs: 60 * 1000, max: 5, message: { error: "Too many payment attempts. Wait a minute and try again." } });

router.post(
  "/stkpush",
  requireAuth,
  payLimiter,
  [
    body("orderId").isString(),
    body("phone")
      .trim()
      .matches(/^(?:\+?254|0)7\d{8}$/)
      .withMessage("Enter a valid Safaricom number, e.g. 07XXXXXXXX")
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ error: errors.array()[0].msg });

      const { orderId, phone } = req.body;
      const order = db.prepare("SELECT * FROM orders WHERE id = ? AND user_id = ?").get(orderId, req.user.id);
      if (!order) return res.status(404).json({ error: "Order not found." });
      if (order.payment_status === "paid") return res.status(400).json({ error: "This order is already paid." });

      const result = await stkPush({
        phone,
        amount: order.total_kes,
        accountReference: `UPTOWN-${order.id.slice(0, 8)}`,
        description: "UP TOWN food order"
      });

      db.prepare("UPDATE orders SET mpesa_checkout_request_id = ? WHERE id = ?").run(
        result.CheckoutRequestID,
        order.id
      );

      res.json({
        message: "Check your phone and enter your M-Pesa PIN to complete payment.",
        checkoutRequestId: result.CheckoutRequestID
      });
    } catch (err) {
      next(err);
    }
  }
);

router.post("/callback", express.json(), (req, res) => {
  try {
    const body = req.body?.Body?.stkCallback;
    if (!body) return res.status(400).json({ ResultCode: 1, ResultDesc: "Invalid payload" });

    const { CheckoutRequestID, ResultCode, CallbackMetadata } = body;
    const order = db.prepare("SELECT * FROM orders WHERE mpesa_checkout_request_id = ?").get(CheckoutRequestID);

    if (order) {
      if (ResultCode === 0) {
        const items = CallbackMetadata?.Item || [];
        const receipt = items.find((i) => i.Name === "MpesaReceiptNumber")?.Value || null;
        db.prepare("UPDATE orders SET payment_status = 'paid', mpesa_receipt = ?, status = 'confirmed' WHERE id = ?").run(
          receipt,
          order.id
        );
      } else {
        db.prepare("UPDATE orders SET payment_status = 'failed' WHERE id = ?").run(order.id);
      }
    }

    res.json({ ResultCode: 0, ResultDesc: "Accepted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ResultCode: 1, ResultDesc: "Server error" });
  }
});

router.get("/status/:orderId", requireAuth, async (req, res, next) => {
  try {
    const order = db.prepare("SELECT * FROM orders WHERE id = ? AND user_id = ?").get(req.params.orderId, req.user.id);
    if (!order) return res.status(404).json({ error: "Order not found." });
    res.json({ paymentStatus: order.payment_status, mpesaReceipt: order.mpesa_receipt });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
