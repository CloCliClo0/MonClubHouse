const { Subscription, PromoCode, User } = require('../models');
const { Op } = require('sequelize');

function isSubscriptionEnabled() {
  return process.env.SUBSCRIPTION_ENABLED === 'true';
}

// STRIPE_ENV=test (défaut, sûr) utilise les clés sk_test_/pk_test_ ; 'production' utilise les clés live.
function getStripeApiKey() {
  const isTest = process.env.STRIPE_ENV !== 'production';
  return isTest ? process.env.STRIPE_API_KEY_TEST : process.env.STRIPE_API_KEY;
}

function getStripe() {
  const key = getStripeApiKey();
  if (!key) return null;
  const Stripe = require('stripe');
  return new Stripe(key);
}

// Prix en euros dans .env (ex: "9.99") → centimes pour Stripe.
// Un club paie un tarif dédié (SUBSCRIPTION_CLUB_*), différent du tarif individuel.
function getPlanAmount(plan, ownerType = 'user') {
  const varName = ownerType === 'club'
    ? (plan === 'annuel' ? 'SUBSCRIPTION_CLUB_ANNUAL_PRICE' : 'SUBSCRIPTION_CLUB_MONTH_PRICE')
    : (plan === 'annuel' ? 'SUBSCRIPTION_ANNUAL_PRICE' : 'SUBSCRIPTION_MONTH_PRICE');
  const eur = parseFloat(process.env[varName]);
  if (!eur || eur <= 0) return null;
  return Math.round(eur * 100);
}

// Accès actif : abonnement club (couvre tous les membres) OU abonnement individuel
async function hasActiveAccess(user) {
  if (!isSubscriptionEnabled()) return true;
  const now = new Date();

  if (user.club_id) {
    const clubSub = await Subscription.findOne({
      where: { owner_type: 'club', owner_id: user.club_id, statut: 'actif' },
    });
    if (clubSub && (!clubSub.current_period_end || clubSub.current_period_end > now)) return true;
  }

  const userSub = await Subscription.findOne({
    where: { owner_type: 'user', owner_id: user.id, statut: 'actif' },
  });
  if (userSub && (!userSub.current_period_end || userSub.current_period_end > now)) return true;

  return false;
}

// Applique un code promo de notre BDD (pas un coupon Stripe) sur le montant en centimes
async function applyPromoCode(amountCents, code) {
  if (!code) return { amount: amountCents, promo: null };
  const promo = await PromoCode.findOne({ where: { code: String(code).toUpperCase().trim(), actif: true } });
  if (!promo) return { amount: amountCents, promo: null, error: 'Code invalide ou expiré' };
  if (promo.expires_at && promo.expires_at < new Date()) return { amount: amountCents, promo: null, error: 'Code expiré' };
  if (promo.max_uses !== null && promo.uses_count >= promo.max_uses) {
    return { amount: amountCents, promo: null, error: 'Code épuisé' };
  }
  const discounted = promo.type === 'percent'
    ? Math.round(amountCents * (1 - promo.valeur / 100))
    : Math.max(0, amountCents - promo.valeur);
  return { amount: discounted, promo };
}

// Crée une session Stripe Checkout — ownerType 'club' réservé aux dirigeant/admin
async function createCheckoutSession({ ownerType, ownerId, plan, promoCode, customerEmail, successUrl, cancelUrl }) {
  const stripe = getStripe();
  if (!stripe) throw new Error('Clé API Stripe non configurée dans .env');

  const baseAmount = getPlanAmount(plan, ownerType);
  if (!baseAmount) throw new Error('Prix d\'abonnement non configuré pour cette formule dans .env');

  const { amount, promo, error } = await applyPromoCode(baseAmount, promoCode);
  if (error) throw new Error(error);

  const interval = plan === 'annuel' ? 'year' : 'month';
  const label = ownerType === 'club' ? 'Abonnement MonClubHouse — Club' : 'Abonnement MonClubHouse';

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer_email: customerEmail,
    line_items: [{
      price_data: {
        currency: 'eur',
        unit_amount: amount,
        recurring: { interval },
        product_data: { name: `${label} (${plan})` },
      },
      quantity: 1,
    }],
    metadata: { owner_type: ownerType, owner_id: String(ownerId), plan, promo_code: promo?.code || '' },
    success_url: successUrl,
    cancel_url: cancelUrl,
  });

  if (promo) {
    await promo.increment('uses_count');
  }

  return session;
}

// Rappel de renouvellement : notifie 3 jours avant l'échéance (une seule fois par période)
async function createRenewalReminders() {
  const { createNotification } = require('../controllers/notificationController');
  const dansTroisJours = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);

  const dues = await Subscription.findAll({
    where: {
      statut: 'actif',
      rappel_envoye: false,
      current_period_end: { [Op.ne]: null, [Op.lte]: dansTroisJours },
    },
  });

  let created = 0;
  for (const sub of dues) {
    const dateStr = new Date(sub.current_period_end).toLocaleDateString('fr-FR');
    const destinataires = sub.owner_type === 'user'
      ? [sub.owner_id]
      : (await User.findAll({ where: { club_id: sub.owner_id, role: { [Op.in]: ['dirigeant', 'admin'] } }, attributes: ['id'] })).map(u => u.id);

    for (const userId of destinataires) {
      await createNotification({
        user_id: userId,
        type: 'systeme',
        titre: 'Renouvellement d\'abonnement',
        contenu: `Votre abonnement ${sub.plan} arrive à échéance le ${dateStr}. Pensez à le renouveler pour continuer à profiter de MonClubHouse.`,
        lien: '/profil',
        donnees: { subscription_id: sub.id },
      });
      created++;
    }
    await sub.update({ rappel_envoye: true });
  }
  return created;
}

module.exports = {
  isSubscriptionEnabled, getStripe, getPlanAmount, hasActiveAccess, applyPromoCode,
  createCheckoutSession, createRenewalReminders,
};
