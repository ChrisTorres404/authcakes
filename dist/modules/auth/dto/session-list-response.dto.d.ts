declare class SessionDto {
    id: string;
    createdAt: string;
    deviceInfo: any;
    lastUsedAt: string;
}
export declare class SessionListResponseDto {
    sessions: SessionDto[];
}
export {};
