import { Injectable } from '@nestjs/common';
import { google } from 'googleapis';
import { Readable } from 'stream';

@Injectable()
export class GoogleDriveService {
  private readonly credentials = {
    type: process.env.GOOGLE_TYPE,
    project_id: process.env.GOOGLE_PROJECT_ID,
    private_key_id: process.env.GOOGLE_PRIVATE_KEY_ID,
    private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    client_email: process.env.GOOGLE_CLIENT_EMAIL,
    client_id: process.env.GOOGLE_CLIENT_ID_DRIVE,
    auth_uri: process.env.GOOGLE_AUTH_URI,
    token_uri: process.env.GOOGLE_TOKEN_URI,
    auth_provider_x509_cert_url: process.env.GOOGLE_AUTH_PROVIDER_CERT_URL,
    client_x509_cert_url: process.env.GOOGLE_CLIENT_CERT_URL,
    universe_domain: process.env.GOOGLE_UNIVERSE_DOMAIN,
  };
  private readonly SCOPES = ['https://www.googleapis.com/auth/drive'];

  private jwtClient = new google.auth.JWT(
    this.credentials.client_email,
    undefined,
    this.credentials.private_key,
    this.SCOPES,
  );

  private async getDriveClient() {
    await this.jwtClient.authorize();
    return google.drive({ version: 'v3', auth: this.jwtClient });
  }

  private bufferToStream(buffer: Buffer): Readable {
    const stream = new Readable();
    stream.push(buffer);
    stream.push(null);
    return stream;
  }

  async createAndShareFolder(folderName: string): Promise<string> {
    const drive = await this.getDriveClient();

    // 1. Kiểm tra folder đã tồn tại chưa
    const listRes = await drive.files.list({
      q: `mimeType='application/vnd.google-apps.folder' and name='${folderName}' and trashed=false`,
      fields: 'files(id, name)',
    });

    if (listRes.data.files && listRes.data.files.length > 0) {
      // Đã tồn tại → dùng lại folderId
      console.log(listRes.data.files[0].id!);
      return listRes.data.files[0].id!;
    }

    // 2. Create new folder if not existed
    const folder = await drive.files.create({
      requestBody: {
        name: folderName,
        mimeType: 'application/vnd.google-apps.folder',
      },
      fields: 'id',
    });

    const folderId = folder.data.id!;

    // 3. Share folder publicly
    await drive.permissions.create({
      fileId: folderId,
      requestBody: {
        role: 'reader',
        type: 'anyone',
      },
    });

    return folderId;
  }

  // Upload file vào folder
  async uploadToDrive(
    file: Express.Multer.File,
    folderId: string,
  ): Promise<string> {
    const drive = await this.getDriveClient();

    const res = await drive.files.create({
      media: {
        mimeType: file.mimetype,
        body: this.bufferToStream(file.buffer),
      },
      requestBody: {
        name: file.originalname,
        parents: [folderId], // ← Chỉ định folder
      },
      fields: 'id, webViewLink, webContentLink',
    });

    return res.data.webViewLink || '';
  }

  async deleteFile(fileId: string): Promise<void> {
    const drive = await this.getDriveClient(); // Get Google Drive client
    await drive.files.delete({ fileId });
  }
}
