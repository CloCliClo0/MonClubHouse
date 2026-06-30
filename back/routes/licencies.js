const express = require('express');
const router = express.Router();
const { getAll, getById, create, update, changerEquipe, mesConvocations } = require('../controllers/licencieController');
const { authenticate } = require('../middlewares/auth');
const { requireMinRole } = require('../middlewares/rbac');

// Route spécifique avant /:id pour éviter le conflit
router.get('/mes-convocations', authenticate, mesConvocations);

router.get('/', authenticate, requireMinRole('coach'), getAll);
router.get('/:id', authenticate, getById);
router.post('/', authenticate, requireMinRole('coach'), create);
router.put('/:id', authenticate, requireMinRole('dirigeant'), update);
router.patch('/:id/equipe', authenticate, requireMinRole('dirigeant'), changerEquipe);

module.exports = router;
