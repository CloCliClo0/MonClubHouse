const express = require('express');
const router = express.Router();
const { authenticate } = require('../middlewares/auth');
const { requireMinRole } = require('../middlewares/rbac');
const { getPresences, getMesPresences, addPresence, deletePresence, getStats } = require('../controllers/arbitrageController');

router.use(authenticate);

router.get('/presences', requireMinRole('joueur'), getPresences);
router.get('/mes-presences', requireMinRole('joueur'), getMesPresences);
router.post('/presences', requireMinRole('joueur'), addPresence);
router.delete('/presences/:id', requireMinRole('joueur'), deletePresence);
router.get('/stats', requireMinRole('dirigeant'), getStats);

module.exports = router;
