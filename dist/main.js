"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const cookieParser = require("cookie-parser");
const app_module_1 = require("./app.module");
const swagger_1 = require("@nestjs/swagger");
const path_1 = require("path");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.useStaticAssets((0, path_1.join)(__dirname, '..', 'src'));
    const configService = app.get(config_1.ConfigService);
    app.use(cookieParser());
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
    }));
    app.enableCors({
        origin: ['http://localhost:3000', 'https://your-frontend.com'],
        credentials: true,
        methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
        allowedHeaders: 'Content-Type,Authorization',
    });
    app.setGlobalPrefix('api');
    const config = new swagger_1.DocumentBuilder()
        .setTitle('AuthCakes API')
        .setDescription('API documentation for AuthCakes multi-tenant system')
        .setVersion('1.0')
        .addBearerAuth()
        .build();
    const document = swagger_1.SwaggerModule.createDocument(app, config);
    swagger_1.SwaggerModule.setup('api/docs', app, document, {
        customSiteTitle: 'AuthCakes Developer Docs',
        customfavIcon: '/favicon.ico',
        customCss: `
      html, body {
        margin: 0;
        padding: 0;
      }

      .swagger-ui {
        max-width: none !important;
        margin: 0 !important;
        padding: 0 !important;
      }

      .swagger-ui .topbar {
        background-color: #1e1e1e;
        padding: 8px 32px;
        display: flex;
        align-items: center;
        justify-content: flex-start;
      }

      .swagger-ui .topbar-wrapper > a,
      .swagger-ui .topbar-wrapper span,
      .swagger-ui .topbar-wrapper img,
      .swagger-ui .topbar-wrapper a[href*="swagger.io"],
      .swagger-ui .topbar-wrapper a[href*="smartbear.com"],
      .swagger-ui .topbar-wrapper .link span {
        display: none !important;
      }

      .swagger-ui .topbar-wrapper::before {
        content: '';
        display: inline-block;
        background-image: url('/AC_Icon_Name_centered.png');
        background-size: contain;
        background-repeat: no-repeat;
        height: 40px;
        width: 180px;
      }

      .swagger-ui .info {
        margin: 20px 0 5px 0 !important;
        padding: 0 !important;
      }

      .swagger-ui .info hgroup,
      .swagger-ui .info h1.title,
      .swagger-ui .info p {
        margin: 0 !important;
        padding: 0 !important;
      }

      @media (max-width: 768px) {
        .swagger-ui {
          padding: 0 16px;
        }
        .swagger-ui .topbar {
          padding: 8px 16px;
        }
      }

      /* Fix spacing mismatch on large screens */
      .swagger-ui .topbar {
        padding-left: 0 !important;
      }
    `,
        swaggerOptions: {
            docExpansion: 'none',
            defaultModelsExpandDepth: -1,
            displayRequestDuration: true,
            tryItOutEnabled: true,
            tagsSorter: 'alpha',
        },
    });
    const port = configService.get('app.port') || 5050;
    await app.listen(port);
    console.log(`✅ Application is running on: http://localhost:${port}/api`);
    console.log(`📖 Swagger UI is available at: http://localhost:${port}/api/docs`);
}
bootstrap();
//# sourceMappingURL=main.js.map