const https = require('https');

function isSmsConfigured() {
  return !!(process.env.CLICKSEND_API_TOKEN);
}

/**
 * Envoie un SMS via l'API ClickSend.
 * @param {string} to   - Numéro de téléphone du destinataire (format E.164 ou local FR)
 * @param {string} message - Texte du SMS (≤ 160 chars pour un segment)
 */
async function sendSms({ to, message }) {
  if (!isSmsConfigured()) {
    return { sent: false, reason: 'CLICKSEND_API_TOKEN non configurée dans .env' };
  }

  // Normalise le numéro : retire espaces, tirets, parenthèses, points
  let phone = String(to).replace(/[\s\-\(\)\.]/g, '');
  // Convertit les numéros français 06/07 → +336/+337
  if (/^0[67]/.test(phone)) phone = '+33' + phone.slice(1);
  // Vérifie le format E.164 minimal
  if (!/^\+?[0-9]{8,15}$/.test(phone)) {
    return { sent: false, reason: `Numéro invalide ou non supporté : ${phone}` };
  }

  const msg = { to: phone, body: message, source: 'monclubhouse' };
  if (process.env.CLICKSEND_FROM) msg.from = process.env.CLICKSEND_FROM;

  const payload = JSON.stringify({ messages: [msg] });

  const t0 = Date.now();
  return new Promise((resolve) => {
    const req = https.request(
      {
        hostname: 'rest.clicksend.com',
        path: '/v3/sms/send',
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.CLICKSEND_API_TOKEN}`,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload),
        },
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          const ms = Date.now() - t0;
          let parsed = {};
          try { parsed = JSON.parse(data); } catch {}
          const msgResult = parsed?.data?.messages?.[0];
          const ok = res.statusCode >= 200 && res.statusCode < 300 && msgResult?.status === 'SUCCESS';
          if (ok) {
            resolve({ sent: true, ms, to: phone, status: res.statusCode });
          } else {
            resolve({
              sent: false, ms, to: phone,
              reason: msgResult?.status || parsed?.response_msg || `HTTP ${res.statusCode}`,
              status: res.statusCode,
            });
          }
        });
      }
    );
    req.on('error', (err) => {
      resolve({ sent: false, ms: Date.now() - t0, to: phone, reason: err.message });
    });
    req.write(payload);
    req.end();
  });
}

/**
 * Envoie un SMS de convocation formaté à un joueur.
 */
async function sendConvocationSms({ joueur, match }) {
  if (!joueur.telephone) {
    return { sent: false, reason: 'Numéro de téléphone manquant pour ce joueur' };
  }

  const matchDate = new Date(match.date);
  const dateStr = matchDate.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });
  const heureStr = matchDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

  const typeLabel = match.type === 'entrainement' ? 'Entraînement' : 'Match';
  const vs = match.type === 'match' && match.adversaire ? ` vs ${match.adversaire}` : '';
  const lieu = match.terrain?.nom ? ` @ ${match.terrain.nom}` : '';

  const message = `[MCH] Convocation ${typeLabel}${vs} — ${dateStr} ${heureStr}${lieu}. Répondez sur monclubhouse.fr/convocations`;

  return sendSms({ to: joueur.telephone, message });
}

/**
 * Envoie un SMS de test de convocation (pour le diagnostic).
 */
async function sendTestConvocSms({ user }) {
  if (!user.telephone) {
    return { sent: false, reason: 'Numéro de téléphone non renseigné pour cet utilisateur. Ajoutez-le dans le profil.' };
  }

  const message = `[TEST MCH] Convocation Match vs Club Test FC — Sam. 14 Juin 15h00 @ Terrain Municipal. Répondez sur monclubhouse.fr/convocations`;

  return sendSms({ to: user.telephone, message });
}

module.exports = { sendSms, sendConvocationSms, sendTestConvocSms, isSmsConfigured };
