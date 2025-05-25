import { Repository } from 'typeorm';
import { Session } from '../entities/session.entity';
export declare class SessionRepository extends Repository<Session> {
    findActiveSessionsByUser(userId: string): Promise<Session[]>;
}
