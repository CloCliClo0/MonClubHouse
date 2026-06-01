const { Composition, Match } = require('../models');

const getByMatch = async (req, res) => {
  try {
    const compo = await Composition.findOne({ where: { match_id: req.params.matchId } });
    if (!compo) return res.status(404).json({ success: false, message: 'Composition introuvable' });
    return res.json({ success: true, data: compo });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

const upsert = async (req, res) => {
  try {
    const { match_id, formation, titulaires, remplacants, notes_tactiques } = req.body;

    const match = await Match.findByPk(match_id);
    if (!match) return res.status(404).json({ success: false, message: 'Match introuvable' });

    const [compo, created] = await Composition.findOrCreate({
      where: { match_id },
      defaults: {
        formation: formation || '4-3-3',
        titulaires: titulaires || [],
        remplacants: remplacants || [],
        notes_tactiques,
        cree_par: req.user.id
      }
    });

    if (!created) {
      await compo.update({ formation, titulaires, remplacants, notes_tactiques });
    }

    return res.status(created ? 201 : 200).json({ success: true, data: compo });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

const FORMATIONS = {
  '4-3-3': { nom: '4-3-3', postes: ['GB', 'DD', 'DC', 'DC', 'DG', 'MD', 'MC', 'MG', 'AD', 'AT', 'AG'] },
  '4-4-2': { nom: '4-4-2', postes: ['GB', 'DD', 'DC', 'DC', 'DG', 'MD', 'MC', 'MC', 'MG', 'BU', 'BU'] },
  '4-2-3-1': { nom: '4-2-3-1', postes: ['GB', 'DD', 'DC', 'DC', 'DG', 'MDR', 'MDR', 'MD', 'MC', 'MD', 'BU'] },
  '3-5-2': { nom: '3-5-2', postes: ['GB', 'DC', 'DC', 'DC', 'PD', 'MD', 'MC', 'MC', 'PG', 'BU', 'BU'] },
  '5-3-2': { nom: '5-3-2', postes: ['GB', 'DD', 'DC', 'DC', 'DC', 'DG', 'MD', 'MC', 'MG', 'BU', 'BU'] }
};

const getFormations = async (req, res) => {
  return res.json({ success: true, data: FORMATIONS });
};

module.exports = { getByMatch, upsert, getFormations };
