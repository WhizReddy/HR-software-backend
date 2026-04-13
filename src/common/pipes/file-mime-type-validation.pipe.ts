import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';

@Injectable()
export class FileMimeTypeValidationPipe implements PipeTransform {
  private allowedImageMimeTypes = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/apng',
    'image/gif',
    'image/avif',
  ];

  private allowedCvMimeTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ];

  transform(value: any): any {
    if (!value) {
      return value;
    }

    if (this.isUploadedFile(value)) {
      this.validateUploadedFile(value);
      return value;
    }

    if (value?.photo) {
      const files = Array.isArray(value.photo) ? value.photo : [value.photo];
      for (const file of files) {
        this.validateImageFile(file);
      }
    }

    if (value?.file) {
      this.validateCvFile(value.file);
    }

    return value;
  }

  private isUploadedFile(value: any): value is Express.Multer.File {
    return Boolean(
      value &&
        typeof value === 'object' &&
        typeof value.mimetype === 'string' &&
        typeof value.fieldname === 'string',
    );
  }

  private validateUploadedFile(file: Express.Multer.File) {
    if (file.fieldname === 'photo') {
      this.validateImageFile(file);
      return;
    }

    if (file.fieldname === 'file') {
      this.validateCvFile(file);
    }
  }

  private validateImageFile(file?: Express.Multer.File) {
    if (!file || !this.allowedImageMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        `Invalid image file type: ${file?.mimetype || 'undefined'}`,
      );
    }
  }

  private validateCvFile(file?: Express.Multer.File) {
    if (!file || !this.allowedCvMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        `Invalid CV file type: ${file?.mimetype || 'undefined'}`,
      );
    }
  }
}
