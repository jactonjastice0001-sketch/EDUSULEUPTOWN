const { body, validationResult } = require('express-validator');

function handleValidation(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: errors.array()[0].msg, fields: errors.array() });
  }
  next();
}

// Kenyan phone: 07XXXXXXXX, 01XXXXXXXX, or +2547XXXXXXXX / +2541XXXXXXXX
const KE_PHONE = /^(?:\+254|0)(7\d{8}|1\d{8})$/;
// Kenyan national ID: 6-8 digits
const KE_ID = /^\d{6,8}$/;

const registerRules = [
  body('fullName').trim().isLength({ min: 2, max: 80 }).withMessage('Full name must be 2–80 characters.'),
  body('email').trim().isEmail().withMessage('Enter a valid email address.').normalizeEmail(),
  body('phone').trim().matches(KE_PHONE).withMessage('Enter a valid Kenyan phone number, e.g. 0712345678.'),
  body('idNumber').trim().matches(KE_ID).withMessage('Enter a valid national ID number (6–8 digits).'),
  body('hostelName').trim().isLength({ min: 1, max: 80 }).withMessage('Hostel/residence name is required.'),
  body('address').trim().isLength({ min: 1, max: 160 }).withMessage('Delivery address is required.'),
  body('password')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters.')
    .matches(/[A-Z]/).withMessage('Password must contain an uppercase letter.')
    .matches(/[a-z]/).withMessage('Password must contain a lowercase letter.')
    .matches(/\d/).withMessage('Password must contain a number.'),
  handleValidation,
];

const loginRules = [
  body('phone').trim().matches(KE_PHONE).withMessage('Enter a valid Kenyan phone number.'),
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
  body('phone').trim().matches(KE_PHONE).withMessage('Enter a valid M-Pesa phone number.'),
  body('amount').isFloat({ min: 1 }).withMessage('Amount must be greater than 0.'),
  body('orderId').notEmpty().withMessage('orderId is required.'),
  handleValidation,
];

module.exports = { registerRules, loginRules, orderRules, stkRules, KE_PHONE, KE_ID };
