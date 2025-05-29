import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { PasswordHistory } from '../entities/password-history.entity';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class PasswordHistoryService {
  private readonly logger = new Logger(PasswordHistoryService.name);

  constructor(
    @InjectRepository(PasswordHistory)
    private readonly passwordHistoryRepository: Repository<PasswordHistory>,
  ) {}

  /**
   * Add a password hash to a user's password history
   * @param userId The user ID
   * @param passwordHash The hashed password to add to history
   */
  async addToHistory(userId: string, passwordHash: string): Promise<void> {
    this.logger.debug(`Adding password to history for user ${userId}`);

    // Create a new password history entry
    await this.passwordHistoryRepository.save({
      userId,
      passwordHash,
      createdAt: new Date(),
    });
  }

  /**
   * Check if a password exists in the user's password history
   * @param userId The user ID
   * @param newPassword The plaintext password to check
   * @param historyCount Number of passwords to check in history
   * @returns Boolean indicating if password exists in history
   */
  async isPasswordInHistory(
    userId: string,
    newPassword: string,
    historyCount = 5,
  ): Promise<boolean> {
    this.logger.debug(
      `Checking if password exists in history for user ${userId}`,
    );

    // Get the most recent password history entries for the user
    const passwordHistory = await this.passwordHistoryRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: historyCount,
    });

    if (!passwordHistory.length) {
      return false;
    }

    // Check if the new password matches any of the stored password hashes
    for (const entry of passwordHistory) {
      const isMatch = await bcrypt.compare(newPassword, entry.passwordHash);
      if (isMatch) {
        this.logger.debug(`Password exists in history for user ${userId}`);
        return true;
      }
    }

    return false;
  }

  /**
   * Prune old password history entries, keeping only the most recent entries
   * @param userId The user ID
   * @param keepCount Number of recent passwords to keep
   */
  async pruneHistory(userId: string, keepCount: number): Promise<void> {
    this.logger.debug(
      `Pruning password history for user ${userId}, keeping ${keepCount}`,
    );

    // Find the timestamp of the Nth most recent entry
    const entries = await this.passwordHistoryRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      skip: keepCount,
      take: 1,
    });

    if (entries.length === 0) {
      return; // No entries to prune
    }

    const cutoffDate = entries[0].createdAt;

    // Delete all entries older than the cutoff date
    await this.passwordHistoryRepository.delete({
      userId,
      createdAt: LessThan(cutoffDate),
    });
  }
}
