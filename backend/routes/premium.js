const express = require("express");
const { v4: uuid } = require("uuid");
const { body, validationResult } = require("express-validator");
const rateLimit = require("express-rate-limit");

const db = require("../db");
const { requireAuth } = require("../middleware/auth");
const { stkPush } = require("../services/daraja");
const { generatePremiumCode } = require("../utils/premiumCode");

const router = express.Router();

const payLimiter = rateLimit({ windowMs: 60 * 1000, max: 5, message: { error: "Too many attempts. Wait a minute and try again." } });

function premiumPrice() {
  return parseInt(process.env.PREMIUM_PRICE_KES || "500", 10);
}

router.get("/status", requireAuth, (req, res, next) => {
  try {
    const user = db.prepare("SELECT is_premium, premium_code, premium_since FROM users WHERE id = ?").get(req.user.id);
    res.json({
      isPremium: !!user.is_premium,
      premiumCode: user.is_premium ? user.premium_code : null,
      premiumSince: user.premium_since,
      priceKes: premiumPrice()
    });
  } catch (err) {
    next(err);
  }
});

// Customer taps "Upgrade to Premium" -> STK push for the fixed premium price.
router.post(
  "/stkpush",
  requireAuth,
  payLimiter,
  [
    body("phone")
      .trim()
      .matches(/^(?:\+?254|0)7\d{8}$/)
      .withMessage("Enter a valid Safaricom number, e.g. 07XXXXXXXX")
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ error: errors.array()[0].msg });

      const user = db.prepare("SELECT * FROM users WHERE id = ?").get(req.user.id);
      if (user.is_premium) return res.status(400).json({ error: "You're already Premium." });

      const { phone } = req.body;
      const amount = premiumPrice();
      const id = uuid();

      db.prepare(
        "INSERT INTO premium_payments (id, user_id, amount_kes, status) VALUES (?, ?, ?, 'pending')"
      ).run(id, req.user.id, amount);

      // Route Safaricom's callback to a premium-specific endpoint, separate
      // from regular food-order payments.
      const base = (process.env.DARAJA_CALLBACK_URL || "").replace(/\/api\/mpesa\/callback\/?$/, "");
      const callbackUrl = base ? `${base}/api/premium/callback` : undefined;

      const result = await stkPush({
        phone,
        amount,
        accountReference: `UPTOWN-PREMIUM`,
        description: "UP TOWN Premium upgrade",
        callbackUrl
      });

      db.prepare("UPDATE premium_payments SET mpesa_checkout_request_id = ? WHERE id = ?").run(
        result.CheckoutRequestID,
        id
      );

      res.json({
        message: "Check your phone and enter your M-Pesa PIN to complete your Premium upgrade.",
        paymentId: id,
        checkoutRequestId: result.CheckoutRequestID
      });
    } catch (err) {
      next(err);
    }
  }
);

// Safaricom calls this directly (public HTTPS, no auth) when the STK prompt
// is completed or cancelled.
router.post("/callback", express.json(), (req, res) => {
  try {
    const body = req.body?.Body?.stkCallback;
    if (!body) return res.status(400).json({ ResultCode: 1, ResultDesc: "Invalid payload" });

    const { CheckoutRequestID, ResultCode, CallbackMetadata } = body;
    const payment = db.prepare("SELECT * FROM premium_payments WHERE mpesa_checkout_request_id = ?").get(CheckoutRequestID);

    if (payment && payment.status === "pending") {
      if (ResultCode === 0) {
        const items = CallbackMetadata?.Item || [];
        const receipt = items.find((i) => i.Name === "MpesaReceiptNumber")?.Value || null;
        const code = generatePremiumCode();

        const tx = db.transaction(() => {
          db.prepare(
            "UPDATE premium_payments SET status = 'paid', mpesa_receipt = ?, premium_code = ? WHERE id = ?"
          ).run(receipt, code, payment.id);
          db.prepare(
            "UPDATE users SET is_premium = 1, premium_code = ?, premium_since = datetime('now') WHERE id = ?"
          ).run(code, payment.user_id);
        });
        tx();
      } else {
        db.prepare("UPDATE premium_payments SET status = 'failed' WHERE id = ?").run(payment.id);
      }
    }

    res.json({ ResultCode: 0, ResultDesc: "Accepted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ResultCode: 1, ResultDesc: "Server error" });
  }
});

// Client polls this while waiting for the callback to land.
router.get("/payment-status/:paymentId", requireAuth, (req, res, next) => {
  try {
    const payment = db
      .prepare("SELECT * FROM premium_payments WHERE id = ? AND user_id = ?")
      .get(req.params.paymentId, req.user.id);
    if (!payment) return res.status(404).json({ error: "Payment not found." });
    res.json({ status: payment.status, premiumCode: payment.premium_code });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
