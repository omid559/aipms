# Production Deployment Guide

This guide covers deploying AIPMS to a production environment with PM2 clustering, monitoring, and backups.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Environment Setup](#environment-setup)
- [Building for Production](#building-for-production)
- [PM2 Deployment](#pm2-deployment)
- [Monitoring](#monitoring)
- [Backup Setup](#backup-setup)
- [Security Checklist](#security-checklist)
- [Troubleshooting](#troubleshooting)

## Prerequisites

- Node.js 18+ (LTS recommended)
- MongoDB 6+ or MongoDB Atlas
- PM2 (for process management)
- Nginx or Apache (for reverse proxy)
- SSL certificate (Let's Encrypt recommended)

```bash
# Install PM2 globally
npm install -g pm2

# Install MongoDB tools for backups
# Ubuntu/Debian:
sudo apt-get install mongodb-database-tools

# macOS:
brew install mongodb-database-tools
```

## Environment Setup

1. **Clone the repository:**
```bash
git clone https://github.com/your-username/aipms.git
cd aipms
```

2. **Install dependencies:**
```bash
npm run install:all
```

3. **Configure environment variables:**
```bash
cp .env.example .env
nano .env
```

Required production settings:
```env
NODE_ENV=production
PORT=3000

# Database
MONGODB_URI=mongodb://your-mongodb-server/aipms

# Authentication - MUST CHANGE
JWT_SECRET=your_very_long_random_secret_key_change_this

# Security
CORS_ORIGIN=https://your-domain.com

# Monitoring (optional but recommended)
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id

# OpenAI
OPENAI_API_KEY=your_openai_api_key

# File Configuration
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=100000000

# Backup
BACKUP_RETENTION_DAYS=7
```

## Building for Production

1. **Build the application:**
```bash
npm run build
```

This compiles:
- Backend TypeScript → `backend/dist/`
- Frontend React → `frontend/dist/`

2. **Test the build:**
```bash
npm start
```

Visit `http://localhost:3000` to verify.

## PM2 Deployment

### Starting the Application

```bash
# Start in production mode with clustering
npm run start:prod

# Or directly with PM2
pm2 start ecosystem.config.cjs --env production
```

This will:
- Start multiple instances (one per CPU core)
- Enable cluster mode for load balancing
- Auto-restart on crashes
- Restart if memory exceeds 1GB

### Managing the Application

```bash
# View status
pm2 status

# View logs
pm2 logs aipms-backend

# Monitor in real-time
pm2 monit

# Restart
pm2 restart aipms-backend

# Stop
pm2 stop aipms-backend

# Delete from PM2
pm2 delete aipms-backend
```

### Zero-Downtime Deployment

```bash
# Reload with zero downtime
pm2 reload aipms-backend

# Or use the script
npm run restart:prod
```

### Auto-Start on System Boot

```bash
# Generate startup script
pm2 startup

# Save current process list
pm2 save
```

## Monitoring

### Health Checks

The application provides multiple health check endpoints:

```bash
# Simple health check (for load balancers)
curl http://localhost:3000/health

# Detailed health check
curl http://localhost:3000/api/health

# Prometheus metrics
curl http://localhost:3000/metrics
```

### Sentry Error Tracking

1. Create a Sentry account at https://sentry.io
2. Create a new project
3. Copy the DSN
4. Add to `.env`:
```env
SENTRY_DSN=https://your-dsn@sentry.io/project-id
```

### Prometheus + Grafana

1. **Install Prometheus:**
```yaml
# prometheus.yml
scrape_configs:
  - job_name: 'aipms'
    static_configs:
      - targets: ['localhost:3000']
```

2. **Start Prometheus:**
```bash
prometheus --config.file=prometheus.yml
```

3. **Install Grafana and add Prometheus as data source**

4. **Import dashboard for Node.js metrics**

### PM2 Monitoring

```bash
# Real-time monitoring
pm2 monit

# Web-based monitoring (PM2 Plus)
pm2 link <secret> <public>
```

## Backup Setup

### Automated Backups

1. **Set up automated backups:**
```bash
./scripts/setup-backup-cron.sh
```

Choose from:
- Daily at 2 AM (recommended)
- Every 6 hours
- Every 12 hours
- Weekly
- Custom schedule

2. **Manual backup:**
```bash
./scripts/backup.sh
```

Backups include:
- MongoDB database
- Uploaded files
- Output files

### Backup to Cloud Storage

Configure in `.env`:
```env
BACKUP_CLOUD_ENABLE=true
BACKUP_CLOUD_PROVIDER=s3
BACKUP_S3_BUCKET=your-bucket-name
```

Supported providers:
- AWS S3
- Google Cloud Storage
- Azure Blob Storage

### Restore from Backup

```bash
# List available backups
./scripts/restore.sh

# Restore specific backup
./scripts/restore.sh 20250123_143000
```

## Reverse Proxy Setup

### Nginx Configuration

```nginx
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # API and uploads
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Static files with caching
    location /uploads {
        proxy_pass http://localhost:3000;
        expires 1h;
        add_header Cache-Control "public, immutable";
    }
}
```

Enable the configuration:
```bash
sudo nginx -t
sudo systemctl reload nginx
```

## Security Checklist

- [ ] Change `JWT_SECRET` to a long random string
- [ ] Set `CORS_ORIGIN` to your frontend domain
- [ ] Enable HTTPS with valid SSL certificate
- [ ] Configure firewall (allow only 80, 443, 22)
- [ ] Set up MongoDB authentication
- [ ] Enable Sentry error tracking
- [ ] Configure automated backups
- [ ] Set up monitoring alerts
- [ ] Review and restrict file upload limits
- [ ] Enable rate limiting (already configured)
- [ ] Keep dependencies updated (`npm audit`)

## Database Optimization

### MongoDB Indexes

The application automatically creates indexes, but verify:
```javascript
db.users.getIndexes()
db.learningdata.getIndexes()
```

### Connection Pooling

Already configured in `server.ts`:
```javascript
maxPoolSize: 10,
minPoolSize: 2,
```

## Performance Optimization

1. **Enable gzip compression** (Nginx):
```nginx
gzip on;
gzip_types text/plain text/css application/json application/javascript;
```

2. **PM2 cluster mode** - Already enabled

3. **Static file caching** - Configure in Nginx

4. **MongoDB query optimization** - Monitor with MongoDB Atlas or Compass

## Troubleshooting

### Application Won't Start

```bash
# Check logs
pm2 logs aipms-backend

# Check for port conflicts
lsof -i :3000

# Verify MongoDB connection
mongosh $MONGODB_URI
```

### High Memory Usage

```bash
# Check PM2 memory usage
pm2 status

# Restart to free memory
pm2 restart aipms-backend

# Reduce max_memory_restart in ecosystem.config.cjs
```

### Database Connection Errors

```bash
# Test MongoDB connection
mongosh $MONGODB_URI

# Check MongoDB status
sudo systemctl status mongod

# View MongoDB logs
sudo journalctl -u mongod
```

### File Upload Failures

```bash
# Check permissions
ls -la uploads/

# Fix permissions
chmod 755 uploads/
chown -R $USER:$USER uploads/

# Check disk space
df -h
```

## Scaling

### Horizontal Scaling

1. **Set up load balancer** (HAProxy, AWS ALB, etc.)

2. **Deploy to multiple servers**
```bash
pm2 deploy production setup
pm2 deploy production
```

3. **Use shared storage** for uploads (AWS S3, NFS, etc.)

4. **Use MongoDB replica set** for database redundancy

### Vertical Scaling

1. **Increase PM2 instances:**
```javascript
// ecosystem.config.cjs
instances: 4, // Instead of 'max'
```

2. **Increase server resources** (CPU, RAM)

3. **Optimize MongoDB** with sharding

## Updates and Maintenance

### Zero-Downtime Updates

```bash
git pull origin main
npm run build
pm2 reload aipms-backend
```

### Database Migrations

```bash
# Backup before migration
./scripts/backup.sh

# Run migration
npm run migrate

# Verify
curl http://localhost:3000/api/health
```

## Support

For issues and questions:
- GitHub Issues: https://github.com/your-username/aipms/issues
- Documentation: https://github.com/your-username/aipms
- Email: support@your-domain.com
