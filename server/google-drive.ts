import { google } from 'googleapis';

let oauth2Client: any = null;

function getOAuth2Client() {
  if (!oauth2Client) {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:5000/api/auth/google/callback';
    
    if (!clientId || !clientSecret) {
      throw new Error('Google OAuth credentials not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET environment variables.');
    }
    
    oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);
  }
  return oauth2Client;
}

export function setGoogleTokens(tokens: { access_token: string; refresh_token?: string; expiry_date?: number }) {
  const client = getOAuth2Client();
  client.setCredentials(tokens);
}

export function getGoogleAuthUrl() {
  const client = getOAuth2Client();
  return client.generateAuthUrl({
    access_type: 'offline',
    scope: [
      'https://www.googleapis.com/auth/drive.readonly',
      'https://www.googleapis.com/auth/drive.file',
    ],
    prompt: 'consent',
  });
}

export async function getGoogleTokensFromCode(code: string) {
  const client = getOAuth2Client();
  const { tokens } = await client.getToken(code);
  client.setCredentials(tokens);
  return tokens;
}

export async function getGoogleDriveClient() {
  const client = getOAuth2Client();
  
  const credentials = client.credentials;
  if (!credentials || !credentials.access_token) {
    throw new Error('Google Drive not connected. Please connect your Google account in Settings.');
  }
  
  if (credentials.expiry_date && credentials.expiry_date < Date.now() && credentials.refresh_token) {
    const { credentials: newCredentials } = await client.refreshAccessToken();
    client.setCredentials(newCredentials);
  }
  
  return google.drive({ version: 'v3', auth: client });
}

export async function findFolder(folderName: string): Promise<string | null> {
  const drive = await getGoogleDriveClient();
  
  const response = await drive.files.list({
    q: `name='${folderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
    fields: 'files(id, name)',
  });

  return response.data.files?.[0]?.id || null;
}

export async function listFilesInFolder(folderId: string) {
  const drive = await getGoogleDriveClient();
  
  const response = await drive.files.list({
    q: `'${folderId}' in parents and trashed=false`,
    fields: 'files(id, name, mimeType, size, modifiedTime)',
    orderBy: 'modifiedTime desc',
  });

  return response.data.files || [];
}

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

export async function findFileInFolder(folderId: string, fileName: string): Promise<{ id: string; name: string } | null> {
  const drive = await getGoogleDriveClient();
  
  const response = await drive.files.list({
    q: `'${folderId}' in parents and name='${fileName}' and trashed=false`,
    fields: 'files(id, name, mimeType)',
  });

  const file = response.data.files?.[0];
  if (file && file.id && file.name) {
    return { id: file.id, name: file.name };
  }
  return null;
}

export function isGoogleDriveConfigured(): boolean {
  return !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}

export function hasGoogleDriveTokens(): boolean {
  try {
    const client = getOAuth2Client();
    return !!(client.credentials && client.credentials.access_token);
  } catch {
    return false;
  }
}
