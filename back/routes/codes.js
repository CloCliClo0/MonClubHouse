const express = require('express');
const router  = express.Router();
const { authenticate }            = require('../middlewares/auth');
const { requireRole }             = require('../middlewares/rbac');
const {
  listCodes, createCode, deleteCode,
  validateCode, linkChild, myChildren, clubPlayers,
} = require('../controllers/codesController');

const isAdmin = requireRole('superadmin', 'admin', 'dirigeant');

// Admin : gestion des codes
router.get('/',       authenticate, isAdmin, listCodes);
router.post('/',      authenticate, isAdmin, createCode);
router.delete('/:id', authenticate, isAdmin, deleteCode);

// Utilisateur : rejoindre avec un code
router.post('/validate', authenticate, validateCode);

// Parent : liaison enfant
router.post('/link-child',  authenticate, linkChild);
router.get('/my-children',  authenticate, myChildren);
router.get('/club-players', authenticate, clubPlayers);

module.exports = router;
