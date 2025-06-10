import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { SessionService } from '../services/session.service';
import { CreateSessionDto } from '../dto/create-session.dto';
import { RevokeSessionDto } from '../dto/revoke-session.dto';
import { Session } from '../entities/session.entity';

@ApiTags('Sessions')
@Controller('v1/sessions')
export class SessionController {
  constructor(private readonly sessionService: SessionService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new session' })
  @ApiResponse({ status: 201, description: 'Session created', type: Session })
  async create(@Body() dto: CreateSessionDto): Promise<Session> {
    return this.sessionService.createSession(dto);
  }

  @Post('revoke')
  @ApiOperation({ summary: 'Revoke a session' })
  @ApiResponse({ status: 200, description: 'Session revoked' })
  async revoke(@Body() dto: RevokeSessionDto): Promise<void> {
    return this.sessionService.revokeSession(dto);
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'List active sessions for a user' })
  @ApiResponse({
    status: 200,
    description: 'List of active sessions',
    type: [Session],
  })
  async listActive(@Param('userId') userId: string): Promise<Session[]> {
    return this.sessionService.listActiveSessions(userId);
  }
}
