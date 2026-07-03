const express = require('express');
const router = express.Router();
const { create, getMes, getAll, getStats, update, remove } = require('../controllers/supportController');
const { authenticate } = require('../middlewares/auth');
const { requireMinRole } = require('../middlewares/rbac');
const { body, validationResult } = require('express-validator');

const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });
  next();
};

const validateTicket = [
  body('sujet').trim().notEmpty().isLength({ max: 200 }).withMessage('Sujet requis (max 200 car.)'),
  body('message').trim().notEmpty().isLength({ max: 5000 }).withMessage('Message requis (max 5000 car.)'),
  body('priorite').optional().isIn(['normal', 'haute', 'urgent']).withMessage('Priorité invalide'),
];

// Routes utilisateur
router.get('/mes-tickets', authenticate, getMes);
router.post('/', authenticate, validateTicket, handleValidation, create);

// Routes superadmin — AVANT /:id pour éviter le conflit
router.get('/stats',  authenticate, requireMinRole('superadmin'), getStats);
router.get('/',       authenticate, requireMinRole('superadmin'), getAll);
router.patch('/:id',  authenticate, requireMinRole('superadmin'), update);
router.delete('/:id', authenticate, requireMinRole('superadmin'), remove);

module.exports = router;
