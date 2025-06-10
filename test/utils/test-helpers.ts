import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { DataSource } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { User } from '../../src/modules/users/entities/user.entity';

export interface TestContext {
  module: TestingModule;
  dataSource: DataSource;
}

export async function createTestingModule(
  imports: any[] = [],
  providers: any[] = [],
): Promise<TestContext> {
  const module = await Test.createTestingModule({
    imports: [
      ConfigModule.forRoot({
        isGlobal: true,
        envFilePath: '.env.test',
      }),
      TypeOrmModule.forRoot({
        type: 'sqlite',
        database: ':memory:',
        entities: [__dirname + '/../../src/**/*.entity{.ts,.js}'],
        synchronize: true,
        logging: false,
      }),
      ...imports,
    ],
    providers: [...providers],
  }).compile();

  const dataSource = module.get<DataSource>(DataSource);
  
  return { module, dataSource };
}

export async function cleanupDatabase(dataSource: DataSource): Promise<void> {
  const entities = dataSource.entityMetadatas;
  
  for (const entity of entities) {
    const repository = dataSource.getRepository(entity.name);
    await repository.clear();
  }
}

export function generateTestJwtToken(
  jwtService: JwtService,
  payload: any,
  expiresIn: string = '15m',
): string {
  return jwtService.sign(payload, { expiresIn });
}

export function createMockRequest(overrides?: any): any {
  return {
    user: null,
    headers: {},
    cookies: {},
    ip: '127.0.0.1',
    get: (header: string) => overrides?.headers?.[header.toLowerCase()],
    ...overrides,
  };
}

export function createMockResponse(): any {
  const res: any = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
    cookie: jest.fn().mockReturnThis(),
    clearCookie: jest.fn().mockReturnThis(),
    setHeader: jest.fn().mockReturnThis(),
  };
  return res;
}

export async function createAuthenticatedUser(
  dataSource: DataSource,
  userData?: Partial<User>,
): Promise<{ user: User; token: string }> {
  const userRepository = dataSource.getRepository(User);
  const bcrypt = require('bcrypt');
  
  const user = userRepository.create({
    email: userData?.email || 'test@example.com',
    password: await bcrypt.hash(userData?.password || 'password123', 10),
    firstName: userData?.firstName || 'Test',
    lastName: userData?.lastName || 'User',
    role: userData?.role || 'user',
    isActive: true,
    emailVerified: true,
    ...userData,
  });
  
  await userRepository.save(user);
  
  const jwtService = new JwtService({
    secret: 'test-secret',
  });
  
  const token = jwtService.sign({
    sub: user.id,
    email: user.email,
    role: user.role,
  });
  
  return { user, token };
}

export function expectToThrowWithCode(
  fn: () => any | Promise<any>,
  errorType: any,
  errorCode?: string,
): void | Promise<void> {
  try {
    const result = fn();
    if (result instanceof Promise) {
      return result.then(
        () => {
          throw new Error(`Expected ${errorType.name} to be thrown`);
        },
        (error) => {
          expect(error).toBeInstanceOf(errorType);
          if (errorCode) {
            expect(error.response?.code || error.code).toBe(errorCode);
          }
        },
      );
    }
    throw new Error(`Expected ${errorType.name} to be thrown`);
  } catch (error) {
    expect(error).toBeInstanceOf(errorType);
    if (errorCode) {
      expect((error as any).response?.code || (error as any).code).toBe(errorCode);
    }
  }
}

export function createMockJwtService(): any {
  return {
    sign: jest.fn().mockReturnValue('mock-jwt-token'),
    verify: jest.fn().mockReturnValue({ sub: 'user-id', email: 'test@example.com' }),
    decode: jest.fn().mockReturnValue({ sub: 'user-id', email: 'test@example.com' }),
  };
}

export function createMockConfigService(config: Record<string, any> = {}): any {
  return {
    get: jest.fn((key: string) => {
      const keys = key.split('.');
      let value = config;
      for (const k of keys) {
        value = value?.[k];
      }
      return value;
    }),
  };
}