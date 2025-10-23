# نصب و راه‌اندازی OrcaSlicer
# OrcaSlicer Installation Guide

این راهنما نحوه نصب و پیکربندی OrcaSlicer را برای استفاده با AIPMS توضیح می‌دهد.

This guide explains how to install and configure OrcaSlicer for use with AIPMS.

---

## چرا OrcaSlicer؟ / Why OrcaSlicer?

OrcaSlicer یک اسلایسر قدرتمند و منبع‌باز است که از PrusaSlicer fork شده و ویژگی‌های پیشرفته‌ای دارد:
- سریع و دقیق
- CLI interface برای اتوماسیون
- پشتیبانی از پروفایل‌های مختلف
- تولید G-code و 3MF با کیفیت بالا

OrcaSlicer is a powerful open-source slicer forked from PrusaSlicer with advanced features:
- Fast and accurate
- CLI interface for automation
- Support for various profiles
- High-quality G-code and 3MF generation

---

## نصب / Installation

### Linux (Ubuntu/Debian)

```bash
# Install dependencies
sudo apt-get update
sudo apt-get install -y wget libgtk-3-0 libglu1-mesa

# Download OrcaSlicer (latest version)
wget https://github.com/SoftFever/OrcaSlicer/releases/download/v1.9.0/OrcaSlicer_Linux_V1.9.0.AppImage

# Make executable
chmod +x OrcaSlicer_Linux_V1.9.0.AppImage

# Move to system path
sudo mv OrcaSlicer_Linux_V1.9.0.AppImage /usr/local/bin/orca-slicer

# Test installation
orca-slicer --version
```

### macOS

```bash
# Using Homebrew
brew install --cask orcaslicer

# Or download from GitHub
# Visit: https://github.com/SoftFever/OrcaSlicer/releases
# Download the .dmg file and install

# Add to PATH (if using .app)
export PATH="/Applications/OrcaSlicer.app/Contents/MacOS:$PATH"

# Test installation
OrcaSlicer --version
```

### Windows

1. دانلود نسخه Windows از [GitHub Releases](https://github.com/SoftFever/OrcaSlicer/releases)
2. نصب فایل `.exe`
3. مسیر نصب را به PATH اضافه کنید یا در `.env` مشخص کنید

1. Download Windows version from [GitHub Releases](https://github.com/SoftFever/OrcaSlicer/releases)
2. Install the `.exe` file
3. Add installation path to PATH or specify in `.env`

**مسیر پیش‌فرض / Default Path:**
```
C:\Program Files\OrcaSlicer\orca-slicer.exe
```

---

## پیکربندی / Configuration

### 1. تنظیم متغیر محیطی / Set Environment Variable

فایل `.env` را ویرایش کنید / Edit `.env` file:

```bash
# Linux/macOS
ORCA_SLICER_PATH=/usr/local/bin/orca-slicer

# Windows
ORCA_SLICER_PATH=C:\Program Files\OrcaSlicer\orca-slicer.exe
```

### 2. تست نصب / Test Installation

```bash
# Linux/macOS
orca-slicer --version
orca-slicer --help

# Windows
"C:\Program Files\OrcaSlicer\orca-slicer.exe" --version
```

### 3. دسترسی‌ها / Permissions

```bash
# Linux - اطمینان از دسترسی اجرایی / Ensure executable permission
chmod +x /usr/local/bin/orca-slicer

# Linux - اجازه به Node.js برای اجرای OrcaSlicer / Allow Node.js to run OrcaSlicer
# No additional permissions needed if installed in system path
```

---

## استفاده در AIPMS / Usage in AIPMS

وقتی OrcaSlicer نصب شد، AIPMS به صورت خودکار از آن استفاده می‌کند:

Once OrcaSlicer is installed, AIPMS will automatically use it:

### با OrcaSlicer / With OrcaSlicer:
✅ تحلیل واقعی فایل STL
✅ محاسبه دقیق حجم و سطح
✅ تولید G-code واقعی
✅ تولید فایل پروژه 3MF
✅ تخمین دقیق زمان و مصرف فیلامنت

✅ Real STL file analysis
✅ Accurate volume and surface calculation
✅ Real G-code generation
✅ 3MF project file generation
✅ Accurate time and filament estimation

### بدون OrcaSlicer / Without OrcaSlicer:
⚠️ تحلیل mock
⚠️ G-code ساده و تستی
⚠️ بدون 3MF

⚠️ Mock analysis
⚠️ Simple test G-code
⚠️ No 3MF

**نکته:** اگر OrcaSlicer نصب نباشد، سیستم به حالت Mock برمی‌گردد و همچنان کار می‌کند اما خروجی‌ها واقعی نیستند.

**Note:** If OrcaSlicer is not installed, the system falls back to Mock mode and still works, but outputs are not real.

---

## دستورات CLI مفید / Useful CLI Commands

```bash
# نمایش ورژن / Show version
orca-slicer --version

# راهنما / Help
orca-slicer --help

# اسلایس یک فایل / Slice a file
orca-slicer --export-gcode --output output.gcode model.stl

# اسلایس با config / Slice with config
orca-slicer --load config.ini --export-gcode --output output.gcode model.stl

# تولید 3MF / Generate 3MF
orca-slicer --export-3mf --output project.3mf model.stl

# اسلایس + 3MF / Slice + 3MF
orca-slicer --export-gcode --export-3mf --output-3mf project.3mf --output output.gcode model.stl
```

---

## عیب‌یابی / Troubleshooting

### OrcaSlicer not found

```bash
# بررسی نصب / Check installation
which orca-slicer  # Linux/macOS
where orca-slicer  # Windows

# بررسی PATH / Check PATH
echo $PATH  # Linux/macOS
echo %PATH%  # Windows

# نصب مجدد / Reinstall
# Follow installation steps again
```

### Permission denied

```bash
# Linux/macOS
sudo chmod +x /usr/local/bin/orca-slicer

# Windows
# Run as Administrator
```

### AppImage issues (Linux)

```bash
# نصب FUSE / Install FUSE
sudo apt-get install fuse libfuse2

# اجرای مستقیم / Run directly
./OrcaSlicer_Linux_V1.9.0.AppImage
```

### Command not found

```bash
# افزودن به PATH موقت / Add to PATH temporarily
export PATH="/path/to/orcaslicer:$PATH"

# افزودن به PATH دائمی / Add to PATH permanently
echo 'export PATH="/path/to/orcaslicer:$PATH"' >> ~/.bashrc
source ~/.bashrc
```

---

## منابع / Resources

- [OrcaSlicer GitHub](https://github.com/SoftFever/OrcaSlicer)
- [OrcaSlicer Releases](https://github.com/SoftFever/OrcaSlicer/releases)
- [OrcaSlicer Wiki](https://github.com/SoftFever/OrcaSlicer/wiki)
- [AIPMS Documentation](./README.md)

---

## پشتیبانی / Support

اگر مشکلی در نصب یا استفاده از OrcaSlicer دارید:

If you have issues installing or using OrcaSlicer:

1. ابتدا GitHub Issues OrcaSlicer را بررسی کنید / Check OrcaSlicer GitHub Issues first
2. لاگ‌های AIPMS را بررسی کنید / Check AIPMS logs
3. در صورت نیاز، یک Issue در مخزن AIPMS باز کنید / Open an issue in AIPMS repository if needed

---

**نکته مهم:** نصب OrcaSlicer اختیاری است. AIPMS بدون آن هم کار می‌کند اما با خروجی‌های mock.

**Important Note:** OrcaSlicer installation is optional. AIPMS works without it but with mock outputs.
