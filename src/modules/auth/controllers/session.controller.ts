import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { SessionService } from '../services/session.service';
import { CreateSessionDto } from '../dto/create-session.dto';
import { RevokeSessionDto } from '../dto/revoke-session.dto';

@Controller('sessions')
export class SessionController {
  constructor(private readonly sessionService: SessionService) {}

  @Post()
  async create(@Body() dto: CreateSessionDto) {
    return this.sessionService.createSession(dto);
  }

  @Post('revoke')
  async revoke(@Body() dto: RevokeSessionDto) {
    return this.sessionService.revokeSession(dto);
  }

  @Get('user/:userId')
  async listActive(@Param('userId') userId: string) {
    return this.sessionService.listActiveSessions(userId);
  }
} 