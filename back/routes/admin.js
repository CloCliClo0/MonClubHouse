const express = require('express');
const router = express.Router();
const { getDashboard, getUsers, updateUser, updateUserRole, toggleUserActif } = require('../controllers/adminController');
const { authenticate } = require('../middlewares/auth');
const { requireMinRole } = require('../middlewares/rbac');
const { validateUpdateUser } = require('../middlewares/validation');
const { validationResult } = require('express-validator');

const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });
  next();
};

router.use(authenticate);

router.get('/dashboard', requireMinRole('dirigeant'), getDashboard);
router.get('/users',     requireMinRole('coach'),     getUsers);
router.patch('/users/:id',       requireMinRole('admin'), validateUpdateUser, handleValidation, updateUser);
router.patch('/users/:id/role',  requireMinRole('admin'), updateUserRole);
router.patch('/users/:id/actif', requireMinRole('admin'), toggleUserActif);

module.exports = router;
