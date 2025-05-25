// src/modules/auth/services/session.service.ts
import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Session } from '../entities/session.entity';
import { SettingsService } from '../../settings/services/settings.service';
import { SessionRepository } from '../repositories/session.repository';
import { CreateSessionDto } from '../dto/create-session.dto';
import { RevokeSessionDto } from '../dto/revoke-session.dto';

@Injectable()
export class SessionService {
  private readonly logger = new Logger(SessionService.name);
  constructor(
    @InjectRepository(Session)
    private readonly sessionRepository: SessionRepository,
    private configService: ConfigService,
    private settingsService: SettingsService,
  ) {}

  async createSession(dto: CreateSessionDto): Promise<Session> {
    const session = this.sessionRepository.create({
      user: { id: dto.userId } as any,
      ipAddress: dto.ipAddress,
      userAgent: dto.userAgent,
      deviceInfo: dto.deviceInfo,
      isActive: true,
      revoked: false,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24), // 24h default
    });
    const saved = await this.sessionRepository.save(session);
    this.logger.log(`Created session: ${saved.id} for user: ${dto.userId}`);
    return saved;
  }

  async getSessionById(sessionId: string): Promise<Session | null> {
    return this.sessionRepository.findOne({ 
      where: { id: sessionId },
    });
  }

  async isSessionValid(userId: string, sessionId: string): Promise<boolean> {
    // Check for active, not revoked session
    const session = await this.sessionRepository.findOne({
      where: {
        id: sessionId,
        user: { id: userId },
        revoked: false,
      },
    });
    if (!session) {
      return false;
    }
    // Check if session has timed out
    const timeoutMinutes = await this.settingsService.getValue<number>('global_session_timeout_minutes', 30);
    const lastUsedAt = session.lastUsedAt || session.createdAt;
    const timeoutMs = timeoutMinutes * 60 * 1000;
    if (Date.now() - lastUsedAt.getTime() > timeoutMs) {
      // Session has timed out, revoke it in DB
      await this.revokeSession({ sessionId, revokedBy: null });
      return false;
    }
    return true;
  }

  async updateSessionActivity(sessionId: string): Promise<void> {
    await this.sessionRepository.update(
      { id: sessionId },
      { lastUsedAt: new Date() },
    );
  }

  async getSessionRemainingTime(sessionId: string): Promise<number> {
    const session = await this.sessionRepository.findOne({
      where: { id: sessionId },
    });
    
    if (!session) {
      return 0;
    }
    
    const timeoutMinutes = await this.settingsService.getValue<number>('global_session_timeout_minutes', 30);
    const lastUsedAt = session.lastUsedAt || session.createdAt;
    const timeoutMs = timeoutMinutes * 60 * 1000;
    const elapsedMs = Date.now() - lastUsedAt.getTime();
    
    // Return remaining time in seconds
    const remainingSeconds = Math.max(0, (timeoutMs - elapsedMs) / 1000);
    return Math.floor(remainingSeconds);
  }

  async getActiveSessions(userId: string): Promise<Session[]> {
    return this.sessionRepository.find({
      where: {
        user: { id: userId },
        revoked: false,
      },
      order: {
        lastUsedAt: 'DESC',
      },
    });
  }

  async revokeSession(dto: RevokeSessionDto): Promise<void> {
    // Mark session as revoked in DB
    await this.sessionRepository.update(
      { id: dto.sessionId },
      { revoked: true, revokedAt: new Date(), revokedBy: dto.revokedBy ?? '', isActive: false }
    );
  }

  async revokeAllUserSessions(userId: string, exceptSessionId?: string): Promise<void> {
    const query = this.sessionRepository.createQueryBuilder()
      .update(Session)
      .set({ 
        revoked: true,
        revokedAt: new Date(),
        revokedBy: '',
        isActive: false
      })
      .where('userId = :userId', { userId })
      .andWhere('revoked = :revoked', { revoked: false });
      
    if (exceptSessionId) {
      query.andWhere('id != :exceptSessionId', { exceptSessionId });
    }
    const result = await query.execute();
    this.logger.log(`[revokeAllUserSessions] userId=${userId}, exceptSessionId=${exceptSessionId}, sessionsUpdated=${result.affected}`);
  }

  // Placeholder for custom session policy checks
  protected async checkCustomSessionPolicy(userId: string, deviceInfo: any): Promise<void> {
    // Implement custom session policy logic here (e.g., block certain devices, geo-restrictions, etc.)
  }

  // Placeholder for sending structured audit events to an external service
  protected logAuditEvent(event: Record<string, any>) {
    // Integrate with your audit/event service here (e.g., send to a message queue, external API, etc.)
    // Example: auditService.log(event);
  }

  async listActiveSessions(userId: string): Promise<Session[]> {
    return this.sessionRepository.findActiveSessionsByUser(userId);
  }
}