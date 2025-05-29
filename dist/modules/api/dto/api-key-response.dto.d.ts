export declare class ApiKeyResponseDto {
    id: string;
    userId: string;
    tenantId?: string;
    name: string;
    key?: string;
    permissions: Record<string, unknown>;
    expiresAt?: Date;
    active: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export declare class ApiKeyListResponseDto {
    apiKeys: ApiKeyResponseDto[];
}
