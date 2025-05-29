import { EntityRepository, Repository, MoreThan } from 'typeorm';
import { Session } from '../entities/session.entity';

@EntityRepository(Session)
export class SessionRepository extends Repository<Session> {
  async findActiveSessionsByUser(userId: string) {
    return this.find({
      where: {
        user: { id: userId },
        isActive: true,
        revoked: false,
        expiresAt: MoreThan(new Date()),
      },
    });
  }
}
