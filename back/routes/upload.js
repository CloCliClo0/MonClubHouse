const express = require('express');
const router  = express.Router();
const multer  = require('multer');
const path    = require('path');
const fs      = require('fs');
const { authenticate } = require('../middlewares/auth');
const { uploadLimiter } = require('../middlewares/rateLimiter');

const USE_DRIVE = !!(process.env.GOOGLE_DRIVE_REFRESH_TOKEN || process.env.GOOGLE_DRIVE_SERVICE_ACCOUNT_KEY);

// Whitelist stricte des types d'upload autorisés — protège contre le path traversal
const ALLOWED_TYPES = new Set(['avatar', 'club', 'banner', 'chat', 'document']);

// Extensions et MIME types autorisés
const ALLOWED_EXTENSIONS = /^(jpeg|jpg|png|gif|webp|pdf|doc|docx)$/;
const ALLOWED_MIMES = new Set([
  'image/jpeg', 'image/png', 'image/gif', 'image/webp',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);

const storage = multer.memoryStorage();
const upload  = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 Mo max (réduit depuis 20)
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase().slice(1);
    if (!ALLOWED_EXTENSIONS.test(ext)) {
      return cb(new Error('Extension non autorisée.'));
    }
    if (!ALLOWED_MIMES.has(file.mimetype)) {
      return cb(new Error('Type MIME non autorisé.'));
    }
    cb(null, true);
  },
});

// POST /api/upload/:type  (type = avatar | club | banner | chat | document)
router.post('/:type', authenticate, uploadLimiter, upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: 'Aucun fichier fourni' });

  // Validation stricte du type — empêche le path traversal
  const type = req.params.type;
  if (!ALLOWED_TYPES.has(type)) {
    return res.status(400).json({ success: false, message: 'Type d\'upload invalide.' });
  }

  // Nom de fichier sécurisé — aucun caractère spécial, aucune extension dangereuse
  const ext = path.extname(req.file.originalname).toLowerCase().replace(/[^.a-z0-9]/g, '');
  const filename = `${type}_${req.user.id}_${Date.now()}_${Math.random().toString(36).slice(2)}${ext}`;

  try {
    if (USE_DRIVE) {
      const { uploadToDrive } = require('../services/driveService');
      const result = await uploadToDrive({
        buffer:    req.file.buffer,
        filename,
        mimetype:  req.file.mimetype,
        subfolder: type,
      });
      return res.json({ success: true, url: result.url, thumbnail: result.thumbnail, driveId: result.id });
    }

    // Fallback : stockage local dans uploads/
    // path.join + resolve garantit qu'on reste dans le dossier uploads
    const baseDir = path.resolve(path.join(__dirname, '../../uploads'));
    const uploadDir = path.resolve(path.join(baseDir, type));
    if (!uploadDir.startsWith(baseDir)) {
      return res.status(400).json({ success: false, message: 'Chemin invalide.' });
    }
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
    fs.writeFileSync(path.join(uploadDir, filename), req.file.buffer);
    const url = `/uploads/${type}/${filename}`;
    return res.json({ success: true, url, thumbnail: url });

  } catch (err) {
    console.error('[Upload] Erreur:', err.message);
    return res.status(500).json({ success: false, message: 'Erreur lors de l\'upload' });
  }
});

module.exports = router;
