import { CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
export declare class SystemAuthGuard implements CanActivate {
    private reflector;
    private configService;
    private jwtService;
    constructor(reflector: Reflector, configService: ConfigService, jwtService: JwtService);
    canActivate(context: ExecutionContext): Promise<boolean>;
    private hashApiKey;
}
