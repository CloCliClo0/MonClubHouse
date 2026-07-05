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
// Un coach peut gérer des codes, mais uniquement pour ses propres équipes (scopé dans le contrôleur)
const isAdminOrCoach = requireRole('superadmin', 'admin', 'dirigeant', 'coach');

// Admin/dirigeant/coach : gestion des codes
router.get('/',       authenticate, isAdminOrCoach, listCodes);
router.post('/',      authenticate, isAdminOrCoach, createCode);
router.patch('/:id/disable', authenticate, isAdminOrCoach, deleteCode);
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
