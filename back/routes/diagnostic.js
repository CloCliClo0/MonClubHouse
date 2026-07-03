const express = require('express');
const router = express.Router();
const { authenticate } = require('../middlewares/auth');
const { requireRole } = require('../middlewares/rbac');
const { getServerDiagnostic, testGemini, testEmail, testNotification } = require('../controllers/diagnosticController');

router.get('/',                 authenticate, requireRole('superadmin'), getServerDiagnostic);
router.get('/gemini',           authenticate, requireRole('superadmin'), testGemini);
router.post('/test-email',      authenticate, requireRole('superadmin'), testEmail);
router.post('/test-notification', authenticate, requireRole('superadmin'), testNotification);

module.exports = router;
