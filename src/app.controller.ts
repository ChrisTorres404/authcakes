import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { SkipThrottle } from '@nestjs/throttler';
import { Public } from './common/decorators/public.decorator';
import { ApiResponseWithData } from './common/decorators/swagger-generic-response.decorator';
import { ApiInfoDto } from './dto/api-info.dto';
import { HealthCheckDto } from './dto/health-check.dto';
import { ApiResponseDto } from './modules/tenants/dto/api-response.dto';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Public()
  @SkipThrottle()
  @Get('health')
  @ApiResponseWithData(HealthCheckDto)
  healthCheck(): ApiResponseDto<HealthCheckDto> {
    return {
      success: true,
      data: {
        status: 'ok',
        timestamp: new Date().toISOString(),
      },
    };
  }

  @Public()
  @SkipThrottle()
  @Get('api')
  @ApiResponseWithData(ApiInfoDto)
  getApiInfo(): ApiResponseDto<ApiInfoDto> {
    return {
      success: true,
      data: {
        name: 'AuthCakes API',
        version: '1.0.0',
        status: 'ok',
        timestamp: new Date().toISOString(),
      },
    };
  }
}
