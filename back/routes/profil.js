const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { getProfil, updateProfil, updatePassword, uploadAvatar, getHistorique, getEnfants, unlinkGoogle, setInitialPassword } = require('../controllers/profilController');
const { getMes, marquerLue, marquerToutesLues } = require('../controllers/notificationController');
const { authenticate } = require('../middlewares/auth');
const { validateUpdateProfil } = require('../middlewares/validation');
const { validationResult } = require('express-validator');

const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });
  next();
};

const UPLOAD_DIR = path.join(__dirname, '..', '..', 'uploads');
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    cb(null, `avatar-${req.user.id}-${Date.now()}${path.extname(file.originalname)}`);
  }
});
const upload = multer({ storage, limits: { fileSize: 2 * 1024 * 1024 } });

router.get('/', authenticate, getProfil);
router.put('/', authenticate, validateUpdateProfil, handleValidation, updateProfil);
router.put('/password', authenticate, updatePassword);
router.post('/avatar', authenticate, upload.single('avatar'), uploadAvatar);
router.get('/historique', authenticate, getHistorique);
router.get('/enfants', authenticate, getEnfants);
router.delete('/google-unlink', authenticate, unlinkGoogle);
router.post('/set-initial-password', authenticate, setInitialPassword);

// Notifications
router.get('/notifications', authenticate, getMes);
router.patch('/notifications/:id/lue', authenticate, marquerLue);
router.patch('/notifications/toutes-lues', authenticate, marquerToutesLues);

module.exports = router;
