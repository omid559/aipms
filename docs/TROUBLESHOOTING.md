# راهنمای رفع مشکلات AIPMS
# AIPMS Troubleshooting Guide

> راهنمای جامع برای حل مشکلات رایج در نصب، پیکربندی و اجرای AIPMS

---

## 📋 فهرست / Table of Contents

1. [مشکلات نصب](#1-مشکلات-نصب)
2. [مشکلات MongoDB](#2-مشکلات-mongodb)
3. [مشکلات Backend](#3-مشکلات-backend)
4. [مشکلات Frontend](#4-مشکلات-frontend)
5. [مشکلات API و Network](#5-مشکلات-api-و-network)
6. [مشکلات Authentication](#6-مشکلات-authentication)
7. [مشکلات AI Services](#7-مشکلات-ai-services)
8. [مشکلات Performance](#8-مشکلات-performance)
9. [ابزارهای Debugging](#9-ابزارهای-debugging)

---

## 1. مشکلات نصب

### ❌ npm install خطا می‌دهد

**خطاهای رایج:**
```
npm ERR! code EACCES
npm ERR! syscall access
npm ERR! path /usr/local/lib/node_modules
```

**راه حل 1: اجرا با دسترسی مناسب**
```bash
# Linux/Mac:
sudo npm install

# Windows: PowerShell را به عنوان Administrator اجرا کنید
```

**راه حل 2: پاک کردن cache و نصب مجدد**
```bash
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

**راه حل 3: بررسی نسخه Node.js**
```bash
node --version
# باید v18.x یا v20.x باشد
```

اگر نسخه قدیمی دارید، از https://nodejs.org آخرین LTS را نصب کنید.

---

### ❌ Python required error (Windows)

**خطا:**
```
gyp ERR! stack Error: Can't find Python executable "python"
```

**راه حل:**
```bash
npm install --global windows-build-tools
```

یا Python 3.x را از python.org نصب کنید.

---

### ❌ tsx: command not found

**خطا:**
```
sh: tsx: command not found
```

**راه حل:**
```bash
cd backend
npm install --save-dev tsx

# یا globally:
npm install -g tsx
```

---

## 2. مشکلات MongoDB

### ❌ MongoDB اجرا نمی‌شود

**خطا:**
```
MongooseServerSelectionError: connect ECONNREFUSED 127.0.0.1:27017
```

**راه حل ویندوز:**
```cmd
# روش 1: از طریق Services
Win + R → services.msc → MongoDB Server → Start

# روش 2: دستی
mongod --dbpath C:\data\db

# روش 3: نصب مجدد به عنوان Service
sc delete MongoDB
# سپس MongoDB را مجدداً نصب کنید با گزینه "Install as Service"
```

**راه حل Linux:**
```bash
sudo systemctl status mongod
sudo systemctl start mongod
sudo systemctl enable mongod  # برای اجرای خودکار
```

**راه حل Mac:**
```bash
brew services list
brew services start mongodb-community
```

**راه حل Docker:**
```bash
# چک کردن container
docker ps -a

# اجرای مجدد
docker start mongodb

# یا ایجاد container جدید
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

---

### ❌ Authentication failed

**خطا:**
```
MongoServerError: Authentication failed
```

**راه حل:**

اگر MongoDB با authentication نصب شده:

```env
# در .env:
MONGODB_URI=mongodb://username:password@localhost:27017/aipms?authSource=admin
```

اگر نیاز به ایجاد user دارید:
```javascript
// در mongosh:
use admin
db.createUser({
  user: "aipms_user",
  pwd: "secure_password",
  roles: ["readWrite", "dbAdmin"]
})

use aipms
db.createUser({
  user: "aipms_user",
  pwd: "secure_password",
  roles: ["readWrite"]
})
```

---

### ❌ Seed script خطا می‌دهد

**خطا:**
```
User validation failed: email: Please enter a valid email
```

**راه حل:**

این خطا در نسخه‌های قدیمی وجود دارد. به‌روزرسانی کنید:

```bash
git pull origin main
cd backend
npm install
npm run seed
```

---

### ❌ Database already exists

**خطا:**
```
E11000 duplicate key error collection
```

**راه حل:**

دیتابیس قبلاً seed شده. اگر می‌خواهید دوباره seed کنید:

**حذف دیتابیس:**
```javascript
// در MongoDB Compass یا mongosh:
use aipms
db.dropDatabase()
```

سپس seed را دوباره اجرا کنید:
```bash
npm run seed
```

---

## 3. مشکلات Backend

### ❌ Port already in use

**خطا:**
```
Error: listen EADDRINUSE: address already in use :::3000
```

**راه حل 1: تغییر پورت**

در `backend/.env`:
```env
PORT=3001
```

**راه حل 2: Kill کردن process**

**Windows:**
```cmd
netstat -ano | findstr :3000
taskkill /PID [شماره PID] /F
```

**Linux/Mac:**
```bash
lsof -ti:3000 | xargs kill -9

# یا
sudo kill -9 $(sudo lsof -t -i:3000)
```

---

### ❌ Cannot find module

**خطا:**
```
Error: Cannot find module '@/types/slicing'
```

**راه حل:**

```bash
cd backend
rm -rf node_modules package-lock.json
npm install
npm run build  # اگر TypeScript است
```

---

### ❌ JWT_SECRET not defined

**خطا:**
```
TypeError: Cannot read property 'sign' of undefined
```

**راه حل:**

فایل `.env` را چک کنید:
```env
JWT_SECRET=your-secret-key-here
```

مطمئن شوید:
- فایل `.env` در پوشه `backend` است
- نام دقیق فایل `.env` است (نه `.env.txt`)
- server را restart کرده‌اید

---

### ❌ CORS error

**خطا (در browser console):**
```
Access to XMLHttpRequest at 'http://localhost:3000/api/...' from origin
'http://localhost:5173' has been blocked by CORS policy
```

**راه حل:**

در `backend/.env`:
```env
CORS_ORIGIN=http://localhost:5173
```

اگر چند origin دارید:
```env
CORS_ORIGIN=http://localhost:5173,http://localhost:3001
```

Server را restart کنید.

---

## 4. مشکلات Frontend

### ❌ صفحه سفید یا خالی

**علت‌های ممکن:**
1. Backend در حال اجرا نیست
2. آدرس API اشتباه است
3. خطای JavaScript در کد

**راه حل:**

**1. چک کردن Console:**
```
F12 → Console tab
```

**2. چک کردن Network:**
```
F12 → Network tab → XHR
```

**3. چک کردن .env:**
```env
# frontend/.env
VITE_API_URL=http://localhost:3000
```

**4. Clear کردن Cache:**
```
Ctrl + Shift + Delete → Clear browsing data
```

**5. Build مجدد:**
```bash
cd frontend
rm -rf node_modules .vite dist
npm install
npm run dev
```

---

### ❌ Vite: Failed to resolve import

**خطا:**
```
Failed to resolve import "@/components/..."
```

**راه حل:**

چک کنید `vite.config.ts` یا `tsconfig.json` alias ها را درست تعریف کرده:

```typescript
// vite.config.ts
export default defineConfig({
  resolve: {
    alias: {
      '@': '/src',
    },
  },
});
```

---

### ❌ React Hook error

**خطا:**
```
Invalid hook call. Hooks can only be called inside of the body of a function component
```

**راه حل:**

ممکن است دو نسخه React نصب شده باشد:

```bash
cd frontend
npm ls react

# اگر چند نسخه دارید:
npm dedupe
npm install
```

---

## 5. مشکلات API و Network

### ❌ 404 Not Found

**خطا:**
```
GET http://localhost:3000/api/profile/materials 404 (Not Found)
```

**راه حل:**

1. **مطمئن شوید backend اجرا است:**
```bash
curl http://localhost:3000/api/health
```

2. **Route را چک کنید:**

در backend code، مطمئن شوید route define شده:
```typescript
app.use('/api/profile', profileRouter);
```

3. **Restart کنید:**
```bash
# Backend را Ctrl+C و دوباره:
npm run dev
```

---

### ❌ 500 Internal Server Error

**راه حل:**

1. **چک کردن Backend Logs:**

در terminal که backend اجرا شده، خطا را ببینید.

2. **چک کردن MongoDB:**
```bash
mongosh mongodb://localhost:27017
```

3. **چک کردن Environment Variables:**

تمام متغیرهای لازم در `.env` هستند؟

---

### ❌ Request Timeout

**خطا:**
```
Error: timeout of 30000ms exceeded
```

**راه حل:**

1. **افزایش timeout:**

در frontend (axios config):
```typescript
axios.defaults.timeout = 60000; // 60 seconds
```

2. **بهینه‌سازی Query:**

اگر query به دیتابیس کند است، index اضافه کنید.

3. **چک کردن Network:**

```bash
ping localhost
traceroute api.yourdomain.com
```

---

## 6. مشکلات Authentication

### ❌ لاگین نمی‌شود

**خطا:**
```
Invalid credentials
```

**راه حل:**

1. **چک کردن اطلاعات ادمین پیش‌فرض:**
```
Email: admin@aipms.local
Password: Admin123!@#
```

2. **Seed مجدد:**
```bash
cd backend
npm run seed
```

3. **چک کردن دیتابیس:**

در MongoDB Compass:
```javascript
use aipms
db.users.find({email: "admin@aipms.local"})
```

---

### ❌ Token expired

**خطا:**
```
jwt expired
```

**راه حل:**

1. **Logout و Login مجدد**

2. **افزایش مدت token:**

در `backend/.env`:
```env
JWT_EXPIRES_IN=30d
```

3. **پاک کردن localStorage:**

در browser console:
```javascript
localStorage.clear()
```

---

### ❌ Unauthorized (401)

**خطا:**
```
401 Unauthorized
```

**راه حل:**

1. **چک کردن Token:**

در browser console:
```javascript
console.log(localStorage.getItem('token'))
```

2. **Login مجدد**

3. **چک کردن Backend:**

مطمئن شوید middleware authentication صحیح است.

---

## 7. مشکلات AI Services

### ❌ AI optimization کار نمی‌کند

**خطا:**
```
Error optimizing with AI
```

**راه حل:**

1. **چک کردن API Key:**

در `backend/.env`:
```env
GAPGPT_API_KEY=sk-xxxxxx
```

2. **تست API Key:**
```bash
curl https://api.gapgpt.app/v1/models \
  -H "Authorization: Bearer YOUR_API_KEY"
```

3. **چک کردن Quota:**

ممکن است quota API شما تمام شده باشد.

4. **چک کردن Model Name:**
```env
GAPGPT_MODEL=deepseek-reasoner
```

---

### ❌ Vision analysis failed

**راه حل:**

Vision ممکن است توسط GapGPT پشتیبانی نشود. برای تست:

```env
# استفاده از مدل متنی برای vision
GAPGPT_VISION_MODEL=deepseek-reasoner

# یا اگر GapGPT از GPT-4 Vision پشتیبانی کند:
GAPGPT_VISION_MODEL=gpt-4-vision-preview
```

---

## 8. مشکلات Performance

### ❌ برنامه خیلی کند است

**راه حل:**

1. **چک کردن CPU و RAM:**

**Windows:**
```
Task Manager → Performance
```

**Linux:**
```bash
top
htop
```

2. **افزایش Cluster Workers:**

در `backend/.env`:
```env
CLUSTER_WORKERS=4
```

3. **اضافه کردن Index به MongoDB:**

```javascript
// در MongoDB Compass → Collection → Indexes
db.users.createIndex({email: 1})
db.slicingJobs.createIndex({createdAt: -1})
```

4. **استفاده از Redis برای Caching:**

```bash
npm install ioredis
```

---

### ❌ Memory Leak

**علائم:**
- RAM استفاده شده مدام افزایش می‌یابد
- بعد از مدتی برنامه crash می‌کند

**راه حل:**

1. **چک کردن با Node.js profiler:**
```bash
node --inspect backend/dist/server.js
```

2. **محدود کردن حافظه:**
```bash
node --max-old-space-size=4096 backend/dist/server.js
```

3. **استفاده از PM2 با restart:**
```bash
pm2 start server.js --max-memory-restart 1G
```

---

## 9. ابزارهای Debugging

### چک کردن سلامت سیستم

**Backend Health:**
```bash
curl http://localhost:3000/api/health
```

**MongoDB:**
```bash
mongosh --eval "db.adminCommand('ping')"
```

**Frontend:**
```
http://localhost:5173
```

---

### Logging

**افزودن log در Backend:**

```typescript
console.log('DEBUG:', {variable, data});
console.error('ERROR:', error);
```

**مشاهده logs در Production:**
```bash
pm2 logs aipms-backend --lines 100
```

---

### Network Debugging

**چک کردن Connection:**
```bash
# Backend پاسخ می‌دهد؟
curl -I http://localhost:3000

# MongoDB در دسترس است؟
nc -zv localhost 27017

# DNS کار می‌کند؟
nslookup yourdomain.com
```

---

### Browser DevTools

**Console:**
```
F12 → Console
```

**Network:**
```
F12 → Network → XHR
```

**Application (localStorage):**
```
F12 → Application → Local Storage
```

---

## 🆘 همچنان مشکل دارید؟

اگر مشکل شما حل نشد:

1. **GitHub Issues:**
   - به https://github.com/omid559/aipms/issues بروید
   - یک issue جدید ایجاد کنید
   - اطلاعات زیر را بدهید:
     - سیستم عامل و نسخه
     - Node.js version
     - MongoDB version
     - پیام خطای کامل
     - مراحلی که انجام دادید

2. **Logs را بررسی کنید:**
```bash
# Backend logs
npm run dev  # و خطاها را کپی کنید

# MongoDB logs (Windows)
C:\Program Files\MongoDB\Server\7.0\log\mongod.log

# MongoDB logs (Linux)
/var/log/mongodb/mongod.log
```

3. **Stack Trace:**

خطای کامل با stack trace را آماده کنید.

---

**موفق باشید!** 🚀
