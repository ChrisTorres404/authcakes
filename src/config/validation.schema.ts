import * as Joi from 'joi';

export const validationSchema = Joi.object({
  // App
  APP_PORT: Joi.number().default(3000),
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
  APP_CORS_ORIGINS: Joi.string().default('*'),
  APP_BASE_URL: Joi.string().uri().optional(),

  // Auth
  AUTH_JWT_SECRET: Joi.string().min(16).required(),
  AUTH_JWT_ACCESS_EXPIRES_IN: Joi.string().default('900'),
  AUTH_JWT_REFRESH_EXPIRES_IN: Joi.string().default('604800'),
  AUTH_PASSWORD_BCRYPT_ROUNDS: Joi.number().min(4).max(20).default(10),
  AUTH_PASSWORD_MIN_LENGTH: Joi.number().min(6).max(128).default(8),
  AUTH_PASSWORD_REQUIRE_NUMBERS: Joi.boolean().default(false),
  AUTH_PASSWORD_REQUIRE_SPECIAL: Joi.boolean().default(false),
  AUTH_MFA_ENABLED: Joi.boolean().default(false),
  AUTH_MFA_TOTP_WINDOW: Joi.number().min(0).max(10).default(1),
  AUTH_COOKIE_DOMAIN: Joi.string().allow('').default(''),
  AUTH_COOKIE_SECURE: Joi.boolean().default(false),
  AUTH_COOKIE_SAMESITE: Joi.string().valid('lax', 'strict', 'none').default('lax'),
  AUTH_SECURITY_MAX_FAILED_ATTEMPTS: Joi.number().min(1).max(20).default(5),
  AUTH_SECURITY_LOCK_DURATION_MINUTES: Joi.number().min(1).max(1440).default(30),

  // Database
  DB_TYPE: Joi.string().valid('postgres', 'mysql', 'sqlite', 'mariadb', 'mongodb').default('postgres'),
  DB_HOST: Joi.string().default('localhost'),
  DB_PORT: Joi.number().default(5432),
  DB_USERNAME: Joi.string().default('postgres'),
  DB_PASSWORD: Joi.string().default('postgres'),
  DB_NAME: Joi.string().default('authcakes'),
  DB_SYNCHRONIZE: Joi.boolean().default(false),
  DB_LOGGING: Joi.boolean().default(false),
  DB_SSL: Joi.boolean().default(false),
  DB_MIGRATIONS_RUN: Joi.boolean().default(false),

  // Application
  API_PREFIX: Joi.string().default('api'),
  APP_NAME: Joi.string().default('AuthCakes'),
  APP_URL: Joi.string().required(),
  FRONTEND_URL: Joi.string().required(),

  // Email (SMTP)
  SMTP_HOST: Joi.string().optional(),
  SMTP_PORT: Joi.number().optional(),
  SMTP_USER: Joi.string().optional(),
  SMTP_PASSWORD: Joi.string().optional(),
  SMTP_FROM_EMAIL: Joi.string().optional(),
  SMTP_FROM_NAME: Joi.string().optional(),
  SMTP_SECURE: Joi.boolean().default(false),

  // Email Templates
  EMAIL_TEMPLATE_WELCOME: Joi.string().optional(),
  EMAIL_TEMPLATE_PASSWORD_RESET: Joi.string().optional(),
  EMAIL_TEMPLATE_INVITE: Joi.string().optional(),
  EMAIL_TEMPLATE_MFA: Joi.string().optional(),

  // S3/Object Storage
  S3_ENDPOINT: Joi.string().uri().optional(),
  S3_ACCESS_KEY: Joi.string().optional(),
  S3_SECRET_KEY: Joi.string().optional(),
  S3_BUCKET: Joi.string().optional(),
  S3_REGION: Joi.string().optional(),
  S3_USE_SSL: Joi.boolean().default(true),

  // OAuth2
  OAUTH_GOOGLE_CLIENT_ID: Joi.string().optional(),
  OAUTH_GOOGLE_CLIENT_SECRET: Joi.string().optional(),
  OAUTH_GOOGLE_REDIRECT_URI: Joi.string().uri().optional(),
  OAUTH_GITHUB_CLIENT_ID: Joi.string().optional(),
  OAUTH_GITHUB_CLIENT_SECRET: Joi.string().optional(),
  OAUTH_GITHUB_REDIRECT_URI: Joi.string().uri().optional(),

  // Feature Flags
  FEATURE_FLAG_NEW_DASHBOARD: Joi.boolean().default(false),
  FEATURE_FLAG_BETA_USER: Joi.boolean().default(false),

  // SMS (Twilio)
  TWILIO_ACCOUNT_SID: Joi.string().optional(),
  TWILIO_AUTH_TOKEN: Joi.string().optional(),
  TWILIO_PHONE_NUMBER: Joi.string().optional(),

  // Push Notifications
  PUSH_PROVIDER: Joi.string().valid('firebase', 'onesignal', 'expo').optional(),
  FIREBASE_SERVER_KEY: Joi.string().optional(),
  ONESIGNAL_APP_ID: Joi.string().optional(),
  ONESIGNAL_API_KEY: Joi.string().optional(),
  EXPO_ACCESS_TOKEN: Joi.string().optional(),

  // Redis
  REDIS_HOST: Joi.string().optional(),
  REDIS_PORT: Joi.number().optional(),
  REDIS_PASSWORD: Joi.string().allow('').optional(),
  REDIS_DB: Joi.number().optional(),

  // Rate limiting
  THROTTLE_TTL: Joi.number().default(60),
  THROTTLE_LIMIT: Joi.number().default(10),

  // Logging
  LOG_LEVEL: Joi.string().valid('error', 'warn', 'info', 'debug').default('info'),

  // Monitoring
  PROMETHEUS_ENABLED: Joi.boolean().default(false),
  DATADOG_API_KEY: Joi.string().optional(),
  DATADOG_APP_KEY: Joi.string().optional(),
  DATADOG_SITE: Joi.string().optional(),

  // Error Tracking
  SENTRY_DSN: Joi.string().uri().optional(),
  SENTRY_ENVIRONMENT: Joi.string().optional(),
  SENTRY_TRACES_SAMPLE_RATE: Joi.number().min(0).max(1).default(0.1),
  ROLLBAR_ACCESS_TOKEN: Joi.string().optional(),
  ROLLBAR_ENVIRONMENT: Joi.string().optional(),

  // Custom Integrations
  CUSTOM_WEBHOOK_URL: Joi.string().uri().optional(),
  CUSTOM_API_KEY: Joi.string().optional(),
  CUSTOM_FEATURE_ENABLED: Joi.boolean().default(false),
});