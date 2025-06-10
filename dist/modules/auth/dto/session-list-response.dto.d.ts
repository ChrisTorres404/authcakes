declare class DeviceInfoDto {
    ip?: string;
    userAgent?: string;
    type?: string;
    platform?: string;
    browser?: string;
    version?: string;
}
declare class SessionDto {
    id: string;
    createdAt: string;
    deviceInfo: DeviceInfoDto;
    lastUsedAt: string;
}
export declare class SessionListResponseDto {
    sessions: SessionDto[];
}
export {};
