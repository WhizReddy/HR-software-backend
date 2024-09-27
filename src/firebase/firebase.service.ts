import { ConflictException, Injectable } from '@nestjs/common';
import * as admin from 'firebase-admin';
import sharp from 'sharp';

@Injectable()
export class FirebaseService {
  async uploadFile(
    file: Express.Multer.File,
    directoryToSave: string,
    aspect: string = '',
  ): Promise<string> {
    try {
      const bucket = admin.storage().bucket(process.env.FIREBASE_BUCKETNAME);
      const fileName = `${Date.now()}_${file.mimetype.startsWith('image/') ? file.originalname.split('.').slice(0, -1).join('.') + '.webp' : file.originalname}`;
      const fileUpload = bucket.file(`${directoryToSave}/${fileName}`);

      let fileBuffer = file.buffer;
      const contentType = file.mimetype.startsWith('image/')
        ? 'image/webp'
        : file.mimetype;

      if (file.mimetype.startsWith('image/')) {
        if (aspect === 'square') {
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

      await fileUpload.makePublic();
      const publicUrl = fileUpload.publicUrl();
      return publicUrl;
    } catch (error) {
      console.error('Error uploading file:', error);
      throw new ConflictException('Failed to upload file');
    }
  }
}
