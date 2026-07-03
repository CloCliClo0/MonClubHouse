const express = require('express');
const router = express.Router();
const { authenticate } = require('../middlewares/auth');
const { requireRole } = require('../middlewares/rbac');
const { getServerDiagnostic, testGemini } = require('../controllers/diagnosticController');

router.get('/', authenticate, requireRole('superadmin'), getServerDiagnostic);
router.get('/gemini', authenticate, requireRole('superadmin'), testGemini);

module.exports = router;
