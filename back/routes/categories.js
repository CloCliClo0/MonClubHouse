const express = require('express');
const router = express.Router();
const { authenticate, requireRole } = require('../middlewares/auth');
const ctrl = require('../controllers/categoryController');

router.get('/', authenticate, ctrl.getByClub);
router.post('/', authenticate, requireRole(['admin', 'dirigeant', 'superadmin']), ctrl.create);
router.put('/:id', authenticate, requireRole(['admin', 'dirigeant', 'superadmin']), ctrl.update);
router.delete('/:id', authenticate, requireRole(['admin', 'dirigeant', 'superadmin']), ctrl.remove);

module.exports = router;
