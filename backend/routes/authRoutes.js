const router = require('express').Router();
const { register, login, me, updateProfile } = require('../controllers/authController');
const { requireAuth } = require('../middleware/auth');
const { registerRules, loginRules } = require('../middleware/validators');
const { authLimiter } = require('../middleware/rateLimiters');

router.post('/register', authLimiter, registerRules, register);
router.post('/login', authLimiter, loginRules, login);
router.get('/me', requireAuth, me);
router.patch('/me', requireAuth, updateProfile);

module.exports = router;
