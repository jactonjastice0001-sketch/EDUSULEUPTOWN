const router = require('express').Router();

// Public and intentionally so — this is the number customers are meant to call.
router.get('/', (req, res) => {
  res.json({
    adminCallNumber: process.env.ADMIN_CALL_NUMBER || process.env.ADMIN_PHONE || null,
    whatsappVendorNumber: process.env.WHATSAPP_VENDOR_NUMBER || null,
  });
});

module.exports = router;
