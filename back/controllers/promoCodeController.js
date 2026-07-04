const { PromoCode } = require('../models');
const { Op } = require('sequelize');

// GET /api/promo-codes — superadmin uniquement
const getAll = async (req, res) => {
  try {
    const codes = await PromoCode.findAll({ order: [['createdAt', 'DESC']] });
    return res.json({ success: true, data: codes });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

const ALLOWED_CREATE = ['code', 'type', 'valeur', 'description', 'max_uses', 'expires_at'];
const ALLOWED_UPDATE = ['type', 'valeur', 'description', 'max_uses', 'expires_at', 'actif'];

// POST /api/promo-codes
const create = async (req, res) => {
  try {
    const data = {};
    for (const key of ALLOWED_CREATE) {
      if (req.body[key] !== undefined) data[key] = req.body[key];
    }
    if (!data.code || !data.valeur) {
      return res.status(400).json({ success: false, message: 'Code et valeur requis' });
    }
    data.code = String(data.code).toUpperCase().trim();
    data.created_by = req.user.id;

    const existing = await PromoCode.findOne({ where: { code: data.code } });
    if (existing) return res.status(409).json({ success: false, message: 'Ce code existe déjà' });

    const promo = await PromoCode.create(data);
    return res.status(201).json({ success: true, data: promo });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

// PATCH /api/promo-codes/:id
const update = async (req, res) => {
  try {
    const promo = await PromoCode.findByPk(req.params.id);
    if (!promo) return res.status(404).json({ success: false, message: 'Code introuvable' });
    const updates = {};
    for (const key of ALLOWED_UPDATE) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }
    await promo.update(updates);
    return res.json({ success: true, data: promo });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

// DELETE /api/promo-codes/:id
const remove = async (req, res) => {
  try {
    const promo = await PromoCode.findByPk(req.params.id);
    if (!promo) return res.status(404).json({ success: false, message: 'Code introuvable' });
    await promo.destroy();
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

// POST /api/promo-codes/validate — accessible à tout utilisateur authentifié (page abonnement)
const validate = async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) return res.status(400).json({ success: false, message: 'Code requis' });

    const promo = await PromoCode.findOne({
      where: {
        code: String(code).toUpperCase().trim(),
        actif: true,
        [Op.or]: [{ expires_at: null }, { expires_at: { [Op.gt]: new Date() } }],
      },
    });
    if (!promo) return res.status(404).json({ success: false, message: 'Code invalide ou expiré' });
    if (promo.max_uses !== null && promo.uses_count >= promo.max_uses) {
      return res.status(410).json({ success: false, message: 'Ce code a atteint sa limite d\'utilisation' });
    }

    return res.json({
      success: true,
      data: { code: promo.code, type: promo.type, valeur: promo.valeur, description: promo.description },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

module.exports = { getAll, create, update, remove, validate };
