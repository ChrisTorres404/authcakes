import { AppService } from './app.service';
import { ApiInfoDto } from './dto/api-info.dto';
import { HealthCheckDto } from './dto/health-check.dto';
import { ApiResponseDto } from './modules/tenants/dto/api-response.dto';
export declare class AppController {
    private readonly appService;
    constructor(appService: AppService);
    getHello(): string;
    healthCheck(): ApiResponseDto<HealthCheckDto>;
    getApiInfo(): ApiResponseDto<ApiInfoDto>;
}
