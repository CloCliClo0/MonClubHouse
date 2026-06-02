const express = require('express');
const router  = express.Router();
const { authenticate } = require('../middlewares/auth');
const { rbac }         = require('../middlewares/rbac');
const {
  listCodes, createCode, deleteCode,
  validateCode, linkChild, myChildren, clubPlayers,
} = require('../controllers/codesController');

// Admin : gestion des codes
router.get('/',    authenticate, rbac(['superadmin','admin','dirigeant']), listCodes);
router.post('/',   authenticate, rbac(['superadmin','admin','dirigeant']), createCode);
router.delete('/:id', authenticate, rbac(['superadmin','admin','dirigeant']), deleteCode);

// Utilisateur : rejoindre avec un code
router.post('/validate', authenticate, validateCode);

// Parent : liaison enfant
router.post('/link-child',  authenticate, linkChild);
router.get('/my-children',  authenticate, myChildren);
router.get('/club-players', authenticate, clubPlayers);

module.exports = router;
