const { body, param, query } = require('express-validator');

const validateRegister = [
  body('email').isEmail().normalizeEmail().withMessage('Email invalide'),
  body('password')
    .isLength({ min: 8 }).withMessage('Mot de passe minimum 8 caractères')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Le mot de passe doit contenir une majuscule, une minuscule et un chiffre'),
  body('nom').trim().notEmpty().isLength({ max: 100 }).withMessage('Nom requis'),
  body('prenom').optional().trim().isLength({ max: 100 })
];

const validateLogin = [
  body('email').isEmail().normalizeEmail().withMessage('Email invalide'),
  body('password').notEmpty().withMessage('Mot de passe requis')
];

const validateClub = [
  body('nom').trim().notEmpty().isLength({ max: 200 }).withMessage('Nom du club requis'),
  body('email').optional().isEmail().normalizeEmail(),
  body('site_web').optional().isURL()
];

const validateEquipe = [
  body('nom').trim().notEmpty().isLength({ max: 200 }).withMessage('Nom requis'),
  body('categorie_id').optional().isInt({ min: 1 }).withMessage('Catégorie invalide'),
  body('sport_id').optional().isInt({ min: 1 }).withMessage('Sport invalide'),
  body('niveau').optional().trim().isLength({ max: 100 }),
  body('couleur').optional().trim().isLength({ max: 7 })
];

const validateMatch = [
  body('equipe_id').isInt({ min: 1 }).withMessage('Équipe requise'),
  body('date').isISO8601().withMessage('Date invalide'),
  body('type').isIn(['match', 'entrainement', 'tournoi', 'amical', 'coupe', 'plateau', 'reunion', 'autre']).withMessage('Type invalide')
];

const validateMessage = [
  body('contenu').trim().notEmpty().isLength({ max: 5000 }).withMessage('Message invalide'),
  body('channel_id').isInt({ min: 1 }).withMessage('Channel requis')
];

const validateLicencie = [
  body('user_id').isInt({ min: 1 }).withMessage('Utilisateur requis'),
  body('equipe_id').isInt({ min: 1 }).withMessage('Équipe requise'),
  body('statut').optional().isIn(['actif', 'inactif', 'suspendu', 'blesse']).withMessage('Statut invalide'),
  body('numero_maillot').optional().isInt({ min: 0, max: 99 }).withMessage('Numéro de maillot invalide'),
  body('numero_licence').optional().trim().isLength({ max: 50 })
];

const validateConvocationReponse = [
  body('statut').isIn(['present', 'absent', 'incertain']).withMessage('Statut invalide'),
  body('motif_absence').optional().trim().isLength({ max: 500 })
];

const validateComposition = [
  body('match_id').isInt({ min: 1 }).withMessage('Match requis'),
  body('formation').notEmpty().isIn(['4-3-3', '4-4-2', '4-2-3-1', '3-5-2', '5-3-2']).withMessage('Formation invalide'),
  body('titulaires').isArray({ max: 11 }).withMessage('Maximum 11 titulaires'),
  body('remplacants').optional().isArray({ max: 7 }).withMessage('Maximum 7 remplaçants')
];

module.exports = {
  validateRegister,
  validateLogin,
  validateClub,
  validateEquipe,
  validateMatch,
  validateMessage,
  validateLicencie,
  validateConvocationReponse,
  validateComposition
};
