import { ConfigService } from '@nestjs/config';
import { Session } from '../entities/session.entity';
import { SettingsService } from '../../settings/services/settings.service';
import { SessionRepository } from '../repositories/session.repository';
import { CreateSessionDto } from '../dto/create-session.dto';
import { RevokeSessionDto } from '../dto/revoke-session.dto';
import { DeviceInfo } from '../interfaces/auth.interfaces';
interface AuditEvent {
    type: string;
    userId?: string;
    sessionId?: string;
    metadata?: Record<string, unknown>;
    timestamp?: Date;
}
export declare class SessionService {
    private readonly sessionRepository;
    private configService;
    private settingsService;
    private readonly logger;
    constructor(sessionRepository: SessionRepository, configService: ConfigService, settingsService: SettingsService);
    createSession(dto: CreateSessionDto): Promise<Session>;
    getSessionById(sessionId: string): Promise<Session | null>;
    isSessionValid(userId: string, sessionId: string): Promise<boolean>;
    updateSessionActivity(sessionId: string): Promise<void>;
    getSessionRemainingTime(sessionId: string): Promise<number>;
    getActiveSessions(userId: string): Promise<Session[]>;
    revokeSession(dto: RevokeSessionDto): Promise<void>;
    revokeAllUserSessions(userId: string, exceptSessionId?: string): Promise<void>;
    protected checkCustomSessionPolicy(userId: string, deviceInfo: DeviceInfo): Promise<void>;
    protected logAuditEvent(event: AuditEvent): void;
    listActiveSessions(userId: string): Promise<Session[]>;
}
export {};
