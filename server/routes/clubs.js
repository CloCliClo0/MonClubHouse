const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { getAll, getById, create, update, uploadLogo } = require('../controllers/clubController');
const { authenticate } = require('../middlewares/auth');
const { requireMinRole } = require('../middlewares/rbac');
const { validateClub } = require('../middlewares/validation');

const storage = multer.diskStorage({
  destination: './public/uploads/',
  filename: (req, file, cb) => {
    cb(null, `club-${Date.now()}${path.extname(file.originalname)}`);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (/image\/(jpeg|png|gif|webp)/.test(file.mimetype)) cb(null, true);
    else cb(new Error('Format image non supporté'));
  }
});

router.get('/', getAll);
router.get('/:id', getById);
router.post('/', authenticate, requireMinRole('admin'), validateClub, create);
router.put('/:id', authenticate, requireMinRole('admin'), update);
router.post('/:id/logo', authenticate, requireMinRole('admin'), upload.single('logo'), uploadLogo);

module.exports = router;
