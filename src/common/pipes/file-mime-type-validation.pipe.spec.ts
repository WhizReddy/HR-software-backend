import { BadRequestException } from '@nestjs/common';
import { FileMimeTypeValidationPipe } from './file-mime-type-validation.pipe';

const uploadedFile = (
  fieldname: string,
  mimetype: string,
): Express.Multer.File =>
  ({
    fieldname,
    mimetype,
  }) as Express.Multer.File;

describe('FileMimeTypeValidationPipe', () => {
  it('keeps applicant file uploads limited to CV document types', () => {
    const pipe = new FileMimeTypeValidationPipe();

    expect(() =>
      pipe.transform(uploadedFile('file', 'application/pdf')),
    ).not.toThrow();
    expect(() => pipe.transform(uploadedFile('file', 'image/png'))).toThrow(
      BadRequestException,
    );
  });

  it('supports image-only validation for profile image uploads', () => {
    const pipe = new FileMimeTypeValidationPipe({
      fieldKinds: { file: 'image' },
    });

    expect(() =>
      pipe.transform(uploadedFile('file', 'image/png')),
    ).not.toThrow();
    expect(() =>
      pipe.transform(uploadedFile('file', 'application/pdf')),
    ).toThrow(BadRequestException);
  });

  it('validates event photo arrays as image uploads', () => {
    const pipe = new FileMimeTypeValidationPipe();

    expect(() =>
      pipe.transform({
        photo: [uploadedFile('photo', 'image/webp')],
      }),
    ).not.toThrow();
  });
});
