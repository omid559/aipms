# AIPMS - AI-Powered 3D Print Management System
# سیستم مدیریت پرینت سه‌بعدی با هوش مصنوعی

![AIPMS](https://img.shields.io/badge/AIPMS-v1.0.0-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)
![React](https://img.shields.io/badge/React-18.2-blue)
![Node.js](https://img.shields.io/badge/Node.js-20+-green)

یک اپلیکیشن تحت وب پیشرفته برای مدیریت و بهینه‌سازی فرآیند اسلایس فایل‌های سه‌بعدی با استفاده از هوش مصنوعی.

A professional web application for managing and optimizing 3D file slicing with AI-powered settings.

## ✨ ویژگی‌های کلیدی / Key Features

### 🤖 بهینه‌سازی هوشمند با AI
- تحلیل خودکار مدل سه‌بعدی
- پیشنهاد تنظیمات بهینه بر اساس شکل، مواد و پرینتر
- بهینه‌سازی خودکار سرعت، دما و کیفیت پرینت
- تشخیص هوشمند نیاز به ساپورت

### 📁 مدیریت فایل‌های سه‌بعدی
- پشتیبانی از فرمت‌های STL, OBJ, 3MF
- آپلود با درگ و دراپ
- پیش‌نمایش سه‌بعدی تعاملی با Three.js
- تحلیل خودکار ابعاد، حجم و مساحت سطح

### ⚙️ تنظیمات حرفه‌ای اسلایس
- تنظیمات کامل لایه (Layer Height, Line Width, Wall Thickness)
- مدیریت پرشدگی (Infill Density, Pattern)
- کنترل دقیق سرعت (Print, Travel, Wall, Infill)
- تنظیمات دما (Nozzle, Bed, Initial Layer)
- پیکربندی ساپورت (Support Density, Pattern, Overhang Angle)
- تنظیمات خنک‌کننده (Fan Speed, Cooling)
- Retraction Settings

### 🎯 مدیریت پروفایل‌ها
- پروفایل‌های از پیش تعریف شده برای مواد مختلف (PLA, ABS, PETG, TPU)
- پروفایل‌های پرینترهای محبوب (Ender 3, Prusa MK3S, CR-10)
- قابلیت ایجاد و ذخیره پروفایل‌های سفارشی

### 📊 پیش‌نمایش و تولید G-Code
- تولید G-Code بهینه
- پیش‌نمایش اطلاعات پرینت
- تخمین زمان و مصرف مواد

## 🏗️ معماری سیستم / System Architecture

```
AIPMS/
├── backend/                 # Node.js + Express + TypeScript
│   ├── src/
│   │   ├── server.ts       # Main server
│   │   ├── routes/         # API routes
│   │   │   ├── upload.ts   # File upload
│   │   │   ├── slicing.ts  # Slicing operations
│   │   │   ├── profile.ts  # Material & Printer profiles
│   │   │   └── ai.ts       # AI optimization
│   │   ├── services/
│   │   │   └── aiOptimizer.ts  # AI optimization service
│   │   └── types/
│   │       └── slicing.ts  # TypeScript types
│   └── tsconfig.json
│
├── frontend/               # React + TypeScript + Vite
│   ├── src/
│   │   ├── components/     # React components
│   │   │   ├── FileUploader.tsx
│   │   │   ├── ModelViewer.tsx
│   │   │   ├── SettingsPanel.tsx
│   │   │   ├── ProfileSelector.tsx
│   │   │   └── AIOptimizer.tsx
│   │   ├── store/          # State management (Zustand)
│   │   ├── api/            # API client
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── vite.config.ts
│   └── tsconfig.json
│
├── package.json
└── README.md
```

## 🚀 نصب و راه‌اندازی / Installation

### پیش‌نیازها / Prerequisites

- Node.js 20+
- npm یا yarn
- کلید API OpenAI (برای بهینه‌سازی AI)

### مراحل نصب / Installation Steps

1. **Clone repository**
```bash
git clone <repository-url>
cd aipms
```

2. **نصب وابستگی‌ها / Install dependencies**
```bash
npm run install:all
```

3. **تنظیم متغیرهای محیطی / Environment setup**
```bash
cp .env.example .env
```

ویرایش فایل `.env` و افزودن کلید OpenAI:
```env
PORT=3000
OPENAI_API_KEY=your_openai_api_key_here
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=100000000
NODE_ENV=development
```

4. **اجرای برنامه / Run application**

**حالت Development:**
```bash
npm run dev
```

این دستور هم Backend (port 3000) و هم Frontend (port 5173) را اجرا می‌کند.

**Build Production:**
```bash
npm run build
npm start
```

5. **دسترسی به برنامه / Access application**
```
Frontend: http://localhost:5173
Backend API: http://localhost:3000
```

## 📖 نحوه استفاده / Usage Guide

### 1. آپلود فایل سه‌بعدی
- فایل STL, OBJ یا 3MF خود را با درگ و دراپ یا کلیک بارگذاری کنید
- سیستم به صورت خودکار فایل را تحلیل می‌کند

### 2. انتخاب پروفایل‌ها
- نوع مواد (Material) مورد استفاده را انتخاب کنید
- پرینتر خود را از لیست انتخاب کنید

### 3. بهینه‌سازی با AI
- روی دکمه "بهینه‌سازی با AI" کلیک کنید
- هوش مصنوعی بهترین تنظیمات را پیشنهاد می‌دهد

### 4. تنظیمات دستی (اختیاری)
- به تب "تنظیمات اسلایس" بروید
- تنظیمات را به دلخواه تغییر دهید

### 5. تولید G-Code
- به تب "پیش‌نمایش و G-Code" بروید
- روی دکمه "تولید G-Code" کلیک کنید

## 🔧 API Documentation

### Upload Endpoints

**POST /api/upload**
- آپلود فایل سه‌بعدی
- Body: FormData with 'model' field
- Response: File information

**DELETE /api/upload/:filename**
- حذف فایل آپلود شده

### Slicing Endpoints

**POST /api/slicing/analyze**
- تحلیل فایل سه‌بعدی
- Body: `{ filePath: string }`
- Response: Model analysis data

**POST /api/slicing/generate-gcode**
- تولید G-Code
- Body: `{ filePath: string, settings: SlicingSettings }`
- Response: G-Code string

**POST /api/slicing/validate**
- اعتبارسنجی تنظیمات
- Body: `{ settings: SlicingSettings, printerProfile: PrinterProfile }`

### Profile Endpoints

**GET /api/profile/materials**
- دریافت لیست مواد

**GET /api/profile/printers**
- دریافت لیست پرینترها

**POST /api/profile/materials**
- ایجاد پروفایل مواد سفارشی

**POST /api/profile/printers**
- ایجاد پروفایل پرینتر سفارشی

### AI Endpoints

**POST /api/ai/optimize**
- بهینه‌سازی تنظیمات با AI
- Body:
```json
{
  "modelAnalysis": {...},
  "materialProfile": {...},
  "printerProfile": {...},
  "userPreferences": {...}
}
```
- Response: Optimized settings

## 🛠️ تکنولوژی‌های استفاده شده / Technology Stack

### Backend
- **Node.js** - JavaScript runtime
- **Express** - Web framework
- **TypeScript** - Type safety
- **Multer** - File upload handling
- **OpenAI API** - AI optimization

### Frontend
- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Three.js** - 3D visualization
- **@react-three/fiber** - React renderer for Three.js
- **@react-three/drei** - Useful helpers for Three.js
- **Zustand** - State management
- **Axios** - HTTP client
- **Lucide React** - Icon library

## 🎨 UI/UX Features

- رابط کاربری فارسی (RTL)
- طراحی مدرن و حرفه‌ای
- Responsive design
- انیمیشن‌های روان
- تجربه کاربری بهینه

## 🔮 قابلیت‌های آینده / Future Features

- [ ] یکپارچه‌سازی با CuraEngine برای slicing واقعی
- [ ] پشتیبانی از فرمت‌های بیشتر (AMF, 3DS)
- [ ] تاریخچه و مدیریت پروژه‌ها
- [ ] ذخیره و اشتراک‌گذاری پروفایل‌ها
- [ ] پیش‌نمایش Layer-by-Layer
- [ ] تخمین دقیق‌تر زمان و هزینه
- [ ] یادگیری ماشین برای بهبود پیشنهادات
- [ ] اتصال مستقیم به پرینترهای شبکه‌ای

## 📝 License

MIT License

## 👥 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 🐛 Bug Reports

For bug reports, please open an issue on GitHub.

## 📧 Contact

For questions or support, please contact the development team.

---

**ساخته شده با ❤️ برای جامعه پرینت سه‌بعدی**
**Made with ❤️ for the 3D printing community**