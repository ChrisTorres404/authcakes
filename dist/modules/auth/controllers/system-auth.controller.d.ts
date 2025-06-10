import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { SystemTokenDto } from '../dto/system-token.dto';
import { SystemTokenResponseDto } from '../dto/system-token-response.dto';
export declare class SystemAuthController {
    private readonly configService;
    private readonly jwtService;
    constructor(configService: ConfigService, jwtService: JwtService);
    generateSystemToken(dto: SystemTokenDto): Promise<SystemTokenResponseDto>;
    validateSystemToken(dto: {
        token: string;
    }): Promise<{
        valid: boolean;
        clientId?: string;
        expiresAt?: Date;
    }>;
    private hashApiKey;
}
