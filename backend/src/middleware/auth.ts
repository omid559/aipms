import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User, IUser } from '../models/user.js';

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: IUser;
    }
  }
}

interface JWTPayload {
  id: string;
  email: string;
  role: string;
}

/**
 * Authentication middleware - Verify JWT token
 */
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'No token provided. Please login.',
      });
      return;
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'your-secret-key'
    ) as JWTPayload;

    // Get user from database
    const user = await User.findById(decoded.id);

    if (!user) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'User not found. Token invalid.',
      });
      return;
    }

    if (!user.isActive) {
      res.status(403).json({
        error: 'Forbidden',
        message: 'Your account has been deactivated.',
      });
      return;
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (error: any) {
    if (error.name === 'JsonWebTokenError') {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid token.',
      });
      return;
    }

    if (error.name === 'TokenExpiredError') {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Token has expired. Please login again.',
      });
      return;
    }

    res.status(500).json({
      error: 'Internal server error',
      message: 'Authentication failed.',
    });
  }
};

/**
 * API Key authentication - Alternative to JWT for programmatic access
 */
export const authenticateApiKey = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const apiKey = req.headers['x-api-key'] as string;

    if (!apiKey) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'No API key provided.',
      });
      return;
    }

    // Find user by API key
    const user = await User.findOne({ apiKey, isActive: true });

    if (!user) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid API key.',
      });
      return;
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(500).json({
      error: 'Internal server error',
      message: 'API key authentication failed.',
    });
  }
};

/**
 * Optional authentication - Continue if no token, but attach user if valid
 */
export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(); // No token, continue without user
  }

  try {
    const token = authHeader.substring(7);
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'your-secret-key'
    ) as JWTPayload;

    const user = await User.findById(decoded.id);
    if (user && user.isActive) {
      req.user = user;
    }
  } catch (error) {
    // Invalid token, continue without user
  }

  next();
};

/**
 * Authorization middleware - Check user roles
 */
export const authorize = (...allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required.',
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        error: 'Forbidden',
        message: `Access denied. Required roles: ${allowedRoles.join(', ')}`,
      });
      return;
    }

    next();
  };
};

/**
 * Check quota middleware - Verify user has not exceeded limits
 */
export const checkQuota = (type: 'uploads' | 'storage' | 'ai') => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required.',
      });
      return;
    }

    const quota = req.user.quota;

    switch (type) {
      case 'uploads':
        if (quota.usedUploads >= quota.maxUploads) {
          res.status(429).json({
            error: 'Quota exceeded',
            message: `Upload limit reached (${quota.maxUploads} per month). Please upgrade your plan.`,
            quota: {
              used: quota.usedUploads,
              max: quota.maxUploads,
            },
          });
          return;
        }
        break;

      case 'storage':
        if (quota.usedStorageBytes >= quota.maxStorageBytes) {
          res.status(429).json({
            error: 'Quota exceeded',
            message: `Storage limit reached. Please upgrade your plan.`,
            quota: {
              used: quota.usedStorageBytes,
              max: quota.maxStorageBytes,
            },
          });
          return;
        }
        break;

      case 'ai':
        if (quota.usedAICalls >= quota.maxAICalls) {
          res.status(429).json({
            error: 'Quota exceeded',
            message: `AI operation limit reached (${quota.maxAICalls} per month). Please upgrade your plan.`,
            quota: {
              used: quota.usedAICalls,
              max: quota.maxAICalls,
            },
          });
          return;
        }
        break;
    }

    next();
  };
};

/**
 * Verify email middleware
 */
export const requireVerifiedEmail = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication required.',
    });
    return;
  }

  if (!req.user.emailVerified) {
    res.status(403).json({
      error: 'Forbidden',
      message: 'Please verify your email address first.',
    });
    return;
  }

  next();
};
