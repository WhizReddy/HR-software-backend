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
    if (value?.photo) {
      const files = Array.isArray(value.photo) ? value.photo : [value.photo];
      for (const file of files) {
        if (!file || !this.allowedImageMimeTypes.includes(file.mimetype)) {
          throw new BadRequestException(
            `Invalid image file type: ${file?.mimetype || 'undefined'}`,
          );
        }
      }
    }

    if (value?.file) {
      const file = value.file;
      if (!file || !this.allowedCvMimeTypes.includes(file.mimetype)) {
        throw new BadRequestException(
          `Invalid CV file type: ${file?.mimetype || 'undefined'}`,
        );
      }
    }

    return value;
  }
}
