const { sequelize, User, Club, Equipe, Match, Licencie, InviteCode, Notification, Convocation, Message, Channel } = require('../models');
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
  const models = { User, Club, Equipe, Match, Licencie, InviteCode, Notification, Convocation, Message, Channel };
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
      'terrains', 'compositions', 'resultats',
    ];
    for (const t of expectedTables) {
      schemaChecks.push({ table: t, exists: tables.includes(t) });
    }

    // Vérifier colonnes critiques
    const criticalColumns = [
      { table: 'users',        column: 'pied_fort' },
      { table: 'users',        column: 'poste' },
      { table: 'equipes',      column: 'couleur' },
      { table: 'equipes',      column: 'niveau' },
      { table: 'invite_codes', column: 'categorie' },
      { table: 'invite_codes', column: 'uses_count' },
      { table: 'invite_codes', column: 'max_uses' },
      { table: 'invite_codes', column: 'label' },
      { table: 'notifications','column': 'send_at' },
    ];
    for (const { table, column } of criticalColumns) {
      try {
        const [cols] = await sequelize.query(`SHOW COLUMNS FROM \`${table}\` LIKE '${column}'`);
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

module.exports = { getServerDiagnostic };
