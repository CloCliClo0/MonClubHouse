const express = require('express');
const router = express.Router();
const { getAll, create, update, remove, validate } = require('../controllers/promoCodeController');
const { authenticate } = require('../middlewares/auth');
const { requireRole } = require('../middlewares/rbac');

router.post('/validate', authenticate, validate);
router.get('/',           authenticate, requireRole('superadmin'), getAll);
router.post('/',          authenticate, requireRole('superadmin'), create);
router.patch('/:id',      authenticate, requireRole('superadmin'), update);
router.delete('/:id',     authenticate, requireRole('superadmin'), remove);

module.exports = router;
