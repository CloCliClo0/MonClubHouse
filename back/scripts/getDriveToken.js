/**
 * Utilitaire pour obtenir le refresh token Google Drive.
 *
 * Usage :
 *   node back/scripts/getDriveToken.js
 *
 * Étapes :
 *   1. Le script affiche une URL — ouvrez-la dans votre navigateur
 *   2. Connectez-vous avec le compte Google qui possède le Drive
 *   3. Copiez le "code" dans l'URL de retour (après ?code=...)
 *   4. Collez-le dans le terminal quand demandé
 *   5. Le script affiche le refresh_token — copiez-le dans .env sous GOOGLE_DRIVE_REFRESH_TOKEN
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { google } = require('googleapis');
const readline   = require('readline');

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  'urn:ietf:wg:oauth:2.0:oob' // redirect URI pour les apps desktop/script
);

const SCOPES = ['https://www.googleapis.com/auth/drive.file'];

const authUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  scope: SCOPES,
  prompt: 'consent', // force la génération d'un refresh_token
});

console.log('\n=== Configuration Google Drive pour MonClubHouse ===\n');
console.log('1. Ouvrez cette URL dans votre navigateur :');
console.log('\n' + authUrl + '\n');
console.log('2. Connectez-vous avec le compte Google qui a accès au Drive');
console.log('3. Autorisez l\'accès et copiez le code affiché\n');

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

rl.question('Collez le code ici : ', async (code) => {
  rl.close();
  try {
    const { tokens } = await oauth2Client.getToken(code.trim());
    console.log('\n✅ Succès ! Ajoutez cette ligne dans back/.env :\n');
    console.log(`GOOGLE_DRIVE_REFRESH_TOKEN=${tokens.refresh_token}`);
    console.log(`GOOGLE_DRIVE_FOLDER_ID=1V26qhNMhw1n_A3PycHyYdBpMUge_Fktj`);
    console.log('\nPuis redémarrez le serveur avec : npm start\n');
  } catch (err) {
    console.error('Erreur :', err.message);
    console.log('Vérifiez que vous avez bien copié le code complet depuis l\'URL.');
  }
});
