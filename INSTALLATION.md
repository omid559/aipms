# راهنمای نصب کامل AIPMS
# Complete Installation Guide for AIPMS

> **نسخه:** 1.0.0
> **آخرین به‌روزرسانی:** 2025
> **سطح:** مبتدی تا پیشرفته

این راهنما شما را مرحله به مرحله برای نصب و راه‌اندازی سیستم AIPMS راهنمایی می‌کند.

This guide will walk you through the complete installation and setup of the AIPMS system.

---

## 📋 فهرست مطالب / Table of Contents

1. [پیش‌نیازها](#1-پیشنیازها--prerequisites)
2. [نصب MongoDB](#2-نصب-mongodb)
3. [نصب Node.js و NPM](#3-نصب-nodejs-و-npm)
4. [دانلود پروژه](#4-دانلود-پروژه)
5. [نصب Dependencies](#5-نصب-dependencies)
6. [پیکربندی محیط](#6-پیکربندی-محیط)
7. [راه‌اندازی دیتابیس](#7-راهاندازی-دیتابیس)
8. [اجرای برنامه](#8-اجرای-برنامه)
9. [تست نصب](#9-تست-نصب)
10. [رفع مشکلات](#10-رفع-مشکلات)

---

## 1. پیش‌نیازها / Prerequisites

قبل از شروع، مطمئن شوید سیستم شما این موارد را دارد:

### سیستم عامل / Operating System
- ✅ Windows 10/11 (64-bit)
- ✅ macOS 12+
- ✅ Linux (Ubuntu 20.04+, Debian 11+)

### نرم‌افزارهای مورد نیاز / Required Software
- **Node.js**: نسخه 18.x یا 20.x (LTS توصیه می‌شود)
- **MongoDB**: نسخه 6.0 یا بالاتر
- **Git**: برای دانلود پروژه
- **یک Text Editor**: VS Code، Sublime، یا Notepad++

### سخت‌افزار توصیه شده / Recommended Hardware
- **CPU**: 2 cores یا بیشتر
- **RAM**: حداقل 4GB (8GB توصیه می‌شود)
- **Disk**: 2GB فضای خالی
- **Network**: اتصال اینترنت برای دانلود dependencies

---

## 2. نصب MongoDB

MongoDB پایگاه داده اصلی این پروژه است.

### ویندوز / Windows

#### روش 1: نصب Community Server (توصیه می‌شود)

1. **دانلود:**
   - به https://www.mongodb.com/try/download/community بروید
   - Platform: Windows
   - Package: MSI
   - روی **Download** کلیک کنید

2. **نصب:**
   - فایل MSI را اجرا کنید
   - "Complete" setup را انتخاب کنید
   - ✅ گزینه **"Install MongoDB as a Service"** را حتماً فعال کنید
   - ✅ گزینه **"Install MongoDB Compass"** را فعال کنید (GUI tool)
   - روی "Install" کلیک کنید

3. **تأیید نصب:**
   ```cmd
   # باز کردن Command Prompt و تست:
   mongo --version
   ```

#### روش 2: استفاده از Docker

```bash
docker pull mongo:latest
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

### macOS

```bash
# با Homebrew:
brew tap mongodb/brew
brew install mongodb-community@7.0

# شروع سرویس:
brew services start mongodb-community@7.0

# تست:
mongosh --version
```

### Linux (Ubuntu/Debian)

```bash
# Import MongoDB GPG Key
wget -qO - https://www.mongodb.org/static/pgp/server-7.0.asc | sudo apt-key add -

# Add repository
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list

# Install
sudo apt-get update
sudo apt-get install -y mongodb-org

# Start service
sudo systemctl start mongod
sudo systemctl enable mongod

# Test
mongosh --version
```

### تست اتصال MongoDB

**MongoDB Compass را باز کنید** و به این آدرس متصل شوید:
```
mongodb://localhost:27017
```

اگر اتصال موفق بود، MongoDB آماده است! ✅

---

## 3. نصب Node.js و NPM

### ویندوز / Windows

1. **دانلود:**
   - به https://nodejs.org بروید
   - نسخه **LTS** (Long Term Support) را انتخاب کنید
   - توصیه: Node.js 20.x LTS

2. **نصب:**
   - فایل `.msi` را اجرا کنید
   - تمام گزینه‌های پیش‌فرض را بپذیرید
   - ✅ گزینه **"Automatically install necessary tools"** را فعال کنید

3. **تأیید نصب:**
   ```cmd
   node --version
   npm --version
   ```

   خروجی باید شبیه این باشد:
   ```
   v20.11.0
   10.2.4
   ```

### macOS

```bash
# با Homebrew:
brew install node@20

# یا دانلود از nodejs.org
```

### Linux

```bash
# Ubuntu/Debian:
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# تست:
node --version
npm --version
```

---

## 4. دانلود پروژه

### روش 1: با Git Clone (توصیه می‌شود)

```bash
# باز کردن terminal/cmd در پوشه دلخواه
cd C:\Users\YourName\Documents  # Windows
cd ~/Documents                   # macOS/Linux

# Clone کردن پروژه
git clone https://github.com/omid559/aipms.git

# ورود به پوشه پروژه
cd aipms
```

### روش 2: دانلود ZIP

1. به https://github.com/omid559/aipms بروید
2. روی **Code** > **Download ZIP** کلیک کنید
3. فایل ZIP را Extract کنید
4. Terminal را در پوشه extract شده باز کنید

---

## 5. نصب Dependencies

این مرحله ممکن است چند دقیقه طول بکشد.

### نصب Backend Dependencies

```bash
cd backend
npm install
```

**نکته:** اگر خطای permission دریافت کردید (Linux/Mac):
```bash
sudo npm install
```

### نصب Frontend Dependencies

یک Terminal **جدید** باز کنید:

```bash
cd frontend
npm install
```

### تأیید نصب

بعد از نصب موفق، این فایل‌ها باید وجود داشته باشند:
- ✅ `backend/node_modules/` (حدود 500-800 package)
- ✅ `frontend/node_modules/` (حدود 300-500 package)

---

## 6. پیکربندی محیط

### ایجاد فایل Backend `.env`

1. به پوشه `backend` بروید
2. فایل `.env.example` را کپی کنید و نام آن را به `.env` تغییر دهید:

**ویندوز (Command Prompt):**
```cmd
cd backend
copy .env.example .env
```

**macOS/Linux:**
```bash
cd backend
cp .env.example .env
```

3. فایل `.env` را با یک text editor باز کنید و مقادیر را تنظیم کنید:

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/aipms

# JWT Configuration - امنیتی! حتماً تغییر دهید
JWT_SECRET=your-super-secret-jwt-key-CHANGE-THIS-IN-PRODUCTION
JWT_EXPIRES_IN=7d

# CORS Configuration
CORS_ORIGIN=http://localhost:5173

# File Upload Configuration
UPLOAD_DIR=uploads
MAX_FILE_SIZE=50000000

# GapGPT AI Service Configuration
GAPGPT_API_KEY=your-gapgpt-api-key-here
GAPGPT_BASE_URL=https://api.gapgpt.app/v1

# Model Configuration
GAPGPT_MODEL=deepseek-reasoner
GAPGPT_VISION_MODEL=deepseek-reasoner

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Clustering
CLUSTER_WORKERS=2
```

#### تنظیمات مهم:

**1. JWT_SECRET:**
- این یک کلید امنیتی است
- حتماً مقدار پیش‌فرض را تغییر دهید
- پیشنهاد: یک رشته رندوم 32+ کاراکتری

**2. GAPGPT_API_KEY:**
- API key خود را از https://gapgpt.app دریافت کنید
- اگر ندارید، بخش AI optimization کار نخواهد کرد

**3. MONGODB_URI:**
- اگر MongoDB روی سیستم محلی است: `mongodb://localhost:27017/aipms`
- اگر از MongoDB Atlas استفاده می‌کنید: آدرس connection string را جایگزین کنید

### ایجاد فایل Frontend `.env`

1. به پوشه `frontend` بروید
2. فایل `.env` ایجاد کنید:

```bash
cd frontend
notepad .env  # Windows
nano .env     # macOS/Linux
```

3. این محتوا را در آن قرار دهید:

```env
VITE_API_URL=http://localhost:3000
```

---

## 7. راه‌اندازی دیتابیس

### اطمینان از اجرای MongoDB

#### ویندوز:
```cmd
# روش 1: چک کردن سرویس
Win + R → services.msc → MongoDB Server → مطمئن شوید "Running" است

# روش 2: اجرای دستی (اگر سرویس نیست)
mongod
```

#### macOS:
```bash
brew services list
# باید mongodb-community را Running ببینید

# اگر نیست:
brew services start mongodb-community
```

#### Linux:
```bash
sudo systemctl status mongod

# اگر متوقف است:
sudo systemctl start mongod
```

### Seed کردن دیتابیس

این دستور دیتابیس اولیه را می‌سازد:

```bash
cd backend
npm run seed
```

**خروجی موفق:**
```
🌱 Starting database seeding...
✅ Connected to MongoDB
✅ Database seeded successfully!
Created:
- Admin user: admin@aipms.local
- 3 printers (Ender 3 V2, Prusa i3 MK3S+, CR-10)
- 4 materials (PLA, ABS, PETG, TPU)
- 1 slicer configuration (70+ settings)
```

#### اطلاعات کاربر ادمین پیش‌فرض:

```
Email: admin@aipms.local
Password: Admin123!@#
```

⚠️ **امنیتی:** بعد از اولین لاگین، حتماً رمز عبور را تغییر دهید!

---

## 8. اجرای برنامه

### روش 1: اجرای Development Mode (توصیه برای توسعه)

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

خروجی موفق:
```
🚀 Server is running on port 3000
✅ MongoDB connected successfully
✅ Database: aipms
🔧 Running in development mode with 2 workers
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

خروجی موفق:
```
VITE v5.x.x  ready in xxx ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
```

### روش 2: اجرای Production Mode

**Build کردن:**
```bash
# Backend
cd backend
npm run build

# Frontend
cd frontend
npm run build
```

**اجرا:**
```bash
# Backend
cd backend
npm start

# Frontend را با یک web server مثل nginx یا serve سرو کنید:
npm install -g serve
serve -s frontend/dist -p 3001
```

### روش 3: استفاده از PM2 (Production)

```bash
# نصب PM2
npm install -g pm2

# اجرای backend
cd backend
pm2 start npm --name "aipms-backend" -- start

# مشاهده logs
pm2 logs aipms-backend

# مدیریت
pm2 status
pm2 restart aipms-backend
pm2 stop aipms-backend
```

---

## 9. تست نصب

### 1. دسترسی به Frontend

مرورگر را باز کنید و به این آدرس بروید:
```
http://localhost:5173
```

**باید صفحه اصلی AIPMS را ببینید!** 🎉

### 2. تست لاگین

1. روی دکمه **"ورود / ثبت‌نام"** کلیک کنید
2. از اطلاعات ادمین استفاده کنید:
   - Email: `admin@aipms.local`
   - Password: `Admin123!@#`
3. روی **"ورود"** کلیک کنید

### 3. تست پنل مدیریت

بعد از لاگین، در گوشه بالا سمت راست:
- باید دکمه **"پنل مدیریت"** (بنفش رنگ با آیکون سپر) را ببینید
- روی آن کلیک کنید
- 3 تب را ببینید: پرینترها، متریال‌ها، تنظیمات اسلایسر

### 4. تست Backend API

```bash
# تست health endpoint
curl http://localhost:3000/api/health

# تست profile endpoints
curl http://localhost:3000/api/profile/materials
curl http://localhost:3000/api/profile/printers
```

---

## 10. رفع مشکلات

### ❌ خطا: MongoDB connection failed

**علت:** MongoDB اجرا نیست یا روی پورت دیگری است.

**راه حل:**
```bash
# ویندوز
services.msc → MongoDB Server → Start

# macOS
brew services start mongodb-community

# Linux
sudo systemctl start mongod

# تست اتصال
mongosh mongodb://localhost:27017
```

### ❌ خطا: Port 3000 is already in use

**راه حل 1:** پورت را در `.env` تغییر دهید:
```env
PORT=3001
```

**راه حل 2:** پروسه‌ای که پورت را اشغال کرده را ببندید:

```bash
# ویندوز
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# macOS/Linux
lsof -ti:3000 | xargs kill -9
```

### ❌ خطا: Cannot find module 'xyz'

**راه حل:**
```bash
# پاک کردن node_modules و نصب مجدد
rm -rf node_modules package-lock.json
npm install

# یا در ویندوز
rmdir /s /q node_modules
del package-lock.json
npm install
```

### ❌ خطا: User validation failed: email

**راه حل:** این خطا برطرف شده است. اگر نسخه قدیمی دارید:
```bash
git pull origin main
npm install
```

### ❌ خطا: CORS error در مرورگر

**راه حل:** مطمئن شوید:
1. Backend در حال اجرا است (`http://localhost:3000`)
2. فایل `frontend/.env` دارای `VITE_API_URL=http://localhost:3000` است
3. Frontend را restart کنید

### ❌ صفحه سفید یا خالی

**راه حل:**
1. Console مرورگر را باز کنید (F12)
2. خطاها را بررسی کنید
3. مطمئن شوید backend و frontend هر دو اجرا هستند

---

## 🎯 نکات پایانی

### پس از نصب موفق:

✅ **امنیت:**
- JWT_SECRET را تغییر دهید
- رمز عبور ادمین را تغییر دهید
- برای production از HTTPS استفاده کنید

✅ **بهینه‌سازی:**
- برای production از PM2 استفاده کنید
- MongoDB را optimize کنید
- Redis برای caching اضافه کنید

✅ **Backup:**
- دیتابیس را به صورت دوره‌ای backup بگیرید
- فایل `.env` را در جای امنی نگه دارید

### منابع بیشتر:

- 📚 [مستندات API](./docs/API.md)
- 🔧 [راهنمای پیکربندی](./docs/CONFIGURATION.md)
- 🐛 [Troubleshooting کامل](./docs/TROUBLESHOOTING.md)
- 🪟 [راهنمای نصب ویندوز](./docs/INSTALLATION_WINDOWS.md)

---

## 🆘 نیاز به کمک؟

اگر با مشکلی مواجه شدید:

1. ✅ [Troubleshooting Guide](./docs/TROUBLESHOOTING.md) را مطالعه کنید
2. 📝 Issue در GitHub ایجاد کنید
3. 💬 در Discussions سوال بپرسید

---

**موفق باشید!** 🚀

تیم AIPMS
