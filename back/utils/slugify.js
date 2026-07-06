// Convertit un texte en identifiant d'URL lisible (ex: "FC Le Doulieu" → "fc-le-doulieu").
function slugify(text) {
  return String(text)
    .normalize('NFD').replace(/[̀-ͯ]/g, '') // retire les accents
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 200);
}

module.exports = { slugify };
