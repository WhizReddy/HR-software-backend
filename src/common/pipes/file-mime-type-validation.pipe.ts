import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';

type AllowedFileKind = 'image' | 'cv';

interface FileMimeTypeValidationOptions {
  fieldKinds?: Record<string, AllowedFileKind>;
}

@Injectable()
export class FileMimeTypeValidationPipe implements PipeTransform {
  private readonly fieldKinds: Record<string, AllowedFileKind>;

  constructor(options: FileMimeTypeValidationOptions = {}) {
    this.fieldKinds = {
      photo: 'image',
      file: 'cv',
      ...options.fieldKinds,
    };
  }

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

    if (value && typeof value === 'object') {
      for (const [fieldName, fieldValue] of Object.entries(value)) {
        const files = Array.isArray(fieldValue) ? fieldValue : [fieldValue];
        for (const file of files) {
          if (this.isUploadedFile(file)) {
            this.validateUploadedFile(file, fieldName);
          }
        }
      }
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

  private validateUploadedFile(
    file: Express.Multer.File,
    fallbackFieldName = file.fieldname,
  ) {
    const fileKind =
      this.fieldKinds[file.fieldname] ?? this.fieldKinds[fallbackFieldName];

    if (fileKind === 'image') {
      this.validateImageFile(file);
      return;
    }

    if (fileKind === 'cv') {
      this.validateCvFile(file);
      return;
    }

    throw new BadRequestException(
      `Unsupported upload field: ${file.fieldname}`,
    );
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
