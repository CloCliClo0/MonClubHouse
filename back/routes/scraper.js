const express = require('express');
const router = express.Router();
const { analyseHTML, importMatches } = require('../controllers/scraperController');
const { authenticate } = require('../middlewares/auth');
const { requireMinRole } = require('../middlewares/rbac');

router.post('/analyse', authenticate, requireMinRole('admin'), analyseHTML);
router.post('/import',  authenticate, requireMinRole('admin'), importMatches);

module.exports = router;
