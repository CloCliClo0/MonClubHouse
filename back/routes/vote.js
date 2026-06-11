const express = require('express');
const router = express.Router();
const { authenticate } = require('../middlewares/auth');
const { requireMinRole } = require('../middlewares/rbac');
const { getVotes, voter } = require('../controllers/voteController');

router.use(authenticate);

router.get('/:matchId', requireMinRole('joueur'), getVotes);
router.post('/:matchId', requireMinRole('joueur'), voter);

module.exports = router;
