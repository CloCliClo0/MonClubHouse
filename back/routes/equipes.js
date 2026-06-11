const express = require('express');
const router = express.Router();
const { getAll, getById, create, update, remove, updateCoachs, getCategoriesCoach } = require('../controllers/equipeController');
const { authenticate } = require('../middlewares/auth');
const { requireMinRole, requireCoachOfTeam } = require('../middlewares/rbac');
const { validateEquipe } = require('../middlewares/validation');

router.get('/categories-coach', authenticate, requireMinRole('coach'), getCategoriesCoach);
router.get('/', authenticate, getAll);
router.get('/:id', authenticate, getById);
router.post('/', authenticate, requireMinRole('dirigeant'), validateEquipe, create);
router.put('/:id', authenticate, requireMinRole('coach'), requireCoachOfTeam, update);
router.put('/:id/coachs', authenticate, requireMinRole('dirigeant'), updateCoachs);
router.patch('/:id/disable', authenticate, requireMinRole('dirigeant'), remove);

module.exports = router;
