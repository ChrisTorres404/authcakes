import { Repository } from 'typeorm';
import { SystemSetting } from '../../settings/entities/system-setting.entity';
import { Logger } from '@nestjs/common';
import { SeederOptions } from './seeder.service';

export async function seedSystemSettings(
  systemSettingsRepository: Repository<SystemSetting>,
  options: SeederOptions = {},
) {
  const logger = new Logger('SystemSettingsSeeder');
  const settingsCount = await systemSettingsRepository.count();
  if (settingsCount === 0 || options.force) {
    if (settingsCount > 0 && options.force) {
      logger.log(
        'Force option enabled - seeding system settings even though settings already exist',
      );
    }
    logger.log('Seeding system settings...');
    const settings = [
      // ... (copy all settings from original SeederService)
      {
        key: 'global_session_timeout_minutes',
        value: '30',
        type: 'number',
        description: 'Global session timeout in minutes',
      },
      {
        key: 'session_warning_time_seconds',
        value: '60',
        type: 'number',
        description: 'Time in seconds before session expiry to show warning',
      },
      {
        key: 'show_session_timeout_warning',
        value: 'true',
        type: 'boolean',
        description: 'Whether to show warning before session expires',
      },
      {
        key: 'session_timeout_redirect_url',
        value: '/login',
        type: 'string',
        description: 'URL to redirect to after session timeout',
      },
      {
        key: 'session_timeout_warning_message',
        value: 'Your session is about to expire. Would you like to continue?',
        type: 'string',
        description: 'Message to show when session is about to expire',
      },
      {
        key: 'session.max_sessions_per_user',
        value: '5',
        type: 'number',
        description: 'Maximum concurrent sessions allowed per user',
      },
      {
        key: 'session.enforce_single_session',
        value: 'false',
        type: 'boolean',
        description: 'Whether to enforce single session per user',
      },
      {
        key: 'session.timeout_seconds',
        value: '3600',
        type: 'number',
        description: 'Time in seconds before an inactive session expires',
      },
      {
        key: 'session.warning_threshold',
        value: '120',
        type: 'number',
        description: 'Time in seconds before expiry to show warning',
      },
      {
        key: 'session.check_interval',
        value: '15000',
        type: 'number',
        description: 'Time in milliseconds between session status checks',
      },
      {
        key: 'user_group_timeouts',
        value: JSON.stringify({
          admin: 60,
          standard: 30,
          guest: 15,
        }),
        type: 'json',
        description: 'Session timeout settings for different user groups',
      },
      // ... (rest of settings as in SeederService)
      {
        key: 'enable_email_auth',
        value: 'true',
        type: 'boolean',
        description: 'Enable email authentication',
      },
      {
        key: 'enable_sms_auth',
        value: 'true',
        type: 'boolean',
        description: 'Enable SMS authentication',
      },
      {
        key: 'enable_google_auth',
        value: 'true',
        type: 'boolean',
        description: 'Enable Google OAuth authentication',
      },
      {
        key: 'enable_apple_auth',
        value: 'true',
        type: 'boolean',
        description: 'Enable Apple OAuth authentication',
      },
      {
        key: 'enable_mfa',
        value: 'true',
        type: 'boolean',
        description: 'Enable multi-factor authentication',
      },
      {
        key: 'enable_webauthn',
        value: 'true',
        type: 'boolean',
        description: 'Enable WebAuthn authentication',
      },
      {
        key: 'password_min_length',
        value: '8',
        type: 'number',
        description: 'Minimum password length',
      },
      {
        key: 'password_require_uppercase',
        value: 'true',
        type: 'boolean',
        description: 'Require uppercase characters in passwords',
      },
      {
        key: 'password_require_lowercase',
        value: 'true',
        type: 'boolean',
        description: 'Require lowercase characters in passwords',
      },
      {
        key: 'password_require_number',
        value: 'true',
        type: 'boolean',
        description: 'Require numbers in passwords',
      },
      {
        key: 'password_require_special',
        value: 'true',
        type: 'boolean',
        description: 'Require special characters in passwords',
      },
      {
        key: 'max_login_attempts',
        value: '5',
        type: 'number',
        description: 'Maximum login attempts before account lockout',
      },
      {
        key: 'login_lockout_duration',
        value: '30',
        type: 'number',
        description: 'Account lockout duration in minutes',
      },
      {
        key: 'refresh_token_duration',
        value: '7',
        type: 'number',
        description: 'Refresh token duration in days',
      },
      {
        key: 'org_logo_max_size',
        value: '2',
        type: 'number',
        description: 'Maximum organization logo size in MB',
      },
      {
        key: 'enable_user_registration',
        value: 'true',
        type: 'boolean',
        description: 'Enable public user registration',
      },
      {
        key: 'require_email_verification',
        value: 'true',
        type: 'boolean',
        description: 'Require email verification for new accounts',
      },
      {
        key: 'require_phone_verification',
        value: 'true',
        type: 'boolean',
        description: 'Require phone verification for new accounts',
      },
      {
        key: 'org_invite_expiry',
        value: '7',
        type: 'number',
        description: 'Organization invitation expiry in days',
      },
      {
        key: 'access_token_duration',
        value: '15',
        type: 'number',
        description: 'Access token duration in minutes',
      },
      {
        key: 'account.password_expiry_days',
        value: '90',
        type: 'number',
        description: 'Number of days before passwords expire',
      },
      {
        key: 'account.password_history_count',
        value: '5',
        type: 'number',
        description: 'Number of previous passwords to prevent reuse',
      },
      {
        key: 'account.inactive_account_lock_days',
        value: '90',
        type: 'number',
        description: 'Days of inactivity before account is locked',
      },
      {
        key: 'mfa.enforced_for_admins',
        value: 'true',
        type: 'boolean',
        description: 'Whether MFA is mandatory for admin users',
      },
      {
        key: 'mfa.recovery_codes_count',
        value: '10',
        type: 'number',
        description: 'Number of recovery codes generated for MFA',
      },
      {
        key: 'mfa.remember_device_days',
        value: '30',
        type: 'number',
        description: 'Days to remember a device for MFA',
      },
      {
        key: 'registration.allow_public_registration',
        value: 'true',
        type: 'boolean',
        description: 'Whether public registration is allowed',
      },
      {
        key: 'registration.require_admin_approval',
        value: 'false',
        type: 'boolean',
        description: 'Whether new registrations require admin approval',
      },
      {
        key: 'registration.verification_token_expiry_hours',
        value: '24',
        type: 'number',
        description: 'Hours before verification tokens expire',
      },
      {
        key: 'privacy.data_retention_days',
        value: '730',
        type: 'number',
        description: 'Days to retain user data after deletion',
      },
      {
        key: 'privacy.login_history_days',
        value: '90',
        type: 'number',
        description: 'Days to retain login history',
      },
      {
        key: 'privacy.allow_export_data',
        value: 'true',
        type: 'boolean',
        description: 'Whether users can export their data',
      },
      {
        key: 'notifications.security_events_email',
        value: 'true',
        type: 'boolean',
        description: 'Send email notifications for security events',
      },
      {
        key: 'notifications.new_device_login',
        value: 'true',
        type: 'boolean',
        description: 'Notify users of logins from new devices',
      },
      {
        key: 'notifications.password_expiry_days_advance',
        value: '7',
        type: 'number',
        description: 'Days in advance to notify of password expiry',
      },
      {
        key: 'rate_limiting.login_max_attempts',
        value: '10',
        type: 'number',
        description: 'Maximum login attempts per timeframe',
      },
      {
        key: 'rate_limiting.login_timeframe_minutes',
        value: '15',
        type: 'number',
        description: 'Timeframe for login rate limiting in minutes',
      },
      {
        key: 'rate_limiting.password_reset_max_daily',
        value: '3',
        type: 'number',
        description: 'Maximum password reset requests per day',
      },
      {
        key: 'tenant.max_users_free_plan',
        value: '5',
        type: 'number',
        description: 'Maximum users for free plan tenants',
      },
      {
        key: 'tenant.allow_custom_domains',
        value: 'false',
        type: 'boolean',
        description: 'Allow tenants to use custom domains',
      },
      {
        key: 'tenant.enforce_domain_restrictions',
        value: 'false',
        type: 'boolean',
        description: 'Enforce email domain restrictions for tenants',
      },
      // Profile update settings
      {
        key: 'ALLOW_USER_PROFILE_UPDATE',
        value: 'true',
        type: 'boolean',
        description:
          'Controls whether users can update their own profile information',
      },
      {
        key: 'PROFILE_UPDATABLE_FIELDS',
        value: JSON.stringify([
          'firstName',
          'lastName',
          'avatar',
          'company',
          'department',
          'country',
          'state',
          'address',
          'address2',
          'city',
          'zipCode',
          'bio',
        ]),
        type: 'json',
        description:
          'List of fields users are allowed to update in their profiles',
      },
    ];
    await systemSettingsRepository.save(settings);
    logger.log(`${settings.length} system settings seeded`);
  } else {
    logger.log('System settings already exist, skipping seeding');
  }
}
