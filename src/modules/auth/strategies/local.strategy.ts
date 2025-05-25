import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../services/auth.service';
import { UsersService } from '../../users/services/users.service';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
  ) {
    super({ usernameField: 'email', passReqToCallback: true }); // use 'email' instead of 'username', pass req
  }

  async validate(req: any, email: string, password: string): Promise<any> {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      // Optionally record failed attempt for non-existent user (do nothing for security)
      throw new UnauthorizedException('Invalid credentials');
    }
    // Check if account is locked
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      throw new UnauthorizedException('Account is locked due to too many failed login attempts.');
    }
    // Check if account is active
    if (user.active === false) {
      throw new UnauthorizedException('Account is inactive.');
    }
    // Validate password
    const validUser = await this.authService.validateUser(email, password);
    if (!validUser) {
      // Record failed login attempt
      await this.usersService.recordFailedLoginAttempt(email);
      throw new UnauthorizedException('Invalid credentials');
    }
    // MFA check
    if (user.mfaEnabled) {
      const mfaCode = req.body.mfaCode || req.headers['x-mfa-code'];
      if (!mfaCode) {
        throw new UnauthorizedException('MFA code required.');
      }
      const mfaValid = await this.authService.validateMfaCode(user, mfaCode);
      if (!mfaValid) {
        throw new UnauthorizedException('Invalid MFA code.');
      }
    }
    // Reset failed login attempts on success
    await this.usersService.resetFailedLoginAttempts(user.id);
    return validUser;
  }
} 