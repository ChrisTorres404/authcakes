const request = require('supertest');
const { Test } = require('@nestjs/testing');
const { AppModule } = require('./dist/app.module.js');

async function debugLogout() {
  const moduleFixture = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleFixture.createNestApplication();
  await app.init();

  // Register a user
  const email = `debug${Date.now()}@example.com`;
  const password = 'Test1234!';
  
  console.log('1. Registering user...');
  const registerRes = await request(app.getHttpServer())
    .post('/api/auth/register')
    .send({
      email,
      password,
      firstName: 'Debug',
      lastName: 'User',
      organizationName: 'DebugOrg',
    });
  
  console.log('Register response:', registerRes.status);
  
  // Login
  console.log('2. Logging in...');
  const loginRes = await request(app.getHttpServer())
    .post('/api/auth/login')
    .send({ email, password });
    
  console.log('Login response:', loginRes.status);
  console.log('Login cookies:', loginRes.headers['set-cookie']);
  
  const loginCookies = loginRes.headers['set-cookie'];
  
  // Try logout
  console.log('3. Attempting logout...');
  const logoutRes = await request(app.getHttpServer())
    .post('/api/auth/logout')
    .set('Cookie', loginCookies);
    
  console.log('Logout response:', logoutRes.status);
  console.log('Logout error:', logoutRes.body);

  await app.close();
}

debugLogout().catch(console.error);