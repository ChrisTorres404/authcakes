import { RefreshTokenService } from '../services/refresh-token.service';
import { CreateRefreshTokenDto } from '../dto/create-refresh-token.dto';
import { RevokeRefreshTokenDto } from '../dto/revoke-refresh-token.dto';
export declare class RefreshTokenController {
    private readonly refreshTokenService;
    constructor(refreshTokenService: RefreshTokenService);
    create(dto: CreateRefreshTokenDto): Promise<import("../entities/refresh-token.entity").RefreshToken>;
    revoke(dto: RevokeRefreshTokenDto): Promise<void>;
    listUserTokens(userId: string): Promise<import("../entities/refresh-token.entity").RefreshToken[]>;
}
