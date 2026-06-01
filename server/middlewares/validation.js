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
  body('categorie').notEmpty().withMessage('Catégorie requise'),
  body('sport_id').isInt({ min: 1 }).withMessage('Sport requis'),
  body('genre').isIn(['masculin', 'feminin', 'mixte', 'handisport']).withMessage('Genre invalide')
];

const validateMatch = [
  body('equipe_id').isInt({ min: 1 }).withMessage('Équipe requise'),
  body('date').isISO8601().withMessage('Date invalide'),
  body('type').isIn(['match', 'entrainement', 'tournoi', 'amical', 'coupe']).withMessage('Type invalide')
];

const validateMessage = [
  body('contenu').trim().notEmpty().isLength({ max: 5000 }).withMessage('Message invalide'),
  body('channel_id').isInt({ min: 1 }).withMessage('Channel requis')
];

module.exports = {
  validateRegister,
  validateLogin,
  validateClub,
  validateEquipe,
  validateMatch,
  validateMessage
};
