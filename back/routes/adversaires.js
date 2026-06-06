const express = require('express');
const router = express.Router();
const { getAll, getById, create, update, remove } = require('../controllers/adversaireController');
const { authenticate } = require('../middlewares/auth');
const { requireMinRole } = require('../middlewares/rbac');

router.get('/',      authenticate, getAll);
router.get('/:id',   authenticate, getById);
router.post('/',     authenticate, requireMinRole('coach'), create);
router.patch('/:id', authenticate, requireMinRole('coach'), update);
router.delete('/:id',authenticate, requireMinRole('dirigeant'), remove);

module.exports = router;
