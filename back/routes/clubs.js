const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { getAll, getById, create, update, uploadLogo, getStats, getTerrains, createTerrain, updateTerrain, deleteTerrain, deleteClub } = require('../controllers/clubController');
const { validateCode, joinByCode, listCodes, createCode, deleteCode, getClubPlayers, linkChild } = require('../controllers/inviteCodeController');
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

// Public: validate a code before joining
router.get('/codes/validate/:code', validateCode);

// Authenticated: join club using a code
router.post('/join', authenticate, joinByCode);

// Parent: list players to link child
router.get('/players', authenticate, getClubPlayers);
router.post('/link-child', authenticate, linkChild);

// Admin/Dirigeant: manage codes
router.get('/codes', authenticate, listCodes);
router.post('/codes', authenticate, requireMinRole('dirigeant'), createCode);
router.delete('/codes/:id', authenticate, requireMinRole('dirigeant'), deleteCode);

// Stats et terrains (avant /:id pour éviter le conflit)
router.get('/stats',          authenticate, getStats);
router.get('/terrains',       authenticate, getTerrains);
router.post('/terrains',      authenticate, requireMinRole('dirigeant'), createTerrain);
router.put('/terrains/:id',   authenticate, requireMinRole('dirigeant'), updateTerrain);
router.delete('/terrains/:id',authenticate, requireMinRole('dirigeant'), deleteTerrain);

router.get('/', getAll);
router.get('/:id', getById);
router.post('/', authenticate, requireMinRole('admin'), validateClub, create);
router.put('/:id', authenticate, requireMinRole('admin'), update);
router.patch('/:id', authenticate, requireMinRole('admin'), update);
router.delete('/:id', authenticate, requireMinRole('superadmin'), deleteClub);
router.post('/:id/logo', authenticate, requireMinRole('admin'), upload.single('logo'), uploadLogo);

module.exports = router;
