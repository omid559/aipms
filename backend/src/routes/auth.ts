import { Router, Request, Response } from 'express';
import { User } from '../models/user.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { body, validationResult } from 'express-validator';

const router = Router();

/**
 * POST /api/auth/register
 * Register a new user
 */
router.post(
  '/register',
  [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage('Password must contain uppercase, lowercase, and number'),
    body('name').trim().notEmpty().withMessage('Name is required'),
  ],
  async (req: Request, res: Response) => {
    try {
      // Validate input
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation failed',
          details: errors.array(),
        });
      }

      const { email, password, name } = req.body;

      // Check if user already exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(409).json({
          error: 'Conflict',
          message: 'User with this email already exists',
        });
      }

      // Create new user
      const user = new User({
        email,
        password,
        name,
        role: 'user',
      });

      await user.save();

      // Generate token
      const token = user.generateAuthToken();

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        token,
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
      });
    } catch (error: any) {
      console.error('Registration error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to register user',
      });
    }
  }
);

/**
 * POST /api/auth/login
 * Login user
 */
router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  async (req: Request, res: Response) => {
    try {
      // Validate input
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation failed',
          details: errors.array(),
        });
      }

      const { email, password } = req.body;

      // Find user and include password field
      const user = await User.findOne({ email }).select('+password');
      if (!user) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Invalid email or password',
        });
      }

      // Check if account is active
      if (!user.isActive) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'Your account has been deactivated',
        });
      }

      // Verify password
      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Invalid email or password',
        });
      }

      // Update last login
      user.lastLogin = new Date();
      await user.save();

      // Generate token
      const token = user.generateAuthToken();

      res.json({
        success: true,
        message: 'Login successful',
        token,
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          role: user.role,
          emailVerified: user.emailVerified,
          quota: user.quota,
        },
      });
    } catch (error: any) {
      console.error('Login error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to login',
      });
    }
  }
);

/**
 * GET /api/auth/me
 * Get current user profile
 */
router.get('/me', authenticate, async (req: Request, res: Response) => {
  try {
    const user = req.user!;

    res.json({
      success: true,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        emailVerified: user.emailVerified,
        quota: user.quota,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin,
      },
    });
  } catch (error: any) {
    console.error('Get profile error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to get profile',
    });
  }
});

/**
 * PUT /api/auth/me
 * Update user profile
 */
router.put(
  '/me',
  authenticate,
  [body('name').optional().trim().notEmpty().withMessage('Name cannot be empty')],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation failed',
          details: errors.array(),
        });
      }

      const user = req.user!;
      const { name } = req.body;

      if (name) user.name = name;

      await user.save();

      res.json({
        success: true,
        message: 'Profile updated successfully',
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
      });
    } catch (error: any) {
      console.error('Update profile error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to update profile',
      });
    }
  }
);

/**
 * POST /api/auth/change-password
 * Change user password
 */
router.post(
  '/change-password',
  authenticate,
  [
    body('currentPassword').notEmpty().withMessage('Current password is required'),
    body('newPassword')
      .isLength({ min: 8 })
      .withMessage('New password must be at least 8 characters')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage('New password must contain uppercase, lowercase, and number'),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation failed',
          details: errors.array(),
        });
      }

      const { currentPassword, newPassword } = req.body;

      // Get user with password
      const user = await User.findById(req.user!._id).select('+password');
      if (!user) {
        return res.status(404).json({
          error: 'Not found',
          message: 'User not found',
        });
      }

      // Verify current password
      const isPasswordValid = await user.comparePassword(currentPassword);
      if (!isPasswordValid) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Current password is incorrect',
        });
      }

      // Update password
      user.password = newPassword;
      await user.save();

      res.json({
        success: true,
        message: 'Password changed successfully',
      });
    } catch (error: any) {
      console.error('Change password error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to change password',
      });
    }
  }
);

/**
 * POST /api/auth/api-key
 * Generate API key
 */
router.post('/api-key', authenticate, async (req: Request, res: Response) => {
  try {
    const user = req.user!;

    const apiKey = user.generateApiKey();
    await user.save();

    res.json({
      success: true,
      message: 'API key generated successfully',
      apiKey,
      warning: 'Store this key securely. It will not be shown again.',
    });
  } catch (error: any) {
    console.error('Generate API key error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to generate API key',
    });
  }
});

/**
 * DELETE /api/auth/api-key
 * Revoke API key
 */
router.delete('/api-key', authenticate, async (req: Request, res: Response) => {
  try {
    const user = req.user!;

    user.apiKey = undefined;
    await user.save();

    res.json({
      success: true,
      message: 'API key revoked successfully',
    });
  } catch (error: any) {
    console.error('Revoke API key error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to revoke API key',
    });
  }
});

/**
 * GET /api/auth/quota
 * Get quota usage
 */
router.get('/quota', authenticate, async (req: Request, res: Response) => {
  try {
    const user = req.user!;

    res.json({
      success: true,
      quota: {
        uploads: {
          used: user.quota.usedUploads,
          max: user.quota.maxUploads,
          remaining: user.quota.maxUploads - user.quota.usedUploads,
          percentage: ((user.quota.usedUploads / user.quota.maxUploads) * 100).toFixed(2),
        },
        storage: {
          used: user.quota.usedStorageBytes,
          max: user.quota.maxStorageBytes,
          remaining: user.quota.maxStorageBytes - user.quota.usedStorageBytes,
          percentage: (
            (user.quota.usedStorageBytes / user.quota.maxStorageBytes) *
            100
          ).toFixed(2),
        },
        ai: {
          used: user.quota.usedAICalls,
          max: user.quota.maxAICalls,
          remaining: user.quota.maxAICalls - user.quota.usedAICalls,
          percentage: ((user.quota.usedAICalls / user.quota.maxAICalls) * 100).toFixed(2),
        },
      },
    });
  } catch (error: any) {
    console.error('Get quota error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to get quota',
    });
  }
});

/**
 * Admin routes
 */

/**
 * GET /api/auth/users
 * Get all users (admin only)
 */
router.get(
  '/users',
  authenticate,
  authorize('admin'),
  async (req: Request, res: Response) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const skip = (page - 1) * limit;

      const users = await User.find()
        .select('-password')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      const total = await User.countDocuments();

      res.json({
        success: true,
        users,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      });
    } catch (error: any) {
      console.error('Get users error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to get users',
      });
    }
  }
);

/**
 * PATCH /api/auth/users/:id/role
 * Update user role (admin only)
 */
router.patch(
  '/users/:id/role',
  authenticate,
  authorize('admin'),
  [body('role').isIn(['admin', 'user', 'guest']).withMessage('Invalid role')],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation failed',
          details: errors.array(),
        });
      }

      const { id } = req.params;
      const { role } = req.body;

      const user = await User.findById(id);
      if (!user) {
        return res.status(404).json({
          error: 'Not found',
          message: 'User not found',
        });
      }

      user.role = role;
      await user.save();

      res.json({
        success: true,
        message: 'User role updated successfully',
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
      });
    } catch (error: any) {
      console.error('Update user role error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to update user role',
      });
    }
  }
);

/**
 * PATCH /api/auth/users/:id/status
 * Activate/deactivate user (admin only)
 */
router.patch(
  '/users/:id/status',
  authenticate,
  authorize('admin'),
  [body('isActive').isBoolean().withMessage('isActive must be boolean')],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation failed',
          details: errors.array(),
        });
      }

      const { id } = req.params;
      const { isActive } = req.body;

      const user = await User.findById(id);
      if (!user) {
        return res.status(404).json({
          error: 'Not found',
          message: 'User not found',
        });
      }

      user.isActive = isActive;
      await user.save();

      res.json({
        success: true,
        message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          isActive: user.isActive,
        },
      });
    } catch (error: any) {
      console.error('Update user status error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to update user status',
      });
    }
  }
);

export default router;
