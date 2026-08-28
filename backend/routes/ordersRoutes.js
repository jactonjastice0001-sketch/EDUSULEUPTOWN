const router = require('express').Router();
const { requireAuth, requireAdmin } = require('../middleware/auth');
const { orderRules, stkRules } = require('../middleware/validators');
const { orderLimiter } = require('../middleware/rateLimiters');
const {
  createOrder,
  mpesaCallback,
  listMyOrders,
  getOrder,
  listAllOrders,
  updateOrderStatus,
} = require('../controllers/ordersController');

router.post('/', requireAuth, orderLimiter, orderRules, createOrder);
router.get('/', requireAuth, listMyOrders);

// Admin only — must come before /:id so "admin" isn't parsed as an order id.
router.get('/admin/all', requireAuth, requireAdmin, listAllOrders);
router.patch('/:id/status', requireAuth, requireAdmin, updateOrderStatus);

router.get('/:id', requireAuth, getOrder);

// Public — Safaricom calls this server-to-server, no user auth available.
router.post('/mpesa/callback', mpesaCallback);

module.exports = router;