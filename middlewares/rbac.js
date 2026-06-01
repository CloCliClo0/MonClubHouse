const ROLE_HIERARCHY = {
  superadmin: 6,
  admin: 5,
  dirigeant: 4,
  coach: 3,
  joueur: 2,
  parent: 2,
  visiteur: 1
};

/**
 * Vérifie que l'utilisateur possède au moins un des rôles requis.
 */
const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Non authentifié' });
    }
    if (!roles.includes(req.user.role) && req.user.role !== 'superadmin') {
      return res.status(403).json({
        success: false,
        message: `Accès refusé. Rôles requis: ${roles.join(', ')}`
      });
    }
    next();
  };
};

/**
 * Vérifie que l'utilisateur a un niveau de rôle >= au niveau requis.
 */
const requireMinRole = (minRole) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Non authentifié' });
    }
    const userLevel = ROLE_HIERARCHY[req.user.role] || 0;
    const requiredLevel = ROLE_HIERARCHY[minRole] || 0;
    if (userLevel < requiredLevel) {
      return res.status(403).json({
        success: false,
        message: 'Droits insuffisants'
      });
    }
    next();
  };
};

/**
 * Vérifie que l'utilisateur appartient au même club que la ressource.
 */
const requireSameClub = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Non authentifié' });
  }
  if (req.user.role === 'superadmin') return next();

  const resourceClubId = parseInt(req.params.clubId || req.body.club_id);
  if (resourceClubId && req.user.club_id !== resourceClubId) {
    return res.status(403).json({
      success: false,
      message: 'Accès interdit à ce club'
    });
  }
  next();
};

/**
 * Vérifie que le coach n'accède qu'à ses propres équipes.
 */
const requireCoachOfTeam = async (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Non authentifié' });
  }
  if (['superadmin', 'admin', 'dirigeant'].includes(req.user.role)) return next();

  if (req.user.role === 'coach') {
    const { Equipe } = require('../models');
    const equipe = await Equipe.findOne({
      where: { id: req.params.equipeId, coach_id: req.user.id }
    });
    if (!equipe) {
      return res.status(403).json({ success: false, message: 'Vous n\'êtes pas coach de cette équipe' });
    }
  }
  next();
};

module.exports = { requireRole, requireMinRole, requireSameClub, requireCoachOfTeam };
