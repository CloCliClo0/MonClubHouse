const { sequelize, User, Club, Equipe, Match, Licencie, InviteCode, Notification, Convocation, Message, Channel, Category, ChEquipe, ChMatch } = require('../models');
const { sendTestEmail, sendTestConvocEmail, isEmailConfigured } = require('../services/emailService');
const os = require('os');

const getServerDiagnostic = async (req, res) => {
  const startedAt = Date.now();
  const mem = process.memoryUsage();
  const uptime = process.uptime();

  // ── DB connection ──
  let dbOk = false;
  let dbError = null;
  let dbPingMs = null;
  try {
    const t0 = Date.now();
    await sequelize.authenticate();
    dbPingMs = Date.now() - t0;
    dbOk = true;
  } catch (err) {
    dbError = err.message;
  }

  // ── Table counts ──
  const counts = {};
  const countErrors = {};
  const models = { User, Club, Equipe, Match, Licencie, InviteCode, Notification, Convocation, Message, Channel, Category, ChEquipe, ChMatch };
  await Promise.all(
    Object.entries(models).map(async ([name, Model]) => {
      try { counts[name] = await Model.count(); }
      catch (err) { counts[name] = null; countErrors[name] = err.message; }
    })
  );

  // ── Model / DB schema check ──
  const schemaChecks = [];
  try {
    const [rows] = await sequelize.query('SHOW TABLES');
    const tables = rows.map(r => Object.values(r)[0]);
    const expectedTables = [
      'users', 'clubs', 'equipes', 'licencies', 'matchs', 'convocations',
      'invite_codes', 'notifications', 'channels', 'messages', 'adversaires',
      'equipe_coachs', 'match_events', 'player_votes', 'arbitrage_presences',
      'terrains', 'compositions', 'categories', 'ch_equipes', 'ch_matchs', 'sports',
    ];
    for (const t of expectedTables) {
      schemaChecks.push({ table: t, exists: tables.includes(t) });
    }

    // Vérifier colonnes critiques
    const criticalColumns = [
      { table: 'users',         column: 'pied_fort' },
      { table: 'users',         column: 'poste' },
      { table: 'equipes',       column: 'couleur' },
      { table: 'equipes',       column: 'niveau' },
      { table: 'equipes',       column: 'categorie_id' },
      { table: 'invite_codes',  column: 'categorie' },
      { table: 'invite_codes',  column: 'uses_count' },
      { table: 'invite_codes',  column: 'max_uses' },
      { table: 'invite_codes',  column: 'label' },
      { table: 'invite_codes',  column: 'created_by' },
      { table: 'invite_codes',  column: 'expires_at' },
      { table: 'matchs',        column: 'heure' },
      { table: 'matchs',        column: 'lieu' },
      { table: 'matchs',        column: 'rapport' },
      { table: 'convocations',  column: 'reponse_at' },
      { table: 'convocations',  column: 'notifie' },
      { table: 'notifications', column: 'send_at' },
      { table: 'notifications', column: 'lien' },
      { table: 'notifications', column: 'lu_at' },
      { table: 'sports',        column: 'nb_joueurs_equipe' },
    ];
    // Whitelist validation — table et colonne sont des constantes statiques,
    // mais on valide le format pour garantir qu'aucune valeur externe n'est interpolée
    const SAFE_IDENT = /^[a-z_][a-z0-9_]{0,63}$/;
    for (const { table, column } of criticalColumns) {
      if (!SAFE_IDENT.test(table) || !SAFE_IDENT.test(column)) continue;
      try {
        const [cols] = await sequelize.query(
          'SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = ? AND COLUMN_NAME = ? AND TABLE_SCHEMA = DATABASE()',
          { replacements: [table, column] }
        );
        schemaChecks.push({ table: `${table}.${column}`, exists: cols.length > 0, isColumn: true });
      } catch { schemaChecks.push({ table: `${table}.${column}`, exists: false, isColumn: true }); }
    }
  } catch (err) {
    schemaChecks.push({ table: '_error', exists: false, error: err.message });
  }

  // ── Env check ──
  const envVars = [
    'DB_HOST', 'DB_NAME', 'DB_USER', 'JWT_SECRET', 'JWT_REFRESH_SECRET',
    'GOOGLE_CLIENT_ID', 'SMTP_HOST', 'NODE_ENV', 'APP_URL',
  ];
  const envStatus = {};
  for (const v of envVars) {
    envStatus[v] = process.env[v] ? '✓ défini' : '✗ MANQUANT';
  }

  const totalMs = Date.now() - startedAt;

  return res.json({
    success: true,
    data: {
      server: {
        uptime_s: Math.round(uptime),
        uptime_human: formatUptime(uptime),
        node_version: process.version,
        platform: process.platform,
        env: process.env.NODE_ENV || 'unknown',
        app_url: process.env.APP_URL || '—',
        pid: process.pid,
        memory: {
          heap_used_mb: Math.round(mem.heapUsed / 1024 / 1024),
          heap_total_mb: Math.round(mem.heapTotal / 1024 / 1024),
          rss_mb: Math.round(mem.rss / 1024 / 1024),
          external_mb: Math.round(mem.external / 1024 / 1024),
          heap_pct: Math.round((mem.heapUsed / mem.heapTotal) * 100),
        },
        os: {
          type: os.type(),
          free_mem_mb: Math.round(os.freemem() / 1024 / 1024),
          total_mem_mb: Math.round(os.totalmem() / 1024 / 1024),
          load_avg: os.loadavg().map(n => +n.toFixed(2)),
          cpus: os.cpus().length,
        },
      },
      database: {
        ok: dbOk,
        ping_ms: dbPingMs,
        error: dbError,
        dialect: sequelize.getDialect(),
        counts,
        count_errors: countErrors,
      },
      schema: schemaChecks,
      env: envStatus,
      diagnostic_ms: totalMs,
      timestamp: new Date().toISOString(),
    },
  });
};

function formatUptime(s) {
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const parts = [];
  if (d) parts.push(`${d}j`);
  if (h) parts.push(`${h}h`);
  parts.push(`${m}min`);
  return parts.join(' ');
}

const testGemini = async (req, res) => {
  const { buildQuotaInfo } = require('./aiScraperController');
  const quota = buildQuotaInfo(req.user.id, req.user.role);

  if (!process.env.GEMINI_API_KEY) {
    return res.status(200).json({
      success: false,
      data: { ok: false, error: 'GEMINI_API_KEY non configurée dans .env', model: null, ms: null, response: null, tokens: null, quota },
    });
  }

  const { GoogleGenerativeAI } = require('@google/generative-ai');
  const MODELS = ['gemini-2.5-flash', 'gemini-flash-latest'];

  for (const modelName of MODELS) {
    const t0 = Date.now();
    try {
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent('Réponds uniquement par le mot : OK');
      const text = result.response.text().trim().slice(0, 100);
      const ms = Date.now() - t0;
      const usage = result.response.usageMetadata || null;
      const tokens = usage ? {
        prompt: usage.promptTokenCount ?? null,
        response: usage.candidatesTokenCount ?? null,
        total: usage.totalTokenCount ?? null,
      } : null;
      return res.json({ success: true, data: { ok: true, model: modelName, ms, response: text, error: null, tokens, quota } });
    } catch (err) {
      const ms = Date.now() - t0;
      const isNotFound = err.status === 404 || String(err.message).includes('not found') || String(err.message).includes('NOT_FOUND');
      if (isNotFound) continue;
      return res.json({ success: true, data: { ok: false, model: modelName, ms, response: null, error: err.message, tokens: null, quota } });
    }
  }

  return res.json({ success: true, data: { ok: false, model: null, ms: null, response: null, error: 'Aucun modèle Gemini disponible', tokens: null, quota } });
};

const testDrive = async (req, res) => {
  const t0 = Date.now();
  try {
    const { uploadToDrive } = require('../services/driveService');
    const testContent = Buffer.from(`Diagnostic Drive — MonClubHouse — ${new Date().toISOString()}`);
    const result = await uploadToDrive({
      buffer: testContent,
      filename: `diagnostic-test-${Date.now()}.txt`,
      mimetype: 'text/plain',
      subfolder: '_diagnostic',
    });
    const ms = Date.now() - t0;
    return res.json({ success: true, data: { ok: true, ms, fileId: result.id, url: result.url, name: result.name, error: null } });
  } catch (err) {
    const ms = Date.now() - t0;
    return res.json({ success: true, data: { ok: false, ms, error: err.message } });
  }
};

const testDiag2fa = async (req, res) => {
  const { user_id } = req.body;
  if (!user_id) return res.status(400).json({ success: false, message: 'user_id requis' });
  try {
    const user = await User.findByPk(user_id, { attributes: ['id', 'nom', 'prenom', 'email'] });
    if (!user) return res.status(404).json({ success: false, message: 'Utilisateur introuvable' });
    const { send2faEmail, isEmailConfigured } = require('../services/emailService');
    if (!isEmailConfigured()) {
      return res.json({ success: true, data: { ok: false, ms: null, to: user.email, error: 'SMTP non configuré' } });
    }
    const code = String(Math.floor(100000 + Math.random() * 900000));
    const t0 = Date.now();
    const result = await send2faEmail({ user, code });
    const ms = Date.now() - t0;
    return res.json({ success: true, data: { ok: result.sent, ms, to: user.email, code_sent: result.sent, error: result.reason || null } });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

const testDiagEmailVerify = async (req, res) => {
  const { user_id } = req.body;
  if (!user_id) return res.status(400).json({ success: false, message: 'user_id requis' });
  try {
    const user = await User.findByPk(user_id, { attributes: ['id', 'nom', 'prenom', 'email'] });
    if (!user) return res.status(404).json({ success: false, message: 'Utilisateur introuvable' });
    const { sendVerifyEmail, isEmailConfigured } = require('../services/emailService');
    if (!isEmailConfigured()) {
      return res.json({ success: true, data: { ok: false, ms: null, to: user.email, error: 'SMTP non configuré' } });
    }
    const token = require('crypto').randomBytes(32).toString('hex');
    const t0 = Date.now();
    const result = await sendVerifyEmail({ user, token });
    const ms = Date.now() - t0;
    return res.json({ success: true, data: { ok: result.sent, ms, to: user.email, error: result.reason || null } });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

const testEmail = async (req, res) => {
  const { user_id } = req.body;
  if (!user_id) return res.status(400).json({ success: false, message: 'user_id requis' });

  try {
    const user = await User.findByPk(user_id, { attributes: ['id', 'nom', 'prenom', 'email'] });
    if (!user) return res.status(404).json({ success: false, message: 'Utilisateur introuvable' });

    if (!isEmailConfigured()) {
      return res.json({ success: true, data: { ok: false, ms: null, to: user.email, error: 'SMTP non configuré (SMTP_USER / SMTP_PASS manquants)' } });
    }

    const result = await sendTestEmail({ user });
    return res.json({ success: true, data: { ok: result.sent, ms: result.ms, to: user.email, error: result.reason || null } });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

const testNotification = async (req, res) => {
  const { user_id } = req.body;
  if (!user_id) return res.status(400).json({ success: false, message: 'user_id requis' });

  try {
    const user = await User.findByPk(user_id, { attributes: ['id', 'nom', 'prenom', 'email'] });
    if (!user) return res.status(404).json({ success: false, message: 'Utilisateur introuvable' });

    const t0 = Date.now();
    await Notification.create({
      user_id: user.id,
      type: 'systeme',
      titre: '🔔 Notification de test',
      contenu: `Test envoyé depuis le panel de diagnostic par le superadmin. Si vous voyez cette notification, le système de notifications in-app fonctionne correctement.`,
      lien: '/diagnostic',
    });
    const ms = Date.now() - t0;
    return res.json({ success: true, data: { ok: true, ms, to: `${user.prenom} ${user.nom}`, error: null } });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

const testConvocEmail = async (req, res) => {
  const { user_id } = req.body;
  if (!user_id) return res.status(400).json({ success: false, message: 'user_id requis' });
  try {
    const user = await User.findByPk(user_id, { attributes: ['id', 'nom', 'prenom', 'email'] });
    if (!user) return res.status(404).json({ success: false, message: 'Utilisateur introuvable' });

    if (!isEmailConfigured()) {
      return res.json({ success: true, data: { ok: false, ms: null, to: user.email, error: 'SMTP non configuré (SMTP_USER_CONV / SMTP_PASS_CONV manquants)' } });
    }

    const result = await sendTestConvocEmail({ user });
    return res.json({ success: true, data: { ok: result.sent, ms: result.ms, to: user.email, error: result.reason || null } });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getServerDiagnostic, testGemini, testDrive, testDiag2fa, testDiagEmailVerify, testEmail, testNotification, testConvocEmail };
