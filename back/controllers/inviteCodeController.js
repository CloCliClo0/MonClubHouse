const { Op } = require('sequelize');
const { InviteCode, User, Club, Equipe, Licencie } = require('../models');

// ─── Helpers ────────────────────────────────────────────────────────────────

const VALID_ROLES = ['joueur', 'parent', 'coach', 'dirigeant'];

/**
 * Génère un code aléatoire au format AAA-1234-AAA.
 */
const generateCode = () => {
  const letters = () =>
    Array.from({ length: 3 }, () =>
      String.fromCharCode(65 + Math.floor(Math.random() * 26))
    ).join('');
  const digits = () =>
    String(Math.floor(1000 + Math.random() * 9000));
  return `${letters()}-${digits()}-${letters()}`;
};

/**
 * Recherche un InviteCode actif par son code, avec les associations Club et Equipe.
 * Renvoie null si inexistant.
 */
const findActiveCode = async (code) => {
  return InviteCode.findOne({
    where: { code, actif: true },
    include: [
      { model: Club,  as: 'club',   attributes: ['id', 'nom', 'couleur_primaire'] },
      { model: Equipe, as: 'equipe', attributes: ['id', 'nom', 'categorie'] }
    ]
  });
};

/**
 * Vérifie qu'un InviteCode n'est pas expiré et pas plein.
 * Retourne { expired: bool, full: bool }.
 */
const codeStatus = (invite) => {
  const now = new Date();
  const expired = invite.expires_at !== null && new Date(invite.expires_at) <= now;
  const full    = invite.uses_count >= invite.max_uses;
  return { expired, full };
};

// ─── Handlers ───────────────────────────────────────────────────────────────

/**
 * GET /clubs/codes/validate/:code  — public
 * Vérifie la validité d'un code d'invitation avant que l'utilisateur rejoigne.
 */
const validateCode = async (req, res) => {
  try {
    const invite = await findActiveCode(req.params.code);

    if (!invite) {
      return res.status(404).json({ success: false, message: 'Code introuvable ou inactif' });
    }

    const { expired, full } = codeStatus(invite);
    if (expired || full) {
      return res.status(410).json({
        success: false,
        message: expired ? 'Ce code a expiré' : 'Ce code a atteint sa limite d\'utilisation'
      });
    }

    return res.json({
      success: true,
      data: {
        club:      { nom: invite.club.nom, couleur_primaire: invite.club.couleur_primaire },
        equipe:    invite.equipe ? { nom: invite.equipe.nom, categorie: invite.equipe.categorie } : null,
        role:      invite.role,
        label:     invite.label,
        remaining: invite.max_uses - invite.uses_count
      }
    });
  } catch (err) {
    console.error('[validateCode]', err);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

/**
 * POST /clubs/join  — authenticated
 * Permet à un utilisateur de rejoindre un club via un code d'invitation.
 */
const joinByCode = async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) {
      return res.status(400).json({ success: false, message: 'Code requis' });
    }

    const invite = await findActiveCode(code);

    if (!invite) {
      return res.status(404).json({ success: false, message: 'Code introuvable ou inactif' });
    }

    const { expired, full } = codeStatus(invite);
    if (expired || full) {
      return res.status(410).json({
        success: false,
        message: expired ? 'Ce code a expiré' : 'Ce code a atteint sa limite d\'utilisation'
      });
    }

    // Mise à jour du rôle et du club de l'utilisateur
    await req.user.update({ club_id: invite.club_id, role: invite.role });

    // Création / mise à jour du licencié pour joueur ou parent
    if (invite.role === 'joueur' || invite.role === 'parent') {
      await Licencie.upsert({
        user_id:          req.user.id,
        equipe_id:        invite.equipe_id,
        statut:           'actif',
        date_inscription: new Date().toISOString().slice(0, 10)
      }, { conflictFields: ['user_id'] });
    }

    // Affectation du coach à l'équipe
    if (invite.role === 'coach' && invite.equipe_id) {
      await Equipe.update(
        { coach_id: req.user.id },
        { where: { id: invite.equipe_id } }
      );
    }

    // Incrémentation du compteur d'utilisations
    await invite.increment('uses_count');

    return res.json({
      success: true,
      message: 'Bienvenue dans le club !',
      data: {
        role:   invite.role,
        club:   { nom: invite.club.nom },
        equipe: invite.equipe ? { nom: invite.equipe.nom } : null
      }
    });
  } catch (err) {
    console.error('[joinByCode]', err);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

/**
 * GET /clubs/codes  — admin/dirigeant
 * Liste tous les codes d'invitation du club de l'utilisateur connecté.
 */
const listCodes = async (req, res) => {
  try {
    const codes = await InviteCode.findAll({
      where: { club_id: req.user.club_id },
      include: [
        { model: Equipe, as: 'equipe', attributes: ['id', 'nom', 'categorie'] },
        { model: User,   as: 'createur', attributes: ['id', 'prenom', 'nom', 'email'] }
      ],
      order: [['createdAt', 'DESC']]
    });

    return res.json({ success: true, data: codes });
  } catch (err) {
    console.error('[listCodes]', err);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

/**
 * POST /clubs/codes  — admin/dirigeant
 * Crée un nouveau code d'invitation pour le club de l'utilisateur connecté.
 */
const createCode = async (req, res) => {
  try {
    const { equipe_id, role, label, max_uses, expires_at } = req.body;

    if (!role || !VALID_ROLES.includes(role)) {
      return res.status(400).json({
        success: false,
        message: `Rôle invalide. Valeurs acceptées : ${VALID_ROLES.join(', ')}`
      });
    }

    // equipe_id requis uniquement pour les rôles liés à une équipe
    if (['joueur', 'parent', 'coach'].includes(role) && !equipe_id) {
      return res.status(400).json({ success: false, message: 'equipe_id requis pour ce rôle' });
    }

    // Génération d'un code unique
    let code;
    let attempts = 0;
    do {
      code = generateCode();
      attempts++;
      if (attempts > 10) {
        return res.status(500).json({ success: false, message: 'Impossible de générer un code unique' });
      }
    } while (await InviteCode.findOne({ where: { code } }));

    const invite = await InviteCode.create({
      code,
      equipe_id,
      club_id:    req.user.club_id,
      role,
      label:      label || null,
      max_uses:   max_uses || 50,
      expires_at: expires_at || null,
      created_by: req.user.id
    });

    return res.status(201).json({ success: true, data: invite });
  } catch (err) {
    console.error('[createCode]', err);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

/**
 * DELETE /clubs/codes/:id  — admin/dirigeant
 * Désactive (soft-delete) un code d'invitation appartenant au club de l'utilisateur.
 */
const deleteCode = async (req, res) => {
  try {
    const invite = await InviteCode.findOne({
      where: { id: req.params.id, club_id: req.user.club_id }
    });

    if (!invite) {
      return res.status(404).json({ success: false, message: 'Code introuvable' });
    }

    await invite.update({ actif: false });

    return res.json({ success: true, message: 'Code désactivé avec succès' });
  } catch (err) {
    console.error('[deleteCode]', err);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

/**
 * GET /clubs/players  — authenticated (parent flow)
 * Retourne la liste des joueurs du même club, pour qu'un parent puisse lier son enfant.
 */
const getClubPlayers = async (req, res) => {
  try {
    if (!req.user.club_id) {
      return res.json({ success: true, data: [] });
    }
    const players = await User.findAll({
      where: { club_id: req.user.club_id, role: 'joueur', actif: true },
      attributes: ['id', 'nom', 'prenom', 'avatar'],
      order: [['nom', 'ASC'], ['prenom', 'ASC']]
    });
    return res.json({ success: true, data: players });
  } catch (err) {
    console.error('[getClubPlayers]', err);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

/**
 * POST /clubs/link-child  — authenticated (parent)
 * body: { child_user_id }
 * Met à jour parent_id du joueur enfant pour le rattacher au parent connecté.
 */
const linkChild = async (req, res) => {
  try {
    const { child_user_id } = req.body;
    if (!child_user_id) {
      return res.status(400).json({ success: false, message: 'child_user_id requis' });
    }
    const child = await User.findOne({
      where: { id: child_user_id, club_id: req.user.club_id, role: 'joueur' }
    });
    if (!child) {
      return res.status(404).json({ success: false, message: 'Joueur introuvable dans ce club' });
    }
    await child.update({ parent_id: req.user.id });
    return res.json({ success: true, message: 'Enfant rattaché avec succès' });
  } catch (err) {
    console.error('[linkChild]', err);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

module.exports = { validateCode, joinByCode, listCodes, createCode, deleteCode, getClubPlayers, linkChild };
