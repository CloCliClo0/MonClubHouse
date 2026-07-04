const express = require('express');
const router = express.Router();
const { getStatus, checkout, adminList } = require('../controllers/subscriptionController');
const { authenticate } = require('../middlewares/auth');
const { requireRole } = require('../middlewares/rbac');

router.get('/status',   authenticate, getStatus);
router.post('/checkout', authenticate, checkout);
router.get('/admin',    authenticate, requireRole('superadmin'), adminList);

module.exports = router;
