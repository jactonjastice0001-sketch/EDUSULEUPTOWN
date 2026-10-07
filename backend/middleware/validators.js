const { body, validationResult } = require('express-validator');

function handleValidation(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: errors.array()[0].msg, fields: errors.array() });
  }
  next();
}

// Lenient: accepts any phone number with 9–13 digits, with or without spaces,
// dashes, or a leading +. We don't enforce a strict Kenyan-only format here —
// normalizePhone() in authController still standardizes it for storage/M-Pesa.
const PHONE = /^\+?[\d\s-]{9,15}$/;

const registerRules = [
  body('fullName').trim().isLength({ min: 2, max: 80 }).withMessage('Full name must be 2–80 characters.'),
  body('email').trim().isEmail().withMessage('Enter a valid email address.').normalizeEmail(),
  body('phone').trim().matches(PHONE).withMessage('Enter a valid phone number.'),
  body('hostelName').optional({ checkFalsy: true }).trim().isLength({ max: 80 }),
  body('address').optional({ checkFalsy: true }).trim().isLength({ max: 160 }),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters.'),
  handleValidation,
];

const loginRules = [
  body('phone').trim().notEmpty().withMessage('Enter your phone number.'),
  body('password').notEmpty().withMessage('Password is required.'),
  handleValidation,
];

const orderRules = [
  body('items').isArray({ min: 1 }).withMessage('Order must contain at least one item.'),
  body('items.*.id').notEmpty().withMessage('Each item needs an id.'),
  body('items.*.quantity').isInt({ min: 1, max: 50 }).withMessage('Quantity must be between 1 and 50.'),
  body('paymentMethod').isIn(['mpesa', 'cash']).withMessage('Payment method must be mpesa or cash.'),
  body('deliverTo').trim().isLength({ min: 1, max: 160 }).withMessage('Delivery location is required.'),
  body('location').optional().isObject(),
  body('location.lat').optional().isFloat({ min: -90, max: 90 }),
  body('location.lng').optional().isFloat({ min: -180, max: 180 }),
  handleValidation,
];

const stkRules = [
  body('phone').trim().matches(PHONE).withMessage('Enter a valid M-Pesa phone number.'),
  body('amount').isFloat({ min: 1 }).withMessage('Amount must be greater than 0.'),
  body('orderId').notEmpty().withMessage('orderId is required.'),
  handleValidation,
];

const premiumStkRules = [
  body('phone').trim().matches(PHONE).withMessage('Enter a valid M-Pesa phone number.'),
  handleValidation,
];

module.exports = { registerRules, loginRules, orderRules, stkRules, premiumStkRules, PHONE };