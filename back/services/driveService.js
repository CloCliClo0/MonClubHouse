const { google } = require('googleapis');
const path = require('path');
const stream = require('stream');

// ID du dossier Google Drive partagé (extrait de l'URL)
const DRIVE_FOLDER_ID = process.env.GOOGLE_DRIVE_FOLDER_ID || '1V26qhNMhw1n_A3PycHyYdBpMUge_Fktj';

function getDriveClient() {
  const auth = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
  );

  // Utilise le service account ou les tokens OAuth stockés
  if (process.env.GOOGLE_DRIVE_SERVICE_ACCOUNT_KEY) {
    const credentials = JSON.parse(process.env.GOOGLE_DRIVE_SERVICE_ACCOUNT_KEY);
    const serviceAuth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/drive.file'],
    });
    return google.drive({ version: 'v3', auth: serviceAuth });
  }

  // Fallback : OAuth2 avec refresh token
  auth.setCredentials({
    refresh_token: process.env.GOOGLE_DRIVE_REFRESH_TOKEN,
  });
  return google.drive({ version: 'v3', auth });
}

/**
 * Upload un buffer/stream vers Google Drive
 * @returns { id, webViewLink, webContentLink }
 */
async function uploadToDrive({ buffer, filename, mimetype, subfolder = '' }) {
  try {
    const drive = getDriveClient();

    // Créer ou trouver le sous-dossier si demandé
    let parentId = DRIVE_FOLDER_ID;
    if (subfolder) {
      const folderRes = await drive.files.list({
        q: `name='${subfolder}' and '${DRIVE_FOLDER_ID}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
        fields: 'files(id)',
      });
      if (folderRes.data.files?.length > 0) {
        parentId = folderRes.data.files[0].id;
      } else {
        const newFolder = await drive.files.create({
          requestBody: { name: subfolder, mimeType: 'application/vnd.google-apps.folder', parents: [DRIVE_FOLDER_ID] },
          fields: 'id',
        });
        parentId = newFolder.data.id;
      }
    }

    // Upload le fichier
    const bufferStream = new stream.PassThrough();
    bufferStream.end(buffer);

    const res = await drive.files.create({
      requestBody: {
        name: filename,
        parents: [parentId],
      },
      media: {
        mimeType: mimetype,
        body: bufferStream,
      },
      fields: 'id, webViewLink, webContentLink, name',
    });

    // Rendre le fichier public
    await drive.permissions.create({
      fileId: res.data.id,
      requestBody: { role: 'reader', type: 'anyone' },
    });

    // URL directe pour affichage
    const directUrl = `https://drive.google.com/uc?export=view&id=${res.data.id}`;
    const thumbnailUrl = `https://drive.google.com/thumbnail?id=${res.data.id}&sz=w400`;

    return {
      id: res.data.id,
      url: directUrl,
      thumbnail: thumbnailUrl,
      viewLink: res.data.webViewLink,
      name: res.data.name,
    };
  } catch (err) {
    console.error('[Drive] Erreur upload:', err.message);
    throw err;
  }
}

/**
 * Supprimer un fichier de Drive
 */
async function deleteFromDrive(fileId) {
  try {
    const drive = getDriveClient();
    await drive.files.delete({ fileId });
  } catch (err) {
    console.warn('[Drive] Erreur suppression:', err.message);
  }
}

module.exports = { uploadToDrive, deleteFromDrive };
