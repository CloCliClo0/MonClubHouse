const express = require('express');
const router = express.Router();
const { authenticateToken, requireMinRole } = require('../middlewares/auth');
const { getPresences, getMesPresences, addPresence, deletePresence, getStats } = require('../controllers/arbitrageController');

router.use(authenticateToken);

router.get('/presences', requireMinRole('joueur'), getPresences);
router.get('/mes-presences', requireMinRole('joueur'), getMesPresences);
router.post('/presences', requireMinRole('joueur'), addPresence);
router.delete('/presences/:id', requireMinRole('joueur'), deletePresence);
router.get('/stats', requireMinRole('dirigeant'), getStats);

module.exports = router;
