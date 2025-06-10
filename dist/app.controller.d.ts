import { AppService } from './app.service';
import { ApiInfoDto } from './dto/api-info.dto';
import { HealthCheckDto } from './dto/health-check.dto';
import { ApiResponseDto } from './modules/tenants/dto/api-response.dto';
import { Request } from 'express';
export declare class AppController {
    private readonly appService;
    constructor(appService: AppService);
    getHello(): string;
    healthCheck(): ApiResponseDto<HealthCheckDto>;
    getApiInfo(): ApiResponseDto<ApiInfoDto>;
    testSystemAuth(req: Request & {
        system?: any;
    }): any;
    testSystemAndUserAuth(req: Request & {
        system?: any;
        user?: any;
    }): any;
}
