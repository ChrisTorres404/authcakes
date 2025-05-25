import { SessionService } from '../services/session.service';
import { CreateSessionDto } from '../dto/create-session.dto';
import { RevokeSessionDto } from '../dto/revoke-session.dto';
export declare class SessionController {
    private readonly sessionService;
    constructor(sessionService: SessionService);
    create(dto: CreateSessionDto): Promise<import("../entities/session.entity").Session>;
    revoke(dto: RevokeSessionDto): Promise<void>;
    listActive(userId: string): Promise<import("../entities/session.entity").Session[]>;
}
