import { ApiKeysService } from '../services/api-keys.service';
export declare class ApiKeysController {
    private readonly apiKeysService;
    constructor(apiKeysService: ApiKeysService);
    create(req: any, createApiKeyDto: any): Promise<import("../entities/api-key.entity").ApiKey>;
    findAll(req: any): Promise<import("../entities/api-key.entity").ApiKey[]>;
    findOne(id: string, req: any): Promise<import("../entities/api-key.entity").ApiKey>;
    update(id: string, req: any, updateApiKeyDto: any): Promise<import("../entities/api-key.entity").ApiKey>;
    remove(id: string, req: any): Promise<void>;
    revoke(id: string, req: any): Promise<void>;
    permanentDelete(id: string, req: any): Promise<void>;
}
