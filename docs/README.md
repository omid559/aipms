# مستندات AIPMS
# AIPMS Documentation

> راهنماهای جامع برای نصب، پیکربندی و استفاده از سیستم مدیریت پرینت سه‌بعدی با هوش مصنوعی

---

## 📚 فهرست مستندات / Documentation Index

### 🚀 راهنماهای نصب / Installation Guides

1. **[راهنمای نصب کامل](../INSTALLATION.md)**
   - نصب و راه‌اندازی کامل پروژه
   - پیش‌نیازها و الزامات سیستم
   - نصب MongoDB، Node.js، و Git
   - راه‌اندازی دیتابیس و seed
   - تست و اجرای برنامه

2. **[راهنمای نصب ویندوز](./INSTALLATION_WINDOWS.md)**
   - راهنمای گام‌به‌گام ویژه ویندوز
   - نصب تمام پیش‌نیازها در ویندوز
   - پیکربندی سرویس‌های ویندوز
   - میانبرهای ویندوز برای اجرای سریع
   - رفع مشکلات رایج در ویندوز

---

### ⚙️ راهنماهای پیکربندی / Configuration Guides

3. **[راهنمای پیکربندی](./CONFIGURATION.md)**
   - متغیرهای محیطی Backend
   - متغیرهای محیطی Frontend
   - پیکربندی MongoDB
   - پیکربندی GapGPT AI Services
   - تنظیمات امنیتی (JWT، CORS، Helmet)
   - تنظیمات Performance (Clustering، Caching)
   - پیکربندی Production (PM2، Nginx)

---

### 🐛 رفع مشکلات / Troubleshooting

4. **[راهنمای رفع مشکلات](./TROUBLESHOOTING.md)**
   - مشکلات نصب و npm
   - مشکلات اتصال MongoDB
   - خطاهای Backend (Port، CORS، Modules)
   - مشکلات Frontend (صفحه خالی، Build errors)
   - مشکلات API و Network
   - مشکلات Authentication و JWT
   - مشکلات AI Services
   - مشکلات Performance
   - ابزارهای Debugging

---

## 🎯 راهنمای سریع / Quick Start

### برای کاربران تازه‌کار / For Beginners

1. **ویندوز:** شروع با [راهنمای نصب ویندوز](./INSTALLATION_WINDOWS.md)
2. **سایر سیستم‌عامل‌ها:** شروع با [راهنمای نصب کامل](../INSTALLATION.md)
3. **بعد از نصب:** مطالعه [راهنمای پیکربندی](./CONFIGURATION.md)
4. **اگر مشکلی داشتید:** مراجعه به [راهنمای رفع مشکلات](./TROUBLESHOOTING.md)

### برای توسعه‌دهندگان / For Developers

1. نصب: `git clone` → `npm install` → `npm run seed`
2. پیکربندی: ایجاد `.env` files
3. اجرا: `npm run dev` در backend و frontend
4. مراجعه به [CONFIGURATION.md](./CONFIGURATION.md) برای تنظیمات پیشرفته

---

## 📖 محتویات هر راهنما / Guide Contents

### [INSTALLATION.md](../INSTALLATION.md)
- ✅ پیش‌نیازهای سیستم
- ✅ نصب MongoDB
- ✅ نصب Node.js و NPM
- ✅ دانلود و clone پروژه
- ✅ نصب Dependencies
- ✅ پیکربندی محیط (.env)
- ✅ Seed کردن دیتابیس
- ✅ اجرا و تست
- ✅ رفع مشکلات رایج

### [INSTALLATION_WINDOWS.md](./INSTALLATION_WINDOWS.md)
- ✅ راهنمای ویژه ویندوز 10/11
- ✅ نصب MongoDB به عنوان Service
- ✅ استفاده از MongoDB Compass
- ✅ اضافه کردن به PATH
- ✅ PowerShell و CMD راهنماها
- ✅ ایجاد Batch Script برای اجرای سریع
- ✅ رفع مشکلات ویژه ویندوز

### [CONFIGURATION.md](./CONFIGURATION.md)
- ✅ تمام متغیرهای محیطی با توضیحات کامل
- ✅ فرمت‌های مختلف MONGODB_URI
- ✅ تولید JWT_SECRET امن
- ✅ پیکربندی CORS برای production
- ✅ تنظیمات GapGPT API
- ✅ Rate Limiting و Clustering
- ✅ Redis برای Caching
- ✅ PM2 برای Production
- ✅ Nginx configuration
- ✅ HTTPS با Let's Encrypt

### [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)
- ✅ خطاهای npm install
- ✅ مشکلات اتصال MongoDB
- ✅ Port conflicts
- ✅ CORS errors
- ✅ صفحه سفید frontend
- ✅ 404 و 500 errors
- ✅ Authentication failures
- ✅ AI service errors
- ✅ Performance issues
- ✅ ابزارهای debugging

---

## 🔗 لینک‌های مفید / Useful Links

### پروژه / Project
- 📦 [Repository](https://github.com/omid559/aipms)
- 📖 [README اصلی](../README.md)
- 🐛 [گزارش مشکلات](https://github.com/omid559/aipms/issues)

### تکنولوژی‌ها / Technologies
- 🟢 [Node.js Documentation](https://nodejs.org/docs)
- 🍃 [MongoDB Documentation](https://docs.mongodb.com)
- ⚛️ [React Documentation](https://react.dev)
- 📘 [TypeScript Documentation](https://www.typescriptlang.org/docs)
- ⚡ [Vite Documentation](https://vitejs.dev)
- 🔧 [Express Documentation](https://expressjs.com)

### AI Services
- 🤖 [GapGPT Platform](https://gapgpt.app)
- 🧠 [DeepSeek Documentation](https://www.deepseek.com)

---

## 💡 نکات مهم / Important Notes

### امنیت / Security
⚠️ **در Production:**
- JWT_SECRET را تغییر دهید
- از HTTPS استفاده کنید
- CORS را محدود کنید
- Rate limiting را فعال کنید
- فایل `.env` را commit نکنید

### Performance
⚡ **برای بهینه‌سازی:**
- از PM2 clustering استفاده کنید
- Redis برای caching اضافه کنید
- MongoDB indexes را بررسی کنید
- از CDN برای static files استفاده کنید
- Response compression فعال کنید

### Backup
💾 **حتماً:**
- دیتابیس را به صورت دوره‌ای backup بگیرید
- فایل `.env` را در جای امن نگه دارید
- از version control استفاده کنید

---

## 🆘 نیاز به کمک؟ / Need Help?

### مراحل دریافت کمک:

1. **جستجو در مستندات**
   - این صفحه را مطالعه کنید
   - راهنمای مربوطه را بررسی کنید
   - Troubleshooting guide را چک کنید

2. **بررسی Issues موجود**
   - به [GitHub Issues](https://github.com/omid559/aipms/issues) بروید
   - جستجو کنید که آیا مشکل مشابهی وجود دارد

3. **ایجاد Issue جدید**
   - اگر مشکل شما حل نشد، یک issue جدید ایجاد کنید
   - اطلاعات زیر را بدهید:
     - سیستم عامل و نسخه
     - Node.js و MongoDB version
     - پیام خطای کامل
     - مراحلی که انجام دادید

4. **اطلاعات مفید برای Debugging**
   ```bash
   # نسخه Node.js
   node --version

   # نسخه npm
   npm --version

   # نسخه MongoDB
   mongosh --version

   # سیستم عامل (Linux/Mac)
   uname -a

   # سیستم عامل (Windows)
   ver
   ```

---

## 📝 مشارکت در مستندات / Contributing to Documentation

اگر می‌خواهید در بهبود مستندات کمک کنید:

1. Fork کردن پروژه
2. ایجاد branch جدید
3. اضافه کردن یا ویرایش مستندات
4. ارسال Pull Request

**راهنمای نگارش:**
- از زبان ساده و روان استفاده کنید
- مثال‌های کد اضافه کنید
- هر دو زبان فارسی و انگلیسی را شامل شوید
- از جداول و لیست‌ها برای خوانایی بهتر استفاده کنید

---

## 📅 به‌روزرسانی مستندات / Documentation Updates

**آخرین به‌روزرسانی:** 2025

این مستندات به صورت مستمر به‌روزرسانی می‌شوند. برای آخرین نسخه:

```bash
git pull origin main
```

---

## 📜 لایسنس / License

این مستندات تحت لایسنس MIT منتشر شده‌اند.

---

**موفق باشید!** 🚀

---

<div align="center">

ساخته شده با ❤️ توسط تیم AIPMS

Made with ❤️ by AIPMS Team

</div>
