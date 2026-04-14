import { ConflictException, Injectable } from '@nestjs/common';
import * as admin from 'firebase-admin';
import sharp from 'sharp';

type UploadFileOptions = {
  aspect?: string;
  visibility?: 'public' | 'private';
};

@Injectable()
export class FirebaseService {
  async uploadFile(
    file: Express.Multer.File,
    directoryToSave: string,
    aspectOrOptions: string | UploadFileOptions = '',
  ): Promise<string> {
    try {
      const options =
        typeof aspectOrOptions === 'string'
          ? { aspect: aspectOrOptions, visibility: 'public' as const }
          : {
              aspect: aspectOrOptions.aspect ?? '',
              visibility: aspectOrOptions.visibility ?? 'public',
            };
      const bucket = admin.storage().bucket(process.env.FIREBASE_BUCKETNAME);
      const fileName = `${Date.now()}_${file.mimetype.startsWith('image/') ? file.originalname.split('.').slice(0, -1).join('.') + '.webp' : file.originalname}`;
      const filePath = `${directoryToSave}/${fileName}`;
      const fileUpload = bucket.file(filePath);

      let fileBuffer = file.buffer;
      const contentType = file.mimetype.startsWith('image/')
        ? 'image/webp'
        : file.mimetype;

      if (file.mimetype.startsWith('image/')) {
        if (options.aspect === 'square') {
          const metadata = await sharp(file.buffer).metadata();

          const size = Math.min(metadata.width, metadata.height);

          const left = Math.floor((metadata.width - size) / 2);
          const top = Math.floor((metadata.height - size) / 2);

          fileBuffer = await sharp(file.buffer)
            .extract({ width: size, height: size, left, top })
            .toBuffer();
        }

        fileBuffer = await sharp(fileBuffer)
          .webp({
            quality: 75,
          })
          .toBuffer();
      }

      const stream = fileUpload.createWriteStream({
        metadata: {
          contentType: contentType,
          contentDisposition: 'inline',
        },
      });

      await new Promise<void>((resolve, reject) => {
        stream.on('error', (error) => {
          console.error('Error in stream:', error);
          reject(new ConflictException('Failed to upload file'));
        });

        stream.on('finish', resolve);
        stream.end(fileBuffer);
      });

      if (options.visibility === 'public') {
        await fileUpload.makePublic();
        return fileUpload.publicUrl();
      }

      return filePath;
    } catch (error) {
      console.error('Error uploading file:', error);
      throw new ConflictException('Failed to upload file');
    }
  }

  async getFileAccessUrl(filePath: string): Promise<string> {
    try {
      if (!filePath || /^https?:\/\//i.test(filePath)) {
        return filePath;
      }

      const bucket = admin.storage().bucket(process.env.FIREBASE_BUCKETNAME);
      const [signedUrl] = await bucket.file(filePath).getSignedUrl({
        action: 'read',
        expires: Date.now() + 60 * 60 * 1000,
        version: 'v4',
      });

      return signedUrl;
    } catch (error) {
      console.error('Error generating file access URL:', error);
      throw new ConflictException('Failed to access file');
    }
  }

  async deleteFile(filePath: string): Promise<void> {
    try {
      if (!filePath || /^https?:\/\//i.test(filePath)) {
        return;
      }

      const bucket = admin.storage().bucket(process.env.FIREBASE_BUCKETNAME);
      await bucket.file(filePath).delete({ ignoreNotFound: true });
    } catch (error) {
      console.error('Error deleting file:', error);
    }
  }
}
