/**
 * PM2 Ecosystem Configuration
 * Production-ready setup with clustering, monitoring, and auto-restart
 */

module.exports = {
  apps: [
    {
      // Backend API Server
      name: 'aipms-backend',
      script: './backend/dist/server.js',
      instances: 'max', // Use all available CPU cores
      exec_mode: 'cluster', // Enable cluster mode for load balancing

      // Environment
      env: {
        NODE_ENV: 'development',
        PORT: 3000,
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
      },

      // Auto-restart on errors
      autorestart: true,
      watch: false, // Disable in production for performance
      max_memory_restart: '1G', // Restart if memory exceeds 1GB

      // Restart behavior
      min_uptime: '10s', // Minimum uptime before considering a restart
      max_restarts: 10, // Max restarts within 1 minute
      restart_delay: 4000, // Delay between restarts (ms)

      // Logs
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,

      // Process control
      kill_timeout: 5000, // Time to wait for graceful shutdown
      listen_timeout: 3000, // Time to wait for app to listen

      // Advanced features
      exp_backoff_restart_delay: 100, // Exponential backoff on restart

      // Health monitoring
      instance_var: 'INSTANCE_ID',
    },
  ],

  // Deployment configuration (optional)
  deploy: {
    production: {
      user: 'deploy',
      host: ['your-server.com'],
      ref: 'origin/main',
      repo: 'git@github.com:username/aipms.git',
      path: '/var/www/aipms',
      'pre-deploy-local': '',
      'post-deploy': 'npm install && npm run build && pm2 reload ecosystem.config.cjs --env production',
      'pre-setup': '',
    },
  },
};
