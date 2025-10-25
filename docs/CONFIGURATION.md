# راهنمای پیکربندی AIPMS
# AIPMS Configuration Guide

> راهنمای کامل تنظیمات محیطی، امنیتی و عملکردی سیستم

---

## 📋 فهرست / Table of Contents

1. [متغیرهای محیطی Backend](#1-متغیرهای-محیطی-backend)
2. [متغیرهای محیطی Frontend](#2-متغیرهای-محیطی-frontend)
3. [پیکربندی MongoDB](#3-پیکربندی-mongodb)
4. [پیکربندی AI Services](#4-پیکربندی-ai-services)
5. [تنظیمات امنیتی](#5-تنظیمات-امنیتی)
6. [تنظیمات Performance](#6-تنظیمات-performance)
7. [تنظیمات Production](#7-تنظیمات-production)

---

## 1. متغیرهای محیطی Backend

فایل: `backend/.env`

### Server Configuration

```env
# پورت سرور backend
PORT=3000

# محیط اجرا: development | production | test
NODE_ENV=development
```

**توضیحات:**

| متغیر | پیش‌فرض | توضیحات |
|-------|---------|---------|
| `PORT` | 3000 | پورت HTTP که backend روی آن اجرا می‌شود |
| `NODE_ENV` | development | محیط اجرا - در production حتماً به `production` تغییر دهید |

---

### MongoDB Configuration

```env
# آدرس اتصال به MongoDB
MONGODB_URI=mongodb://localhost:27017/aipms
```

**فرمت‌های مختلف:**

**Local (پیش‌فرض):**
```env
MONGODB_URI=mongodb://localhost:27017/aipms
```

**با Authentication:**
```env
MONGODB_URI=mongodb://username:password@localhost:27017/aipms
```

**MongoDB Atlas (Cloud):**
```env
MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/aipms?retryWrites=true&w=majority
```

**Replica Set:**
```env
MONGODB_URI=mongodb://host1:27017,host2:27017,host3:27017/aipms?replicaSet=myReplicaSet
```

---

### JWT Configuration

```env
# کلید مخفی برای امضای توکن‌های JWT
JWT_SECRET=your-super-secret-jwt-key-CHANGE-THIS

# مدت اعتبار توکن
JWT_EXPIRES_IN=7d
```

**⚠️ بسیار مهم - امنیتی:**

`JWT_SECRET` باید:
- حداقل 32 کاراکتر باشد
- شامل حروف، اعداد و کاراکترهای خاص باشد
- در production حتماً تغییر کند
- هرگز در git commit نشود (در `.gitignore` است)

**تولید یک JWT_SECRET امن:**

**Windows PowerShell:**
```powershell
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | % {[char]$_})
```

**Linux/Mac:**
```bash
openssl rand -base64 32
```

**Node.js:**
```javascript
require('crypto').randomBytes(32).toString('hex')
```

**فرمت‌های `JWT_EXPIRES_IN`:**
- `60`: 60 ثانیه
- `120s`: 120 ثانیه
- `30m`: 30 دقیقه
- `12h`: 12 ساعت
- `7d`: 7 روز
- `30d`: 30 روز

---

### CORS Configuration

```env
# آدرس‌هایی که اجازه دسترسی به API را دارند
CORS_ORIGIN=http://localhost:5173
```

**فرمت‌های مختلف:**

**تک آدرس:**
```env
CORS_ORIGIN=http://localhost:5173
```

**چند آدرس (با کاما جدا شده):**
```env
CORS_ORIGIN=http://localhost:5173,http://localhost:3001,https://aipms.com
```

**همه آدرس‌ها (⚠️ فقط development):**
```env
CORS_ORIGIN=*
```

**Production:**
```env
CORS_ORIGIN=https://yourdomain.com,https://www.yourdomain.com
```

---

### File Upload Configuration

```env
# پوشه ذخیره فایل‌های آپلود شده
UPLOAD_DIR=uploads

# حداکثر حجم فایل (بایت)
MAX_FILE_SIZE=50000000
```

**محاسبه حجم:**
- 1 MB = 1,000,000 بایت
- 10 MB = 10,000,000 بایت
- 50 MB = 50,000,000 بایت (پیش‌فرض)
- 100 MB = 100,000,000 بایت

**نکته:** فایل‌های STL سنگین ممکن است نیاز به افزایش این مقدار داشته باشند.

---

### GapGPT AI Service Configuration

```env
# API Key از GapGPT
GAPGPT_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxx

# آدرس پایه API
GAPGPT_BASE_URL=https://api.gapgpt.app/v1

# مدل برای متن و reasoning
GAPGPT_MODEL=deepseek-reasoner

# مدل برای تحلیل تصویر (اگر موجود باشد)
GAPGPT_VISION_MODEL=deepseek-reasoner
```

**دریافت API Key:**
1. به https://gapgpt.app بروید
2. ثبت‌نام کنید
3. از بخش API Keys یک کلید ایجاد کنید

**Base URL های جایگزین:**
```env
# گزینه 1 (پیش‌فرض):
GAPGPT_BASE_URL=https://api.gapgpt.app/v1

# گزینه 2 (جایگزین):
GAPGPT_BASE_URL=https://api.gapapi.com/v1
```

**مدل‌های موجود:**
- `deepseek-reasoner`: DeepSeek R1 با قابلیت reasoning (توصیه می‌شود)
- `deepseek-chat`: DeepSeek chat model بدون reasoning
- سایر مدل‌ها بر اساس ارائه‌دهنده

**اگر API key ندارید:**
- بخش AI optimization کار نخواهد کرد
- سایر قسمت‌های برنامه عادی کار می‌کنند

---

### Rate Limiting

```env
# بازه زمانی برای محدودیت درخواست (میلی‌ثانیه)
RATE_LIMIT_WINDOW_MS=900000

# حداکثر تعداد درخواست در هر بازه
RATE_LIMIT_MAX_REQUESTS=100
```

**محاسبه:**
- 1 ثانیه = 1,000 ms
- 1 دقیقه = 60,000 ms
- 15 دقیقه = 900,000 ms (پیش‌فرض)
- 1 ساعت = 3,600,000 ms

**مثال‌ها:**
```env
# 100 درخواست در 15 دقیقه (پیش‌فرض)
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# 50 درخواست در 5 دقیقه (محدودتر)
RATE_LIMIT_WINDOW_MS=300000
RATE_LIMIT_MAX_REQUESTS=50

# 1000 درخواست در 1 ساعت (آزادتر)
RATE_LIMIT_WINDOW_MS=3600000
RATE_LIMIT_MAX_REQUESTS=1000
```

---

### Clustering

```env
# تعداد worker processها
CLUSTER_WORKERS=2
```

**توصیه:**
- Development: 1-2
- Production: تعداد CPU cores (یا cores - 1)
- برای CPU 4-core: 3-4
- برای CPU 8-core: 6-8

**چک کردن تعداد cores:**

**Windows:**
```cmd
echo %NUMBER_OF_PROCESSORS%
```

**Linux/Mac:**
```bash
nproc
# یا
sysctl -n hw.ncpu
```

---

## 2. متغیرهای محیطی Frontend

فایل: `frontend/.env`

```env
# آدرس backend API
VITE_API_URL=http://localhost:3000
```

**فرمت‌های مختلف:**

**Development (local):**
```env
VITE_API_URL=http://localhost:3000
```

**Development (شبکه محلی):**
```env
VITE_API_URL=http://192.168.1.100:3000
```

**Production (same domain):**
```env
VITE_API_URL=/api
```

**Production (subdomain):**
```env
VITE_API_URL=https://api.yourdomain.com
```

**⚠️ نکته مهم:** بعد از تغییر `.env` در frontend، حتماً سرور را restart کنید:
```bash
# Ctrl+C برای توقف
npm run dev  # اجرای مجدد
```

---

## 3. پیکربندی MongoDB

### تنظیمات Connection Pool

برای بهبود performance، در کد backend:

`backend/src/config/database.ts` (اگر وجود دارد) یا در `server.ts`:

```typescript
mongoose.connect(process.env.MONGODB_URI!, {
  maxPoolSize: 10,           // حداکثر تعداد connection همزمان
  minPoolSize: 5,            // حداقل connection pool
  socketTimeoutMS: 45000,    // timeout برای عملیات
  serverSelectionTimeoutMS: 5000, // timeout برای انتخاب server
});
```

### Indexes برای Performance

Indexes در models به صورت خودکار ایجاد می‌شوند، ولی می‌توانید در MongoDB Compass چک کنید:

1. MongoDB Compass را باز کنید
2. به دیتابیس `aipms` بروید
3. Collection ها را باز کنید
4. تب "Indexes" را چک کنید

### Backup دیتابیس

**Export با mongodump:**
```bash
mongodump --uri="mongodb://localhost:27017/aipms" --out=./backup/$(date +%Y%m%d)
```

**Import با mongorestore:**
```bash
mongorestore --uri="mongodb://localhost:27017/aipms" ./backup/20250125/aipms
```

---

## 4. پیکربندی AI Services

### استفاده از مدل‌های مختلف

می‌توانید برای هر سرویس AI مدل خاصی تعیین کنید:

```env
# برای بهینه‌سازی تنظیمات اسلایسر
GAPGPT_MODEL=deepseek-reasoner

# برای آنالیز تصویر (اگر موجود است)
GAPGPT_VISION_MODEL=gpt-4-vision-preview

# یا اگر GapGPT از vision پشتیبانی کند
GAPGPT_VISION_MODEL=deepseek-reasoner
```

### Timeout ها

اگر می‌خواهید timeout های AI را تنظیم کنید، در سرویس‌های AI (مثلاً `aiOptimizer.ts`):

```typescript
const response = await openai.chat.completions.create({
  model: process.env.GAPGPT_MODEL,
  messages: [...],
  temperature: 0.7,
  max_tokens: 2000,
  timeout: 30000,  // 30 ثانیه
});
```

---

## 5. تنظیمات امنیتی

### Helmet.js Headers

برای افزودن security headers (در production):

`backend/src/server.ts`:

```typescript
import helmet from 'helmet';

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));
```

### HTTPS در Production

**با Let's Encrypt (توصیه می‌شود):**

```bash
# نصب certbot
sudo apt-get install certbot

# دریافت certificate
sudo certbot certonly --standalone -d yourdomain.com

# Certificate ها در:
/etc/letsencrypt/live/yourdomain.com/
```

**تنظیم در Node.js:**

```typescript
import https from 'https';
import fs from 'fs';

const options = {
  key: fs.readFileSync('/etc/letsencrypt/live/yourdomain.com/privkey.pem'),
  cert: fs.readFileSync('/etc/letsencrypt/live/yourdomain.com/fullchain.pem'),
};

https.createServer(options, app).listen(443);
```

### Environment Variables در Production

**⚠️ هرگز این کارها را نکنید:**
- فایل `.env` را commit نکنید
- API key ها را در کد قرار ندهید
- secrets را در لاگ‌ها print نکنید

**✅ روش صحیح:**
- از environment variables سیستم استفاده کنید
- از secret management tools استفاده کنید (AWS Secrets Manager، Azure Key Vault)
- فایل `.env` را در `.gitignore` قرار دهید (پیش‌فرض است)

---

## 6. تنظیمات Performance

### Caching با Redis (اختیاری)

برای بهبود performance می‌توانید Redis اضافه کنید:

**نصب Redis:**
```bash
# Windows: از https://github.com/microsoftarchive/redis/releases
# Linux: sudo apt-get install redis-server
# Mac: brew install redis
```

**نصب کتابخانه:**
```bash
npm install ioredis
npm install --save-dev @types/ioredis
```

**استفاده:**
```typescript
import Redis from 'ioredis';

const redis = new Redis({
  host: 'localhost',
  port: 6379,
});

// Cache کردن نتیجه
await redis.set('key', JSON.stringify(data), 'EX', 3600); // 1 ساعت

// خواندن از cache
const cached = await redis.get('key');
if (cached) return JSON.parse(cached);
```

### Compression

برای فشرده‌سازی response ها:

```bash
npm install compression
```

```typescript
import compression from 'compression';
app.use(compression());
```

### Morgan Logging

برای لاگ‌گیری از درخواست‌ها:

```typescript
import morgan from 'morgan';

if (process.env.NODE_ENV === 'production') {
  app.use(morgan('combined')); // Full logging
} else {
  app.use(morgan('dev')); // Colored, short logging
}
```

---

## 7. تنظیمات Production

### فایل `.env.production`

```env
NODE_ENV=production
PORT=3000

MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/aipms

JWT_SECRET=VERY-LONG-RANDOM-STRING-HERE-AT-LEAST-32-CHARS
JWT_EXPIRES_IN=7d

CORS_ORIGIN=https://yourdomain.com

UPLOAD_DIR=/var/www/aipms/uploads
MAX_FILE_SIZE=100000000

GAPGPT_API_KEY=your-production-api-key
GAPGPT_BASE_URL=https://api.gapgpt.app/v1
GAPGPT_MODEL=deepseek-reasoner

RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

CLUSTER_WORKERS=4
```

### Build و Deploy

**Build Backend:**
```bash
cd backend
npm run build
```

**Build Frontend:**
```bash
cd frontend
npm run build
```

**Deploy با PM2:**
```bash
# نصب PM2
npm install -g pm2

# اجرا
cd backend
pm2 start dist/server.js --name aipms-backend -i 4

# Save configuration
pm2 save

# Startup script
pm2 startup
```

### Nginx Configuration (توصیه می‌شود)

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    # Frontend
    location / {
        root /var/www/aipms/frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # File uploads
    client_max_body_size 100M;
}
```

### Monitoring

**PM2 Monitoring:**
```bash
pm2 monit
pm2 logs
pm2 status
```

**Log Files:**
```bash
# تنظیم log rotation
pm2 install pm2-logrotate

# مشاهده logs
pm2 logs --lines 100
```

---

## 📚 منابع بیشتر

- 📖 [راهنمای نصب](../INSTALLATION.md)
- 🪟 [نصب ویندوز](./INSTALLATION_WINDOWS.md)
- 🐛 [Troubleshooting](./TROUBLESHOOTING.md)

---

**موفق باشید!** 🚀
