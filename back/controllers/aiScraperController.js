const { GoogleGenerativeAI } = require('@google/generative-ai');
const { ChEquipe, ChMatch } = require('../models');

// Quota journalier par rôle
const DAILY_LIMITS = {
  superadmin: 200,
  admin: 50,
  dirigeant: 20,
  coach: 10,
};

// Store en mémoire : userId → { count, date }
const quotaStore = {};

function getOrInitQuota(userId) {
  const today = new Date().toISOString().slice(0, 10);
  if (!quotaStore[userId] || quotaStore[userId].date !== today) {
    quotaStore[userId] = { count: 0, date: today };
  }
  return quotaStore[userId];
}

function buildQuotaInfo(userId, role) {
  const quota = getOrInitQuota(userId);
  const limit = DAILY_LIMITS[role] ?? 0;
  return { used: quota.count, limit, remaining: Math.max(0, limit - quota.count) };
}

const SYSTEM_PROMPT = `Tu es un assistant spécialisé dans l'extraction de données sportives.
Analyse le contenu fourni (screenshot, PDF, HTML ou texte d'un site de résultats sportifs) et extrais TOUS les matchs trouvés.

Pour chaque match, fournis exactement ces champs :
- dom : nom de l'équipe à domicile (string)
- ext : nom de l'équipe à l'extérieur (string)
- score_dom : score de l'équipe domicile (number ou null si le match n'a pas encore eu lieu)
- score_ext : score de l'équipe extérieure (number ou null si le match n'a pas encore eu lieu)
- date : date au format YYYY-MM-DD (string ou null)
- journee : numéro de journée/ronde (number ou null)

Réponds UNIQUEMENT avec un objet JSON valide, sans aucun texte avant ou après :
{"matches":[...],"championnat":"nom du championnat ou null","saison":"ex: 2024-2025 ou null"}

RÈGLES IMPORTANTES :
- "championnat" = NOM de la compétition sportive (ex: "Régional 2", "Division Honneur", "Championnat National U15", "Coupe de France"). Ne mets JAMAIS une année (ex: "2026-2027") dans ce champ. Si tu ne trouves pas le nom exact, mets null.
- "saison" = l'année sportive uniquement, au format AAAA-AAAA (ex: "2024-2025", "2025-2026"). Ce champ ne contient QUE des chiffres séparés par un tiret.

Si aucun match n'est trouvé, retourne : {"matches":[],"championnat":null,"saison":null}`;

// GET /ai-scraper/quota
const getQuota = (req, res) => {
  const { id: userId, role } = req.user;
  return res.json({ success: true, data: buildQuotaInfo(userId, role) });
};

// POST /ai-scraper/analyse
const analyseWithAI = async (req, res) => {
  const { id: userId, role } = req.user;
  const quota = getOrInitQuota(userId);
  const limit = DAILY_LIMITS[role] ?? 0;

  if (quota.count >= limit) {
    return res.status(429).json({
      success: false,
      message: `Quota journalier atteint (${limit} analyse${limit > 1 ? 's' : ''}/jour pour votre rôle). Réessayez demain.`,
    });
  }

  const file = req.file;
  const html = req.body?.html;
  const json = req.body?.json;

  if (!file && !html?.trim() && !json?.trim()) {
    return res.status(400).json({ success: false, message: 'Fournissez un fichier (image/PDF), du HTML/texte ou du JSON.' });
  }

  if (!process.env.GEMINI_API_KEY) {
    return res.status(500).json({ success: false, message: 'Clé API Gemini non configurée sur le serveur.' });
  }

  // Ordre de préférence des modèles (fallback automatique)
  // gemini-2.0-flash a quota=0 sur ce projet → on utilise 2.5-flash en priorité
  const MODELS = ['gemini-2.5-flash', 'gemini-flash-latest'];

  for (const modelName of MODELS) {
    try {
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: modelName });

      let parts;
      if (file) {
        const base64 = file.buffer.toString('base64');
        parts = [
          { inlineData: { data: base64, mimeType: file.mimetype } },
          { text: SYSTEM_PROMPT + '\n\nExtrais tous les matchs de ce document.' },
        ];
      } else if (json?.trim()) {
        const truncated = json.slice(0, 80000);
        parts = [{ text: SYSTEM_PROMPT + `\n\nExtrais tous les matchs du JSON suivant :\n\n${truncated}` }];
      } else {
        const truncated = html.slice(0, 80000);
        parts = [{ text: SYSTEM_PROMPT + `\n\nExtrais tous les matchs du contenu suivant :\n\n${truncated}` }];
      }

      const result = await model.generateContent({ contents: [{ role: 'user', parts }] });
      const text = result.response.text();

      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('Pas de JSON dans la réponse IA');

      const parsed = JSON.parse(jsonMatch[0]);
      if (!Array.isArray(parsed.matches)) throw new Error('Format de réponse IA invalide');

      quota.count++;
      console.log(`[AI Scraper] Succès avec le modèle ${modelName}`);

      return res.json({
        success: true,
        data: {
          matches: parsed.matches,
          championnat: parsed.championnat || null,
          saison: parsed.saison || null,
          quota: buildQuotaInfo(userId, role),
        },
      });
    } catch (err) {
      const isQuota = err.status === 429
        || String(err.message).includes('RESOURCE_EXHAUSTED')
        || String(err.message).includes('quota');
      const isAuth = err.status === 401 || err.status === 403
        || String(err.message).includes('API_KEY')
        || String(err.message).includes('API key')
        || String(err.message).includes('PERMISSION_DENIED')
        || String(err.message).includes('UNAUTHENTICATED');
      const isNotFound = err.status === 404
        || String(err.message).includes('not found')
        || String(err.message).includes('NOT_FOUND');

      console.error(`[AI Scraper] Modèle ${modelName} — status=${err.status} message=${err.message}`);

      // Erreur d'auth : peut être spécifique à CE modèle (accès restreint/payant) plutôt qu'à la clé —
      // on tente les modèles suivants avant d'abandonner, comme pour le quota.
      if (isAuth) {
        if (modelName === MODELS[MODELS.length - 1]) {
          return res.status(502).json({
            success: false,
            message: 'Clé API Gemini invalide ou accès refusé pour tous les modèles disponibles. Vérifiez la clé dans le fichier .env (GEMINI_API_KEY) et son accès aux modèles Gemini dans Google AI Studio.',
          });
        }
        continue;
      }

      // Modèle introuvable → essayer le suivant
      if (isNotFound) continue;

      // Quota Google épuisé → essayer le modèle suivant (quota indépendant par modèle)
      if (isQuota) {
        if (modelName === MODELS[MODELS.length - 1]) {
          return res.status(502).json({
            success: false,
            message: 'Quota de l\'API Gemini épuisé sur tous les modèles disponibles. Vérifiez votre projet Google AI Studio ou réessayez demain.',
          });
        }
        continue;
      }

      // Autre erreur (JSON invalide, réseau…) : on arrête
      return res.status(500).json({ success: false, message: `Erreur IA (${modelName}) : ${err.message}` });
    }
  }
};

// POST /ai-scraper/check-teams
const checkTeams = async (req, res) => {
  try {
    const { equipe_ref_id, saison, championnat, team_names } = req.body;
    if (!equipe_ref_id || !saison || !Array.isArray(team_names) || team_names.length === 0) {
      return res.status(400).json({ success: false, message: 'Paramètres invalides' });
    }

    let club_id = req.user.club_id;
    if (!club_id) {
      const { Equipe } = require('../models');
      const eq = await Equipe.findByPk(equipe_ref_id, { attributes: ['club_id'] });
      club_id = eq?.club_id || null;
    }
    if (!club_id) return res.status(400).json({ success: false, message: 'Impossible de déterminer le club.' });

    const existing = await ChEquipe.findAll({
      where: { club_id, equipe_ref_id, saison, championnat: championnat || null },
      attributes: ['id', 'nom'],
      raw: true,
    });

    function norm(s) {
      return s.toLowerCase().trim()
        .normalize('NFD').replace(/[̀-ͯ]/g, '')
        .replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim();
    }

    function levenshtein(a, b) {
      const m = a.length, n = b.length;
      const dp = Array.from({ length: m + 1 }, (_, i) => i);
      for (let j = 1; j <= n; j++) {
        let prev = dp[0]; dp[0] = j;
        for (let i = 1; i <= m; i++) {
          const tmp = dp[i];
          dp[i] = a[i - 1] === b[j - 1] ? prev : 1 + Math.min(prev, dp[i - 1], dp[i]);
          prev = tmp;
        }
      }
      return dp[m];
    }

    function simScore(a, b) {
      const na = norm(a), nb = norm(b);
      if (na === nb) return 1;
      if (na.includes(nb) || nb.includes(na)) return 0.85;
      const dist = levenshtein(na, nb);
      const maxLen = Math.max(na.length, nb.length);
      return maxLen === 0 ? 1 : Math.max(0, 1 - dist / maxLen);
    }

    const uniqueNames = [...new Set(team_names.map(n => String(n).trim()).filter(Boolean))];
    const teams = uniqueNames.map(name => {
      const exactMatch = existing.find(e => norm(e.nom) === norm(name));
      if (exactMatch) return { name, status: 'exists', match: { id: exactMatch.id, nom: exactMatch.nom } };

      const similar = existing
        .map(e => ({ id: e.id, nom: e.nom, pct: Math.round(simScore(name, e.nom) * 100) }))
        .filter(e => e.pct >= 55)
        .sort((a, b) => b.pct - a.pct)
        .slice(0, 3);

      if (similar.length > 0) return { name, status: 'similar', suggestions: similar };
      return { name, status: 'new' };
    });

    return res.json({ success: true, data: { teams, existing_count: existing.length } });
  } catch (err) {
    console.error('[AI Scraper] Erreur check-teams:', err.message);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

// POST /ai-scraper/import
const importMatches = async (req, res) => {
  try {
    const { equipe_ref_id, saison, championnat, matches, team_overrides = {} } = req.body;

    if (!equipe_ref_id || !saison || !Array.isArray(matches) || matches.length === 0) {
      return res.status(400).json({ success: false, message: 'Paramètres invalides' });
    }

    // Superadmin peut avoir club_id null → le résoudre depuis l'équipe sélectionnée
    let club_id = req.user.club_id;
    if (!club_id) {
      const { Equipe } = require('../models');
      const eq = await Equipe.findByPk(equipe_ref_id, { attributes: ['club_id'] });
      club_id = eq?.club_id || null;
    }
    if (!club_id) {
      return res.status(400).json({ success: false, message: 'Impossible de déterminer le club de cette équipe.' });
    }

    const teamCache = {};
    const newTeams = [];
    let createdMatchs = 0;

    const getOrCreateTeam = async (nom) => {
      // Appliquer l'override admin si défini (ex : "Paris FC" → "FC Paris")
      const resolvedNom = (team_overrides[nom.trim()] || nom.trim());
      const key = resolvedNom.toLowerCase();
      if (teamCache[key]) return teamCache[key];
      let eq = await ChEquipe.findOne({
        where: { club_id, equipe_ref_id, saison, championnat: championnat || null, nom: resolvedNom },
      });
      if (!eq) {
        eq = await ChEquipe.create({
          club_id, equipe_ref_id, equipe_id: null,
          nom: resolvedNom, saison, championnat: championnat || null, couleur: '#6c757d',
        });
        newTeams.push(eq.nom);
      }
      teamCache[key] = eq;
      return eq;
    };

    for (const m of matches) {
      if (!m.dom || !m.ext) continue;
      const domEq = await getOrCreateTeam(m.dom);
      const extEq = await getOrCreateTeam(m.ext);
      const existing = await ChMatch.findOne({
        where: { club_id, equipe_ref_id, dom_id: domEq.id, ext_id: extEq.id, saison, championnat: championnat || null },
      });
      if (!existing) {
        await ChMatch.create({
          club_id, equipe_ref_id, dom_id: domEq.id, ext_id: extEq.id,
          journee: m.journee || null, date: m.date || null,
          score_dom: m.score_dom ?? null, score_ext: m.score_ext ?? null,
          saison, championnat: championnat || null,
        });
        createdMatchs++;
      }
    }

    return res.json({ success: true, data: { created_matchs: createdMatchs, new_teams: newTeams } });
  } catch (err) {
    console.error('[AI Scraper] Erreur import:', err.message);
    return res.status(500).json({ success: false, message: 'Erreur lors de l\'import' });
  }
};

module.exports = { getQuota, analyseWithAI, checkTeams, importMatches, buildQuotaInfo };
