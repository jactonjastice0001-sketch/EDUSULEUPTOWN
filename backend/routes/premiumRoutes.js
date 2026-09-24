const router = require('express').Router();
const { requireAuth } = require('../middleware/auth');
const { premiumStkRules } = require('../middleware/validators');
const { orderLimiter } = require('../middleware/rateLimiters');
const { getStatus, stkPush, mpesaCallback, paymentStatus } = require('../controllers/premiumController');

router.get('/status', requireAuth, getStatus);
router.post('/stkpush', requireAuth, orderLimiter, premiumStkRules, stkPush);
router.get('/payment-status/:paymentId', requireAuth, paymentStatus);

// Public — Safaricom calls this server-to-server, no user auth available.
router.post('/mpesa/callback', mpesaCallback);

module.exports = router;
