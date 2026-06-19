type Environment = Record<string, string | undefined>;

const REQUIRED_ENV_VARS = [
  'MONGODB_URI',
  'JWT_SECRET',
  'FIREBASE_PROJECT_ID',
  'FIREBASE_PRIVATE_KEY',
  'FIREBASE_CLIENT_EMAIL',
  'FIREBASE_BUCKETNAME',
] as const;

const RECOMMENDED_ENV_VARS = ['FRONT_URL'] as const;

const hasValue = (value: string | undefined) =>
  typeof value === 'string' && value.trim().length > 0;

export const validateEnvironment = (config: Environment) => {
  const missingVars = REQUIRED_ENV_VARS.filter((key) => !hasValue(config[key]));

  if (missingVars.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingVars.join(', ')}`,
    );
  }

  const missingRecommendedVars = RECOMMENDED_ENV_VARS.filter(
    (key) => !hasValue(config[key]),
  );

  if (missingRecommendedVars.length > 0) {
    console.warn(
      `Missing recommended environment variables: ${missingRecommendedVars.join(
        ', ',
      )}. Some generated links may be incomplete.`,
    );
  }

  if (hasValue(config.MAIL_PORT) && Number.isNaN(Number(config.MAIL_PORT))) {
    throw new Error('MAIL_PORT must be a valid number when provided');
  }

  if (hasValue(config.PORT) && Number.isNaN(Number(config.PORT))) {
    throw new Error('PORT must be a valid number when provided');
  }

  return config;
};
