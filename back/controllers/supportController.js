const { SupportTicket, User, Club } = require('../models');
const { Op } = require('sequelize');

const USER_ATTRS = ['id', 'nom', 'prenom', 'email', 'role'];

// POST /api/support — créer un ticket (tout utilisateur authentifié)
const create = async (req, res) => {
  try {
    const { sujet, message, priorite } = req.body;
    if (!sujet?.trim() || !message?.trim())
      return res.status(400).json({ success: false, message: 'Sujet et message requis.' });

    const ticket = await SupportTicket.create({
      user_id:  req.user.id,
      club_id:  req.user.club_id || null,
      sujet:    String(sujet).trim().slice(0, 200),
      message:  String(message).trim().slice(0, 5000),
      priorite: ['normal', 'haute', 'urgent'].includes(priorite) ? priorite : 'normal',
    });

    return res.status(201).json({ success: true, data: ticket });
  } catch (err) {
    console.error('[supportController.create]', err.message);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

// GET /api/support/mes-tickets — tickets de l'utilisateur connecté
const getMes = async (req, res) => {
  try {
    const tickets = await SupportTicket.findAll({
      where: { user_id: req.user.id },
      order: [['createdAt', 'DESC']],
      include: [{ model: User, as: 'repondant', attributes: USER_ATTRS }],
    });
    return res.json({ success: true, data: tickets });
  } catch (err) {
    console.error('[supportController.getMes]', err.message);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

// GET /api/support — tous les tickets (superadmin seulement)
const getAll = async (req, res) => {
  try {
    const { statut, priorite, search } = req.query;
    const where = {};
    if (statut && statut !== 'tous') where.statut = statut;
    if (priorite && priorite !== 'tous') where.priorite = priorite;
    if (search) {
      where[Op.or] = [
        { sujet: { [Op.like]: `%${search}%` } },
        { message: { [Op.like]: `%${search}%` } },
      ];
    }

    const tickets = await SupportTicket.findAll({
      where,
      order: [
        ['statut', 'ASC'],
        ['priorite', 'DESC'],
        ['createdAt', 'DESC'],
      ],
      include: [
        { model: User, as: 'auteur',    attributes: USER_ATTRS },
        { model: User, as: 'repondant', attributes: USER_ATTRS },
        { model: Club, as: 'club',      attributes: ['id', 'nom', 'couleur_primaire'] },
      ],
    });
    return res.json({ success: true, data: tickets });
  } catch (err) {
    console.error('[supportController.getAll]', err.message);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

// GET /api/support/stats — compteurs par statut (superadmin)
const getStats = async (req, res) => {
  try {
    const counts = await SupportTicket.findAll({
      attributes: ['statut', [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'count']],
      group: ['statut'],
      raw: true,
    });
    const stats = { ouvert: 0, en_cours: 0, resolu: 0, ferme: 0, total: 0 };
    counts.forEach(r => {
      stats[r.statut] = parseInt(r.count);
      stats.total += parseInt(r.count);
    });
    return res.json({ success: true, data: stats });
  } catch (err) {
    console.error('[supportController.getStats]', err.message);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

// PATCH /api/support/:id — mettre à jour statut + réponse (superadmin)
const update = async (req, res) => {
  try {
    const ticket = await SupportTicket.findByPk(req.params.id);
    if (!ticket) return res.status(404).json({ success: false, message: 'Ticket introuvable.' });

    const { statut, reponse } = req.body;
    const updates = {};
    if (statut && ['ouvert', 'en_cours', 'resolu', 'ferme'].includes(statut)) updates.statut = statut;
    if (reponse !== undefined) {
      updates.reponse    = reponse ? String(reponse).trim().slice(0, 5000) : null;
      updates.repondu_par = reponse ? req.user.id : null;
    }

    await ticket.update(updates);

    const updated = await SupportTicket.findByPk(ticket.id, {
      include: [
        { model: User, as: 'auteur',    attributes: USER_ATTRS },
        { model: User, as: 'repondant', attributes: USER_ATTRS },
        { model: Club, as: 'club',      attributes: ['id', 'nom', 'couleur_primaire'] },
      ],
    });
    return res.json({ success: true, data: updated });
  } catch (err) {
    console.error('[supportController.update]', err.message);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

// DELETE /api/support/:id — supprimer (superadmin)
const remove = async (req, res) => {
  try {
    const ticket = await SupportTicket.findByPk(req.params.id);
    if (!ticket) return res.status(404).json({ success: false, message: 'Ticket introuvable.' });
    await ticket.destroy();
    return res.json({ success: true });
  } catch (err) {
    console.error('[supportController.remove]', err.message);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

module.exports = { create, getMes, getAll, getStats, update, remove };
