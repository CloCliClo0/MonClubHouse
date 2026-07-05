const { Op } = require('sequelize');
const { InviteCode, User, Club, Equipe, Licencie } = require('../models');
const { assignUserToEquipes, equipeIdsForCategory, equipeIdsForCategoryByName } = require('../services/rosterService');

// ─── Helpers ────────────────────────────────────────────────────────────────
//
// Ce contrôleur ne gère QUE la validation/rédemption d'un code par l'utilisateur
// lui-même (auto-inscription : RegisterPage/JoinPage/GoogleCompletePage).
// La création/liste/désactivation des codes, ainsi que le rattachement d'enfant
// (lier un compte existant ou en créer un), vivent uniquement dans
// `codesController.js` (mounté sur /api/codes) — ne pas dupliquer ici.

/**
 * Recherche un InviteCode actif par son code, avec les associations Club et Equipe.
 * Renvoie null si inexistant.
 */
const findActiveCode = async (code) => {
  const { Category } = require('../models');
  return InviteCode.findOne({
    where: { code, actif: true },
    include: [
      { model: Club,   as: 'club',   attributes: ['id', 'nom', 'couleur_primaire'], required: false },
      { model: Equipe, as: 'equipe', attributes: ['id', 'nom', 'categorie_id'],     required: false,
        include: [{ model: Category, as: 'categorie', attributes: ['id', 'nom'], required: false }] }
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
        equipe:    invite.equipe ? { nom: invite.equipe.nom, categorie: invite.equipe.categorie?.nom || null } : null,
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

    // Affectation à la catégorie (toutes les équipes actives) ou, à défaut, à l'équipe précise du
    // code — pour joueur, parent ET coach (un code catégorie stocke le nom en texte libre).
    if (['joueur', 'parent', 'coach'].includes(invite.role)) {
      let equipeIds = [];
      if (invite.equipe_id) {
        equipeIds = invite.equipe?.categorie_id
          ? await equipeIdsForCategory({ clubId: invite.club_id, categorieId: invite.equipe.categorie_id })
          : [invite.equipe_id];
      } else if (invite.categorie) {
        equipeIds = await equipeIdsForCategoryByName({ clubId: invite.club_id, categorieName: invite.categorie });
      }

      if (equipeIds.length > 0) {
        await assignUserToEquipes({ userId: req.user.id, clubId: invite.club_id, equipeIds, role: invite.role });
      } else if (invite.role !== 'coach') {
        // Ni équipe ni catégorie résolue : licencié rattaché au club sans équipe
        await Licencie.findOrCreate({
          where: { user_id: req.user.id },
          defaults: { user_id: req.user.id, equipe_id: null, club_id: invite.club_id, statut: 'actif' },
        });
      }
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

module.exports = { validateCode, joinByCode };
