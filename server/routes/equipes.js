const express = require('express');
const router = express.Router();
const { getAll, getById, create, update, remove } = require('../controllers/equipeController');
const { authenticate } = require('../middlewares/auth');
const { requireMinRole } = require('../middlewares/rbac');
const { validateEquipe } = require('../middlewares/validation');

router.get('/', authenticate, getAll);
router.get('/:id', authenticate, getById);
router.post('/', authenticate, requireMinRole('dirigeant'), validateEquipe, create);
router.put('/:id', authenticate, requireMinRole('dirigeant'), update);
router.delete('/:id', authenticate, requireMinRole('admin'), remove);

module.exports = router;
