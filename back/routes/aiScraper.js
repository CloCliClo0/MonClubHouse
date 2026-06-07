const express = require('express');
const router = express.Router();
const multer = require('multer');
const { getQuota, analyseWithAI, importMatches } = require('../controllers/aiScraperController');
const { authenticate } = require('../middlewares/auth');
const { requireMinRole } = require('../middlewares/rbac');

const ALLOWED_MIMES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf'];

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 Mo max
  fileFilter(_req, file, cb) {
    if (ALLOWED_MIMES.includes(file.mimetype)) return cb(null, true);
    cb(new Error('Type de fichier non supporté. Utilisez une image (JPG, PNG, WebP) ou un PDF.'));
  },
});

// Accès : coach et au-dessus (coach=3, dirigeant=4, admin=5, superadmin=6)
router.get('/quota',   authenticate, requireMinRole('coach'), getQuota);
router.post('/analyse', authenticate, requireMinRole('coach'), upload.single('file'), analyseWithAI);
router.post('/import',  authenticate, requireMinRole('coach'), importMatches);

module.exports = router;
