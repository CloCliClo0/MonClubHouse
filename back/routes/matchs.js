const express = require('express');
const router = express.Router();
const { getAll, getById, create, update, saisirScore, remove } = require('../controllers/matchController');
const { getByMatch, creerConvocations, repondre, repondreParent, renvoyerEmail } = require('../controllers/convocationController');
const { getByMatch: getCompo, upsert: upsertCompo, getFormations } = require('../controllers/compositionController');
const { authenticate } = require('../middlewares/auth');
const { requireMinRole, requireRole } = require('../middlewares/rbac');
const { validateMatch } = require('../middlewares/validation');

router.get('/', authenticate, getAll);
router.get('/formations', authenticate, getFormations);
router.get('/:id', authenticate, getById);
router.post('/', authenticate, requireMinRole('coach'), validateMatch, create);
router.put('/:id', authenticate, requireMinRole('coach'), update);
router.patch('/:id/score', authenticate, requireMinRole('dirigeant'), saisirScore);
router.patch('/:id/disable', authenticate, requireMinRole('dirigeant'), remove);

// Convocations
router.get('/:matchId/convocations', authenticate, getByMatch);
router.post('/:matchId/convocations', authenticate, requireMinRole('coach'), creerConvocations);
router.patch('/:matchId/reponse', authenticate, requireRole('joueur', 'parent', 'coach'), repondre);
router.patch('/:matchId/reponse-parent', authenticate, requireRole('parent'), repondreParent);
router.post('/:matchId/convocations/:joueurId/email', authenticate, requireMinRole('coach'), renvoyerEmail);

// Composition
router.get('/:matchId/composition', authenticate, getCompo);
router.post('/composition', authenticate, requireMinRole('coach'), upsertCompo);

module.exports = router;
