const { ChEquipe, ChMatch } = require('../models');

// ── Parsing HTML ──────────────────────────────────────────────────────────────

function stripTags(html) {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&eacute;/gi, 'é').replace(/&egrave;/gi, 'è')
    .replace(/&ecirc;/gi, 'ê').replace(/&euml;/gi, 'ë')
    .replace(/&agrave;/gi, 'à').replace(/&acirc;/gi, 'â')
    .replace(/&icirc;/gi, 'î').replace(/&ocirc;/gi, 'ô')
    .replace(/&ucirc;/gi, 'û').replace(/&ccedil;/gi, 'ç')
    .replace(/&#\d+;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function parseTables(html) {
  const tables = [];
  const tableRx = /<table[^>]*>([\s\S]*?)<\/table>/gi;
  let tm;
  while ((tm = tableRx.exec(html)) !== null) {
    const rows = [];
    const rowRx = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
    let rm;
    while ((rm = rowRx.exec(tm[1])) !== null) {
      const cells = [];
      const cellRx = /<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi;
      let cm;
      while ((cm = cellRx.exec(rm[1])) !== null) {
        cells.push(stripTags(cm[1]));
      }
      if (cells.length >= 2) rows.push(cells);
    }
    if (rows.length >= 2) tables.push(rows);
  }
  return tables;
}

function parseScore(text) {
  const m = text.match(/^(\d{1,2})\s*[-:]\s*(\d{1,2})$/);
  return m ? { dom: parseInt(m[1], 10), ext: parseInt(m[2], 10) } : null;
}

function parseFrDate(text) {
  const m = text.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  return m ? `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}` : null;
}

function parseJournee(text) {
  const m = text.match(/(?:J\.?\s*|Journ[ée]e?\s*)(\d+)/i);
  return m ? parseInt(m[1], 10) : null;
}

function extractMatches(tables) {
  const matches = [];
  const seen = new Set();

  for (const table of tables) {
    for (const row of table) {
      let scoreIdx = -1;
      let scoreData = null;

      for (let i = 0; i < row.length; i++) {
        const s = parseScore(row[i]);
        if (s) { scoreIdx = i; scoreData = s; break; }
      }
      if (scoreIdx < 0 || scoreIdx === 0 || scoreIdx >= row.length - 1) continue;

      const domNom = row[scoreIdx - 1];
      const extNom = row[scoreIdx + 1];

      if (!domNom || !extNom) continue;
      // Ignore header-like rows and very short values
      if (domNom.length < 3 || extNom.length < 3) continue;
      // Ignore rows where team names look like column headers
      if (/^(Club|Équipe|Domicile|Visiteur|Recevant|Recevan|Dom|Ext|Ext\.)$/i.test(domNom)) continue;

      let date = null;
      let journee = null;
      for (const cell of row) {
        if (!date) date = parseFrDate(cell);
        if (!journee) journee = parseJournee(cell);
      }

      const key = `${domNom}|${extNom}|${scoreData.dom}|${scoreData.ext}`;
      if (seen.has(key)) continue;
      seen.add(key);

      matches.push({ dom: domNom, ext: extNom, score_dom: scoreData.dom, score_ext: scoreData.ext, date, journee });
    }
  }
  return matches;
}

// ── Controllers ───────────────────────────────────────────────────────────────

// POST /scraper/analyse — analyse le HTML et retourne les matchs trouvés
const analyseHTML = async (req, res) => {
  try {
    const { html } = req.body;
    if (!html || typeof html !== 'string') {
      return res.status(400).json({ success: false, message: 'HTML requis' });
    }
    if (html.length > 2_000_000) {
      return res.status(400).json({ success: false, message: 'HTML trop volumineux (max 2 Mo)' });
    }

    const tables = parseTables(html);
    const matches = extractMatches(tables);
    return res.json({ success: true, data: { matches, tables_found: tables.length } });
  } catch (err) {
    console.error('[Scraper] Erreur analyse:', err.message);
    return res.status(500).json({ success: false, message: 'Erreur lors de l\'analyse HTML' });
  }
};

// POST /scraper/import — importe les matchs dans un championnat
const importMatches = async (req, res) => {
  try {
    const { equipe_ref_id, saison, championnat, matches } = req.body;
    const club_id = req.user.club_id;

    if (!equipe_ref_id || !saison || !Array.isArray(matches) || matches.length === 0) {
      return res.status(400).json({ success: false, message: 'Paramètres invalides' });
    }

    const teamCache = {};
    const newTeams = [];
    let createdMatchs = 0;

    const getOrCreateTeam = async (nom) => {
      const key = nom.trim().toLowerCase();
      if (teamCache[key]) return teamCache[key];

      let eq = await ChEquipe.findOne({ where: { club_id, equipe_ref_id, saison, championnat: championnat || null, nom: nom.trim() } });
      if (!eq) {
        eq = await ChEquipe.create({ club_id, equipe_ref_id, equipe_id: null, nom: nom.trim(), saison, championnat: championnat || null, couleur: '#6c757d' });
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
    console.error('[Scraper] Erreur import:', err.message);
    return res.status(500).json({ success: false, message: 'Erreur lors de l\'import' });
  }
};

module.exports = { analyseHTML, importMatches };
