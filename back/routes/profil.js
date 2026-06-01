const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { getProfil, updateProfil, updatePassword, uploadAvatar, getHistorique, getEnfants } = require('../controllers/profilController');
const { getMes, marquerLue, marquerToutesLues } = require('../controllers/notificationController');
const { authenticate } = require('../middlewares/auth');

const storage = multer.diskStorage({
  destination: './public/uploads/',
  filename: (req, file, cb) => {
    cb(null, `avatar-${req.user.id}-${Date.now()}${path.extname(file.originalname)}`);
  }
});
const upload = multer({ storage, limits: { fileSize: 2 * 1024 * 1024 } });

router.get('/', authenticate, getProfil);
router.put('/', authenticate, updateProfil);
router.put('/password', authenticate, updatePassword);
router.post('/avatar', authenticate, upload.single('avatar'), uploadAvatar);
router.get('/historique', authenticate, getHistorique);
router.get('/enfants', authenticate, getEnfants);

// Notifications
router.get('/notifications', authenticate, getMes);
router.patch('/notifications/:id/lue', authenticate, marquerLue);
router.patch('/notifications/toutes-lues', authenticate, marquerToutesLues);

module.exports = router;
