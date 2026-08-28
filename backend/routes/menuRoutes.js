const router = require('express').Router();
const { requireAuth, requireAdmin } = require('../middleware/auth');
const { upload } = require('../middleware/upload');
const {
  listMenu,
  listMenuAdmin,
  updateMenuItem,
  uploadMenuImage,
  createMenuItem,
} = require('../controllers/menuController');

// Public
router.get('/', listMenu);

// Admin only
router.get('/admin/all', requireAuth, requireAdmin, listMenuAdmin);
router.post('/', requireAuth, requireAdmin, createMenuItem);
router.patch('/:id', requireAuth, requireAdmin, updateMenuItem);
router.post('/:id/image', requireAuth, requireAdmin, upload.single('image'), uploadMenuImage);

module.exports = router;
