import { Injectable } from '@nestjs/common';
import { google } from 'googleapis';
import { Readable } from 'stream';

@Injectable()
export class GoogleDriveService {
  private readonly credentials = require('D:/WorkSpace/DATN/be_invest-bot/src/assets/file/dananginvestbot-94a2e9437a4d.json');
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
