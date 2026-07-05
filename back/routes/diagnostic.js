const express = require('express');
const router = express.Router();
const { authenticate } = require('../middlewares/auth');
const { requireRole } = require('../middlewares/rbac');
const { getServerDiagnostic, testGemini, testStripe, testDrive, testDiag2fa, testDiagEmailVerify, testEmail, testNotification, testConvocEmail } = require('../controllers/diagnosticController');

router.get('/',                    authenticate, requireRole('superadmin'), getServerDiagnostic);
router.get('/gemini',              authenticate, requireRole('superadmin'), testGemini);
router.get('/stripe',              authenticate, requireRole('superadmin'), testStripe);
router.get('/drive',               authenticate, requireRole('superadmin'), testDrive);
router.post('/test-email',         authenticate, requireRole('superadmin'), testEmail);
router.post('/test-notification',  authenticate, requireRole('superadmin'), testNotification);
router.post('/test-2fa',           authenticate, requireRole('superadmin'), testDiag2fa);
router.post('/test-email-verify',  authenticate, requireRole('superadmin'), testDiagEmailVerify);
router.post('/test-convoc-email',  authenticate, requireRole('superadmin'), testConvocEmail);

module.exports = router;
