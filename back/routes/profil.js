const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { getProfil, updateProfil, updatePassword, uploadAvatar, getHistorique, getEnfants, unlinkGoogle, setInitialPassword, resendVerifyEmail, send2faCode, enable2fa, disable2fa } = require('../controllers/profilController');
const { getMes, marquerLue, marquerToutesLues } = require('../controllers/notificationController');
const { authenticate } = require('../middlewares/auth');
const { validateUpdateProfil } = require('../middlewares/validation');
const { validationResult } = require('express-validator');

const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });
  next();
};

const AVATAR_MIMES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

// memoryStorage : le buffer est passé au driveService, qui gère le stockage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (AVATAR_MIMES.has(file.mimetype)) return cb(null, true);
    const err = new Error('Type de fichier non autorisé. JPEG, PNG, WebP ou GIF uniquement.');
    err.status = 400;
    cb(err);
  },
});

router.get('/', authenticate, getProfil);
router.put('/', authenticate, validateUpdateProfil, handleValidation, updateProfil);
router.put('/password', authenticate, updatePassword);
router.post('/avatar', authenticate, upload.single('avatar'), uploadAvatar);
router.get('/historique', authenticate, getHistorique);
router.get('/enfants', authenticate, getEnfants);
router.delete('/google-unlink', authenticate, unlinkGoogle);
router.post('/set-initial-password', authenticate, setInitialPassword);
router.post('/resend-verify-email',  authenticate, resendVerifyEmail);
router.post('/2fa/send-code', authenticate, send2faCode);
router.post('/2fa/enable',    authenticate, enable2fa);
router.post('/2fa/disable',   authenticate, disable2fa);

// Notifications
router.get('/notifications', authenticate, getMes);
router.patch('/notifications/:id/lue', authenticate, marquerLue);
router.patch('/notifications/toutes-lues', authenticate, marquerToutesLues);

module.exports = router;
