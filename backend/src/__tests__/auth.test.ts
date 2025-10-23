import request from 'supertest';
import express from 'express';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import authRouter from '../routes/auth.js';
import { User } from '../models/user.js';

const app = express();
app.use(express.json());
app.use('/api/auth', authRouter);

let mongoServer: MongoMemoryServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  await User.deleteMany({});
});

describe('Auth API', () => {
  describe('POST /api/auth/register', () => {
    it('should register a new user with valid data', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'Password123',
          name: 'Test User',
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.token).toBeDefined();
      expect(response.body.user.email).toBe('test@example.com');
      expect(response.body.user.name).toBe('Test User');
      expect(response.body.user.role).toBe('user');
    });

    it('should fail with invalid email', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'invalid-email',
          password: 'Password123',
          name: 'Test User',
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validation failed');
    });

    it('should fail with weak password', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'weak',
          name: 'Test User',
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validation failed');
    });

    it('should fail when email already exists', async () => {
      // Create first user
      await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'Password123',
          name: 'Test User',
        });

      // Try to create duplicate
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'Password123',
          name: 'Another User',
        });

      expect(response.status).toBe(409);
      expect(response.body.error).toBe('Conflict');
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      // Create a test user
      await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'Password123',
          name: 'Test User',
        });
    });

    it('should login with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'Password123',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.token).toBeDefined();
      expect(response.body.user.email).toBe('test@example.com');
    });

    it('should fail with invalid email', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'wrong@example.com',
          password: 'Password123',
        });

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Unauthorized');
    });

    it('should fail with invalid password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'WrongPassword123',
        });

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Unauthorized');
    });

    it('should fail when account is deactivated', async () => {
      // Deactivate the user
      await User.updateOne(
        { email: 'test@example.com' },
        { isActive: false }
      );

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'Password123',
        });

      expect(response.status).toBe(403);
      expect(response.body.error).toBe('Forbidden');
    });
  });

  describe('GET /api/auth/me', () => {
    let authToken: string;

    beforeEach(async () => {
      // Create and login a test user
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'Password123',
          name: 'Test User',
        });

      authToken = response.body.token;
    });

    it('should get current user profile with valid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.user.email).toBe('test@example.com');
      expect(response.body.user.name).toBe('Test User');
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .get('/api/auth/me');

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Unauthorized');
    });

    it('should fail with invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Unauthorized');
    });
  });

  describe('POST /api/auth/change-password', () => {
    let authToken: string;

    beforeEach(async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'Password123',
          name: 'Test User',
        });

      authToken = response.body.token;
    });

    it('should change password with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          currentPassword: 'Password123',
          newPassword: 'NewPassword456',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // Verify can login with new password
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'NewPassword456',
        });

      expect(loginResponse.status).toBe(200);
    });

    it('should fail with incorrect current password', async () => {
      const response = await request(app)
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          currentPassword: 'WrongPassword123',
          newPassword: 'NewPassword456',
        });

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Unauthorized');
    });
  });

  describe('GET /api/auth/quota', () => {
    let authToken: string;

    beforeEach(async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'Password123',
          name: 'Test User',
        });

      authToken = response.body.token;
    });

    it('should get quota information', async () => {
      const response = await request(app)
        .get('/api/auth/quota')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.quota.uploads).toBeDefined();
      expect(response.body.quota.storage).toBeDefined();
      expect(response.body.quota.ai).toBeDefined();
      expect(response.body.quota.uploads.max).toBeGreaterThan(0);
    });
  });

  describe('Admin Operations', () => {
    let adminToken: string;
    let userToken: string;
    let testUserId: string;

    beforeEach(async () => {
      // Create admin user
      const admin = new User({
        email: 'admin@example.com',
        password: 'AdminPassword123',
        name: 'Admin User',
        role: 'admin',
      });
      await admin.save();
      adminToken = admin.generateAuthToken();

      // Create regular user
      const userResponse = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'user@example.com',
          password: 'UserPassword123',
          name: 'Regular User',
        });

      userToken = userResponse.body.token;
      testUserId = userResponse.body.user.id;
    });

    describe('GET /api/auth/users', () => {
      it('should get all users as admin', async () => {
        const response = await request(app)
          .get('/api/auth/users')
          .set('Authorization', `Bearer ${adminToken}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.users).toBeInstanceOf(Array);
        expect(response.body.users.length).toBeGreaterThan(0);
      });

      it('should fail as regular user', async () => {
        const response = await request(app)
          .get('/api/auth/users')
          .set('Authorization', `Bearer ${userToken}`);

        expect(response.status).toBe(403);
        expect(response.body.error).toBe('Forbidden');
      });
    });

    describe('PATCH /api/auth/users/:id/role', () => {
      it('should update user role as admin', async () => {
        const response = await request(app)
          .patch(`/api/auth/users/${testUserId}/role`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ role: 'admin' });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.user.role).toBe('admin');
      });

      it('should fail as regular user', async () => {
        const response = await request(app)
          .patch(`/api/auth/users/${testUserId}/role`)
          .set('Authorization', `Bearer ${userToken}`)
          .send({ role: 'admin' });

        expect(response.status).toBe(403);
        expect(response.body.error).toBe('Forbidden');
      });
    });

    describe('PATCH /api/auth/users/:id/status', () => {
      it('should deactivate user as admin', async () => {
        const response = await request(app)
          .patch(`/api/auth/users/${testUserId}/status`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ isActive: false });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.user.isActive).toBe(false);
      });
    });
  });
});
