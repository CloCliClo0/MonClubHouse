const nodemailer = require('nodemailer');

// Transporter singleton — créé une seule fois
let _transporter = null;

function getTransporter() {
  if (_transporter) return _transporter;

  _transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.hostinger.com',
    port: parseInt(process.env.SMTP_PORT || '465'),
    secure: process.env.SMTP_SECURE !== 'false', // true par défaut (port 465 SSL)
    auth: {
      user: process.env.SMTP_USER_CONV,
      pass: process.env.SMTP_PASS_CONV,
    },
    tls: {
      rejectUnauthorized: process.env.NODE_ENV === 'production',
    },
  });

  return _transporter;
}

// Vérifie que la config SMTP est bien renseignée
function isEmailConfigured() {
  return !!(process.env.SMTP_USER_CONV && process.env.SMTP_PASS_CONV);
}

// ─── Template HTML ─────────────────────────────────────────────────────────

function buildConvocationEmail({ joueur, match, club, appUrl }) {
  const matchDate = new Date(match.date);
  const dateStr = matchDate.toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
  const heureStr = match.heure ? match.heure.substring(0, 5) : matchDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

  const typeLabel  = match.type === 'entrainement' ? 'Entraînement' : 'Match';
  const titleLine  = match.type === 'entrainement'
    ? `Entraînement — ${match.equipe?.nom || 'Équipe'}`
    : `${match.equipe?.nom || 'Équipe'} vs ${match.adversaire}`;

  const confirmUrl = `${appUrl}/convocations`;

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>Convocation MonClubHouse</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f6;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">

  <!-- Wrapper -->
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f6;padding:40px 0;">
    <tr><td align="center">

      <!-- Card -->
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.08);">

        <!-- Header vert -->
        <tr>
          <td style="background:linear-gradient(135deg,#1b4332 0%,#2d6a4f 100%);padding:36px 40px;text-align:center;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td align="center">
                  <div style="display:inline-block;background:rgba(255,255,255,.15);border-radius:12px;padding:12px 20px;margin-bottom:16px;">
                    <span style="color:#ffffff;font-weight:900;font-size:22px;letter-spacing:-1px;">MCH</span>
                  </div>
                  <p style="margin:0;color:rgba(255,255,255,.7);font-size:13px;letter-spacing:2px;text-transform:uppercase;font-weight:600;">
                    ${club?.nom || 'MonClubHouse'}
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Badge type -->
        <tr>
          <td align="center" style="padding:28px 40px 0;">
            <span style="display:inline-block;background:${match.type === 'entrainement' ? '#dbeafe' : '#dcfce7'};color:${match.type === 'entrainement' ? '#1d4ed8' : '#15803d'};font-size:12px;font-weight:700;letter-spacing:1px;text-transform:uppercase;padding:6px 14px;border-radius:99px;">
              ${typeLabel}
            </span>
          </td>
        </tr>

        <!-- Titre -->
        <tr>
          <td style="padding:20px 40px 8px;text-align:center;">
            <h1 style="margin:0;font-size:24px;font-weight:800;color:#181a2e;line-height:1.3;">
              Tu es convoqué(e) !
            </h1>
            <p style="margin:8px 0 0;font-size:16px;color:#404943;">
              ${titleLine}
            </p>
          </td>
        </tr>

        <!-- Infos match -->
        <tr>
          <td style="padding:28px 40px;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fffe;border:1px solid #bfc9c1;border-radius:12px;overflow:hidden;">
              <tr>
                <td style="padding:20px 24px;border-bottom:1px solid #e8e8f0;">
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td width="36" style="vertical-align:top;">
                        <span style="font-size:22px;">📅</span>
                      </td>
                      <td style="padding-left:12px;vertical-align:top;">
                        <p style="margin:0;font-size:12px;color:#707973;font-weight:600;text-transform:uppercase;letter-spacing:.5px;">Date</p>
                        <p style="margin:4px 0 0;font-size:15px;color:#181a2e;font-weight:700;text-transform:capitalize;">${dateStr}</p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              <tr>
                <td style="padding:20px 24px;border-bottom:1px solid #e8e8f0;">
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td width="36" style="vertical-align:top;">
                        <span style="font-size:22px;">⏰</span>
                      </td>
                      <td style="padding-left:12px;vertical-align:top;">
                        <p style="margin:0;font-size:12px;color:#707973;font-weight:600;text-transform:uppercase;letter-spacing:.5px;">Heure</p>
                        <p style="margin:4px 0 0;font-size:15px;color:#181a2e;font-weight:700;">${heureStr}</p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              ${match.terrain?.nom ? `
              <tr>
                <td style="padding:20px 24px;border-bottom:1px solid #e8e8f0;">
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td width="36" style="vertical-align:top;"><span style="font-size:22px;">📍</span></td>
                      <td style="padding-left:12px;vertical-align:top;">
                        <p style="margin:0;font-size:12px;color:#707973;font-weight:600;text-transform:uppercase;letter-spacing:.5px;">Lieu</p>
                        <p style="margin:4px 0 0;font-size:15px;color:#181a2e;font-weight:700;">${match.terrain.nom}</p>
                        ${match.terrain.adresse ? `<p style="margin:2px 0 0;font-size:13px;color:#707973;">${match.terrain.adresse}</p>` : ''}
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>` : ''}
              ${match.type === 'match' && match.adversaire ? `
              <tr>
                <td style="padding:20px 24px;">
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td width="36" style="vertical-align:top;"><span style="font-size:22px;">⚽</span></td>
                      <td style="padding-left:12px;vertical-align:top;">
                        <p style="margin:0;font-size:12px;color:#707973;font-weight:600;text-transform:uppercase;letter-spacing:.5px;">Adversaire</p>
                        <p style="margin:4px 0 0;font-size:15px;color:#181a2e;font-weight:700;">${match.adversaire}</p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>` : ''}
            </table>
          </td>
        </tr>

        <!-- Instructions -->
        ${match.instructions ? `
        <tr>
          <td style="padding:0 40px 24px;">
            <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:10px;padding:16px 20px;">
              <p style="margin:0;font-size:13px;color:#92400e;font-weight:700;">📋 Instructions du coach</p>
              <p style="margin:8px 0 0;font-size:14px;color:#78350f;">${match.instructions}</p>
            </div>
          </td>
        </tr>` : ''}

        <!-- CTA -->
        <tr>
          <td style="padding:8px 40px 36px;text-align:center;">
            <p style="margin:0 0 20px;font-size:14px;color:#404943;">
              Confirme ta présence directement depuis l'application :
            </p>
            <table cellpadding="0" cellspacing="0" style="margin:0 auto;">
              <tr>
                <td>
                  <a href="${confirmUrl}?action=present" style="display:inline-block;background:#0f5238;color:#ffffff;text-decoration:none;font-size:15px;font-weight:700;padding:14px 32px;border-radius:10px;margin-right:10px;">
                    ✅ Je serai là
                  </a>
                </td>
                <td style="padding-left:10px;">
                  <a href="${confirmUrl}?action=absent" style="display:inline-block;background:#ffffff;color:#181a2e;text-decoration:none;font-size:15px;font-weight:700;padding:14px 32px;border-radius:10px;border:1.5px solid #bfc9c1;">
                    ❌ Je serai absent
                  </a>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#f4f4f6;padding:24px 40px;text-align:center;border-top:1px solid #e8e8f0;">
            <p style="margin:0;font-size:12px;color:#707973;">
              Ce message a été envoyé par <strong>${club?.nom || 'MonClubHouse'}</strong> via la plateforme MonClubHouse.<br/>
              Pour ne plus recevoir ces emails, modifiez vos <a href="${appUrl}/profil" style="color:#0f5238;">préférences de notification</a>.
            </p>
          </td>
        </tr>

      </table>
      <!-- /Card -->

    </td></tr>
  </table>
</body>
</html>`;
}

// ─── Fonctions publiques ────────────────────────────────────────────────────

/**
 * Envoie un email de convocation à un joueur.
 */
async function sendConvocationEmail({ joueur, match, club }) {
  if (!isEmailConfigured()) {
    console.warn('[Email] SMTP non configuré — email ignoré');
    return { sent: false, reason: 'smtp_not_configured' };
  }

  const appUrl = process.env.APP_URL || 'https://monclubhouse.fr';
  const transporter = getTransporter();

  const matchDate = new Date(match.date);
  const dateStr = matchDate.toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long',
  });
  const typeLabel = match.type === 'entrainement' ? 'Entraînement' : 'Match';
  const subject = match.type === 'entrainement'
    ? `[MCH] Convocation — Entraînement ${dateStr}`
    : `[MCH] Convocation — ${match.equipe?.nom || 'Match'} vs ${match.adversaire} · ${dateStr}`;

  const html = buildConvocationEmail({ joueur, match, club, appUrl });

  try {
    await transporter.sendMail({
      from: `"${club?.nom || 'MonClubHouse'}" <${process.env.SMTP_USER_CONV}>`,
      to: `"${joueur.prenom} ${joueur.nom}" <${joueur.email}>`,
      subject,
      html,
    });
    console.log(`[Email] Convocation envoyée → ${joueur.email}`);
    return { sent: true };
  } catch (err) {
    console.error(`[Email] Échec envoi → ${joueur.email}:`, err.message);
    return { sent: false, reason: err.message };
  }
}

/**
 * Envoie les convocations en masse pour une liste de joueurs.
 * Retourne un rapport { total, sent, failed }.
 */
async function sendBulkConvocationEmails({ joueurs, match, club }) {
  if (!isEmailConfigured()) {
    return { total: joueurs.length, sent: 0, failed: joueurs.length, reason: 'smtp_not_configured' };
  }

  let sent = 0;
  let failed = 0;

  for (const joueur of joueurs) {
    if (!joueur.email || joueur.notif_email === false) {
      failed++;
      continue;
    }
    const result = await sendConvocationEmail({ joueur, match, club });
    result.sent ? sent++ : failed++;
  }

  return { total: joueurs.length, sent, failed };
}

/**
 * Envoie un email de test de diagnostic à un utilisateur.
 */
async function sendTestEmail({ user }) {
  if (!isEmailConfigured()) {
    return { sent: false, reason: 'smtp_not_configured', ms: null };
  }
  const transporter = getTransporter();
  const t0 = Date.now();
  try {
    await transporter.sendMail({
      from: `"MonClubHouse" <${process.env.SMTP_USER_CONV}>`,
      to: `"${user.prenom} ${user.nom}" <${user.email}>`,
      subject: '[TEST] MonClubHouse — Test de configuration email',
      html: `<div style="font-family:sans-serif;max-width:500px;margin:0 auto;padding:32px;">
        <h2 style="color:#1b4332;">🔔 Email de test</h2>
        <p>Bonjour <strong>${user.prenom}</strong>,</p>
        <p>Ceci est un email de test envoyé depuis le panel de diagnostic MonClubHouse.</p>
        <p style="color:#15803d;font-weight:bold;">✅ La configuration SMTP est opérationnelle.</p>
        <hr style="border:none;border-top:1px solid #e8e8f0;margin:24px 0;"/>
        <p style="font-size:12px;color:#707973;">MonClubHouse — Diagnostic système</p>
      </div>`,
      text: `Bonjour ${user.prenom},\n\nCeci est un email de test envoyé depuis le panel de diagnostic.\nLa configuration SMTP est opérationnelle.`,
    });
    return { sent: true, ms: Date.now() - t0 };
  } catch (err) {
    return { sent: false, reason: err.message, ms: Date.now() - t0 };
  }
}

/**
 * Vérifie la connexion SMTP (utile au démarrage du serveur).
 */
async function verifyConnection() {
  if (!isEmailConfigured()) return false;
  try {
    await getTransporter().verify();
    console.log('[Email] SMTP Hostinger connecté ✓');
    return true;
  } catch (err) {
    console.warn('[Email] SMTP non joignable:', err.message);
    return false;
  }
}

/**
 * Envoie un code 2FA à l'utilisateur (lors de la connexion ou de l'activation).
 */
async function send2faEmail({ user, code }) {
  if (!isEmailConfigured()) return { sent: false, reason: 'smtp_not_configured' };
  const transporter = getTransporter();
  const appUrl = process.env.APP_URL || 'https://monclubhouse.fr';
  try {
    await transporter.sendMail({
      from: `"MonClubHouse" <${process.env.SMTP_USER_CONV}>`,
      to: `"${user.prenom} ${user.nom}" <${user.email}>`,
      subject: `[MCH] Code de vérification : ${code}`,
      html: `<div style="font-family:sans-serif;max-width:500px;margin:0 auto;padding:32px;">
        <div style="background:linear-gradient(135deg,#1b4332,#2d6a4f);padding:24px;border-radius:12px 12px 0 0;text-align:center;">
          <span style="color:#fff;font-weight:900;font-size:22px;letter-spacing:-1px;">MCH</span>
        </div>
        <div style="background:#fff;padding:32px;border:1px solid #e8e8f0;border-radius:0 0 12px 12px;">
          <h2 style="color:#1b4332;margin:0 0 16px;">Code de vérification</h2>
          <p>Bonjour <strong>${user.prenom}</strong>,</p>
          <p>Votre code de vérification à 6 chiffres est :</p>
          <div style="background:#f4f4f6;border-radius:8px;padding:20px;text-align:center;margin:20px 0;">
            <span style="font-size:36px;font-weight:900;letter-spacing:12px;color:#1b4332;font-family:monospace;">${code}</span>
          </div>
          <p style="color:#707973;font-size:13px;">Ce code est valable <strong>10 minutes</strong>. Ne le communiquez à personne.</p>
          <hr style="border:none;border-top:1px solid #e8e8f0;margin:24px 0;"/>
          <p style="font-size:12px;color:#707973;">MonClubHouse — <a href="${appUrl}" style="color:#1b4332;">monclubhouse.fr</a></p>
        </div>
      </div>`,
      text: `Bonjour ${user.prenom},\n\nVotre code de vérification MonClubHouse : ${code}\n\nValable 10 minutes. Ne le communiquez à personne.`,
    });
    return { sent: true };
  } catch (err) {
    return { sent: false, reason: err.message };
  }
}

/**
 * Envoie un email de vérification d'adresse email (lien cliquable).
 */
async function sendVerifyEmail({ user, token }) {
  if (!isEmailConfigured()) return { sent: false, reason: 'smtp_not_configured' };
  const transporter = getTransporter();
  const appUrl = process.env.APP_URL || 'https://monclubhouse.fr';
  const verifyUrl = `${appUrl}/api/auth/verify-email?token=${token}`;
  try {
    await transporter.sendMail({
      from: `"MonClubHouse" <${process.env.SMTP_USER_CONV}>`,
      to: `"${user.prenom} ${user.nom}" <${user.email}>`,
      subject: '[MCH] Vérifiez votre adresse email',
      html: `<div style="font-family:sans-serif;max-width:500px;margin:0 auto;padding:32px;">
        <div style="background:linear-gradient(135deg,#1b4332,#2d6a4f);padding:24px;border-radius:12px 12px 0 0;text-align:center;">
          <span style="color:#fff;font-weight:900;font-size:22px;letter-spacing:-1px;">MCH</span>
        </div>
        <div style="background:#fff;padding:32px;border:1px solid #e8e8f0;border-radius:0 0 12px 12px;">
          <h2 style="color:#1b4332;margin:0 0 16px;">Vérifiez votre adresse email</h2>
          <p>Bonjour <strong>${user.prenom}</strong>,</p>
          <p>Cliquez sur le bouton ci-dessous pour confirmer votre adresse email sur MonClubHouse.</p>
          <div style="text-align:center;margin:28px 0;">
            <a href="${verifyUrl}" style="display:inline-block;background:#1b4332;color:#fff;text-decoration:none;font-size:15px;font-weight:700;padding:14px 32px;border-radius:10px;">
              ✅ Vérifier mon email
            </a>
          </div>
          <p style="color:#707973;font-size:13px;">Ce lien est valable <strong>24 heures</strong>. Si vous n'avez pas créé de compte MonClubHouse, ignorez cet email.</p>
          <hr style="border:none;border-top:1px solid #e8e8f0;margin:24px 0;"/>
          <p style="font-size:12px;color:#707973;">Ou copiez ce lien : <a href="${verifyUrl}" style="color:#1b4332;">${verifyUrl}</a></p>
        </div>
      </div>`,
      text: `Bonjour ${user.prenom},\n\nVérifiez votre email MonClubHouse :\n${verifyUrl}\n\nLien valable 24 heures.`,
    });
    return { sent: true };
  } catch (err) {
    return { sent: false, reason: err.message };
  }
}

/**
 * Envoie un email de convocation de test (pour le diagnostic superadmin).
 * Utilise un match fictif pour ne pas nécessiter de vraie donnée DB.
 */
async function sendTestConvocEmail({ user }) {
  if (!isEmailConfigured()) {
    return { sent: false, reason: 'smtp_not_configured', ms: null };
  }

  const appUrl = process.env.APP_URL || 'https://monclubhouse.fr';
  const transporter = getTransporter();

  const fakeMatch = {
    type: 'match',
    date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    adversaire: 'Club Test FC',
    equipe: { nom: 'U15 A (test)' },
    terrain: { nom: 'Terrain Municipal', adresse: '1 Place du Stade, 75000 Paris' },
    instructions: 'Ceci est un email de convocation de TEST envoyé depuis le panel de diagnostic. Aucune action n\'est requise.',
  };

  const fakeClub = { nom: 'MonClubHouse' };

  const matchDate = new Date(fakeMatch.date);
  const dateStr = matchDate.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });

  const subject = `[TEST] Convocation — Match vs Club Test FC · ${dateStr}`;
  const html = buildConvocationEmail({ joueur: user, match: fakeMatch, club: fakeClub, appUrl });

  const t0 = Date.now();
  try {
    await transporter.sendMail({
      from: `"MonClubHouse" <${process.env.SMTP_USER_CONV}>`,
      to: `"${user.prenom} ${user.nom}" <${user.email}>`,
      subject,
      html,
    });
    return { sent: true, ms: Date.now() - t0 };
  } catch (err) {
    return { sent: false, reason: err.message, ms: Date.now() - t0 };
  }
}

// Alerte générique (texte brut) vers l'adresse de supervision — ex: échec de migration au
// démarrage. Best-effort : n'importe quelle erreur d'envoi est avalée, jamais remontée à
// l'appelant (une alerte cassée ne doit jamais faire planter le processus qui l'a déclenchée).
async function sendAdminAlert({ subject, message }) {
  if (!isEmailConfigured()) return { sent: false, reason: 'SMTP non configuré' };
  const to = process.env.ALERT_EMAIL || process.env.SMTP_USER_CONV;
  try {
    await getTransporter().sendMail({
      from: `"MonClubHouse — Alertes" <${process.env.SMTP_USER_CONV}>`,
      to,
      subject: `[MonClubHouse] ${subject}`,
      text: message,
    });
    return { sent: true };
  } catch (err) {
    return { sent: false, reason: err.message };
  }
}

module.exports = { sendConvocationEmail, sendBulkConvocationEmails, sendTestEmail, sendTestConvocEmail, send2faEmail, sendVerifyEmail, verifyConnection, isEmailConfigured, sendAdminAlert };
