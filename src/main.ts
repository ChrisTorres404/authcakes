// src/main.ts
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as cookieParser from 'cookie-parser';
// import helmet from 'helmet';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { join } from 'path';
import { NestExpressApplication } from '@nestjs/platform-express';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  // Serve static assets from src for Swagger logo, etc.
  app.useStaticAssets(join(__dirname, '..', 'src'));
  const configService = app.get(ConfigService);

  // Security middlewares
  // app.use(helmet()); // Disabled for E2E debug
  app.use(cookieParser());

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // CORS setup
  app.enableCors({
    origin: ['http://localhost:3000', 'https://your-frontend.com'],
    credentials: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    allowedHeaders: 'Content-Type,Authorization',
  });

  // Prefix all routes with /api
  app.setGlobalPrefix('api');

  // Swagger/OpenAPI setup
  const config = new DocumentBuilder()
    .setTitle('AuthCakes API')
    .setDescription('API documentation for AuthCakes multi-tenant system')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
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
  }); // Swagger UI at /api/docs

  const port = configService.get<number>('app.port') || 5050;
  await app.listen(port);
  console.log(`✅ Application is running on: http://localhost:${port}/api`);
  console.log(`📖 Swagger UI is available at: http://localhost:${port}/api/docs`);
}
bootstrap();