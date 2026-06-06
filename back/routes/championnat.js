const express = require('express');
const router = express.Router();
const {
  getClassement, getChampionnats, deleteChampionnat,
  addEquipe, updateEquipe, removeEquipe,
  addMatch, updateMatch, deleteMatch,
  getCoachs, addCoach, removeCoach,
} = require('../controllers/championnatController');
const { authenticate } = require('../middlewares/auth');
const { requireMinRole } = require('../middlewares/rbac');

router.get('/',          authenticate, getClassement);
router.get('/list',      authenticate, getChampionnats);
router.delete('/complet', authenticate, requireMinRole('coach'), deleteChampionnat);

router.post('/equipes',        authenticate, requireMinRole('coach'), addEquipe);
router.patch('/equipes/:id',   authenticate, requireMinRole('coach'), updateEquipe);
router.delete('/equipes/:id',  authenticate, requireMinRole('coach'), removeEquipe);

router.post('/matchs',         authenticate, requireMinRole('coach'), addMatch);
router.patch('/matchs/:id',    authenticate, requireMinRole('coach'), updateMatch);
router.delete('/matchs/:id',   authenticate, requireMinRole('coach'), deleteMatch);

router.get('/coachs',          authenticate, requireMinRole('coach'), getCoachs);
router.post('/coachs',         authenticate, requireMinRole('dirigeant'), addCoach);
router.delete('/coachs',       authenticate, requireMinRole('dirigeant'), removeCoach);

module.exports = router;
