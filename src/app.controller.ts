import { Controller, Get, Req } from '@nestjs/common';
import { AppService } from './app.service';
import { SkipThrottle } from '@nestjs/throttler';
import { Public } from './common/decorators/public.decorator';
import { ApiResponseWithData } from './common/decorators/swagger-generic-response.decorator';
import { ApiInfoDto } from './dto/api-info.dto';
import { HealthCheckDto } from './dto/health-check.dto';
import { ApiResponseDto } from './modules/tenants/dto/api-response.dto';
import { SystemAuth, SystemAndUserAuth } from './common/decorators/system-auth.decorator';
import { Request } from 'express';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

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

  @SystemAuth()
  @Get('test/system-auth')
  @ApiTags('System Auth Test')
  @ApiOperation({ 
    summary: 'Test system authentication',
    description: 'Requires system API key or JWT. Use X-System-API-Key header or X-System-Authorization header.'
  })
  testSystemAuth(@Req() req: Request & { system?: any }): any {
    return {
      success: true,
      message: 'System authentication successful',
      system: req.system,
      timestamp: new Date().toISOString(),
    };
  }

  @SystemAndUserAuth()
  @Get('test/system-and-user-auth')
  @ApiTags('System Auth Test')
  @ApiOperation({ 
    summary: 'Test system and user authentication',
    description: 'Requires both system authentication (API key or JWT) and user JWT token.'
  })
  testSystemAndUserAuth(@Req() req: Request & { system?: any; user?: any }): any {
    return {
      success: true,
      message: 'System and user authentication successful',
      system: req.system,
      user: {
        id: req.user?.id,
        email: req.user?.email,
        role: req.user?.role,
      },
      timestamp: new Date().toISOString(),
    };
  }
}
