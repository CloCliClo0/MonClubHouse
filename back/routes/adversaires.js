const express = require('express');
const router = express.Router();
const { getAll, getById, create, update, remove } = require('../controllers/adversaireController');
const { authenticate } = require('../middlewares/auth');
const { requireMinRole } = require('../middlewares/rbac');
const { validateAdversaire } = require('../middlewares/validation');
const { validationResult } = require('express-validator');

const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });
  next();
};

router.get('/',      authenticate, getAll);
router.get('/:id',   authenticate, getById);
router.post('/',     authenticate, requireMinRole('coach'), validateAdversaire, handleValidation, create);
router.patch('/:id', authenticate, requireMinRole('coach'), validateAdversaire, handleValidation, update);
router.delete('/:id',authenticate, requireMinRole('coach'), remove);

module.exports = router;
