const express = require('express');
const router = express.Router();
const { getResultatsLocaux, getClassementFFF, getResultatsFFF } = require('../controllers/resultatController');
const { optionalAuth } = require('../middlewares/auth');

// Public — accessibles aux visiteurs
router.get('/', optionalAuth, getResultatsLocaux);
router.get('/fff/:competition_id/classement', optionalAuth, getClassementFFF);
router.get('/fff/:competition_id', optionalAuth, getResultatsFFF);

module.exports = router;
