import { Request, Response, NextFunction } from 'express';
import { authenticate, authorize, checkQuota, optionalAuth } from '../middleware/auth.js';
import { User } from '../models/user.js';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongoServer: MongoMemoryServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
  process.env.JWT_SECRET = 'test-secret-key';
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  await User.deleteMany({});
});

const mockRequest = (overrides = {}) => {
  return {
    headers: {},
    body: {},
    params: {},
    query: {},
    ...overrides,
  } as unknown as Request;
};

const mockResponse = () => {
  const res = {} as Response;
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const mockNext = jest.fn() as NextFunction;

describe('Authentication Middleware', () => {
  describe('authenticate', () => {
    it('should authenticate user with valid JWT token', async () => {
      // Create a test user
      const user = new User({
        email: 'test@example.com',
        password: 'Password123',
        name: 'Test User',
        role: 'user',
      });
      await user.save();

      const token = user.generateAuthToken();
      const req = mockRequest({
        headers: {
          authorization: `Bearer ${token}`,
        },
      });
      const res = mockResponse();
      const next = jest.fn();

      await authenticate(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.user).toBeDefined();
      expect(req.user?.email).toBe('test@example.com');
    });

    it('should fail without authorization header', async () => {
      const req = mockRequest();
      const res = mockResponse();
      const next = jest.fn();

      await authenticate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Unauthorized',
        message: 'No token provided',
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should fail with invalid token', async () => {
      const req = mockRequest({
        headers: {
          authorization: 'Bearer invalid-token',
        },
      });
      const res = mockResponse();
      const next = jest.fn();

      await authenticate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Unauthorized',
        message: 'Invalid or expired token',
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should fail when user not found', async () => {
      // Create a token for a non-existent user
      const fakeId = new mongoose.Types.ObjectId();
      const token = jwt.sign({ id: fakeId.toString() }, process.env.JWT_SECRET!);

      const req = mockRequest({
        headers: {
          authorization: `Bearer ${token}`,
        },
      });
      const res = mockResponse();
      const next = jest.fn();

      await authenticate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Unauthorized',
        message: 'User not found',
      });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('optionalAuth', () => {
    it('should set user when valid token provided', async () => {
      const user = new User({
        email: 'test@example.com',
        password: 'Password123',
        name: 'Test User',
        role: 'user',
      });
      await user.save();

      const token = user.generateAuthToken();
      const req = mockRequest({
        headers: {
          authorization: `Bearer ${token}`,
        },
      });
      const res = mockResponse();
      const next = jest.fn();

      await optionalAuth(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.user).toBeDefined();
    });

    it('should proceed without user when no token provided', async () => {
      const req = mockRequest();
      const res = mockResponse();
      const next = jest.fn();

      await optionalAuth(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.user).toBeUndefined();
    });

    it('should proceed without user when invalid token provided', async () => {
      const req = mockRequest({
        headers: {
          authorization: 'Bearer invalid-token',
        },
      });
      const res = mockResponse();
      const next = jest.fn();

      await optionalAuth(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.user).toBeUndefined();
    });
  });

  describe('authorize', () => {
    it('should allow access for authorized role', async () => {
      const user = new User({
        email: 'admin@example.com',
        password: 'Password123',
        name: 'Admin User',
        role: 'admin',
      });
      await user.save();

      const req = mockRequest();
      req.user = user;
      const res = mockResponse();
      const next = jest.fn();

      const middleware = authorize('admin');
      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('should deny access for unauthorized role', async () => {
      const user = new User({
        email: 'user@example.com',
        password: 'Password123',
        name: 'Regular User',
        role: 'user',
      });
      await user.save();

      const req = mockRequest();
      req.user = user;
      const res = mockResponse();
      const next = jest.fn();

      const middleware = authorize('admin');
      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Forbidden',
        message: 'Insufficient permissions',
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should allow access for multiple authorized roles', async () => {
      const user = new User({
        email: 'user@example.com',
        password: 'Password123',
        name: 'Regular User',
        role: 'user',
      });
      await user.save();

      const req = mockRequest();
      req.user = user;
      const res = mockResponse();
      const next = jest.fn();

      const middleware = authorize('admin', 'user');
      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('should fail without user', async () => {
      const req = mockRequest();
      const res = mockResponse();
      const next = jest.fn();

      const middleware = authorize('admin');
      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Unauthorized',
        message: 'Authentication required',
      });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('checkQuota', () => {
    it('should allow when upload quota not exceeded', async () => {
      const user = new User({
        email: 'test@example.com',
        password: 'Password123',
        name: 'Test User',
        role: 'user',
      });
      user.quota.usedUploads = 5;
      user.quota.maxUploads = 100;
      await user.save();

      const req = mockRequest();
      req.user = user;
      const res = mockResponse();
      const next = jest.fn();

      const middleware = checkQuota('uploads');
      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('should deny when upload quota exceeded', async () => {
      const user = new User({
        email: 'test@example.com',
        password: 'Password123',
        name: 'Test User',
        role: 'user',
      });
      user.quota.usedUploads = 100;
      user.quota.maxUploads = 100;
      await user.save();

      const req = mockRequest();
      req.user = user;
      const res = mockResponse();
      const next = jest.fn();

      const middleware = checkQuota('uploads');
      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(429);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Quota exceeded',
        message: 'Upload quota limit reached',
        quota: {
          used: 100,
          max: 100,
        },
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should allow when storage quota not exceeded', async () => {
      const user = new User({
        email: 'test@example.com',
        password: 'Password123',
        name: 'Test User',
        role: 'user',
      });
      user.quota.usedStorageBytes = 500000000;
      user.quota.maxStorageBytes = 1000000000;
      await user.save();

      const req = mockRequest();
      req.user = user;
      const res = mockResponse();
      const next = jest.fn();

      const middleware = checkQuota('storage');
      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('should deny when storage quota exceeded', async () => {
      const user = new User({
        email: 'test@example.com',
        password: 'Password123',
        name: 'Test User',
        role: 'user',
      });
      user.quota.usedStorageBytes = 1000000000;
      user.quota.maxStorageBytes = 1000000000;
      await user.save();

      const req = mockRequest();
      req.user = user;
      const res = mockResponse();
      const next = jest.fn();

      const middleware = checkQuota('storage');
      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(429);
      expect(next).not.toHaveBeenCalled();
    });

    it('should allow when AI quota not exceeded', async () => {
      const user = new User({
        email: 'test@example.com',
        password: 'Password123',
        name: 'Test User',
        role: 'user',
      });
      user.quota.usedAICalls = 50;
      user.quota.maxAICalls = 100;
      await user.save();

      const req = mockRequest();
      req.user = user;
      const res = mockResponse();
      const next = jest.fn();

      const middleware = checkQuota('ai');
      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('should deny when AI quota exceeded', async () => {
      const user = new User({
        email: 'test@example.com',
        password: 'Password123',
        name: 'Test User',
        role: 'user',
      });
      user.quota.usedAICalls = 100;
      user.quota.maxAICalls = 100;
      await user.save();

      const req = mockRequest();
      req.user = user;
      const res = mockResponse();
      const next = jest.fn();

      const middleware = checkQuota('ai');
      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(429);
      expect(next).not.toHaveBeenCalled();
    });

    it('should allow when no user (optional auth)', async () => {
      const req = mockRequest();
      const res = mockResponse();
      const next = jest.fn();

      const middleware = checkQuota('uploads');
      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });
  });
});
