const express = require('express');
const router = express.Router();
const { authenticate } = require('../middlewares/auth');
const { requireRole } = require('../middlewares/rbac');
const { getServerDiagnostic } = require('../controllers/diagnosticController');

router.get('/', authenticate, requireRole('superadmin'), getServerDiagnostic);

module.exports = router;
