// Google Drive integration using Replit connector
import { google } from 'googleapis';

let connectionSettings: any;

async function getAccessToken() {
  if (connectionSettings && connectionSettings.settings.expires_at && new Date(connectionSettings.settings.expires_at).getTime() > Date.now()) {
    return connectionSettings.settings.access_token;
  }
  
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken) {
    throw new Error('X_REPLIT_TOKEN not found for repl/depl');
  }

  connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=google-drive',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  const accessToken = connectionSettings?.settings?.access_token || connectionSettings.settings?.oauth?.credentials?.access_token;

  if (!connectionSettings || !accessToken) {
    throw new Error('Google Drive not connected');
  }
  return accessToken;
}

// WARNING: Never cache this client.
// Access tokens expire, so a new client must be created each time.
export async function getGoogleDriveClient() {
  const accessToken = await getAccessToken();

  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({
    access_token: accessToken
  });

  return google.drive({ version: 'v3', auth: oauth2Client });
}

// Find a folder by name
export async function findFolder(folderName: string): Promise<string | null> {
  const drive = await getGoogleDriveClient();
  
  const response = await drive.files.list({
    q: `name='${folderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
    fields: 'files(id, name)',
  });

  return response.data.files?.[0]?.id || null;
}

// List files in a folder
export async function listFilesInFolder(folderId: string) {
  const drive = await getGoogleDriveClient();
  
  const response = await drive.files.list({
    q: `'${folderId}' in parents and trashed=false`,
    fields: 'files(id, name, mimeType, size, modifiedTime)',
    orderBy: 'modifiedTime desc',
  });

  return response.data.files || [];
}

// Get file content
export async function getFileContent(fileId: string): Promise<string> {
  const drive = await getGoogleDriveClient();
  
  const response = await drive.files.get({
    fileId,
    alt: 'media',
  }, {
    responseType: 'text'
  });

  return response.data as string;
}

// Find and get a specific file by name in a folder
export async function findFileInFolder(folderId: string, fileName: string): Promise<{ id: string; name: string } | null> {
  const drive = await getGoogleDriveClient();
  
  const response = await drive.files.list({
    q: `'${folderId}' in parents and name='${fileName}' and trashed=false`,
    fields: 'files(id, name, mimeType)',
  });

  return response.data.files?.[0] || null;
}
