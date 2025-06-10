import { AppService } from './app.service';
import { ApiInfoDto } from './dto/api-info.dto';
import { HealthCheckDto } from './dto/health-check.dto';
import { Request } from 'express';
export declare class AppController {
    private readonly appService;
    constructor(appService: AppService);
    getHello(): string;
    healthCheck(): HealthCheckDto;
    getApiInfo(): ApiInfoDto;
    testSystemAuth(req: Request & {
        system?: any;
    }): any;
    testSystemAndUserAuth(req: Request & {
        system?: any;
        user?: any;
    }): any;
}
