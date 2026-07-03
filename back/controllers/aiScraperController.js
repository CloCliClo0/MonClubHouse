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

  if (!file && !html?.trim()) {
    return res.status(400).json({ success: false, message: 'Fournissez un fichier (image/PDF) ou du HTML/texte.' });
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

      // Erreur d'auth : inutile d'essayer les autres modèles
      if (isAuth) {
        return res.status(502).json({
          success: false,
          message: 'Clé API Gemini invalide ou accès refusé. Vérifiez la clé dans le fichier .env (GEMINI_API_KEY).',
        });
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

// POST /ai-scraper/import
const importMatches = async (req, res) => {
  try {
    const { equipe_ref_id, saison, championnat, matches } = req.body;

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
      const key = nom.trim().toLowerCase();
      if (teamCache[key]) return teamCache[key];
      let eq = await ChEquipe.findOne({
        where: { club_id, equipe_ref_id, saison, championnat: championnat || null, nom: nom.trim() },
      });
      if (!eq) {
        eq = await ChEquipe.create({
          club_id, equipe_ref_id, equipe_id: null,
          nom: nom.trim(), saison, championnat: championnat || null, couleur: '#6c757d',
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

module.exports = { getQuota, analyseWithAI, importMatches, buildQuotaInfo };
