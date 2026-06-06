const { Adversaire } = require('../models');

const getAll = async (req, res) => {
  try {
    const where = { club_id: req.user.club_id };
    if (req.query.categorie) where.categorie = req.query.categorie;
    const data = await Adversaire.findAll({ where, order: [['nom', 'ASC']] });
    return res.json({ success: true, data });
  } catch {
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

const getById = async (req, res) => {
  try {
    const adv = await Adversaire.findOne({ where: { id: req.params.id, club_id: req.user.club_id } });
    if (!adv) return res.status(404).json({ success: false, message: 'Adversaire introuvable' });
    return res.json({ success: true, data: adv });
  } catch {
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

const create = async (req, res) => {
  try {
    const { nom, categorie, ville, contact, telephone, couleur } = req.body;
    if (!nom?.trim()) return res.status(400).json({ success: false, message: 'Nom requis' });
    const adv = await Adversaire.create({
      club_id: req.user.club_id,
      nom: nom.trim(),
      categorie: categorie || null,
      ville: ville || null,
      contact: contact || null,
      telephone: telephone || null,
      couleur: couleur || '#1b4332',
    });
    return res.status(201).json({ success: true, data: adv });
  } catch {
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

const update = async (req, res) => {
  try {
    const adv = await Adversaire.findOne({ where: { id: req.params.id, club_id: req.user.club_id } });
    if (!adv) return res.status(404).json({ success: false, message: 'Adversaire introuvable' });
    await adv.update(req.body);
    return res.json({ success: true, data: adv });
  } catch {
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

const remove = async (req, res) => {
  try {
    const adv = await Adversaire.findOne({ where: { id: req.params.id, club_id: req.user.club_id } });
    if (!adv) return res.status(404).json({ success: false, message: 'Adversaire introuvable' });
    await adv.destroy();
    return res.json({ success: true, message: 'Adversaire supprimé' });
  } catch {
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

module.exports = { getAll, getById, create, update, remove };
