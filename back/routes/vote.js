const express = require('express');
const router = express.Router();
const { authenticateToken, requireMinRole } = require('../middlewares/auth');
const { getVotes, voter } = require('../controllers/voteController');

router.use(authenticateToken);

router.get('/:matchId', requireMinRole('joueur'), getVotes);
router.post('/:matchId', requireMinRole('joueur'), voter);

module.exports = router;
