const express = require('express');
const path = require('path');
const fs = require('fs');
const { google } = require('googleapis');
const router = express.Router();

// Path to stored tokens
const TOKEN_PATH = path.join(__dirname, '../../config/token.json');
// Path to client secrets
const CLIENT_SECRETS_PATH = path.join(__dirname, '../../config/client_secrets.json');
// Path to settings file
const SETTINGS_PATH = path.join(__dirname, '../../config/settings.json');

// OAuth2 scopes
const SCOPES = ['https://www.googleapis.com/auth/drive.file'];

// Get OAuth2 client
const getOAuth2Client = () => {
  try {
    if (!fs.existsSync(CLIENT_SECRETS_PATH)) {
      throw new Error('client_secrets.json not found. Please follow the setup instructions.');
    }

    const content = fs.readFileSync(CLIENT_SECRETS_PATH, 'utf8');
    const credentials = JSON.parse(content);
    const { client_secret, client_id, redirect_uris } = credentials.web || credentials.installed;

    const oAuth2Client = new google.auth.OAuth2(
      client_id,
      client_secret,
      redirect_uris[0] || 'http://localhost:5000/api/drive/callback'
    );

    // Check if we have a token
    if (fs.existsSync(TOKEN_PATH)) {
      const token = fs.readFileSync(TOKEN_PATH, 'utf8');
      oAuth2Client.setCredentials(JSON.parse(token));
    }

    return oAuth2Client;
  } catch (error) {
    console.error('Error creating OAuth client:', error);
    throw error;
  }
};

// Check auth status
router.get('/status', (req, res) => {
  try {
    // Check if client_secrets.json exists
    if (!fs.existsSync(CLIENT_SECRETS_PATH)) {
      return res.json({
        authenticated: false,
        message: 'Google Drive API credentials not found'
      });
    }

    // Check if token exists
    const authenticated = fs.existsSync(TOKEN_PATH);

    res.json({
      authenticated,
      message: authenticated ? 'Authenticated with Google Drive' : 'Not authenticated'
    });
  } catch (error) {
    console.error('Error checking auth status:', error);
    res.status(500).json({
      authenticated: false,
      message: `Error checking auth status: ${error.message}`
    });
  }
});

// Start authentication process
router.get('/auth', (req, res) => {
  try {
    // Get OAuth client
    const oAuth2Client = getOAuth2Client();

    // If we already have a token, we're authenticated
    if (fs.existsSync(TOKEN_PATH)) {
      return res.json({
        success: true,
        message: 'Already authenticated with Google Drive'
      });
    }

    // Generate auth URL
    const authUrl = oAuth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: SCOPES,
      prompt: 'consent'  // Force to always get refresh token
    });

    res.json({
      success: true,
      url: authUrl
    });
  } catch (error) {
    console.error('Error starting auth process:', error);
    res.status(500).json({
      success: false,
      message: `Error starting auth process: ${error.message}`
    });
  }
});

// OAuth callback
router.get('/callback', async (req, res) => {
  const { code } = req.query;

  if (!code) {
    return res.status(400).send('Error: No authorization code received');
  }

  try {
    // Get OAuth client
    const oAuth2Client = getOAuth2Client();

    // Exchange code for token
    const { tokens } = await oAuth2Client.getToken(code);
    oAuth2Client.setCredentials(tokens);

    // Save token
    fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens));

    res.send('Authentication successful! You can close this window.');
  } catch (error) {
    console.error('Error during callback:', error);
    res.status(500).send(`Error during authentication: ${error.message}`);
  }
});

// Trigger a manual sync
router.post('/sync', async (req, res) => {
  try {
    if (!fs.existsSync(TOKEN_PATH)) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated with Google Drive'
      });
    }

    // Get settings
    let settings;
    if (fs.existsSync(SETTINGS_PATH)) {
      const settingsFile = fs.readFileSync(SETTINGS_PATH, 'utf8');
      settings = JSON.parse(settingsFile);
    } else {
      settings = {
        drive_folder_name: 'BarcoderImages',
        local_folder: 'images'
      };
    }

    // Get OAuth client
    const oAuth2Client = getOAuth2Client();
    const drive = google.drive({ version: 'v3', auth: oAuth2Client });

    // Get or create the folder
    const folderId = await getOrCreateFolder(drive, settings.drive_folder_name);
    if (!folderId) {
      throw new Error('Failed to create or find Drive folder');
    }

    // Sync folder
    const result = await syncFolder(drive, folderId, settings.local_folder);

    res.json({
      success: true,
      message: `Synced ${result.uploaded} files to Google Drive`,
      result
    });
  } catch (error) {
    console.error('Error syncing to Drive:', error);
    res.status(500).json({
      success: false,
      message: `Error syncing to Drive: ${error.message}`
    });
  }
});

// Get or create a folder in Google Drive
async function getOrCreateFolder(drive, folderName) {
  try {
    // Check if folder exists
    const response = await drive.files.list({
      q: `name='${folderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
      fields: 'files(id, name)'
    });

    if (response.data.files && response.data.files.length > 0) {
      return response.data.files[0].id;
    }

    // Create folder if it doesn't exist
    const fileMetadata = {
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder'
    };

    const folder = await drive.files.create({
      resource: fileMetadata,
      fields: 'id'
    });

    return folder.data.id;
  } catch (error) {
    console.error('Error with Drive folder:', error);
    throw error;
  }
}

// Sync local folder with Google Drive
async function syncFolder(drive, folderId, localFolder) {
  try {
    // Get list of files already in Drive folder
    const response = await drive.files.list({
      q: `'${folderId}' in parents and trashed=false`,
      fields: 'files(id, name)'
    });

    const driveFiles = response.data.files || [];
    const uploadedFilenames = driveFiles.map(file => file.name);

    // Get local files
    const localFolderPath = path.join(__dirname, '../../', localFolder);
    if (!fs.existsSync(localFolderPath)) {
      fs.mkdirSync(localFolderPath, { recursive: true });
      return { uploaded: 0, skipped: 0 };
    }

    const files = fs.readdirSync(localFolderPath);

    // Filter for image files
    const imageFiles = files.filter(file =>
      file.toLowerCase().endsWith('.jpg') ||
      file.toLowerCase().endsWith('.jpeg')
    );

    // Track upload stats
    let uploaded = 0;
    let skipped = 0;

    // Upload new files
    for (const filename of imageFiles) {
      if (!uploadedFilenames.includes(filename)) {
        await uploadFile(drive, folderId, path.join(localFolderPath, filename), filename);
        uploaded++;
      } else {
        skipped++;
      }
    }

    return { uploaded, skipped };
  } catch (error) {
    console.error('Error syncing folder:', error);
    throw error;
  }
}

// Upload a file to Google Drive
async function uploadFile(drive, folderId, filePath, filename) {
  try {
    const fileMetadata = {
      name: filename,
      parents: [folderId]
    };

    const media = {
      mimeType: 'image/jpeg',
      body: fs.createReadStream(filePath)
    };

    await drive.files.create({
      resource: fileMetadata,
      media: media,
      fields: 'id'
    });

    return true;
  } catch (error) {
    console.error(`Error uploading ${filename}:`, error);
    throw error;
  }
}

module.exports = router;
