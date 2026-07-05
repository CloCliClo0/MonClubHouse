const { Adversaire } = require('../models');

const getAll = async (req, res) => {
  try {
    const where = {};
    if (req.user.club_id !== null) where.club_id = req.user.club_id;
    if (req.query.categorie) where.categorie = req.query.categorie;
    const data = await Adversaire.findAll({ where, order: [['nom', 'ASC']] });
    return res.json({ success: true, data });
  } catch {
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

const getById = async (req, res) => {
  try {
    const where = { id: req.params.id };
    if (req.user.club_id !== null) where.club_id = req.user.club_id;
    const adv = await Adversaire.findOne({ where });
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
    // Un superadmin n'a pas de club_id propre — il doit pouvoir en préciser un explicitement.
    const club_id = req.user.role === 'superadmin' ? (req.body.club_id || req.user.club_id) : req.user.club_id;
    if (!club_id) return res.status(400).json({ success: false, message: 'club_id requis' });
    const adv = await Adversaire.create({
      club_id,
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
    const whereUpd = { id: req.params.id };
    if (req.user.club_id !== null) whereUpd.club_id = req.user.club_id;
    const adv = await Adversaire.findOne({ where: whereUpd });
    if (!adv) return res.status(404).json({ success: false, message: 'Adversaire introuvable' });
    // Whitelist explicite — empêche la modification de club_id ou d'autres champs sensibles
    const { nom, categorie, ville, contact, telephone, couleur } = req.body;
    const updates = {};
    if (nom       !== undefined) updates.nom       = String(nom).trim().slice(0, 200);
    if (categorie !== undefined) updates.categorie = categorie || null;
    if (ville     !== undefined) updates.ville     = ville ? String(ville).slice(0, 200) : null;
    if (contact   !== undefined) updates.contact   = contact ? String(contact).slice(0, 200) : null;
    if (telephone !== undefined) updates.telephone = telephone ? String(telephone).slice(0, 30) : null;
    if (couleur   !== undefined) updates.couleur   = /^#[0-9a-fA-F]{6}$/.test(couleur) ? couleur : adv.couleur;
    await adv.update(updates);
    return res.json({ success: true, data: adv });
  } catch {
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

const remove = async (req, res) => {
  try {
    const whereDel = { id: req.params.id };
    if (req.user.club_id !== null) whereDel.club_id = req.user.club_id;
    const adv = await Adversaire.findOne({ where: whereDel });
    if (!adv) return res.status(404).json({ success: false, message: 'Adversaire introuvable' });
    await adv.destroy();
    return res.json({ success: true, message: 'Adversaire supprimé' });
  } catch {
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

module.exports = { getAll, getById, create, update, remove };
