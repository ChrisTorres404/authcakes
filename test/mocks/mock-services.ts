export const mockUsersService = () => ({
  findById: jest.fn(),
  findByEmail: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  findAll: jest.fn(),
  updatePassword: jest.fn(),
  verifyEmail: jest.fn(),
  updateLastLogin: jest.fn(),
});

export const mockTokenService = () => ({
  generateTokens: jest.fn(),
  generateAccessToken: jest.fn(),
  generateRefreshToken: jest.fn(),
  verifyAccessToken: jest.fn(),
  verifyRefreshToken: jest.fn(),
  revokeRefreshToken: jest.fn(),
  revokeSession: jest.fn(),
  revokeAllUserTokens: jest.fn(),
  cleanupExpiredTokens: jest.fn(),
  saveRefreshToken: jest.fn(),
});

export const mockSessionService = () => ({
  create: jest.fn(),
  findById: jest.fn(),
  findActiveByUser: jest.fn(),
  findByToken: jest.fn(),
  update: jest.fn(),
  revoke: jest.fn(),
  revokeAllUserSessions: jest.fn(),
  cleanupExpiredSessions: jest.fn(),
  updateLastActivity: jest.fn(),
});

export const mockAuthService = () => ({
  validateUser: jest.fn(),
  login: jest.fn(),
  logout: jest.fn(),
  register: jest.fn(),
  refresh: jest.fn(),
  changePassword: jest.fn(),
  forgotPassword: jest.fn(),
  resetPassword: jest.fn(),
  verifyEmail: jest.fn(),
  requestAccountRecovery: jest.fn(),
  completeAccountRecovery: jest.fn(),
});

export const mockNotificationService = () => ({
  sendEmail: jest.fn(),
  sendSms: jest.fn(),
  sendVerificationEmail: jest.fn(),
  sendPasswordResetEmail: jest.fn(),
  sendWelcomeEmail: jest.fn(),
  sendLoginNotification: jest.fn(),
  sendPasswordChangeNotification: jest.fn(),
});

export const mockAuditLogService = () => ({
  log: jest.fn(),
  logUserLogin: jest.fn(),
  logUserLogout: jest.fn(),
  logPasswordChange: jest.fn(),
  logAccountRecovery: jest.fn(),
  logMfaEnabled: jest.fn(),
  logMfaDisabled: jest.fn(),
  getUserAuditLogs: jest.fn(),
});

export const mockPasswordHistoryService = () => ({
  addPassword: jest.fn(),
  isPasswordReused: jest.fn(),
  getPasswordHistory: jest.fn(),
  cleanupOldPasswords: jest.fn(),
});

export const mockRepository = <T>() => ({
  find: jest.fn(),
  findOne: jest.fn(),
  findOneBy: jest.fn(),
  findAndCount: jest.fn(),
  save: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  remove: jest.fn(),
  count: jest.fn(),
  createQueryBuilder: jest.fn(() => ({
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orWhere: jest.fn().mockReturnThis(),
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    innerJoinAndSelect: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    getOne: jest.fn(),
    getMany: jest.fn(),
    getManyAndCount: jest.fn(),
    getCount: jest.fn(),
    getRawOne: jest.fn(),
    getRawMany: jest.fn(),
    execute: jest.fn(),
  })),
});