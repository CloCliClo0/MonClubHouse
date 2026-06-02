const express = require('express');
const router  = express.Router();
const multer  = require('multer');
const path    = require('path');
const fs      = require('fs');
const { authenticate } = require('../middlewares/auth');

const USE_DRIVE = !!(process.env.GOOGLE_DRIVE_REFRESH_TOKEN || process.env.GOOGLE_DRIVE_SERVICE_ACCOUNT_KEY);

// Stockage local en fallback
const storage = multer.memoryStorage();
const upload  = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp|svg|mp4|mov|avi|pdf|doc|docx/;
    const ext = path.extname(file.originalname).toLowerCase().slice(1);
    cb(null, allowed.test(ext));
  },
});

// POST /api/upload/:type  (type = avatar | club | banner | chat)
router.post('/:type', authenticate, upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: 'Aucun fichier fourni' });

  const type     = req.params.type;
  const filename = `${type}_${Date.now()}_${Math.random().toString(36).slice(2)}${path.extname(req.file.originalname)}`;

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
    const uploadDir = path.join(__dirname, '../../uploads', type);
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
