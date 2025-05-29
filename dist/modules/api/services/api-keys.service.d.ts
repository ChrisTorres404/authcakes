import { Repository } from 'typeorm';
import { ApiKey } from '../entities/api-key.entity';
export declare class ApiKeysService {
    private apiKeysRepository;
    private readonly logger;
    constructor(apiKeysRepository: Repository<ApiKey>);
    create(userId: string, tenantId: string | undefined, name: string, permissions?: Record<string, unknown>): Promise<ApiKey>;
    findAll(userId: string, tenantId?: string): Promise<ApiKey[]>;
    findOne(id: string, userId: string): Promise<ApiKey>;
    findByKey(key: string): Promise<ApiKey | null>;
    update(id: string, userId: string, updates: Partial<ApiKey>): Promise<ApiKey>;
    revoke(id: string, userId: string): Promise<ApiKey>;
    delete(id: string, userId: string): Promise<ApiKey>;
    private generateApiKey;
    validatePermissions(key: string, requiredPermissions: string[]): Promise<boolean>;
}
