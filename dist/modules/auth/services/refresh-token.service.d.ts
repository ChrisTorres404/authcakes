import { RefreshToken } from '../entities/refresh-token.entity';
import { RefreshTokenRepository } from '../repositories/refresh-token.repository';
import { CreateRefreshTokenDto } from '../dto/create-refresh-token.dto';
import { RevokeRefreshTokenDto } from '../dto/revoke-refresh-token.dto';
export declare class RefreshTokenService {
    private readonly refreshTokenRepository;
    constructor(refreshTokenRepository: RefreshTokenRepository);
    createRefreshToken(dto: CreateRefreshTokenDto): Promise<RefreshToken>;
    revokeRefreshToken(dto: RevokeRefreshTokenDto): Promise<void>;
    listUserRefreshTokens(userId: string): Promise<RefreshToken[]>;
}
