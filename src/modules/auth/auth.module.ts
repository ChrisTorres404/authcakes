// src/modules/auth/auth.module.ts
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

// Controllers
import { AuthController } from './controllers/auth.controller';
import { SessionController } from './controllers/session.controller';
import { RefreshTokenController } from './controllers/refresh-token.controller';
import { SystemAuthController } from './controllers/system-auth.controller';

// Services
import { AuthService } from './services/auth.service';
import { TokenService } from './services/token.service';
import { SessionService } from './services/session.service';
import { RefreshTokenService } from './services/refresh-token.service';
import { AuditLogService } from './services/audit-log.service';
import { NotificationService } from './services/notification.service';
import { PasswordHistoryService } from './services/password-history.service';

// Strategies
import { JwtStrategy } from './strategies/jwt.strategy';
import { LocalStrategy } from './strategies/local.strategy';
import { JwtRefreshStrategy } from './strategies/jwt-refresh.strategy';

// Entities
import { RefreshToken } from './entities/refresh-token.entity';
import { Session } from './entities/session.entity';
import { UserDevice } from './entities/user-device.entity';
import { MfaRecoveryCode } from './entities/mfa-recovery-code.entity';
import { WebauthnCredential } from './entities/webauthn-credential.entity';
import { PasswordHistory } from './entities/password-history.entity';
import { Log } from '../logs/entities/log.entity';

// Guards
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { JwtRefreshGuard } from './guards/jwt-refresh.guard';
import { LocalAuthGuard } from './guards/local-auth.guard';

// Imported modules
import { UsersModule } from '../users/users.module';
import { TenantsModule } from '../tenants/tenants.module';
import { SettingsModule } from '../settings/settings.module';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get('auth.jwt.secret'),
        signOptions: {
          expiresIn: configService.get('auth.jwt.accessExpiresIn'),
        },
      }),
    }),
    TypeOrmModule.forFeature([
      RefreshToken,
      Session,
      UserDevice,
      MfaRecoveryCode,
      WebauthnCredential,
      PasswordHistory,
      Log,
    ]),
    UsersModule,
    TenantsModule,
    SettingsModule,
  ],
  controllers: [AuthController, SessionController, RefreshTokenController, SystemAuthController],
  providers: [
    AuthService,
    TokenService,
    SessionService,
    RefreshTokenService,
    JwtStrategy,
    LocalStrategy,
    JwtRefreshStrategy,
    JwtAuthGuard,
    JwtRefreshGuard,
    LocalAuthGuard,
    AuditLogService,
    NotificationService,
    PasswordHistoryService,
  ],
  exports: [
    AuthService,
    TokenService,
    SessionService,
    JwtAuthGuard,
    JwtRefreshGuard,
    AuditLogService,
    NotificationService,
    PasswordHistoryService,
  ],
})
export class AuthModule {}
