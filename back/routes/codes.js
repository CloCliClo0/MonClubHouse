const express = require('express');
const router  = express.Router();
const { authenticate }            = require('../middlewares/auth');
const { requireRole }             = require('../middlewares/rbac');
const {
  listCodes, createCode, deleteCode, hardDeleteCode,
  validateCode, linkChild, myChildren, clubPlayers,
  createChild, joinChildByCode,
} = require('../controllers/codesController');

const isAdmin = requireRole('superadmin', 'admin', 'dirigeant');
// Consultation/désactivation : admin/dirigeant/coach (un coach reste scopé à ses équipes dans le contrôleur)
const canManageCodes = requireRole('superadmin', 'admin', 'dirigeant', 'coach');
// Création : dirigeant exclu — seuls superadmin/admin/coach peuvent générer un nouveau code
// (coach restreint aux rôles joueur/parent et à ses propres équipes, vérifié dans le contrôleur)
const canCreateCodes = requireRole('superadmin', 'admin', 'coach');

router.get('/',       authenticate, canManageCodes, listCodes);
router.post('/',      authenticate, canCreateCodes, createCode);
router.patch('/:id/disable', authenticate, canManageCodes, deleteCode);
router.delete('/:id', authenticate, isAdmin, hardDeleteCode);

// Utilisateur : rejoindre avec un code
router.post('/validate', authenticate, validateCode);

// Parent : liaison enfant
router.post('/link-child',  authenticate, linkChild);
router.get('/my-children',  authenticate, myChildren);
router.get('/club-players', authenticate, clubPlayers);
router.post('/children',    authenticate, createChild);
router.post('/join-child',  authenticate, joinChildByCode);

module.exports = router;
