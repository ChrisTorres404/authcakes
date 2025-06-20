import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { RefreshTokenService } from '../services/refresh-token.service';
import { CreateRefreshTokenDto } from '../dto/create-refresh-token.dto';
import { RevokeRefreshTokenDto } from '../dto/revoke-refresh-token.dto';
import { RefreshToken } from '../entities/refresh-token.entity';

@ApiTags('Refresh Tokens')
@ApiBearerAuth()
@Controller('v1/refresh-tokens')
export class RefreshTokenController {
  constructor(private readonly refreshTokenService: RefreshTokenService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new refresh token' })
  @ApiResponse({
    status: 201,
    description: 'Refresh token created',
    type: RefreshToken,
  })
  async create(@Body() dto: CreateRefreshTokenDto): Promise<RefreshToken> {
    // TODO: Add guard for authentication if needed
    // TODO: Add audit logging
    return this.refreshTokenService.createRefreshToken(dto);
  }

  @Post('revoke')
  @ApiOperation({ summary: 'Revoke a refresh token' })
  @ApiResponse({
    status: 200,
    description: 'Refresh token revoked',
  })
  async revoke(@Body() dto: RevokeRefreshTokenDto): Promise<void> {
    // TODO: Add guard for authentication if needed
    // TODO: Add audit logging
    return this.refreshTokenService.revokeRefreshToken(dto);
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'List all refresh tokens for a user' })
  @ApiResponse({
    status: 200,
    description: 'List of refresh tokens',
    type: [RefreshToken],
  })
  async listUserTokens(
    @Param('userId') userId: string,
  ): Promise<RefreshToken[]> {
    // TODO: Add guard for authentication if needed
    return this.refreshTokenService.listUserRefreshTokens(userId);
  }
}
