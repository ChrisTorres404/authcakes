import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBody, ApiOkResponse } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Public } from '../../../common/decorators/public.decorator';
import { SystemTokenDto } from '../dto/system-token.dto';
import { SystemTokenResponseDto } from '../dto/system-token-response.dto';
import * as crypto from 'crypto';

@ApiTags('System Auth')
@Controller('v1/system/auth')
export class SystemAuthController {
  constructor(
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
  ) {}

  @Public()
  @Post('token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Generate system JWT token',
    description: 'Exchange API key for a system JWT token for API authentication',
  })
  @ApiBody({ type: SystemTokenDto })
  @ApiOkResponse({
    type: SystemTokenResponseDto,
    description: 'System token generated successfully',
  })
  async generateSystemToken(
    @Body() dto: SystemTokenDto,
  ): Promise<SystemTokenResponseDto> {
    // Validate API key
    const validApiKeys = this.configService.get<string[]>('system.apiKeys', []);
    
    if (!validApiKeys.includes(dto.apiKey)) {
      throw new UnauthorizedException('Invalid API key');
    }

    // Generate system JWT
    const payload = {
      type: 'system',
      clientId: dto.clientId,
      apiKeyHash: this.hashApiKey(dto.apiKey),
      permissions: dto.permissions || ['read', 'write'],
    };

    const systemSecret = this.configService.get<string>('system.jwtSecret');
    const expirationMinutes = this.configService.get<number>('system.jwtExpirationMinutes', 1440);
    
    const token = await this.jwtService.signAsync(payload, {
      secret: systemSecret,
      expiresIn: `${expirationMinutes}m`,
      issuer: this.configService.get<string>('system.jwtIssuer'),
      audience: this.configService.get<string>('system.jwtAudience'),
    });

    return {
      success: true,
      token,
      expiresIn: expirationMinutes * 60, // Convert to seconds
      tokenType: 'Bearer',
      clientId: dto.clientId,
    };
  }

  @Public()
  @Post('validate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Validate system token',
    description: 'Verify if a system token is valid and not expired',
  })
  async validateSystemToken(
    @Body() dto: { token: string },
  ): Promise<{ valid: boolean; clientId?: string; expiresAt?: Date }> {
    try {
      const systemSecret = this.configService.get<string>('system.jwtSecret');
      const payload = await this.jwtService.verifyAsync(dto.token, {
        secret: systemSecret,
      });

      return {
        valid: true,
        clientId: payload.clientId,
        expiresAt: new Date(payload.exp * 1000),
      };
    } catch {
      return { valid: false };
    }
  }

  private hashApiKey(apiKey: string): string {
    return crypto
      .createHash('sha256')
      .update(apiKey)
      .digest('hex')
      .substring(0, 16);
  }
}