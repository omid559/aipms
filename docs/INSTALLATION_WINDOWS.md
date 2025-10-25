# راهنمای نصب AIPMS در ویندوز
# AIPMS Installation Guide for Windows

> **ویژه کاربران ویندوز 10 و 11**
>
> این راهنما به صورت گام‌به‌گام و با تصاویر توضیحی، فرآیند نصب را ساده می‌کند.

---

## 📋 فهرست / Table of Contents

1. [آماده‌سازی سیستم](#1-آمادهسازی-سیستم)
2. [نصب Node.js](#2-نصب-nodejs)
3. [نصب MongoDB](#3-نصب-mongodb)
4. [نصب Git](#4-نصب-git)
5. [دانلود و راه‌اندازی پروژه](#5-دانلود-و-راهاندازی-پروژه)
6. [اجرا و تست](#6-اجرا-و-تست)

---

## 1. آماده‌سازی سیستم

### بررسی پیش‌نیازها

1. **سیستم عامل:**
   - Windows 10 (64-bit) یا بالاتر
   - Windows 11 (توصیه می‌شود)

2. **دسترسی Administrator:**
   - برای نصب برخی نرم‌افزارها نیاز به دسترسی مدیریت دارید

3. **آنتی‌ویروس:**
   - ممکن است نیاز باشد پوشه پروژه را به لیست استثناها اضافه کنید

### آماده‌سازی محیط کاری

1. **ایجاد پوشه پروژه:**
   ```
   C:\Users\[YourUsername]\Projects\
   ```

2. **باز کردن PowerShell یا Command Prompt:**
   - کلیک راست روی Start Menu
   - "Windows PowerShell" یا "Command Prompt" را انتخاب کنید
   - یا `Win + R` سپس تایپ کنید: `cmd`

---

## 2. نصب Node.js

Node.js محیط اجرای JavaScript است که برای backend و frontend استفاده می‌شود.

### مرحله 1: دانلود

1. به https://nodejs.org بروید
2. دکمه **"Recommended For Most Users"** (معمولاً سمت چپ) را کلیک کنید
3. نسخه **LTS** را دانلود کنید (توصیه: v20.x)

### مرحله 2: نصب

1. فایل دانلود شده (`.msi`) را اجرا کنید
2. روی **"Next"** کلیک کنید
3. لایسنس را بپذیرید (Accept)
4. مسیر نصب را پیش‌فرض نگه دارید:
   ```
   C:\Program Files\nodejs\
   ```
5. در صفحه "Custom Setup":
   - تمام گزینه‌ها را فعال نگه دارید
   - ✅ **Add to PATH** حتماً فعال باشد
6. در صفحه "Tools for Native Modules":
   - ✅ گزینه "Automatically install the necessary tools" را فعال کنید
   - این ابزارهای اضافی برای compile کردن برخی packages لازم است
7. روی **"Install"** کلیک کنید
8. منتظر بمانید تا نصب کامل شود
9. اگر پنجره PowerShell برای نصب ابزارهای اضافی باز شد، منتظر بمانید

### مرحله 3: تأیید نصب

1. یک **PowerShell یا CMD جدید** باز کنید (قدیمی را ببندید)
2. این دستورات را تست کنید:

```cmd
node --version
```
خروجی باید شبیه این باشد:
```
v20.11.0
```

```cmd
npm --version
```
خروجی باید شبیه این باشد:
```
10.2.4
```

✅ **اگر شماره نسخه نمایش داده شد، نصب موفق بوده است!**

---

## 3. نصب MongoDB

MongoDB پایگاه داده NoSQL است که داده‌های پروژه را ذخیره می‌کند.

### روش 1: نصب MongoDB Community Server (توصیه می‌شود)

#### مرحله 1: دانلود

1. به https://www.mongodb.com/try/download/community بروید
2. تنظیمات را این‌طور انتخاب کنید:
   - **Version:** (آخرین نسخه) - مثلاً 7.0.5
   - **Platform:** Windows
   - **Package:** MSI
3. روی **"Download"** کلیک کنید

#### مرحله 2: نصب

1. فایل `.msi` دانلود شده را اجرا کنید
2. روی **"Next"** کلیک کنید
3. لایسنس را بپذیرید
4. نوع نصب را انتخاب کنید: **"Complete"**
5. در صفحه "Service Configuration":
   - ✅ **"Install MongoDB as a Service"** را حتماً فعال کنید
   - Service Name: `MongoDB`
   - Data Directory: پیش‌فرض نگه دارید
   - Log Directory: پیش‌فرض نگه دارید
   - ✅ **"Run service as Network Service user"** را انتخاب کنید
6. در صفحه بعدی:
   - ✅ **"Install MongoDB Compass"** را فعال کنید
   - این یک GUI tool است که کار با MongoDB را آسان می‌کند
7. روی **"Install"** کلیک کنید
8. منتظر بمانید (ممکن است چند دقیقه طول بکشد)
9. روی **"Finish"** کلیک کنید

#### مرحله 3: تأیید نصب و اجرا

**روش 1: چک کردن Service**

1. کلیدهای `Win + R` را بزنید
2. تایپ کنید: `services.msc` و Enter بزنید
3. در لیست، دنبال **"MongoDB Server"** بگردید
4. مطمئن شوید که:
   - Status: **Running**
   - Startup Type: **Automatic**

اگر Running نیست:
- روی سرویس راست‌کلیک کنید
- **"Start"** را انتخاب کنید

**روش 2: تست با MongoDB Compass**

1. **MongoDB Compass** را باز کنید (از Start Menu)
2. در Connection String این آدرس را وارد کنید:
   ```
   mongodb://localhost:27017
   ```
3. روی **"Connect"** کلیک کنید
4. اگر متصل شد، MongoDB به درستی نصب شده است! ✅

#### مرحله 4: اضافه کردن MongoDB به PATH (اختیاری ولی توصیه می‌شود)

برای استفاده آسان از `mongosh` در terminal:

1. کلیدهای `Win + Pause/Break` را بزنید (یا راست‌کلیک روی "This PC" > Properties)
2. روی **"Advanced system settings"** کلیک کنید
3. روی **"Environment Variables"** کلیک کنید
4. در بخش "System variables"، روی **"Path"** کلیک کنید
5. روی **"Edit"** کلیک کنید
6. روی **"New"** کلیک کنید و این مسیر را اضافه کنید:
   ```
   C:\Program Files\MongoDB\Server\7.0\bin
   ```
7. روی **"OK"** کلیک کنید (سه بار)
8. یک CMD/PowerShell **جدید** باز کنید و تست کنید:
   ```cmd
   mongosh --version
   ```

### روش 2: استفاده از Docker (پیشرفته)

اگر Docker Desktop نصب دارید:

```powershell
docker pull mongo:latest
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

برای چک کردن:
```powershell
docker ps
```

---

## 4. نصب Git

Git برای دانلود و مدیریت کد پروژه استفاده می‌شود.

### مرحله 1: دانلود

1. به https://git-scm.com/download/win بروید
2. دانلود به صورت خودکار شروع می‌شود
3. یا روی **"Click here to download manually"** کلیک کنید

### مرحله 2: نصب

1. فایل `.exe` را اجرا کنید
2. تمام گزینه‌های پیش‌فرض را بپذیرید (Next, Next, ...)
3. نکات مهم:
   - Default editor: می‌توانید Notepad، VS Code یا هر editor دلخواه را انتخاب کنید
   - ✅ **"Git from the command line and also from 3rd-party software"** را انتخاب کنید
   - Line ending: **"Checkout Windows-style, commit Unix-style"**
4. روی **"Install"** کلیک کنید
5. منتظر بمانید تا نصب کامل شود

### مرحله 3: تأیید نصب

یک CMD/PowerShell جدید باز کنید:

```cmd
git --version
```

خروجی:
```
git version 2.43.0.windows.1
```

---

## 5. دانلود و راه‌اندازی پروژه

### مرحله 1: دانلود پروژه

#### روش 1: با Git Clone (توصیه می‌شود)

1. **PowerShell یا CMD** را باز کنید
2. به پوشه دلخواه بروید:
   ```cmd
   cd C:\Users\[YourUsername]\Documents
   ```
3. پروژه را clone کنید:
   ```cmd
   git clone https://github.com/omid559/aipms.git
   ```
4. به پوشه پروژه بروید:
   ```cmd
   cd aipms
   ```

#### روش 2: دانلود ZIP

1. به https://github.com/omid559/aipms بروید
2. روی دکمه سبز **"Code"** کلیک کنید
3. **"Download ZIP"** را انتخاب کنید
4. فایل ZIP را در یک پوشه Extract کنید
5. PowerShell را در آن پوشه باز کنید:
   - در Explorer، در پوشه Extract شده
   - Shift + راست‌کلیک در فضای خالی
   - "Open PowerShell window here" یا "Open in Terminal"

### مرحله 2: نصب Dependencies

این مرحله **مهم‌ترین** بخش است و ممکن است 5-10 دقیقه طول بکشد.

**Terminal 1 - Backend:**
```cmd
cd backend
npm install
```

منتظر بمانید تا تمام package‌ها نصب شوند (500-800 package).

**Terminal 2 - Frontend:**

یک PowerShell/CMD **جدید** باز کنید (Terminal قبلی را نبندید):

```cmd
cd C:\Users\[YourUsername]\Documents\aipms\frontend
npm install
```

منتظر بمانید تا نصب کامل شود (300-500 package).

### مرحله 3: پیکربندی Environment Variables

#### Backend Environment:

1. در File Explorer به پوشه `backend` بروید
2. فایل `.env.example` را کپی کنید
3. نام کپی را به `.env` تغییر دهید
4. فایل `.env` را با Notepad باز کنید
5. این محتوا را در آن قرار دهید:

```env
PORT=3000
NODE_ENV=development

MONGODB_URI=mongodb://localhost:27017/aipms

JWT_SECRET=CHANGE-THIS-TO-A-RANDOM-32-CHARACTER-STRING
JWT_EXPIRES_IN=7d

CORS_ORIGIN=http://localhost:5173

UPLOAD_DIR=uploads
MAX_FILE_SIZE=50000000

GAPGPT_API_KEY=your-api-key-here-if-you-have-one
GAPGPT_BASE_URL=https://api.gapgpt.app/v1
GAPGPT_MODEL=deepseek-reasoner
GAPGPT_VISION_MODEL=deepseek-reasoner

RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

CLUSTER_WORKERS=2
```

**نکته مهم:** اگر API key ندارید، همین‌طور بگذارید. فقط بخش AI optimization کار نخواهد کرد.

#### Frontend Environment:

1. در File Explorer به پوشه `frontend` بروید
2. یک فایل جدید ایجاد کنید: `.env`
3. با Notepad باز کنید و این خط را بنویسید:

```env
VITE_API_URL=http://localhost:3000
```

4. ذخیره کنید

### مرحله 4: راه‌اندازی دیتابیس

1. مطمئن شوید MongoDB در حال اجرا است (سرویس MongoDB در services.msc)
2. در terminal backend (که قبلاً باز کردید):

```cmd
npm run seed
```

**خروجی موفق:**
```
🌱 Starting database seeding...
✅ Connected to MongoDB
✅ Database seeded successfully!
Created:
- Admin user: admin@aipms.local
- 3 printers
- 4 materials
- 1 slicer configuration
```

اطلاعات ادمین پیش‌فرض:
```
Email: admin@aipms.local
Password: Admin123!@#
```

---

## 6. اجرا و تست

### مرحله 1: اجرای Backend

در terminal backend:

```cmd
npm run dev
```

**خروجی موفق:**
```
🚀 Server is running on port 3000
✅ MongoDB connected successfully
✅ Database: aipms
🔧 Running in development mode
```

⚠️ **این terminal را باز نگه دارید!**

### مرحله 2: اجرای Frontend

در terminal frontend:

```cmd
npm run dev
```

**خروجی موفق:**
```
VITE v5.x.x  ready in xxx ms

➜  Local:   http://localhost:5173/
➜  Network: http://192.168.1.x:5173/
➜  press h + enter to show help
```

⚠️ **این terminal را هم باز نگه دارید!**

### مرحله 3: باز کردن برنامه

1. مرورگر (Chrome، Edge، Firefox) را باز کنید
2. به این آدرس بروید:
   ```
   http://localhost:5173
   ```

3. **باید صفحه اصلی AIPMS را ببینید!** 🎉

### مرحله 4: تست لاگین

1. روی دکمه **"ورود / ثبت‌نام"** کلیک کنید
2. اطلاعات ادمین را وارد کنید:
   - Email: `admin@aipms.local`
   - Password: `Admin123!@#`
3. روی **"ورود"** کلیک کنید
4. باید وارد داشبورد شوید

### مرحله 5: تست پنل مدیریت

1. بعد از لاگین، در گوشه بالا سمت راست
2. دکمه **بنفش** با آیکون سپر و متن "پنل مدیریت" را ببینید
3. روی آن کلیک کنید
4. 3 تب را ببینید:
   - مدیریت پرینترها
   - مدیریت متریال‌ها
   - تنظیمات اسلایسر

✅ **تبریک! نصب با موفقیت انجام شد!** 🎉

---

## 🔧 نکات و ترفندها

### نحوه بستن برنامه

برای توقف سرورها:
1. در هر terminal که سرور در آن اجرا است
2. کلیدهای `Ctrl + C` را بزنید
3. اگر پرسید "Terminate batch job (Y/N)?", تایپ کنید: `Y`

### نحوه اجرای مجدد

هر بار که می‌خواهید برنامه را اجرا کنید:

**Terminal 1:**
```cmd
cd C:\Users\[YourUsername]\Documents\aipms\backend
npm run dev
```

**Terminal 2:**
```cmd
cd C:\Users\[YourUsername]\Documents\aipms\frontend
npm run dev
```

### میانبر برای اجرای سریع

می‌توانید یک فایل Batch Script بسازید:

**start-aipms.bat:**
```batch
@echo off
echo Starting AIPMS...

start cmd /k "cd /d C:\Users\[YourUsername]\Documents\aipms\backend && npm run dev"
start cmd /k "cd /d C:\Users\[YourUsername]\Documents\aipms\frontend && npm run dev"

timeout /t 5
start http://localhost:5173

echo AIPMS Started!
```

این فایل را در پوشه پروژه قرار دهید و دوبار کلیک کنید!

---

## ❌ رفع مشکلات رایج

### مشکل 1: MongoDB اجرا نمی‌شود

**خطا:**
```
MongooseServerSelectionError: connect ECONNREFUSED 127.0.0.1:27017
```

**راه حل:**
1. `Win + R` → `services.msc`
2. "MongoDB Server" را پیدا کنید
3. راست‌کلیک → Start
4. اگر error داد، راست‌کلیک → Properties → Startup type → Automatic
5. دوباره Start کنید

### مشکل 2: Port 3000 in use

**خطا:**
```
Error: listen EADDRINUSE: address already in use :::3000
```

**راه حل:**
```cmd
netstat -ano | findstr :3000
```

پیدا کردن PID (آخرین ستون) و kill کردن:
```cmd
taskkill /PID [شماره PID] /F
```

یا پورت را در `.env` تغییر دهید:
```env
PORT=3001
```

### مشکل 3: npm install خطا می‌دهد

**راه حل:**
```cmd
# پاک کردن cache
npm cache clean --force

# حذف node_modules
rmdir /s /q node_modules
del package-lock.json

# نصب مجدد
npm install
```

### مشکل 4: PowerShell execution policy error

**خطا:**
```
cannot be loaded because running scripts is disabled on this system
```

**راه حل:**
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### مشکل 5: صفحه سفید در مرورگر

**راه حل:**
1. F12 را بزنید (Developer Tools)
2. تب Console را باز کنید
3. خطاها را بررسی کنید
4. مطمئن شوید backend در حال اجرا است
5. `frontend\.env` را چک کنید

---

## 📚 منابع بیشتر

- 📖 [راهنمای نصب عمومی](../INSTALLATION.md)
- 🔧 [راهنمای پیکربندی](./CONFIGURATION.md)
- 🐛 [Troubleshooting کامل](./TROUBLESHOOTING.md)

---

**موفق باشید!** 🚀
