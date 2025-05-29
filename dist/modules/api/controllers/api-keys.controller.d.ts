import { Request as ExpressRequest } from 'express';
import { ApiKeysService } from '../services/api-keys.service';
import { CreateApiKeyDto } from '../dto/create-api-key.dto';
import { UpdateApiKeyDto } from '../dto/update-api-key.dto';
import { ApiKeyResponseDto, ApiKeyListResponseDto } from '../dto/api-key-response.dto';
import { User } from '../../users/entities/user.entity';
interface RequestWithUser extends ExpressRequest {
    user: User & {
        id: string;
        tenantId?: string;
        role?: string;
    };
}
export declare class ApiKeysController {
    private readonly apiKeysService;
    private readonly logger;
    constructor(apiKeysService: ApiKeysService);
    create(req: RequestWithUser, createApiKeyDto: CreateApiKeyDto): Promise<ApiKeyResponseDto>;
    findAll(req: RequestWithUser): Promise<ApiKeyListResponseDto>;
    findOne(id: string, req: RequestWithUser): Promise<ApiKeyResponseDto>;
    update(id: string, req: RequestWithUser, updateApiKeyDto: UpdateApiKeyDto): Promise<ApiKeyResponseDto>;
    remove(id: string, req: RequestWithUser): Promise<ApiKeyResponseDto>;
    revoke(id: string, req: RequestWithUser): Promise<ApiKeyResponseDto>;
    permanentDelete(id: string, req: RequestWithUser): Promise<ApiKeyResponseDto>;
}
export {};
