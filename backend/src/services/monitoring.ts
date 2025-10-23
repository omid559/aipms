import * as Sentry from '@sentry/node';
import { ProfilingIntegration } from '@sentry/profiling-node';
import { Express, Request, Response, NextFunction } from 'express';
import { register, collectDefaultMetrics, Counter, Histogram, Gauge } from 'prom-client';

/**
 * Initialize Sentry for error tracking and performance monitoring
 */
export function initSentry(app: Express) {
  // Only initialize Sentry if DSN is provided
  if (!process.env.SENTRY_DSN) {
    console.warn('⚠️  Sentry DSN not configured. Error tracking disabled.');
    return;
  }

  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
    integrations: [
      // Enable HTTP calls tracing
      new Sentry.Integrations.Http({ tracing: true }),
      // Enable Express.js middleware tracing
      new Sentry.Integrations.Express({ app }),
      // Enable profiling
      new ProfilingIntegration(),
    ],
    // Performance Monitoring
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    // Profiling
    profilesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    // Capture unhandled promise rejections
    beforeSend(event, hint) {
      // Don't send errors in test environment
      if (process.env.NODE_ENV === 'test') {
        return null;
      }
      return event;
    },
  });

  console.log('✅ Sentry error tracking initialized');
}

/**
 * Sentry request handler middleware
 */
export function sentryRequestHandler() {
  return Sentry.Handlers.requestHandler();
}

/**
 * Sentry tracing handler middleware
 */
export function sentryTracingHandler() {
  return Sentry.Handlers.tracingHandler();
}

/**
 * Sentry error handler middleware
 */
export function sentryErrorHandler() {
  return Sentry.Handlers.errorHandler();
}

/**
 * Initialize Prometheus metrics
 */
export class PrometheusMetrics {
  private httpRequestDuration: Histogram;
  private httpRequestTotal: Counter;
  private httpRequestErrors: Counter;
  private activeConnections: Gauge;
  private uploadSize: Histogram;
  private slicingDuration: Histogram;
  private aiCallsTotal: Counter;
  private quotaUsage: Gauge;
  private databaseConnections: Gauge;

  constructor() {
    // Enable default system metrics
    collectDefaultMetrics({ register });

    // HTTP request duration in seconds
    this.httpRequestDuration = new Histogram({
      name: 'http_request_duration_seconds',
      help: 'Duration of HTTP requests in seconds',
      labelNames: ['method', 'route', 'status_code'],
      buckets: [0.1, 0.5, 1, 2, 5, 10],
    });

    // Total HTTP requests
    this.httpRequestTotal = new Counter({
      name: 'http_requests_total',
      help: 'Total number of HTTP requests',
      labelNames: ['method', 'route', 'status_code'],
    });

    // HTTP request errors
    this.httpRequestErrors = new Counter({
      name: 'http_request_errors_total',
      help: 'Total number of HTTP request errors',
      labelNames: ['method', 'route', 'error_type'],
    });

    // Active connections
    this.activeConnections = new Gauge({
      name: 'active_connections',
      help: 'Number of active connections',
    });

    // Upload file size
    this.uploadSize = new Histogram({
      name: 'upload_file_size_bytes',
      help: 'Size of uploaded files in bytes',
      buckets: [1000, 10000, 100000, 1000000, 10000000, 100000000],
    });

    // Slicing operation duration
    this.slicingDuration = new Histogram({
      name: 'slicing_duration_seconds',
      help: 'Duration of slicing operations in seconds',
      buckets: [1, 5, 10, 30, 60, 120, 300],
    });

    // Total AI calls
    this.aiCallsTotal = new Counter({
      name: 'ai_calls_total',
      help: 'Total number of AI optimization calls',
      labelNames: ['success'],
    });

    // Quota usage (percentage)
    this.quotaUsage = new Gauge({
      name: 'user_quota_usage_percentage',
      help: 'User quota usage percentage',
      labelNames: ['user_id', 'quota_type'],
    });

    // Database connections
    this.databaseConnections = new Gauge({
      name: 'database_connections',
      help: 'Number of database connections',
      labelNames: ['state'],
    });

    console.log('✅ Prometheus metrics initialized');
  }

  /**
   * Middleware to track HTTP requests
   */
  trackHttpRequest() {
    return (req: Request, res: Response, next: NextFunction) => {
      this.activeConnections.inc();

      const start = Date.now();

      res.on('finish', () => {
        const duration = (Date.now() - start) / 1000;
        const route = req.route?.path || req.path;

        this.httpRequestDuration.observe(
          { method: req.method, route, status_code: res.statusCode },
          duration
        );

        this.httpRequestTotal.inc({
          method: req.method,
          route,
          status_code: res.statusCode,
        });

        this.activeConnections.dec();

        // Track errors
        if (res.statusCode >= 400) {
          this.httpRequestErrors.inc({
            method: req.method,
            route,
            error_type: res.statusCode >= 500 ? 'server' : 'client',
          });
        }
      });

      next();
    };
  }

  /**
   * Track file upload size
   */
  trackUpload(sizeBytes: number) {
    this.uploadSize.observe(sizeBytes);
  }

  /**
   * Track slicing operation duration
   */
  trackSlicing(durationSeconds: number) {
    this.slicingDuration.observe(durationSeconds);
  }

  /**
   * Track AI call
   */
  trackAICall(success: boolean) {
    this.aiCallsTotal.inc({ success: success.toString() });
  }

  /**
   * Update quota usage metrics
   */
  updateQuotaUsage(userId: string, quotaType: 'uploads' | 'storage' | 'ai', percentage: number) {
    this.quotaUsage.set({ user_id: userId, quota_type: quotaType }, percentage);
  }

  /**
   * Update database connection metrics
   */
  updateDatabaseConnections(connected: number, disconnected: number) {
    this.databaseConnections.set({ state: 'connected' }, connected);
    this.databaseConnections.set({ state: 'disconnected' }, disconnected);
  }

  /**
   * Get metrics endpoint handler
   */
  getMetricsHandler() {
    return async (req: Request, res: Response) => {
      try {
        res.set('Content-Type', register.contentType);
        const metrics = await register.metrics();
        res.end(metrics);
      } catch (error) {
        res.status(500).json({ error: 'Failed to collect metrics' });
      }
    };
  }
}

// Singleton instance
export const metrics = new PrometheusMetrics();

/**
 * Health check endpoint data
 */
export interface HealthCheckData {
  status: 'ok' | 'degraded' | 'down';
  timestamp: string;
  uptime: number;
  version: string;
  services: {
    mongodb: {
      status: 'connected' | 'disconnected';
      latency?: number;
    };
    openai: {
      status: 'available' | 'unavailable';
      configured: boolean;
    };
    sentry: {
      status: 'configured' | 'not_configured';
    };
    filesystem: {
      status: 'ok' | 'error';
      uploadsAvailable: boolean;
      outputsAvailable: boolean;
    };
  };
  metrics: {
    totalRequests: number;
    errorRate: number;
    averageResponseTime: number;
  };
}

/**
 * Comprehensive health check
 */
export async function performHealthCheck(): Promise<HealthCheckData> {
  const startTime = Date.now();

  // Check MongoDB
  let mongoStatus: 'connected' | 'disconnected' = 'disconnected';
  let mongoLatency: number | undefined;
  try {
    const mongoose = await import('mongoose');
    if (mongoose.default.connection.readyState === 1) {
      const pingStart = Date.now();
      await mongoose.default.connection.db.admin().ping();
      mongoLatency = Date.now() - pingStart;
      mongoStatus = 'connected';
    }
  } catch (error) {
    mongoStatus = 'disconnected';
  }

  // Check OpenAI
  const openaiConfigured = !!process.env.OPENAI_API_KEY;

  // Check Sentry
  const sentryConfigured = !!process.env.SENTRY_DSN;

  // Check filesystem
  let uploadsAvailable = false;
  let outputsAvailable = false;
  try {
    const fs = await import('fs/promises');
    const path = await import('path');
    const { fileURLToPath } = await import('url');
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);

    await fs.access(path.join(__dirname, '../../../uploads'));
    uploadsAvailable = true;

    await fs.access(path.join(__dirname, '../../../output'));
    outputsAvailable = true;
  } catch (error) {
    // Directories might not exist yet
  }

  // Determine overall status
  let overallStatus: 'ok' | 'degraded' | 'down' = 'ok';
  if (mongoStatus === 'disconnected' && openaiConfigured === false) {
    overallStatus = 'down';
  } else if (mongoStatus === 'disconnected' || !openaiConfigured) {
    overallStatus = 'degraded';
  }

  return {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: '1.0.0',
    services: {
      mongodb: {
        status: mongoStatus,
        latency: mongoLatency,
      },
      openai: {
        status: openaiConfigured ? 'available' : 'unavailable',
        configured: openaiConfigured,
      },
      sentry: {
        status: sentryConfigured ? 'configured' : 'not_configured',
      },
      filesystem: {
        status: uploadsAvailable && outputsAvailable ? 'ok' : 'error',
        uploadsAvailable,
        outputsAvailable,
      },
    },
    metrics: {
      totalRequests: 0, // Would be populated from Prometheus
      errorRate: 0,
      averageResponseTime: 0,
    },
  };
}
