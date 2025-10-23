# AIPMS - AI-Powered 3D Print Management System
# سیستم مدیریت پرینت سه‌بعدی با هوش مصنوعی

![AIPMS](https://img.shields.io/badge/AIPMS-v1.0.0-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)
![React](https://img.shields.io/badge/React-18.2-blue)
![Node.js](https://img.shields.io/badge/Node.js-20+-green)
![Security](https://img.shields.io/badge/Security-Hardened-green)
![License](https://img.shields.io/badge/License-MIT-yellow)

یک اپلیکیشن تحت وب پیشرفته برای مدیریت و بهینه‌سازی فرآیند اسلایس فایل‌های سه‌بعدی با استفاده از هوش مصنوعی.

A professional web application for managing and optimizing 3D file slicing with AI-powered settings.

---

## 📖 فهرست مطالب / Table of Contents

- [ویژگی‌های کلیدی](#-ویژگیهای-کلیدی--key-features)
- [نصب و راه‌اندازی](#-نصب-و-راهاندازی--installation)
- [نحوه استفاده](#-نحوه-استفاده--usage-guide)
- [API Documentation](#-api-documentation)
- [امنیت](#-امنیت--security)
- [معماری سیستم](#️-معماری-سیستم--system-architecture)
- [تکنولوژی‌ها](#️-تکنولوژیهای-استفاده-شده--technology-stack)
- [مستندات](#-مستندات--documentation)
- [مشارکت](#-مشارکت--contributing)

---

## ✨ ویژگی‌های کلیدی / Key Features

### 🤖 بهینه‌سازی هوشمند با AI

#### تحلیل خودکار مدل
- **تحلیل واقعی فایل STL** با node-stl parser
- محاسبه دقیق حجم با signed volume method
- اندازه‌گیری سطح و bounding box
- تشخیص خودکار overhang، thin wall، bridging
- پیشنهاد تنظیمات بهینه بر اساس شکل، مواد و پرینتر

#### 🎯 بهینه‌سازی جهت‌گیری خودکار (NEW! ⭐)
- **تحلیل 48+ جهت‌گیری مختلف** برای یافتن بهترین حالت
- امتیازدهی چند عاملی:
  - 🔧 حجم ساپورت (35%) - کاهش مواد اضافی
  - 📐 سطح اورهنگ (25%) - کاهش overhangs
  - ⚖️ پایداری (15%) - بهبود چسبندگی به بستر
  - ✨ کیفیت سطح (15%) - بهترین فینیش
  - ⏱️ زمان پرینت (10%) - کاهش زمان
- **اعمال خودکار چرخش** قبل از slicing
- تحلیل دقیق با GPT-4o-mini (به دو زبان فارسی و انگلیسی)
- نمایش زیبای نتایج با gradient UI

📚 [راهنمای کامل Orientation Optimization](ORIENTATION_OPTIMIZATION.md)

#### 🧠 سیستم یادگیری با RLHF (NEW! ⭐)
- **آموزش هوش مصنوعی** از طریق feedback کاربران
- تحلیل تصاویر پرینت شده با GPT-4 Vision
- 3 نوع feedback:
  - ⭐ Quick rating (1-5 stars)
  - 📝 Detailed feedback (با دلایل و پیشنهادات)
  - 📸 Image-based feedback (تشخیص خرابی‌ها)
- **Fine-tuning** مدل‌های OpenAI برای بهبود مداوم
- ردیابی performance و metrics
- Import فایل‌های 3MF با annotations

📚 [راهنمای کامل AI Learning System](AI_LEARNING_GUIDE.md)

### 📁 مدیریت فایل‌های سه‌بعدی

- ✅ پشتیبانی از فرمت‌های STL, OBJ, 3MF
- 📤 آپلود با درگ و دراپ
- 🎨 **پیش‌نمایش سه‌بعدی تعاملی** با Three.js:
  - نمایش Solid و Wireframe
  - Grid قابل نمایش/مخفی
  - Auto-rotation
  - Mouse controls (چرخش، حرکت، زوم)
  - نمایش اطلاعات مدل (حجم، ابعاد، سطح)
- 🔍 تحلیل خودکار ابعاد، حجم و مساحت سطح
- 🧹 **پاک‌سازی خودکار** فایل‌های قدیمی (پیش‌فرض: 24 ساعت)

### ⚙️ تنظیمات حرفه‌ای اسلایس

**Layer Settings:**
- Layer Height, Initial Layer Height
- Line Width, Wall Thickness
- Top/Bottom Thickness

**Infill Settings:**
- Infill Density (0-100%)
- Infill Pattern (grid, lines, triangles, cubic, etc.)
- Infill Line Width

**Speed Settings:**
- Print Speed, Infill Speed
- Wall Speed, Top/Bottom Speed
- Travel Speed, Initial Layer Speed

**Temperature Settings:**
- Nozzle Temperature
- Bed Temperature
- Initial Layer Temperature

**Support Settings:**
- Enable/Disable Supports
- Support Density, Pattern
- Overhang Angle

**Cooling & Retraction:**
- Fan Speed, Initial Layer Fan Speed
- Retraction Distance, Speed
- Flow Rate

### 🎯 مدیریت پروفایل‌ها

**پروفایل‌های مواد:**
- PLA (200°C / 60°C)
- ABS (240°C / 100°C)
- PETG (230°C / 80°C)
- TPU (220°C / 50°C)
- Custom profiles

**پروفایل‌های پرینتر:**
- Creality Ender 3 (220×220×250mm)
- Prusa i3 MK3S (250×210×210mm)
- Creality CR-10 (300×300×400mm)
- Custom printers

### 📊 تولید G-Code و 3MF

- ✅ **تولید G-Code واقعی با OrcaSlicer**
- ✅ **تولید فایل پروژه 3MF**
- ✅ **Metadata کامل** در G-code و 3MF:
  - اطلاعات orientation optimization
  - تنظیمات استفاده شده
  - تاریخ و زمان
  - Material و printer profile
- 📊 پیش‌نمایش اطلاعات دقیق پرینت:
  - تعداد لایه‌ها
  - زمان تخمینی
  - طول و وزن فیلامنت
- 💾 دانلود فایل‌های G-code و 3MF

📚 [راهنمای نصب OrcaSlicer](ORCA_SLICER_SETUP.md)

---

## 🔒 امنیت / Security

AIPMS با بهترین روش‌های امنیتی طراحی شده است:

### ✅ اقدامات امنیتی پیاده‌سازی شده:

#### 🛡️ Rate Limiting
- **API عمومی**: 100 درخواست در 15 دقیقه
- **Upload**: 10 آپلود در 15 دقیقه
- **AI operations**: 5 درخواست در 1 دقیقه
- محافظت در برابر DDoS attacks

#### 🔐 Input Validation & Sanitization
- Validation تمام ورودی‌های کاربر
- حذف null bytes و کاراکترهای خطرناک
- Regex validation برای filename
- Path traversal protection

#### 🔒 Security Headers
- `X-Frame-Options: DENY` - جلوگیری از clickjacking
- `X-Content-Type-Options: nosniff`
- `X-XSS-Protection: 1; mode=block`
- `Content-Security-Policy`
- `helmet.js` برای hardening

#### ⏱️ Request Timeout
- Timeout 30 ثانیه‌ای برای همه درخواست‌ها
- جلوگیری از hang شدن سرور

#### 📝 Error Handling
- Global error logger با context کامل
- پیام‌های user-friendly
- جداسازی development/production errors
- عدم افشای اطلاعات حساس

#### 🧹 File Management
- پاک‌سازی خودکار فایل‌های قدیمی
- محدودیت حجم آپلود (100MB)
- Type validation (STL, OBJ, 3MF)
- Quarantine برای فایل‌های مشکوک

#### 🔄 CORS Configuration
- Configurable از طریق `CORS_ORIGIN`
- پیش‌فرض: `*` برای development
- Production: فقط domain مشخص

### ⚠️ توصیه‌های امنیتی برای Production:

```bash
# در فایل .env
NODE_ENV=production
CORS_ORIGIN=https://yourdomain.com

# همیشه HTTPS استفاده کنید
# برای production از secrets manager استفاده کنید
# Key rotation برای API keys
# Backup منظم database
# Monitoring و alerting فعال کنید
```

---

## 🚀 نصب و راه‌اندازی / Installation

### پیش‌نیازها / Prerequisites

- ✅ Node.js 20+
- ✅ npm یا yarn
- ✅ MongoDB (اختیاری - برای AI learning features)
- ✅ کلید API OpenAI (برای بهینه‌سازی AI)
- ⭐ **OrcaSlicer** (پیشنهاد می‌شود - برای تولید G-code واقعی)

### مراحل نصب / Installation Steps

#### 1. Clone repository

```bash
git clone https://github.com/yourusername/aipms.git
cd aipms
```

#### 2. نصب وابستگی‌ها / Install dependencies

```bash
npm run install:all
```

این دستور هم backend و هم frontend dependencies را نصب می‌کند.

#### 3. تنظیم متغیرهای محیطی / Environment setup

```bash
cp .env.example .env
```

ویرایش فایل `.env`:

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Database (اختیاری - برای AI learning)
MONGODB_URI=mongodb://localhost:27017/aipms

# OpenAI API (ضروری)
OPENAI_API_KEY=your_openai_api_key_here

# File Upload
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=100000000

# Security
CORS_ORIGIN=*

# File Cleanup
FILE_CLEANUP_INTERVAL_MINUTES=60
FILE_MAX_AGE_HOURS=24

# OrcaSlicer (اختیاری - برای slicing واقعی)
ORCA_SLICER_PATH=orca-slicer
```

#### 4. نصب OrcaSlicer (اختیاری اما پیشنهاد می‌شود)

برای تولید G-code واقعی، OrcaSlicer را نصب کنید:

```bash
# Linux (Ubuntu/Debian)
wget https://github.com/SoftFever/OrcaSlicer/releases/download/v1.8.0/OrcaSlicer_Linux_V1.8.0.AppImage
chmod +x OrcaSlicer_Linux_V1.8.0.AppImage
sudo mv OrcaSlicer_Linux_V1.8.0.AppImage /usr/local/bin/orca-slicer

# macOS
brew install --cask orcaslicer

# Windows
# دانلود از: https://github.com/SoftFever/OrcaSlicer/releases
```

📚 [راهنمای کامل نصب OrcaSlicer](ORCA_SLICER_SETUP.md)

#### 5. نصب MongoDB (اختیاری - برای AI learning)

```bash
# Linux (Ubuntu)
sudo apt install mongodb

# macOS
brew install mongodb-community

# یا استفاده از MongoDB Atlas (cloud)
```

#### 6. اجرای برنامه / Run application

**حالت Development:**

```bash
npm run dev
```

این دستور هم Backend (port 3000) و هم Frontend (port 5173) را به صورت همزمان اجرا می‌کند.

**Build Production:**

```bash
npm run build
npm start
```

#### 7. دسترسی به برنامه / Access application

```
Frontend: http://localhost:5173
Backend API: http://localhost:3000
Health Check: http://localhost:3000/api/health
```

---

## 📖 نحوه استفاده / Usage Guide

### گردش کار اصلی (Main Workflow):

#### 1️⃣ آپلود فایل سه‌بعدی
- فایل STL, OBJ یا 3MF خود را با **درگ و دراپ** یا کلیک بارگذاری کنید
- سیستم به صورت خودکار فایل را تحلیل می‌کند:
  - ✅ حجم و سطح
  - ✅ Bounding box
  - ✅ Overhangs و thin walls
  - ✅ نیاز به support

#### 2️⃣ مشاهده مدل سه‌بعدی
- پیش‌نمایش تعاملی مدل
- تغییر بین Solid و Wireframe
- چرخش، زوم و حرکت دادن
- مشاهده اطلاعات دقیق

#### 3️⃣ انتخاب پروفایل‌ها
- **Material**: PLA, ABS, PETG, TPU یا custom
- **Printer**: Ender 3, Prusa MK3S, CR-10 یا custom

#### 4️⃣ بهینه‌سازی با AI (اختیاری)
- روی دکمه **"بهینه‌سازی با AI"** کلیک کنید
- هوش مصنوعی بهترین تنظیمات را پیشنهاد می‌دهد:
  - Layer height بهینه
  - Infill مناسب
  - سرعت‌های بهینه شده
  - دمای مناسب
  - پیشنهاد support

#### 5️⃣ تنظیمات دستی (اختیاری)
- به تب **"تنظیمات اسلایس"** بروید
- تنظیمات را به دلخواه تغییر دهید
- همه تنظیمات به صورت real-time اعمال می‌شوند

#### 6️⃣ تولید G-Code
- به تب **"پیش‌نمایش و G-Code"** بروید
- روی دکمه **"تولید G-Code و 3MF"** کلیک کنید
- **AI به صورت خودکار**:
  - بهترین جهت‌گیری را پیدا می‌کند (48+ حالت)
  - مدل را می‌چرخاند
  - G-code تولید می‌کند
- مشاهده:
  - نتایج orientation optimization
  - اطلاعات دقیق پرینت
  - زمان و مواد مصرفی
- دانلود فایل‌های G-code و 3MF

#### 7️⃣ آموزش AI (اختیاری)
بعد از پرینت، می‌توانید به AI feedback بدهید:
- **Quick feedback**: امتیاز 1-5 ستاره
- **Detailed feedback**: دلایل و پیشنهادات
- **Image feedback**: عکس قطعه برای تشخیص خرابی

📚 [راهنمای کامل AI Learning](AI_LEARNING_GUIDE.md)

---

## 🔧 API Documentation

### Base URL
```
Development: http://localhost:3000/api
Production: https://your-domain.com/api
```

### Authentication
در نسخه فعلی Authentication ندارد. برای production پیاده‌سازی کنید.

### Upload Endpoints

#### POST `/api/upload`
آپلود فایل سه‌بعدی

**Request:**
```bash
curl -X POST http://localhost:3000/api/upload \
  -F "model=@/path/to/model.stl"
```

**Response:**
```json
{
  "success": true,
  "file": {
    "filename": "1234567890-123456789.stl",
    "originalName": "model.stl",
    "size": 1048576,
    "path": "/uploads/1234567890-123456789.stl",
    "mimetype": "application/sla"
  }
}
```

#### DELETE `/api/upload/:filename`
حذف فایل آپلود شده

**Security Features:**
- ✅ Filename validation (regex)
- ✅ Path traversal protection
- ✅ Directory boundary check

### Slicing Endpoints

#### POST `/api/slicing/analyze`
تحلیل فایل سه‌بعدی

**Request:**
```json
{
  "filePath": "/uploads/model.stl"
}
```

**Response:**
```json
{
  "success": true,
  "analysis": {
    "volume": 12345.67,
    "surfaceArea": 5678.90,
    "boundingBox": {
      "x": 100.5,
      "y": 85.3,
      "z": 45.2
    },
    "overhangs": [
      { "angle": 55, "area": 123.45 }
    ],
    "thinWalls": false,
    "bridging": true
  }
}
```

#### POST `/api/slicing/optimize-orientation`
بهینه‌سازی جهت‌گیری با AI

**Request:**
```json
{
  "filePath": "/uploads/model.stl",
  "materialType": "PLA",
  "printerProfile": {
    "buildVolumeX": 220,
    "buildVolumeY": 220,
    "buildVolumeZ": 250
  }
}
```

**Response:**
```json
{
  "success": true,
  "orientationData": {
    "bestOrientation": {
      "rotation": { "x": 1.57, "y": 0, "z": 0 },
      "score": 87.5,
      "supportVolume": 125.3,
      "overhangArea": 45.2,
      "stability": 0.92,
      "surfaceQuality": 0.85,
      "reasoning": "minimal support needed, excellent bed adhesion"
    },
    "alternatives": [...],
    "analysis": "**English:** This orientation...\n**فارسی:** این جهت..."
  }
}
```

#### POST `/api/slicing/generate-gcode`
تولید G-Code و 3MF

**Request:**
```json
{
  "filePath": "/uploads/model.stl",
  "settings": { ... },
  "printerProfile": { ... },
  "generate3MF": true,
  "optimizeOrientation": true
}
```

**Response:**
```json
{
  "success": true,
  "gcodePath": "/output/model_1234567890.gcode",
  "threeMFPath": "/output/model_1234567890.3mf",
  "rotatedModelPath": "/output/model_rotated_1234567890.stl",
  "orientationData": { ... },
  "metadata": {
    "layerCount": 150,
    "estimatedTime": "2h 30m",
    "filamentLength": "18.5m",
    "filamentWeight": "55g"
  }
}
```

### AI Endpoints

#### POST `/api/ai/optimize`
بهینه‌سازی تنظیمات با AI

**Request:**
```json
{
  "modelAnalysis": { ... },
  "materialProfile": { ... },
  "printerProfile": { ... },
  "userPreferences": { ... }
}
```

**Response:**
```json
{
  "success": true,
  "settings": {
    "layerHeight": 0.2,
    "infillDensity": 20,
    "printSpeed": 60,
    ...
  },
  "reasoning": "Based on model analysis..."
}
```

### Learning Endpoints

#### POST `/api/learning/feedback/quick`
ارسال feedback سریع (star rating)

#### POST `/api/learning/feedback/detailed`
ارسال feedback دقیق با توضیحات

#### POST `/api/learning/feedback/image`
ارسال عکس برای تحلیل

📚 [مستندات کامل API در AI_LEARNING_GUIDE.md](AI_LEARNING_GUIDE.md)

### Health & Monitoring

#### GET `/api/health`
وضعیت سیستم

**Response:**
```json
{
  "status": "ok",
  "message": "AIPMS Backend is running",
  "timestamp": "2025-10-23T12:00:00.000Z",
  "mongodb": "connected",
  "learningEnabled": true,
  "version": "1.0.0"
}
```

#### GET `/api/files/stats`
آمار فایل‌ها

**Response:**
```json
{
  "success": true,
  "stats": {
    "uploads": {
      "count": 15,
      "totalSize": 52428800
    },
    "outputs": {
      "count": 10,
      "totalSize": 10485760
    }
  }
}
```

---

## 🏗️ معماری سیستم / System Architecture

```
AIPMS/
├── backend/                          # Node.js + Express + TypeScript
│   ├── src/
│   │   ├── server.ts                # Main server with security
│   │   ├── middleware/
│   │   │   └── security.ts          # Rate limiting, validation, headers
│   │   ├── routes/
│   │   │   ├── upload.ts            # File upload (secured)
│   │   │   ├── slicing.ts           # Slicing & orientation
│   │   │   ├── profile.ts           # Materials & printers
│   │   │   ├── ai.ts                # AI optimization
│   │   │   └── learning.ts          # RLHF system
│   │   ├── services/
│   │   │   ├── aiOptimizer.ts       # GPT-4 optimization
│   │   │   ├── orientationOptimizer.ts  # 48+ orientation analysis
│   │   │   ├── orcaSlicerService.ts # Real G-code generation
│   │   │   ├── modelAnalyzer.ts     # STL analysis
│   │   │   ├── visionAnalyzer.ts    # GPT-4 Vision
│   │   │   ├── fineTuningService.ts # Model training
│   │   │   ├── trainingDataManager.ts
│   │   │   └── fileCleanupService.ts # Auto cleanup
│   │   ├── models/
│   │   │   └── learning.ts          # MongoDB schemas
│   │   └── types/
│   │       └── slicing.ts           # TypeScript types
│   └── tsconfig.json
│
├── frontend/                         # React + TypeScript + Vite
│   ├── src/
│   │   ├── components/
│   │   │   ├── FileUploader.tsx     # Drag & drop upload
│   │   │   ├── ModelViewer.tsx      # 3D viewer (memory-safe)
│   │   │   ├── SettingsPanel.tsx    # All slicing settings
│   │   │   ├── ProfileSelector.tsx  # Material & printer
│   │   │   ├── AIOptimizer.tsx      # AI optimization UI
│   │   │   ├── GCodeGenerator.tsx   # G-code generation + orientation
│   │   │   └── FeedbackModal.tsx    # Feedback collection
│   │   ├── store/
│   │   │   └── useStore.ts          # Zustand state
│   │   ├── api/
│   │   │   └── client.ts            # API client
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── vite.config.ts
│   └── tsconfig.json
│
├── uploads/                          # آپلودهای کاربران (auto-cleanup)
├── output/                           # G-code و 3MF (auto-cleanup)
├── .env.example                      # Environment variables
├── package.json
├── README.md                         # این فایل
├── ORIENTATION_OPTIMIZATION.md       # راهنمای orientation
├── AI_LEARNING_GUIDE.md              # راهنمای AI learning
├── ORCA_SLICER_SETUP.md              # راهنمای نصب OrcaSlicer
└── PROJECT_ANALYSIS_AND_RECOMMENDATIONS.md  # تحلیل و پیشنهادات
```

---

## 🛠️ تکنولوژی‌های استفاده شده / Technology Stack

### Backend

#### Core
- **Node.js 20+** - JavaScript runtime
- **Express 4** - Web framework
- **TypeScript 5.3** - Type safety

#### Security
- **helmet** - Security headers
- **express-rate-limit** - Rate limiting
- **cors** - CORS configuration

#### AI & Processing
- **OpenAI API** - GPT-4 و GPT-4o-mini
  - Settings optimization
  - Orientation analysis
  - Vision analysis (print quality)
  - Fine-tuning
- **OrcaSlicer** - Professional slicing engine
- **node-stl** - STL file parsing
- **Three.js** - 3D geometry processing

#### Database & Storage
- **MongoDB** - NoSQL database (اختیاری)
- **Mongoose** - MongoDB ODM
- **Multer** - File upload handling
- **Archiver** - 3MF file generation

#### Development
- **tsx** - TypeScript execution
- **dotenv** - Environment variables
- **concurrently** - Run multiple commands

### Frontend

#### Core
- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool & dev server

#### 3D Visualization
- **Three.js** - 3D rendering engine
- **@react-three/fiber** - React renderer for Three.js
- **@react-three/drei** - Useful helpers (OrbitControls, Stage, etc.)
- **STLLoader** - STL file loading

#### State & Data
- **Zustand** - Lightweight state management
- **Axios** - HTTP client

#### UI/UX
- **Lucide React** - Icon library
- **CSS3** - Styling with RTL support
- **Responsive Design** - Mobile-friendly

---

## 🎨 UI/UX Features

### طراحی (Design):
- ✨ رابط کاربری **فارسی** (RTL) با فونت مناسب
- 🎨 طراحی مدرن و حرفه‌ای
- 📱 **Responsive design** برای موبایل و تبلت
- 🌈 انیمیشن‌های روان
- 🔄 Loading states واضح
- 🎯 تجربه کاربری بهینه

### قابلیت‌های بصری:
- 🖼️ Gradient UI برای نمایش orientation optimization
- 📊 نمایش metrics و scores
- 🎛️ کنترل‌های تعاملی (solid/wireframe, grid, auto-rotate)
- 📈 Charts و visualizations
- 🌓 Dark mode support (coming soon)

---

## 📚 مستندات / Documentation

### راهنماهای موجود:

1. **[README.md](README.md)** - این فایل
   - نصب و راه‌اندازی
   - نحوه استفاده
   - API documentation
   - معماری سیستم

2. **[ORIENTATION_OPTIMIZATION.md](ORIENTATION_OPTIMIZATION.md)**
   - راهنمای کامل orientation optimization
   - الگوریتم‌های امتیازدهی
   - نمونه‌های API
   - جزئیات فنی

3. **[AI_LEARNING_GUIDE.md](AI_LEARNING_GUIDE.md)**
   - راهنمای کامل سیستم یادگیری
   - انواع feedback
   - Fine-tuning workflow
   - API reference

4. **[ORCA_SLICER_SETUP.md](ORCA_SLICER_SETUP.md)**
   - نصب OrcaSlicer در Linux/macOS/Windows
   - کانفیگوریشن
   - Troubleshooting

5. **[PROJECT_ANALYSIS_AND_RECOMMENDATIONS.md](PROJECT_ANALYSIS_AND_RECOMMENDATIONS.md)**
   - تحلیل کامل پروژه
   - مشکلات شناسایی شده
   - 20+ پیشنهاد فیچر
   - Roadmap توسعه
   - مقایسه با رقبا

### نمونه کدها:

```javascript
// مثال: بهینه‌سازی orientation
const response = await axios.post('/api/slicing/optimize-orientation', {
  filePath: '/uploads/model.stl',
  materialType: 'PLA',
  printerProfile: selectedPrinter
});

console.log('Best orientation score:', response.data.orientationData.bestOrientation.score);
```

```javascript
// مثال: تولید G-code با orientation optimization
const result = await generateGCode({
  filePath: uploadedFile.path,
  settings: slicingSettings,
  printerProfile: selectedPrinter,
  generate3MF: true,
  optimizeOrientation: true  // فعال‌سازی optimization
});
```

---

## 🔮 قابلیت‌های آینده / Future Features

### در دست توسعه:
- [ ] **Authentication System** - JWT + OAuth
- [ ] **Project Management** - ذخیره و مدیریت پروژه‌ها
- [ ] **Layer-by-Layer Preview** - نمایش هر لایه جداگانه

### برنامه‌ریزی شده:
- [ ] **Print Queue Management** - صف پرینت با drag & drop
- [ ] **Settings Comparison** - مقایسه 2-3 تنظیمات
- [ ] **Filament Management** - ردیابی موجودی
- [ ] **Cost Analysis** - محاسبه دقیق هزینه
- [ ] **Network Printer Integration** - ارسال مستقیم G-code
- [ ] **Community Features** - اشتراک پروفایل‌ها
- [ ] **Multi-Language** - عربی، ترکی، اردو
- [ ] **Dark Mode** - حالت تاریک
- [ ] **Mobile App** - React Native
- [ ] **Plugin System** - پلاگین‌های third-party

📚 [لیست کامل پیشنهادات در PROJECT_ANALYSIS](PROJECT_ANALYSIS_AND_RECOMMENDATIONS.md)

---

## 👥 مشارکت / Contributing

مشارکت شما در AIPMS خوشایند است! 🎉

### نحوه مشارکت:

1. **Fork** کنید
2. Branch جدید بسازید (`git checkout -b feature/AmazingFeature`)
3. تغییرات خود را **commit** کنید (`git commit -m 'Add some AmazingFeature'`)
4. به branch خود **push** کنید (`git push origin feature/AmazingFeature`)
5. **Pull Request** بسازید

### راهنماهای مشارکت:

- ✅ کد تمیز و خوانا بنویسید
- ✅ TypeScript types استفاده کنید
- ✅ Unit tests اضافه کنید
- ✅ مستندات را آپدیت کنید
- ✅ از conventional commits استفاده کنید
- ✅ Code review را رعایت کنید

### اولویت‌های مشارکت:

🔴 **High Priority:**
- Authentication system
- Unit tests (>60% coverage)
- API documentation (Swagger)
- Performance optimization

🟡 **Medium Priority:**
- Progress indicators
- Error handling improvements
- Responsive design fixes
- Internationalization

---

## 🐛 گزارش باگ / Bug Reports

برای گزارش باگ، لطفاً یک **Issue** در GitHub باز کنید با:

- ✅ توضیحات دقیق مشکل
- ✅ مراحل تکرار (steps to reproduce)
- ✅ Logs و error messages
- ✅ Environment info (OS, Node version, etc.)
- ✅ Screenshots (در صورت امکان)

---

## 📄 License

این پروژه تحت لایسنس **MIT** منتشر شده است - فایل [LICENSE](LICENSE) را ببینید.

---

## 📧 تماس / Contact

برای سوالات، پشتیبانی یا همکاری:

- 📧 Email: support@aipms.com
- 💬 GitHub Issues: [github.com/yourusername/aipms/issues](https://github.com/yourusername/aipms/issues)
- 📱 Telegram: @aipms_support

---

## 🙏 تشکر / Acknowledgments

- **OpenAI** برای GPT-4 و GPT-4 Vision API
- **OrcaSlicer** برای slicing engine قدرتمند
- **Three.js** برای rendering 3D
- جامعه **3D printing** برای feedback و پشتیبانی
- تمام **contributors** که به این پروژه کمک کردند

---

## 📊 آمار پروژه / Project Stats

```
📁 Total Files: 50+
📝 Lines of Code: 10,000+
🔒 Security Score: A+
⚡ Performance: Optimized
🧪 Test Coverage: In Progress
📚 Documentation: Comprehensive
```

---

## 🎯 نقشه راه / Roadmap

### Phase 1: Security & Stability ✅ (Completed)
- ✅ Rate limiting
- ✅ Input validation
- ✅ Memory leak fixes
- ✅ File cleanup service
- ⬜ Authentication system
- ⬜ Unit tests (60%+)
- ⬜ API docs (Swagger)

### Phase 2: Core Features (In Progress)
- ⬜ Project management
- ⬜ Layer-by-layer preview
- ⬜ Print queue
- ⬜ Settings comparison
- ⬜ Progress indicators

### Phase 3: Advanced Features (Planned)
- ⬜ Network printer integration
- ⬜ Material management
- ⬜ Cost analysis
- ⬜ Community features
- ⬜ Multi-language

---

**ساخته شده با ❤️ برای جامعه پرینت سه‌بعدی ایران و جهان**

**Made with ❤️ for the 3D printing community**

---

**⭐ اگر این پروژه برایتان مفید بود، لطفاً یک Star بدهید!**

**⭐ If you found this project helpful, please give it a star!**
