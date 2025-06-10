"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const typeorm_1 = require("@nestjs/typeorm");
const throttler_1 = require("@nestjs/throttler");
const throttler_2 = require("@nestjs/throttler");
const core_1 = require("@nestjs/core");
const jwt_1 = require("@nestjs/jwt");
const app_controller_1 = require("./app.controller");
const app_service_1 = require("./app.service");
const app_config_1 = require("./config/app.config");
const auth_config_1 = require("./config/auth.config");
const database_config_1 = require("./config/database.config");
const throttler_config_1 = require("./config/throttler.config");
const system_config_1 = require("./config/system.config");
const validation_schema_1 = require("./config/validation.schema");
const auth_module_1 = require("./modules/auth/auth.module");
const users_module_1 = require("./modules/users/users.module");
const tenants_module_1 = require("./modules/tenants/tenants.module");
const database_module_1 = require("./modules/database/database.module");
const core_2 = require("@nestjs/core");
const jwt_auth_guard_1 = require("./modules/auth/guards/jwt-auth.guard");
const tenant_context_interceptor_1 = require("./common/interceptors/tenant-context.interceptor");
const all_exceptions_filter_1 = require("./common/filters/all-exceptions.filter");
const roles_guard_1 = require("./common/guards/roles.guard");
const logging_middleware_1 = require("./common/middleware/logging.middleware");
const security_headers_middleware_1 = require("./common/middleware/security-headers.middleware");
const csrf_middleware_1 = require("./common/middleware/csrf.middleware");
const api_version_middleware_1 = require("./common/middleware/api-version.middleware");
const performance_interceptor_1 = require("./common/interceptors/performance.interceptor");
const transform_response_interceptor_1 = require("./common/interceptors/transform-response.interceptor");
let AppModule = class AppModule {
    configure(consumer) {
        consumer
            .apply(security_headers_middleware_1.SecurityHeadersMiddleware)
            .forRoutes('*')
            .apply(api_version_middleware_1.ApiVersionMiddleware)
            .forRoutes('*')
            .apply(logging_middleware_1.LoggingMiddleware)
            .forRoutes('*')
            .apply(csrf_middleware_1.CsrfMiddleware)
            .exclude({ path: 'api/v1/auth/login', method: common_1.RequestMethod.POST }, { path: 'api/v1/auth/register', method: common_1.RequestMethod.POST }, { path: 'api/v1/auth/refresh', method: common_1.RequestMethod.POST }, { path: 'api/health', method: common_1.RequestMethod.GET }, { path: 'api/docs', method: common_1.RequestMethod.GET })
            .forRoutes('*');
    }
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                load: [app_config_1.default, auth_config_1.default, database_config_1.default, throttler_config_1.default, system_config_1.default],
                validationSchema: validation_schema_1.validationSchema,
                validationOptions: {
                    allowUnknown: true,
                    abortEarly: true,
                },
            }),
            typeorm_1.TypeOrmModule.forRootAsync({
                imports: [config_1.ConfigModule],
                inject: [config_1.ConfigService],
                useFactory: (configService) => ({
                    type: 'postgres',
                    host: configService.get('database.host'),
                    port: configService.get('database.port'),
                    username: configService.get('database.username'),
                    password: configService.get('database.password'),
                    database: configService.get('database.name'),
                    entities: [__dirname + '/**/*.entity{.ts,.js}'],
                    synchronize: configService.get('database.synchronize'),
                    logging: configService.get('database.logging'),
                }),
            }),
            throttler_1.ThrottlerModule.forRootAsync({
                imports: [config_1.ConfigModule],
                inject: [config_1.ConfigService],
                useFactory: (configService) => ({
                    throttlers: [
                        {
                            name: 'default',
                            ttl: configService.get('throttler.default.ttl', 60),
                            limit: configService.get('throttler.default.limit', 100),
                        },
                    ],
                    storage: undefined,
                    skipIf: (context) => {
                        if (process.env.NODE_ENV === 'test' ||
                            process.env.THROTTLE_SKIP === 'true') {
                            return true;
                        }
                        const request = context.switchToHttp().getRequest();
                        return request.url === '/api/health';
                    },
                }),
            }),
            jwt_1.JwtModule.register({
                global: true,
                secret: process.env.SYSTEM_JWT_SECRET || 'system-jwt-secret',
            }),
            auth_module_1.AuthModule,
            users_module_1.UsersModule,
            tenants_module_1.TenantsModule,
            database_module_1.DatabaseModule,
        ],
        controllers: [app_controller_1.AppController],
        providers: [
            app_service_1.AppService,
            {
                provide: core_2.APP_GUARD,
                useClass: throttler_2.ThrottlerGuard,
            },
            {
                provide: core_2.APP_GUARD,
                useClass: jwt_auth_guard_1.JwtAuthGuard,
            },
            {
                provide: core_2.APP_GUARD,
                useClass: roles_guard_1.RolesGuard,
            },
            core_1.Reflector,
            {
                provide: core_2.APP_INTERCEPTOR,
                useClass: common_1.ClassSerializerInterceptor,
            },
            {
                provide: core_2.APP_INTERCEPTOR,
                useClass: transform_response_interceptor_1.TransformResponseInterceptor,
            },
            {
                provide: core_2.APP_INTERCEPTOR,
                useClass: tenant_context_interceptor_1.TenantContextInterceptor,
            },
            {
                provide: core_2.APP_INTERCEPTOR,
                useClass: performance_interceptor_1.PerformanceInterceptor,
            },
            {
                provide: core_2.APP_FILTER,
                useClass: all_exceptions_filter_1.AllExceptionsFilter,
            },
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map