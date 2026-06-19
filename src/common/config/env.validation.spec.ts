import { validateEnvironment } from './env.validation';

const validEnvironment = {
  MONGODB_URI: 'mongodb://localhost:27017/people-hub',
  JWT_SECRET: 'secret',
  FIREBASE_PROJECT_ID: 'project-id',
  FIREBASE_PRIVATE_KEY: 'private-key',
  FIREBASE_CLIENT_EMAIL: 'firebase@example.com',
  FIREBASE_BUCKETNAME: 'bucket-name',
  FRONT_URL: 'https://people-hub.example.com',
};

describe('validateEnvironment', () => {
  it('throws a clear error when required values are missing', () => {
    expect(() =>
      validateEnvironment({
        ...validEnvironment,
        JWT_SECRET: '',
      }),
    ).toThrow('Missing required environment variables: JWT_SECRET');
  });

  it('allows FRONT_URL to be missing while warning about generated links', () => {
    const environmentWithoutFrontUrl = Object.fromEntries(
      Object.entries(validEnvironment).filter(([key]) => key !== 'FRONT_URL'),
    );
    const warn = jest.spyOn(console, 'warn').mockImplementation();

    expect(validateEnvironment(environmentWithoutFrontUrl)).toEqual(
      environmentWithoutFrontUrl,
    );
    expect(warn).toHaveBeenCalledWith(
      'Missing recommended environment variables: FRONT_URL. Some generated links may be incomplete.',
    );

    warn.mockRestore();
  });

  it('rejects non-numeric port values when provided', () => {
    expect(() =>
      validateEnvironment({
        ...validEnvironment,
        PORT: 'not-a-number',
      }),
    ).toThrow('PORT must be a valid number when provided');
  });
});
