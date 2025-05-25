# Environment Variables Guide for AuthCakes (NestJS Backend)

## How Environment Variables Are Loaded

Environment variables are loaded using NestJS's `ConfigModule`. The configuration is set up in `app.module.ts` as follows:

```typescript
// app.module.ts
ConfigModule.forRoot({
  isGlobal: true,
  envFilePath: '.env',
  validationSchema: validationSchema, // optional
});
```

- **envFilePath**: Specifies the `.env` file to load variables from.
- **validationSchema**: (Optional) Uses Joi to validate environment variables at startup for safety and correctness.
- **isGlobal: true**: Makes the config available throughout the app without needing to import it in every module.

> **Tip:** The app will use `.env` by default, but you can specify a different file for different environments (e.g., `.env.staging`).

---

## Table of Contents
- [General Guidelines](#general-guidelines)
- [Auth Config](#auth-config)
- [Database Config](#database-config)
- [SMTP/Email Config](#smtpemail-config)
- [S3/Storage Config](#s3storage-config)
- [OAuth Providers](#oauth-providers)
- [Feature Flags](#feature-flags)
- [Analytics](#analytics)
- [Payments](#payments)
- [Monitoring & Error Tracking](#monitoring--error-tracking)
- [Push Notifications](#push-notifications)
- [Custom Integrations](#custom-integrations)
- [Migration Notes](#migration-notes)
- [Best Practices](#best-practices)

---

## General Guidelines
- **Required** variables must be set for the app to run.
- **Optional** variables enable extra features or integrations.
- Use `.env.example` as a template.
- Secrets (passwords, keys) should never be committed to version control.

---

## Auth Config
| Variable | Required | Example | Description |
|---|---|---|---|
| `AUTH_JWT_SECRET` | Yes | `supersecretjwtkey` | Secret for signing JWT tokens |
| `AUTH_JWT_EXPIRY` | Yes | `3600s` | JWT token expiry (e.g., `3600s`, `1d`) |
| `AUTH_REFRESH_TOKEN_SECRET` | Yes | `refreshsecretkey` | Secret for refresh tokens |
| `AUTH_REFRESH_TOKEN_EXPIRY` | Yes | `7d` | Refresh token expiry |
| `AUTH_MFA_ENABLED` | No | `true` | Enable multi-factor authentication |
| `AUTH_MFA_ISSUER` | No | `AuthCakes` | MFA issuer name for TOTP |
| `AUTH_SESSION_EXPIRY` | No | `86400` | Session expiry in seconds |
| `AUTH_PASSWORD_RESET_EXPIRY` | No | `3600` | Password reset token expiry (seconds) |
| `AUTH_EMAIL_VERIFICATION_EXPIRY` | No | `86400` | Email verification token expiry (seconds) |

---

## Database Config
| Variable | Required | Example | Description |
|---|---|---|---|
| `DB_HOST` | Yes | `localhost` | Database host |
| `DB_PORT` | Yes | `5432` | Database port |
| `DB_USERNAME` | Yes | `postgres` | Database username |
| `DB_PASSWORD` | Yes | `password` | Database password |
| `DB_NAME` | Yes | `authcakes` | Database name |
| `DB_SSL` | No | `false` | Enable SSL for DB connection |

---

## SMTP/Email Config
| Variable | Required | Example | Description |
|---|---|---|---|
| `SMTP_HOST` | Yes | `smtp.mailtrap.io` | SMTP server host |
| `SMTP_PORT` | Yes | `2525` | SMTP server port |
| `SMTP_USER` | Yes | `user` | SMTP username |
| `SMTP_PASS` | Yes | `pass` | SMTP password |
| `SMTP_FROM_EMAIL` | Yes | `noreply@authcakes.com` | Default sender email |
| `SMTP_FROM_NAME` | No | `AuthCakes` | Default sender name |

---

## S3/Storage Config
| Variable | Required | Example | Description |
|---|---|---|---|
| `S3_ENDPOINT` | No | `https://s3.amazonaws.com` | S3 endpoint URL |
| `S3_BUCKET` | Yes | `authcakes-uploads` | S3 bucket name |
| `S3_ACCESS_KEY` | Yes | `AKIA...` | S3 access key |
| `S3_SECRET_KEY` | Yes | `secret` | S3 secret key |
| `S3_REGION` | No | `us-east-1` | S3 region |
| `S3_PUBLIC_URL` | No | `https://cdn.authcakes.com` | Public URL for assets |

---

## OAuth Providers
| Variable | Required | Example | Description |
|---|---|---|---|
| `OAUTH_GOOGLE_CLIENT_ID` | No | `...` | Google OAuth client ID |
| `OAUTH_GOOGLE_CLIENT_SECRET` | No | `...` | Google OAuth client secret |
| `OAUTH_GITHUB_CLIENT_ID` | No | `...` | GitHub OAuth client ID |
| `OAUTH_GITHUB_CLIENT_SECRET` | No | `...` | GitHub OAuth client secret |
| `OAUTH_FACEBOOK_CLIENT_ID` | No | `...` | Facebook OAuth client ID |
| `OAUTH_FACEBOOK_CLIENT_SECRET` | No | `...` | Facebook OAuth client secret |

---

## Feature Flags
| Variable | Required | Example | Description |
|---|---|---|---|
| `FEATURE_REGISTRATION_ENABLED` | No | `true` | Enable user registration |
| `FEATURE_MFA_ENABLED` | No | `true` | Enable MFA globally |
| `FEATURE_AUDIT_LOGGING` | No | `true` | Enable audit logging |
| `FEATURE_SOFT_DELETE` | No | `true` | Enable soft deletes |

---

## Analytics
| Variable | Required | Example | Description |
|---|---|---|---|
| `ANALYTICS_PROVIDER` | No | `posthog` | Analytics provider name |
| `ANALYTICS_API_KEY` | No | `phc_...` | Analytics API key |
| `ANALYTICS_ENDPOINT` | No | `https://app.posthog.com` | Analytics endpoint |

---

## Payments
| Variable | Required | Example | Description |
|---|---|---|---|
| `PAYMENTS_PROVIDER` | No | `stripe` | Payments provider |
| `STRIPE_API_KEY` | No | `sk_live_...` | Stripe API key |
| `STRIPE_WEBHOOK_SECRET` | No | `whsec_...` | Stripe webhook secret |

---

## Monitoring & Error Tracking
| Variable | Required | Example | Description |
|---|---|---|---|
| `SENTRY_DSN` | No | `https://...@sentry.io/123` | Sentry DSN for error tracking |
| `MONITORING_PROVIDER` | No | `datadog` | Monitoring provider |
| `MONITORING_API_KEY` | No | `...` | Monitoring API key |

---

## Push Notifications
| Variable | Required | Example | Description |
|---|---|---|---|
| `PUSH_PROVIDER` | No | `onesignal` | Push notification provider |
| `PUSH_API_KEY` | No | `...` | Push API key |
| `PUSH_APP_ID` | No | `...` | Push app ID |

---

## Custom Integrations
| Variable | Required | Example | Description |
|---|---|---|---|
| `INTEGRATION_SLACK_WEBHOOK` | No | `https://hooks.slack.com/...` | Slack webhook for notifications |
| `INTEGRATION_CUSTOM_API_KEY` | No | `...` | Custom integration API key |

---

## Migration Notes
- **Old to New Mapping:**
  - `JWT_SECRET` → `AUTH_JWT_SECRET`
  - `REFRESH_SECRET` → `AUTH_REFRESH_TOKEN_SECRET`
  - `SESSION_EXPIRY` → `AUTH_SESSION_EXPIRY`
  - `EMAIL_FROM` → `SMTP_FROM_EMAIL`
  - `S3_KEY`/`S3_SECRET` → `S3_ACCESS_KEY`/`S3_SECRET_KEY`
  - See `.env.example` for more mappings.
- **Remove** deprecated/unused variables.
- **Add** any new required variables as per this guide.

---

## Best Practices
- Use a separate `.env` for each environment (development, staging, production).
- Never commit secrets to version control.
- Use a tool like [dotenv-vault](https://www.dotenv.org/) or your CI/CD secrets manager for production secrets.
- Review and update this file when adding new features or integrations.

---

For questions or updates, see the main README or contact the project maintainers. 