// src/main.ts
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import * as cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { join } from 'path';
import { NestExpressApplication } from '@nestjs/platform-express';
import { StrictValidationPipe } from './common/pipes/strict-validation.pipe';
import { initializeMonitoring } from './config/monitoring.config';

async function bootstrap() {
  // Initialize APM monitoring before app creation
  initializeMonitoring();

  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  // Serve static assets from src for Swagger logo, etc.
  app.useStaticAssets(join(__dirname, '..', 'src'));
  const configService = app.get(ConfigService);

  // Security middlewares
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"], // Required for Swagger UI
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"], // Required for Swagger UI
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'"],
        fontSrc: ["'self'", "https:", "data:"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
      },
    },
    crossOriginEmbedderPolicy: false, // Required for Swagger UI
  }));
  app.use(cookieParser());

  // Global validation pipe with enhanced security
  app.useGlobalPipes(new StrictValidationPipe());

  // CORS setup
  app.enableCors({
    origin: ['http://localhost:3000', 'http://localhost:5050', 'https://your-frontend.com'],
    credentials: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type,Authorization,X-CSRF-Token',
    exposedHeaders: 'X-API-Version,X-CSRF-Token',
  });

  // Prefix all routes with /api
  app.setGlobalPrefix('api');

// Swagger/OpenAPI setup
const config = new DocumentBuilder()
  .setTitle('AuthCakes API')
  .setDescription('Enterprise Authentication Platform')
  .setVersion('1.0.0')
  .addServer('http://localhost:5050', 'Local Development')
  .addServer('https://api.authcakes.com', 'Production')
  .addApiKey(
    {
      type: 'apiKey',
      name: 'X-System-API-Key',
      in: 'header',
      description: 'System API key for application-level authentication',
    },
    'SystemApiKey',
  )
  .addBearerAuth(
    {
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
      name: 'X-System-Authorization',
      in: 'header',
      description: 'System JWT token for application-level authentication',
    },
    'SystemJWT',
  )
  .addBearerAuth(
    {
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
      name: 'Authorization',
      description: 'User JWT token for user-level authentication',
    },
    'UserJWT',
  )
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
      padding: 0 0 0 0 !important;
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
      height: 50px;
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

    /* Smooth animations for expand/collapse */
    .swagger-ui .opblock {
      transition: all 0.3s ease-in-out;
    }

    .swagger-ui .opblock.is-open {
      transition: all 0.3s ease-in-out;
    }

    .swagger-ui .opblock-summary {
      transition: all 0.2s ease-in-out;
    }

    /* Remove hover effect from API operation blocks */
    .swagger-ui .opblock-summary:hover {
      background-color: transparent !important;
    }

    .swagger-ui .opblock-body {
      transition: max-height 0.3s ease-in-out, opacity 0.2s ease-in-out;
      overflow: hidden;
    }

    .swagger-ui .opblock:not(.is-open) .opblock-body {
      max-height: 0;
      opacity: 0;
    }

    .swagger-ui .opblock.is-open .opblock-body {
      max-height: none;
      opacity: 1;
    }

    /* Animation for the expand/collapse icon */
    .swagger-ui .opblock-summary-control {
      transition: transform 0.2s ease-in-out;
    }

    .swagger-ui .opblock.is-open .opblock-summary-control {
      transform: rotate(0deg);
    }

    /* Reset models section styling for proper layout */
    .swagger-ui .models {
      display: block !important;
      padding: 0 !important;
      margin: 0 0 10px 0 !important;
    }

    .swagger-ui section.models {
      display: block !important;
      width: 100% !important;
      margin: 0 0 10px 0 !important;
      padding: 0 !important;
      border: 2px solid #053D61 !important;
      border-radius: 4px !important;
      background-color: #fafbfc !important;
      box-sizing: border-box !important;
    }
    
    /* Style for the Schemas button/header */
    .swagger-ui .models-control {
      width: 100% !important;
      min-height: 62px !important;
      display: flex !important;
      justify-content: space-between !important;
      align-items: center !important;
      padding: 0 15px !important;
      margin: 0 !important;
      border: none !important;
      background-color: transparent !important;
      cursor: pointer !important;
      box-sizing: border-box !important;
    }
    
    /* Text styling for Schemas header */
    .swagger-ui .models-control span {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif !important;
      font-weight: 600 !important;
      color: #3b4151 !important;
      font-size: 18px !important;
      margin: 0 !important;
      flex: 1 !important;
      text-align: left !important;
    }

    /* Make Schemas button look and behave exactly like the tag buttons */
    .swagger-ui .models-control {
      background: #fafbfc !important;
      border: 2px solid #053D61 !important;
      border-radius: 4px !important;
      margin: 0 !important;
      padding: 0 15px !important;
      min-height: 62px !important;
      height: 62px !important;
      display: flex !important;
      align-items: center !important;
      justify-content: space-between !important;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif !important;
      font-weight: 600 !important;
      color: #3b4151 !important;
      font-size: 18px !important;
      cursor: pointer !important;
      width: 100% !important;
      box-sizing: border-box !important;
      transition: background 0.2s, border-color 0.2s, color 0.2s;
    }
    /* Remove hover effect on schema section */
    .swagger-ui .models-control:hover,
    .swagger-ui .models-control:focus {
      background: #fafbfc !important;
      border-color: #053D61 !important;
      color: #3b4151 !important;
    }
    .swagger-ui .models-control span {
      flex: 1 1 auto !important;
      text-align: left !important;
    }
    .swagger-ui .models-control svg {
      flex-shrink: 0 !important;
      margin-left: 12px !important;
      transition: transform 0.2s ease-in-out;
      fill: #3b4151 !important;
    }
    /* Rotate arrow when expanded */
    .swagger-ui .models-control[aria-expanded="true"] svg {
      transform: rotate(180deg);
    }
    .swagger-ui .models-control[aria-expanded="false"] svg {
      transform: rotate(0deg);
    }

    /* Ensure Try It Out button is visible and styled */
    .swagger-ui .try-out__btn {
      display: inline-block !important;
      visibility: visible !important;
      opacity: 1 !important;
      background-color: #61affe;
      border: 1px solid #61affe;
      color: #fff;
      padding: 5px 15px;
      border-radius: 4px;
      cursor: pointer;
      transition: all 0.2s ease-in-out;
    }

    .swagger-ui .try-out__btn:hover {
      background-color: #4e90d9;
      border-color: #4e90d9;
    }

    /* Ensure Execute button is also visible */
    .swagger-ui .btn.execute {
      background-color: #4990e2;
      border-color: #4990e2;
      color: #fff;
      transition: all 0.2s ease-in-out;
    }

    .swagger-ui .btn.execute:hover {
      background-color: #357abd;
      border-color: #357abd;
    }

    /* Make sure models section is visible */
    .swagger-ui .models,
    .swagger-ui .model-container,
    .swagger-ui .models-control {
      display: block !important;
      visibility: visible !important;
    }

    /* Reduce padding around authorize button section */
    .swagger-ui .auth-wrapper {
      padding: 10px 0 !important;
      margin: 10px 0 !important;
    }

    .swagger-ui .auth-container {
      padding: 5px !important;
    }

    .swagger-ui .auth-container .auth-btn-wrapper {
      padding: 8px 0 !important;
    }

    @media (max-width: 768px) {
      .swagger-ui {
        padding: 0 16px 60px 16px !important;
      }
      .swagger-ui .topbar {
        padding: 8px 16px;
      }
    }

    /* Fix spacing mismatch on large screens */
    .swagger-ui .topbar {
      padding-left: 0 !important;
    }

    /* Consistent styling for all sections */
    .swagger-ui .opblock-tag {
      border: 2px solid #053D61 !important;
      border-radius: 4px !important;
      margin-bottom: 10px !important;
      background-color: #fafbfc !important;
      transition: all 0.2s ease-in-out;
      padding: 0 15px !important; /* Adjust padding to maintain proper spacing */
      min-height: 62px !important; /* Standard height for all sections */
      height: 62px !important; /* Explicitly set height */
      display: flex !important;
      align-items: center !important;
      justify-content: space-between !important;
      box-sizing: border-box !important;
    }

    /* Remove hover effects from API tag sections */
    .swagger-ui .opblock-tag:hover {
      background-color: transparent !important;
    }
    
    /* Remove hover effects from all API operation methods (GET, POST, etc.) */
    .swagger-ui .opblock .opblock-summary-method:hover {
      background-color: inherit !important;
    }
    
    /* Remove hover color changes from operation blocks */
    .swagger-ui .opblock-get:hover,
    .swagger-ui .opblock-post:hover,
    .swagger-ui .opblock-put:hover,
    .swagger-ui .opblock-patch:hover,
    .swagger-ui .opblock-delete:hover {
      border-color: inherit !important;
    }

    /* Font styling for all section headers */
    .swagger-ui .opblock-tag span,
    .swagger-ui .opblock-tag h3,
    .swagger-ui .opblock-tag h4 {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif !important;
      font-weight: 600 !important;
      color: #3b4151 !important;
      font-size: 18px !important;
      margin: 0 !important;
      flex: 1 !important;
      text-align: left !important;
    }

    /* Position arrows on the right for all sections */
    .swagger-ui .opblock-tag .opblock-summary-control {
      flex-shrink: 0 !important;
      margin-left: 15px !important;
      float: none !important;
    }

    /* Schemas section styling to match others */
    .swagger-ui .models {
      border: 2px solid #053D61 !important;
      border-radius: 4px !important;
      background-color: #fafbfc !important;
      padding: 0px !important;
      margin-top: 0px !important;
      margin-bottom: 10px !important;
      min-height: 62px !important;
      position: relative !important;
    }

    .swagger-ui .models h4 {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif !important;
      font-weight: 600 !important;
      color: #3b4151 !important;
      font-size: 18px !important;
      margin: 0 !important;
      display: flex !important;
      align-items: center !important;
      justify-content: space-between !important;
      min-height: 20px !important;
    }

    /* Fix Schemas arrow positioning */
    .swagger-ui .models-control {
      margin-left: 600px !important;
    }

    /* Add spacing between individual API endpoints */
    .swagger-ui .opblock {
      margin-bottom: 15px !important;
    }

    /* Ensure consistent section spacing */
    .swagger-ui .opblock-tag-section {
      margin-bottom: 10px !important;
    }

    /* Smooth scrolling for better navigation */
    html {
      scroll-behavior: smooth;
    }

    /* Remove flex from .models */
    .swagger-ui .models {
      padding-left: 20px !important;
      padding-right: 20px !important;
    }

    /* Make the header row flex */
    .swagger-ui .models > h4 {
      display: flex !important;
      align-items: center !important;
      justify-content: space-between !important;
      margin: 0 !important;
      font-weight: 600 !important;
      font-size: 18px !important;
      text-align: left !important;
    }

    /* Ensure the arrow stays on the right */
    .swagger-ui .models-control {
      margin-left: 5px !important;
      flex-shrink: 0 !important;
    }

    /* Remove hover effects from Schemas section */
    .swagger-ui .models:hover,
    .swagger-ui .models h4:hover,
    .swagger-ui .models-control:hover {
      background: none !important;
      box-shadow: none !important;
      cursor: default !important;
      color: inherit !important;
    }

    /* Ensure section.models and the Schemas button match the tag containers and buttons exactly */
    .swagger-ui section.models {
      width: 100% !important;
      max-width: 100% !important;
      box-sizing: border-box !important;
      border: none !important;
      background: transparent !important;
      padding: 0 !important;
      margin: 0 0 10px 0 !important;
      box-shadow: none !important;
      display: block !important;
    }
    .swagger-ui .models-control {
      width: 100% !important;
      box-sizing: border-box !important;
      background: #fafbfc !important;
      border: 2px solid #053D61 !important;
      border-radius: 4px !important;
      margin: 0 !important;
      padding: 0 15px !important;
      min-height: 62px !important;
      height: 62px !important;
      display: flex !important;
      align-items: center !important;
      justify-content: space-between !important;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif !important;
      font-weight: 600 !important;
      color: #3b4151 !important;
      font-size: 18px !important;
      cursor: pointer !important;
      transition: background 0.2s, border-color 0.2s, color 0.2s;
    }

    /* Remove horizontal padding from all Swagger UI containers that wrap the models section */
    .swagger-ui .information-container,
    .swagger-ui .main,
    .swagger-ui .models,
    .swagger-ui section.models,
    .swagger-ui .opblock-tag-section {
      padding-left: 0 !important;
      padding-right: 0 !important;
      box-sizing: border-box !important;
    }
    /* Remove any manual margin from .models-control */
    .swagger-ui .models-control {
      margin-left: 0 !important;
      margin-right: 0 !important;
    }

    /* Remove padding/margin from all relevant parent containers to ensure equal width */
    .swagger-ui .opblock-tag-section,
    .swagger-ui .models,
    .swagger-ui section.models,
    .swagger-ui .information-container,
    .swagger-ui .main,
    .swagger-ui .wrapper,
    .swagger-ui .swagger-ui {
      width: 100% !important;
      max-width: 100% !important;
      padding-left: 0 !important;
      padding-right: 0 !important;
      margin-left: 0 !important;
      margin-right: 0 !important;
      box-sizing: border-box !important;
    }

    /* Center all Swagger UI content and set max width */
    .swagger-ui .wrapper,
    .swagger-ui .main,
    .swagger-ui .information-container {
      max-width: 1420px !important;
      margin-left: auto !important;
      margin-right: auto !important;
      padding-left: 24px !important;
      padding-right: 24px !important;
      box-sizing: border-box !important;
    }
    /* Ensure tag sections and schemas section fill the container */
    .swagger-ui .opblock-tag-section,
    .swagger-ui .models,
    .swagger-ui section.models {
      width: 100% !important;
      max-width: 100% !important;
      margin: 0 0 10px 0 !important;
      box-sizing: border-box !important;
    }

    /* COMPLETE OVERHAUL OF SCHEMAS SECTION FOR PROPER DISPLAY */
    
    /* Main schemas container */
    .swagger-ui section.models {
      width: 100% !important;
      margin: 0 0 10px 0 !important;
      padding: 0 !important;
      border: 2px solid #053D61 !important;
      border-radius: 4px !important;
      background-color: #fafbfc !important;
      display: block !important; /* Critical for proper stacking */
      position: relative !important;
      box-sizing: border-box !important;
    }
    
    /* Schemas button/header styling */
    .swagger-ui .models-control {
      width: 100% !important;
      min-height: 62px !important;
      height: 62px !important;
      padding: 0 15px !important;
      margin: 0 !important;
      border: none !important;
      display: flex !important;
      justify-content: space-between !important;
      align-items: center !important;
      background-color: transparent !important;
      cursor: pointer !important;
      box-sizing: border-box !important;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif !important;
      font-weight: 600 !important;
      color: #3b4151 !important;
      font-size: 18px !important;
      transition: background 0.2s, color 0.2s !important;
    }
    
    /* Schemas button text */
    .swagger-ui .models-control span {
      flex: 1 !important;
      text-align: left !important;
    }
    
    /* Schemas button arrow icon */
    .swagger-ui .models-control svg {
      transition: transform 0.3s !important;
    }
    
    /* Rotate arrow when expanded */
    .swagger-ui .models-control[aria-expanded="true"] svg {
      transform: rotate(180deg) !important;
    }
    
    /* Models wrapper - container for all schema items */
    .swagger-ui .models-wrap {
      width: 100% !important;
      padding: 20px 0 0 0 !important; /* Match the 20px spacing used between model containers */
      margin: 0 !important;
      display: block !important;
      box-sizing: border-box !important;
    }
    
    /* Individual model container - add spacing and visual separation */
    .swagger-ui .model-container {
      width: 100% !important;
      padding: 15px 20px !important;
      margin: 0 0 20px 0 !important; /* Increase bottom margin to match spacing between other sections */
      border-top: 1px solid rgba(59, 65, 81, 0.1) !important;
      border-bottom: 1px solid rgba(59, 65, 81, 0.1) !important;
      box-sizing: border-box !important;
      display: block !important;
      background-color: #fff !important;
      border-radius: 3px !important;
    }
    
    /* Restore auto-expand functionality for schema items */
    .swagger-ui .model-box {
      padding: 10px 0 !important;
      cursor: pointer !important;
    }
    
    /* Style model title for better visibility */
    .swagger-ui .model-title {
      font-size: 16px !important;
      font-weight: 600 !important;
      margin: 5px 0 !important;
    }
    
    /* Ensure schema item expansion works properly */
    .swagger-ui .model-toggle {
      cursor: pointer !important;
      display: inline-block !important;
    }
    
    /* Space between different schema sections */
    .swagger-ui .model {
      margin-bottom: 10px !important;
    }
    
    /* Remove any legacy positioning that could cause shifting */
    .swagger-ui .models,
    .swagger-ui .models-wrap,
    .swagger-ui .model-container,
    .swagger-ui .model,
    .swagger-ui .model-box {
      position: static !important;
      left: auto !important;
      right: auto !important;
      float: none !important;
      clear: both !important;
    }
    
    /* Remove potential interference from flex layouts */
    .swagger-ui section.models .models,
    .swagger-ui section.models .models-wrap {
      display: block !important;
      flex: none !important;
      flex-direction: initial !important;
      align-items: initial !important;
      justify-content: initial !important;
    }
    
    /* Ensure models are visible with proper stacking */
    .swagger-ui section.models.is-open {
      padding-bottom: 0 !important;
    }
    
    /* Ensure consistent section height with no hover effect */
    .swagger-ui section.models {
      min-height: 62px !important;
      height: auto !important;
    }
    
    /* Remove hover effect */
    .swagger-ui .models-control:hover {
      background-color: transparent !important;
    }

    /* Ensure server selector is visible */
    .swagger-ui .scheme-container {
      display: block !important;
      margin: 10px 0 !important;
      padding: 10px !important;
      background: #f7f7f7 !important;
      border-radius: 4px !important;
    }

    .swagger-ui .servers {
      display: block !important;
    }

    .swagger-ui .servers-title {
      display: inline-block !important;
      margin-right: 10px !important;
      font-weight: 600 !important;
    }

    .swagger-ui .servers select {
      padding: 5px 10px !important;
      border: 1px solid #ddd !important;
      border-radius: 4px !important;
      font-size: 14px !important;
    }
  `,
  swaggerOptions: {
    docExpansion: 'none',
    defaultModelsExpandDepth: 2,
    displayRequestDuration: true,
    tryItOutEnabled: true,
    tagsSorter: 'alpha',
    operationsSorter: 'alpha',
    showExtensions: true,
    showCommonExtensions: true,
    defaultModelExpandDepth: 2,
    defaultModelRendering: 'example',
    deepLinking: true,
    servers: [
      { url: 'http://localhost:5050', description: 'Local Development' },
      { url: 'https://api.authcakes.com', description: 'Production' }
    ],
    persistAuthorization: true,
    requestSnippetsEnabled: true,
    requestSnippets: {
      generators: {
        'curl_bash': {
          title: 'cURL (bash)',
          syntax: 'bash',
        },
        'curl_powershell': {
          title: 'cURL (PowerShell)',
          syntax: 'powershell',
        },
        'curl_cmd': {
          title: 'cURL (CMD)',
          syntax: 'bash',
        },
        'node_native': {
          title: 'Node.js (Native)',
          syntax: 'javascript',
        },
        'node_axios': {
          title: 'Node.js (Axios)',
          syntax: 'javascript',
        },
        'javascript_fetch': {
          title: 'JavaScript (Fetch)',
          syntax: 'javascript',
        },
        'python_requests': {
          title: 'Python (Requests)',
          syntax: 'python',
        },
      },
      defaultExpanded: true,
      languages: ['bash', 'powershell', 'cmd', 'javascript', 'python'],
    },
    syntaxHighlight: {
      activate: true,
      theme: 'monokai',
    },
  },
}); // Swagger UI at /api/docs

  const port = configService.get<number>('app.port') || 5050;
  await app.listen(port);
  console.log(`✅ Application is running on: http://localhost:${port}/api`);
  console.log(
    `📖 Swagger UI is available at: http://localhost:${port}/api/docs`,
  );
}
bootstrap();
