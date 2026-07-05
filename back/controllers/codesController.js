const { InviteCode, Equipe, Club, User, Licencie, Category, EquipeCoach } = require('../models');
const { Op } = require('sequelize');
const crypto = require('crypto');
const { assignUserToEquipes, equipeIdsForCategory, equipeIdsForCategoryByName } = require('../services/rosterService');

// Génère un code lisible ex: MCH-U15-A3F2
const makeCode = (prefix = 'MCH') =>
  `${prefix}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

// IDs des équipes qu'un coach encadre lui-même (via EquipeCoach).
const coachedEquipeIds = async (userId) => {
  const links = await EquipeCoach.findAll({ where: { user_id: userId }, attributes: ['equipe_id'] });
  return links.map(l => l.equipe_id);
};

// GET /api/codes — liste les codes (tous les clubs pour superadmin, seulement ses équipes pour un coach)
const listCodes = async (req, res) => {
  try {
    const where = {};
    // superadmin voit tous les codes ; sinon filtre par club
    if (req.user.role !== 'superadmin' && req.user.club_id) {
      where.club_id = req.user.club_id;
    }
    if (req.query.club_id) where.club_id = req.query.club_id;

    if (req.user.role === 'coach') {
      // Un coach ne voit jamais les codes d'une équipe qu'il n'encadre pas, même en forçant
      // ?equipe_id= dans la requête — l'intersection avec ses propres équipes fait toujours foi.
      const myEquipeIds = await coachedEquipeIds(req.user.id);
      where.equipe_id = req.query.equipe_id
        ? { [Op.in]: myEquipeIds.filter(id => id === parseInt(req.query.equipe_id)) }
        : { [Op.in]: myEquipeIds };
    } else if (req.query.equipe_id) {
      where.equipe_id = req.query.equipe_id;
    }

    const codes = await InviteCode.findAll({
      where,
      include: [
        { model: Equipe, as: 'equipe', attributes: ['id', 'nom', 'categorie_id'], required: false,
          include: [{ model: Category, as: 'categorie', attributes: ['id', 'nom'], required: false }] },
        { model: Club,   as: 'club',   attributes: ['id', 'nom'],             required: false },
      ],
      order: [['created_at', 'DESC']],
    });
    return res.json({ success: true, data: codes });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/codes — créer un code (admin/dirigeant : n'importe quelle équipe du club ;
// coach : uniquement une équipe qu'il encadre lui-même, et seulement pour joueur/parent)
const createCode = async (req, res) => {
  try {
    const { equipe_id, categorie, role = 'joueur', label, max_uses = 50, expires_at } = req.body;
    const club_id = req.user.role === 'superadmin' ? (req.body.club_id || req.user.club_id) : req.user.club_id;

    if (!club_id) return res.status(400).json({ success: false, message: 'club_id requis' });

    // Pour les rôles liés, il faut soit equipe_id soit categorie
    if (['joueur', 'parent', 'coach'].includes(role) && !equipe_id && !categorie) {
      return res.status(400).json({ success: false, message: 'equipe_id ou categorie requis pour ce rôle' });
    }

    if (req.user.role === 'coach') {
      if (!['joueur', 'parent'].includes(role)) {
        return res.status(403).json({ success: false, message: 'Un coach ne peut générer que des codes joueur ou parent.' });
      }
      const myEquipeIds = await coachedEquipeIds(req.user.id);
      if (!equipe_id || !myEquipeIds.includes(parseInt(equipe_id))) {
        return res.status(403).json({ success: false, message: 'Vous ne pouvez créer un code que pour une équipe que vous encadrez.' });
      }
    }

    let equipe = null;
    if (equipe_id) {
      equipe = await Equipe.findOne({
        where: { id: equipe_id, club_id },
        include: [{ model: Category, as: 'categorie', attributes: ['id', 'nom'], required: false }],
      });
      if (!equipe) return res.status(404).json({ success: false, message: 'Équipe introuvable' });
    }

    const catLabel = (categorie || equipe?.categorie?.nom || '').replace(/\s+/g, '').slice(0, 4).toUpperCase() || 'MCH';
    let code, exists = true;
    while (exists) {
      code = makeCode(catLabel);
      exists = await InviteCode.findOne({ where: { code } });
    }

    const newCode = await InviteCode.create({
      code,
      equipe_id: equipe_id || null,
      categorie: categorie || equipe?.categorie?.nom || null,
      club_id,
      role,
      label,
      created_by: req.user.id,
      max_uses,
      expires_at: expires_at || null,
    });

    return res.status(201).json({ success: true, data: newCode });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// PATCH /api/codes/:id/disable — désactiver un code (soft)
const deleteCode = async (req, res) => {
  try {
    const where = { id: req.params.id };
    if (req.user.role !== 'superadmin' && req.user.club_id) where.club_id = req.user.club_id;
    if (req.user.role === 'coach') where.equipe_id = { [Op.in]: await coachedEquipeIds(req.user.id) };
    const code = await InviteCode.findOne({ where });
    if (!code) return res.status(404).json({ success: false, message: 'Code introuvable' });
    await code.update({ actif: false });
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE /api/codes/:id — supprimer définitivement un code
const hardDeleteCode = async (req, res) => {
  try {
    const where = { id: req.params.id };
    if (req.user.role !== 'superadmin' && req.user.club_id) where.club_id = req.user.club_id;
    const code = await InviteCode.findOne({ where });
    if (!code) return res.status(404).json({ success: false, message: 'Code introuvable' });
    await code.destroy();
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/codes/validate — valide un code et lie l'utilisateur à l'équipe
const validateCode = async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) return res.status(400).json({ success: false, message: 'Code requis' });

    const inviteCode = await InviteCode.findOne({
      where: {
        code: code.toUpperCase().trim(),
        actif: true,
        [Op.or]: [{ expires_at: null }, { expires_at: { [Op.gt]: new Date() } }],
      },
      include: [{ model: Equipe, as: 'equipe', attributes: ['id', 'nom', 'categorie_id'] }],
    });

    if (!inviteCode) return res.status(404).json({ success: false, message: 'Code invalide ou expiré' });
    if (inviteCode.uses_count >= inviteCode.max_uses) {
      return res.status(410).json({ success: false, message: 'Ce code a atteint sa limite d\'utilisation' });
    }

    // Mise à jour du rôle et du club de l'utilisateur
    await req.user.update({
      role:    inviteCode.role,
      club_id: inviteCode.club_id,
    });

    // Affectation à la catégorie (toutes les équipes actives) ou, à défaut, à l'équipe précise du code —
    // pour joueur, parent ET coach (les codes catégorie stockent le nom en texte libre, pas une FK).
    if (['joueur', 'parent', 'coach'].includes(inviteCode.role)) {
      let equipeIds = [];
      if (inviteCode.equipe_id) {
        equipeIds = inviteCode.equipe?.categorie_id
          ? await equipeIdsForCategory({ clubId: inviteCode.club_id, categorieId: inviteCode.equipe.categorie_id })
          : [inviteCode.equipe_id];
      } else if (inviteCode.categorie) {
        equipeIds = await equipeIdsForCategoryByName({ clubId: inviteCode.club_id, categorieName: inviteCode.categorie });
      }

      if (equipeIds.length > 0) {
        await assignUserToEquipes({ userId: req.user.id, clubId: inviteCode.club_id, equipeIds, role: inviteCode.role });
      } else if (inviteCode.role !== 'coach') {
        // Ni équipe ni catégorie précisée sur le code : licencié rattaché au club sans équipe
        await Licencie.findOrCreate({
          where: { user_id: req.user.id },
          defaults: { user_id: req.user.id, equipe_id: null, club_id: inviteCode.club_id, statut: 'actif' },
        });
      }
    }

    // Incrément du compteur
    await inviteCode.increment('uses_count');

    const label = inviteCode.equipe
      ? `${inviteCode.equipe.nom}`
      : inviteCode.categorie
        ? `la catégorie ${inviteCode.categorie}`
        : 'le club';
    return res.json({
      success: true,
      message: `Vous avez rejoint ${label} en tant que ${inviteCode.role}`,
      data: {
        equipe:    inviteCode.equipe || null,
        categorie: inviteCode.categorie || null,
        role:      inviteCode.role,
        club_id:   inviteCode.club_id,
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/codes/link-child — lie un parent à son enfant (joueur)
const linkChild = async (req, res) => {
  try {
    const { child_user_id } = req.body;
    if (!child_user_id) return res.status(400).json({ success: false, message: 'child_user_id requis' });
    if (req.user.role !== 'parent') {
      return res.status(403).json({ success: false, message: 'Réservé aux parents' });
    }

    const child = await User.findOne({ where: { id: child_user_id, club_id: req.user.club_id, role: 'joueur' } });
    if (!child) return res.status(404).json({ success: false, message: 'Joueur introuvable dans votre club' });

    // L'enfant pointe vers le parent via parent_id
    await child.update({ parent_id: req.user.id });

    return res.json({ success: true, message: `${child.prenom} ${child.nom} est maintenant lié à votre compte` });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/codes/my-children — liste les enfants du parent connecté
const myChildren = async (req, res) => {
  try {
    if (req.user.role !== 'parent' && req.user.role !== 'superadmin' && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Réservé aux parents' });
    }
    const children = await User.findAll({
      where: { parent_id: req.user.id },
      attributes: ['id', 'nom', 'prenom', 'avatar', 'club_id'],
      include: [{ model: Licencie, as: 'licence', attributes: ['equipe_id', 'statut'] }],
    });
    return res.json({ success: true, data: children });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/codes/club-players — joueurs du club non encore rattachés (pour choix enfant)
const clubPlayers = async (req, res) => {
  try {
    const players = await User.findAll({
      where: { club_id: req.user.club_id, role: 'joueur' },
      attributes: ['id', 'nom', 'prenom', 'avatar'],
      include: [{ model: Licencie, as: 'licence', attributes: ['equipe_id'] }],
    });
    return res.json({ success: true, data: players });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/codes/children — un parent crée directement le compte de son enfant (joueur),
// sans passer par une inscription email/mot de passe classique (l'enfant ne se connecte pas
// lui-même — compte géré par le parent). Email synthétique pour satisfaire la contrainte
// NOT NULL/unique du modèle User, jamais utilisé pour se connecter.
const createChild = async (req, res) => {
  try {
    if (req.user.role !== 'parent') {
      return res.status(403).json({ success: false, message: 'Réservé aux parents' });
    }
    const { nom, prenom, date_naissance, poste, pied_fort, taille } = req.body;
    if (!nom?.trim() || !prenom?.trim()) {
      return res.status(400).json({ success: false, message: 'Nom et prénom requis' });
    }
    const validPiedFort = ['droit', 'gauche', 'ambidextre'].includes(pied_fort) ? pied_fort : null;

    const email = `enfant.${Date.now()}.${crypto.randomBytes(4).toString('hex')}@compte-gere.monclubhouse.local`;

    const child = await User.create({
      nom: nom.trim(),
      prenom: prenom.trim(),
      email,
      password_hash: null,
      role: 'joueur',
      club_id: req.user.club_id || null,
      parent_id: req.user.id,
      date_naissance: date_naissance || null,
      poste: poste || null,
      pied_fort: validPiedFort,
      taille: taille ? parseInt(taille) : null,
      email_verified: true,
    });

    return res.status(201).json({
      success: true,
      data: { id: child.id, nom: child.nom, prenom: child.prenom, date_naissance: child.date_naissance },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/codes/join-child — un parent rattache un de ses enfants à une catégorie/équipe via
// un code d'invitation (le code n'est jamais appliqué au compte du parent lui-même ici).
const joinChildByCode = async (req, res) => {
  try {
    if (req.user.role !== 'parent') {
      return res.status(403).json({ success: false, message: 'Réservé aux parents' });
    }
    const { code, child_user_id } = req.body;
    if (!code || !child_user_id) {
      return res.status(400).json({ success: false, message: 'code et child_user_id requis' });
    }

    const child = await User.findOne({ where: { id: child_user_id, parent_id: req.user.id, role: 'joueur' } });
    if (!child) return res.status(404).json({ success: false, message: 'Enfant introuvable sur votre compte' });

    const inviteCode = await InviteCode.findOne({
      where: {
        code: code.toUpperCase().trim(),
        actif: true,
        [Op.or]: [{ expires_at: null }, { expires_at: { [Op.gt]: new Date() } }],
      },
      include: [{ model: Equipe, as: 'equipe', attributes: ['id', 'nom', 'categorie_id'] }],
    });
    if (!inviteCode) return res.status(404).json({ success: false, message: 'Code invalide ou expiré' });
    if (inviteCode.uses_count >= inviteCode.max_uses) {
      return res.status(410).json({ success: false, message: "Ce code a atteint sa limite d'utilisation" });
    }
    if (inviteCode.role !== 'joueur') {
      return res.status(400).json({ success: false, message: "Ce code n'est pas un code joueur, il ne peut pas être utilisé pour un enfant." });
    }

    await child.update({ club_id: inviteCode.club_id });

    let equipeIds = [];
    if (inviteCode.equipe_id) {
      equipeIds = inviteCode.equipe?.categorie_id
        ? await equipeIdsForCategory({ clubId: inviteCode.club_id, categorieId: inviteCode.equipe.categorie_id })
        : [inviteCode.equipe_id];
    } else if (inviteCode.categorie) {
      equipeIds = await equipeIdsForCategoryByName({ clubId: inviteCode.club_id, categorieName: inviteCode.categorie });
    }

    if (equipeIds.length > 0) {
      await assignUserToEquipes({ userId: child.id, clubId: inviteCode.club_id, equipeIds, role: 'joueur' });
    } else {
      await Licencie.findOrCreate({
        where: { user_id: child.id },
        defaults: { user_id: child.id, equipe_id: null, club_id: inviteCode.club_id, statut: 'actif' },
      });
    }

    await inviteCode.increment('uses_count');

    const label = inviteCode.equipe ? inviteCode.equipe.nom : (inviteCode.categorie ? `la catégorie ${inviteCode.categorie}` : 'le club');
    return res.json({
      success: true,
      message: `${child.prenom} a rejoint ${label}`,
      data: { child_id: child.id, club_id: inviteCode.club_id },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { listCodes, createCode, deleteCode, hardDeleteCode, validateCode, linkChild, myChildren, clubPlayers, createChild, joinChildByCode };
