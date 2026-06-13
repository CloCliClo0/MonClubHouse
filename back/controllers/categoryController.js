const { Category, Club, Equipe } = require('../models');

const getByClub = async (req, res) => {
  try {
    const club_id = req.query.club_id ? parseInt(req.query.club_id) : req.user.club_id;
    const categories = await Category.findAll({
      where: { club_id, actif: true },
      order: [['nom', 'ASC']],
    });
    res.json({ success: true, data: categories });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const create = async (req, res) => {
  try {
    const club_id = req.body.club_id || req.user.club_id;
    const { nom, couleur } = req.body;
    if (!nom) return res.status(400).json({ success: false, message: 'Nom requis.' });
    const cat = await Category.create({ club_id, nom: nom.trim(), couleur: couleur || '#1b4332' });
    res.status(201).json({ success: true, data: cat });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const update = async (req, res) => {
  try {
    const club_id = req.user.club_id;
    const cat = await Category.findOne({ where: { id: req.params.id, club_id } });
    if (!cat) return res.status(404).json({ success: false, message: 'Catégorie introuvable.' });
    const { nom, couleur, actif } = req.body;
    if (nom !== undefined) cat.nom = nom.trim();
    if (couleur !== undefined) cat.couleur = couleur;
    if (actif !== undefined) cat.actif = actif;
    await cat.save();
    res.json({ success: true, data: cat });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const remove = async (req, res) => {
  try {
    const club_id = req.user.club_id;
    const cat = await Category.findOne({ where: { id: req.params.id, club_id } });
    if (!cat) return res.status(404).json({ success: false, message: 'Catégorie introuvable.' });
    await cat.destroy();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getByClub, create, update, remove };
