const { Category, Club, Equipe, User } = require('../models');
const { assignUserToEquipes, equipeIdsForCategory } = require('../services/rosterService');

const ASSIGNABLE_ROLES = ['joueur', 'parent', 'coach'];

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

// POST /api/categories/:id/assign — affecte un utilisateur à TOUTES les équipes actives de la catégorie
const assignMember = async (req, res) => {
  try {
    // Résout la catégorie par son id d'abord — son propre club_id fait foi, pas celui du requérant
    // (un superadmin n'a pas de club_id propre ; se fier à req.body.club_id serait fragile si le
    // frontend oublie de l'envoyer, comme ce fut le cas).
    const cat = await Category.findByPk(req.params.id);
    if (!cat) return res.status(404).json({ success: false, message: 'Catégorie introuvable.' });
    if (req.user.role !== 'superadmin' && cat.club_id !== req.user.club_id) {
      return res.status(403).json({ success: false, message: 'Accès interdit à cette catégorie.' });
    }
    const club_id = cat.club_id;

    const { user_id, role } = req.body;
    if (!user_id || !ASSIGNABLE_ROLES.includes(role)) {
      return res.status(400).json({ success: false, message: 'user_id et role (joueur/parent/coach) requis.' });
    }

    const user = await User.findOne({ where: { id: user_id, club_id } });
    if (!user) return res.status(404).json({ success: false, message: 'Utilisateur introuvable dans ce club.' });

    const equipeIds = await equipeIdsForCategory({ clubId: club_id, categorieId: cat.id });
    if (equipeIds.length === 0) {
      return res.status(400).json({ success: false, message: 'Aucune équipe active dans cette catégorie.' });
    }

    const { assignedCount } = await assignUserToEquipes({ userId: user.id, clubId: club_id, equipeIds, role });
    return res.json({ success: true, data: { assigned_count: assignedCount } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getByClub, create, update, remove, assignMember };
