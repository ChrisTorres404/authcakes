import { RefreshTokenService } from '../services/refresh-token.service';
import { CreateRefreshTokenDto } from '../dto/create-refresh-token.dto';
import { RevokeRefreshTokenDto } from '../dto/revoke-refresh-token.dto';
import { RefreshToken } from '../entities/refresh-token.entity';
export declare class RefreshTokenController {
    private readonly refreshTokenService;
    constructor(refreshTokenService: RefreshTokenService);
    create(dto: CreateRefreshTokenDto): Promise<RefreshToken>;
    revoke(dto: RevokeRefreshTokenDto): Promise<void>;
    listUserTokens(userId: string): Promise<RefreshToken[]>;
}
