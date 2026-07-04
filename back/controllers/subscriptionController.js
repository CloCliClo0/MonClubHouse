const { Subscription, User, Club } = require('../models');
const {
  isSubscriptionEnabled, getStripe, hasActiveAccess, createCheckoutSession,
} = require('../services/subscriptionService');

const CAN_BUY_FOR_CLUB = ['dirigeant', 'admin', 'superadmin'];

// GET /api/subscription/status
const getStatus = async (req, res) => {
  try {
    const enabled = isSubscriptionEnabled();
    if (!enabled) {
      return res.json({ success: true, data: { enabled: false, active: true } });
    }

    const active = await hasActiveAccess(req.user);

    const clubSub = req.user.club_id
      ? await Subscription.findOne({ where: { owner_type: 'club', owner_id: req.user.club_id, statut: 'actif' } })
      : null;
    const userSub = await Subscription.findOne({ where: { owner_type: 'user', owner_id: req.user.id, statut: 'actif' } });

    return res.json({
      success: true,
      data: {
        enabled: true,
        active,
        can_buy_for_club: CAN_BUY_FOR_CLUB.includes(req.user.role),
        club_subscription: clubSub ? { plan: clubSub.plan, current_period_end: clubSub.current_period_end } : null,
        user_subscription: userSub ? { plan: userSub.plan, current_period_end: userSub.current_period_end } : null,
      },
    });
  } catch (err) {
    console.error('[subscriptionController.getStatus]', err.message);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

// POST /api/subscription/checkout
const checkout = async (req, res) => {
  try {
    const { plan, scope = 'user', promo_code } = req.body;
    if (!['mensuel', 'annuel'].includes(plan)) {
      return res.status(400).json({ success: false, message: 'Formule invalide' });
    }
    if (scope === 'club') {
      if (!CAN_BUY_FOR_CLUB.includes(req.user.role)) {
        return res.status(403).json({ success: false, message: 'Seul un dirigeant ou admin peut acheter pour le club' });
      }
      if (!req.user.club_id) {
        return res.status(400).json({ success: false, message: 'Aucun club associé à ce compte' });
      }
    }

    const ownerType = scope === 'club' ? 'club' : 'user';
    const ownerId = scope === 'club' ? req.user.club_id : req.user.id;
    const appUrl = process.env.APP_URL || 'http://localhost:5173';

    const session = await createCheckoutSession({
      ownerType,
      ownerId,
      plan,
      promoCode: promo_code,
      customerEmail: req.user.email,
      successUrl: `${appUrl}/dashboard?abonnement=succes`,
      cancelUrl: `${appUrl}/abonnement?annule=1`,
    });

    return res.json({ success: true, data: { url: session.url } });
  } catch (err) {
    console.error('[subscriptionController.checkout]', err.message);
    return res.status(400).json({ success: false, message: err.message });
  }
};

// GET /api/subscription/admin — superadmin : liste de tous les abonnements
const adminList = async (req, res) => {
  try {
    const subs = await Subscription.findAll({ order: [['createdAt', 'DESC']] });

    const clubIds = subs.filter(s => s.owner_type === 'club').map(s => s.owner_id);
    const userIds = subs.filter(s => s.owner_type === 'user').map(s => s.owner_id);
    const [clubs, users] = await Promise.all([
      clubIds.length ? Club.findAll({ where: { id: clubIds }, attributes: ['id', 'nom'] }) : [],
      userIds.length ? User.findAll({ where: { id: userIds }, attributes: ['id', 'nom', 'prenom', 'email'] }) : [],
    ]);
    const clubMap = new Map(clubs.map(c => [c.id, c]));
    const userMap = new Map(users.map(u => [u.id, u]));

    const data = subs.map(s => ({
      id: s.id,
      owner_type: s.owner_type,
      owner: s.owner_type === 'club' ? clubMap.get(s.owner_id) : userMap.get(s.owner_id),
      plan: s.plan,
      statut: s.statut,
      promo_code: s.promo_code,
      current_period_end: s.current_period_end,
      createdAt: s.createdAt,
    }));

    return res.json({ success: true, data });
  } catch (err) {
    console.error('[subscriptionController.adminList]', err.message);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

// POST /api/subscription/webhook — Stripe (body brut, signature vérifiée)
const webhook = async (req, res) => {
  const stripe = getStripe();
  if (!stripe || !process.env.STRIPE_WEBHOOK_SECRET) {
    return res.status(503).send('Webhook non configuré');
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, req.headers['stripe-signature'], process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('[subscriptionController.webhook] signature invalide:', err.message);
    return res.status(400).send(`Webhook signature invalide`);
  }

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const { owner_type, owner_id, plan, promo_code } = session.metadata || {};
      if (owner_type && owner_id) {
        await Subscription.create({
          owner_type,
          owner_id: parseInt(owner_id, 10),
          plan: plan || 'mensuel',
          statut: 'actif',
          stripe_customer_id: session.customer,
          stripe_subscription_id: session.subscription,
          promo_code: promo_code || null,
          current_period_end: null, // affiné par customer.subscription.updated
        });
      }
    }

    if (event.type === 'customer.subscription.updated' || event.type === 'customer.subscription.created') {
      const sub = event.data.object;
      const existing = await Subscription.findOne({ where: { stripe_subscription_id: sub.id } });
      if (existing) {
        await existing.update({
          statut: sub.status === 'active' ? 'actif' : sub.status === 'past_due' ? 'impaye' : existing.statut,
          current_period_end: sub.current_period_end ? new Date(sub.current_period_end * 1000) : null,
          rappel_envoye: false,
        });
      }
    }

    if (event.type === 'customer.subscription.deleted') {
      const sub = event.data.object;
      await Subscription.update({ statut: 'annule' }, { where: { stripe_subscription_id: sub.id } });
    }

    return res.json({ received: true });
  } catch (err) {
    console.error('[subscriptionController.webhook]', err.message);
    return res.status(500).send('Erreur traitement webhook');
  }
};

module.exports = { getStatus, checkout, adminList, webhook };
