const { v4: uuid } = require('uuid');
const { readTable, writeTable } = require('../config/db');
const { initiateStkPush } = require('../services/darajaService');
const { generatePremiumCode } = require('../utils/premiumCode');

function premiumPriceKes() {
  return Number(process.env.PREMIUM_PRICE_KES || 500);
}

async function getStatus(req, res) {
  const user = req.user;
  res.json({
    isPremium: Boolean(user.isPremium),
    premiumCode: user.isPremium ? user.premiumCode : null,
    premiumSince: user.premiumSince || null,
    priceKes: premiumPriceKes(),
  });
}

// Customer taps "Upgrade to Premium" -> STK push for the fixed premium fee.
async function stkPush(req, res, next) {
  try {
    if (req.user.isPremium) {
      return res.status(400).json({ error: "You're already Premium." });
    }

    const { phone } = req.body;
    const amount = premiumPriceKes();
    const id = uuid();

    const payments = readTable('premiumPayments');
    const payment = {
      id,
      userId: req.user.id,
      amountKes: amount,
      status: 'pending',
      mpesaCheckoutRequestId: null,
      mpesaResultDesc: null,
      premiumCode: null,
      createdAt: new Date().toISOString(),
    };
    payments.push(payment);
    writeTable('premiumPayments', payments);

    const mpesa = await initiateStkPush({
      phone,
      amount,
      orderId: `PREMIUM-${id.slice(0, 8)}`,
      accountRef: 'UPTOWN-PREMIUM',
      callbackUrl: (process.env.DARAJA_CALLBACK_URL || '').replace(
        '/api/orders/mpesa/callback',
        '/api/premium/mpesa/callback'
      ),
    });

    if (!mpesa.ok) {
      return res.status(502).json({ error: mpesa.reason });
    }

    const idx = payments.findIndex((p) => p.id === id);
    payments[idx].mpesaCheckoutRequestId = mpesa.checkoutRequestId;
    writeTable('premiumPayments', payments);

    res.json({
      message: 'Check your phone and enter your M-Pesa PIN to complete your Premium upgrade.',
      paymentId: id,
      checkoutRequestId: mpesa.checkoutRequestId,
    });
  } catch (err) {
    next(err);
  }
}

// Safaricom posts the payment result here — public, no user auth available,
// server-to-server. Always respond 200 per Daraja convention.
async function mpesaCallback(req, res) {
  try {
    const body = req.body?.Body?.stkCallback;
    if (!body) return res.status(200).json({ ResultCode: 0, ResultDesc: 'Accepted' });

    const payments = readTable('premiumPayments');
    const idx = payments.findIndex((p) => p.mpesaCheckoutRequestId === body.CheckoutRequestID);

    if (idx !== -1 && payments[idx].status === 'pending') {
      if (body.ResultCode === 0) {
        const code = generatePremiumCode();
        payments[idx].status = 'paid';
        payments[idx].premiumCode = code;
        payments[idx].mpesaResultDesc = body.ResultDesc;
        writeTable('premiumPayments', payments);

        const users = readTable('users');
        const uIdx = users.findIndex((u) => u.id === payments[idx].userId);
        if (uIdx !== -1) {
          users[uIdx].isPremium = true;
          users[uIdx].premiumCode = code;
          users[uIdx].premiumSince = new Date().toISOString();
          writeTable('users', users);
        }
      } else {
        payments[idx].status = 'failed';
        payments[idx].mpesaResultDesc = body.ResultDesc;
        writeTable('premiumPayments', payments);
      }
    }

    res.status(200).json({ ResultCode: 0, ResultDesc: 'Accepted' });
  } catch (err) {
    console.error(err);
    res.status(200).json({ ResultCode: 0, ResultDesc: 'Accepted' });
  }
}

// Client polls this while waiting for the callback to land.
async function paymentStatus(req, res, next) {
  try {
    const payment = readTable('premiumPayments').find(
      (p) => p.id === req.params.paymentId && p.userId === req.user.id
    );
    if (!payment) return res.status(404).json({ error: 'Payment not found.' });
    res.json({ status: payment.status, premiumCode: payment.premiumCode });
  } catch (err) {
    next(err);
  }
}

module.exports = { getStatus, stkPush, mpesaCallback, paymentStatus };
