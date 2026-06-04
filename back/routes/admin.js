const express = require('express');
const router = express.Router();
const { getDashboard, getUsers, updateUser, updateUserRole, toggleUserActif } = require('../controllers/adminController');
const { authenticate } = require('../middlewares/auth');
const { requireMinRole } = require('../middlewares/rbac');

router.use(authenticate, requireMinRole('dirigeant'));

router.get('/dashboard', getDashboard);
router.get('/users',             requireMinRole('dirigeant'), getUsers);
router.patch('/users/:id',       requireMinRole('admin'), updateUser);
router.patch('/users/:id/role',  requireMinRole('admin'), updateUserRole);
router.patch('/users/:id/actif', requireMinRole('admin'), toggleUserActif);

module.exports = router;
