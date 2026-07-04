const { Equipe, Licencie, EquipeCoach, Category } = require('../models');

// Affecte un utilisateur (joueur/parent/coach) à une liste d'équipes déjà résolue.
// Additif uniquement (ignoreDuplicates) — ne retire jamais l'utilisateur d'une équipe existante.
async function assignUserToEquipes({ userId, clubId, equipeIds, role }) {
  if (!equipeIds || equipeIds.length === 0) return { assignedCount: 0 };

  if (role === 'coach') {
    await EquipeCoach.bulkCreate(
      equipeIds.map(equipe_id => ({ equipe_id, user_id: userId })),
      { ignoreDuplicates: true }
    );
  } else if (role === 'joueur' || role === 'parent') {
    await Licencie.bulkCreate(
      equipeIds.map(equipe_id => ({ equipe_id, user_id: userId, club_id: clubId, statut: 'actif' })),
      { ignoreDuplicates: true }
    );
  }
  return { assignedCount: equipeIds.length };
}

// IDs de toutes les équipes actives d'une catégorie (par id de catégorie).
async function equipeIdsForCategory({ clubId, categorieId }) {
  if (!categorieId) return [];
  const equipes = await Equipe.findAll({ where: { categorie_id: categorieId, club_id: clubId, actif: true }, attributes: ['id'] });
  return equipes.map(e => e.id);
}

// IDs de toutes les équipes actives d'une catégorie (par nom — cas des codes d'invitation historiques
// qui stockent le nom de la catégorie en texte libre, pas une FK).
async function equipeIdsForCategoryByName({ clubId, categorieName }) {
  if (!categorieName) return [];
  const equipes = await Equipe.findAll({
    where: { club_id: clubId, actif: true },
    include: [{ model: Category, as: 'categorie', attributes: [], where: { nom: categorieName }, required: true }],
    attributes: ['id'],
  });
  return equipes.map(e => e.id);
}

// Étend une équipe précise à toutes les équipes de sa catégorie (elle-même incluse).
// Si l'équipe n'a pas de catégorie, retourne uniquement cette équipe.
async function expandEquipeToCategory({ equipeId, clubId }) {
  const equipe = await Equipe.findByPk(equipeId, { attributes: ['id', 'categorie_id'] });
  if (!equipe) return [];
  if (!equipe.categorie_id) return [equipe.id];
  const siblings = await Equipe.findAll({
    where: { categorie_id: equipe.categorie_id, club_id: clubId, actif: true },
    attributes: ['id'],
  });
  return siblings.map(s => s.id);
}

module.exports = { assignUserToEquipes, equipeIdsForCategory, equipeIdsForCategoryByName, expandEquipeToCategory };
