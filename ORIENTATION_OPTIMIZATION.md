# 🤖 AI-Powered Orientation Optimization

## Overview | نمای کلی

The AIPMS system now includes **automatic AI-powered orientation optimization** that analyzes your 3D model and determines the best orientation for printing. This feature minimizes support material, reduces print time, and improves overall print quality.

سیستم AIPMS اکنون شامل **بهینه‌سازی خودکار جهت‌گیری با هوش مصنوعی** می‌شود که مدل سه‌بعدی شما را تحلیل کرده و بهترین جهت برای پرینت را تعیین می‌کند. این ویژگی مواد ساپورت را به حداقل رسانده، زمان پرینت را کاهش داده و کیفیت کلی پرینت را بهبود می‌بخشد.

## Features | ویژگی‌ها

### 🎯 Multi-Factor Analysis | تحلیل چند عاملی

The AI analyzes multiple factors to determine the optimal orientation:

هوش مصنوعی عوامل متعددی را برای تعیین جهت‌گیری بهینه تحلیل می‌کند:

1. **Support Volume | حجم ساپورت**
   - Minimizes the amount of support material required
   - کاهش حجم مواد ساپورت مورد نیاز
   - Weight: 35% in scoring

2. **Overhang Area | سطح اورهنگ**
   - Reduces surfaces that require support
   - کاهش سطوحی که به ساپورت نیاز دارند
   - Weight: 25% in scoring

3. **Bed Adhesion & Stability | چسبندگی و پایداری روی بستر**
   - Ensures good contact with the build plate
   - اطمینان از تماس خوب با صفحه پرینت
   - Weight: 15% in scoring

4. **Surface Quality | کیفیت سطح**
   - Optimizes for best surface finish
   - بهینه‌سازی برای بهترین کیفیت سطح
   - Weight: 15% in scoring

5. **Print Time | زمان پرینت**
   - Reduces overall printing duration
   - کاهش مدت زمان کلی پرینت
   - Weight: 10% in scoring

### 🔄 Automatic Application | اعمال خودکار

- The optimal rotation is **automatically applied** before slicing
- چرخش بهینه **به طور خودکار** قبل از اسلایس اعمال می‌شود

- Both G-code and 3MF files contain the rotated model
- هر دو فایل G-code و 3MF شامل مدل چرخانده شده هستند

- Original model remains unchanged
- مدل اصلی بدون تغییر باقی می‌ماند

### 📊 Detailed Scoring | امتیازدهی دقیق

Each orientation is scored from 0-100 based on:
هر جهت‌گیری بر اساس موارد زیر از 0 تا 100 امتیاز می‌گیرد:

```
Total Score = (0.35 × Support Score) +
              (0.25 × Overhang Score) +
              (0.15 × Stability Score) +
              (0.15 × Surface Quality Score) +
              (0.10 × Print Time Score)
```

### 🧠 OpenAI Integration | یکپارچه‌سازی با OpenAI

- Uses GPT-4o-mini for detailed analysis and recommendations
- استفاده از GPT-4o-mini برای تحلیل دقیق و پیشنهادات

- Provides bilingual explanations (English & Persian)
- ارائه توضیحات دو زبانه (انگلیسی و فارسی)

## How It Works | نحوه کار

### 1. Candidate Generation | تولید نامزدها

The system tests **48+ different orientations** including:
سیستم **بیش از 48 جهت‌گیری مختلف** را آزمایش می‌کند، شامل:

- 6 main face orientations (0°, 90°, 180°, 270°)
- شش جهت‌گیری اصلی روی صفحات

- Diagonal orientations (45°, 135°, 225°, 315°)
- جهت‌گیری‌های مورب

- Combined rotations on X, Y, Z axes
- چرخش‌های ترکیبی روی محورهای X، Y، Z

### 2. Geometric Analysis | تحلیل هندسی

For each orientation:
برای هر جهت‌گیری:

```typescript
// Calculate support volume using signed volume method
حجم ساپورت = جمع (سطح مثلث × فاصله از بستر)
  برای هر مثلث با زاویه > 45° و رو به پایین

// Measure overhang area
سطح اورهنگ = جمع سطح مثلث‌های با زاویه > 45°

// Evaluate stability based on base contact area
پایداری = (سطح تماس پایه × 0.7) + (مرکز جرم پایین × 0.3)

// Surface quality from vertical/horizontal faces
کیفیت سطح = سطح صاف / کل سطح
```

### 3. AI Recommendation | پیشنهاد هوش مصنوعی

The best orientation is sent to OpenAI GPT-4o-mini for analysis:
بهترین جهت‌گیری برای تحلیل به OpenAI GPT-4o-mini ارسال می‌شود:

- Explains why this orientation is optimal
- توضیح می‌دهد چرا این جهت‌گیری بهینه است

- Identifies potential challenges
- چالش‌های احتمالی را شناسایی می‌کند

- Provides printing recommendations
- پیشنهادات پرینت ارائه می‌دهد

### 4. Rotation Application | اعمال چرخش

The optimal rotation is applied to the STL file:
چرخش بهینه روی فایل STL اعمال می‌شود:

1. Load original STL geometry
2. Apply 4×4 rotation matrix
3. Recalculate normals and bounds
4. Export as new STL file
5. Use rotated model for slicing

## API Usage | استفاده از API

### Analyze Orientation Only | فقط تحلیل جهت‌گیری

```javascript
POST /api/slicing/optimize-orientation

Request Body:
{
  "filePath": "/uploads/model.stl",
  "materialType": "PLA",
  "printerProfile": {
    "buildVolumeX": 220,
    "buildVolumeY": 220,
    "buildVolumeZ": 250
  }
}

Response:
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
      "printTime": 145,
      "reasoning": "minimal support needed, excellent bed adhesion"
    },
    "alternatives": [...],
    "analysis": "**English:** This orientation minimizes support material..."
  }
}
```

### Generate G-Code with Optimization | تولید G-Code با بهینه‌سازی

```javascript
POST /api/slicing/generate-gcode

Request Body:
{
  "filePath": "/uploads/model.stl",
  "settings": { ... },
  "printerProfile": { ... },
  "generate3MF": true,
  "optimizeOrientation": true  // ← Enable optimization (default: true)
}

Response:
{
  "success": true,
  "gcodePath": "/output/model_123456.gcode",
  "threeMFPath": "/output/model_123456.3mf",
  "orientationData": { ... },
  "rotatedModelPath": "/output/model_rotated_123456.stl",
  "metadata": { ... }
}
```

### Disable Optimization | غیرفعال کردن بهینه‌سازی

```javascript
{
  "optimizeOrientation": false  // Use original orientation
}
```

## Frontend Display | نمایش در رابط کاربری

The frontend automatically displays orientation data when available:

```
┌─────────────────────────────────────────────────┐
│ 🤖 بهینه‌سازی جهت‌گیری با هوش مصنوعی           │
├─────────────────────────────────────────────────┤
│  Score: 87.5/100                                │
│                                                 │
│  حجم ساپورت: 125.30 mm³                        │
│  سطح اورهنگ: 45.20 mm²                         │
│  پایداری: 92.0%                                │
│  کیفیت سطح: 85.0%                              │
│                                                 │
│  Analysis:                                      │
│  This orientation minimizes support material    │
│  while maintaining good bed adhesion...         │
│                                                 │
│  Rotation Applied:                              │
│  X: 90.0° | Y: 0.0° | Z: 0.0°                  │
└─────────────────────────────────────────────────┘
```

## Technical Details | جزئیات فنی

### Overhang Detection | تشخیص اورهنگ

```typescript
// Detect overhangs > 45° facing downward
const overhangAngle = 45; // degrees
const angleWithVertical = Math.acos(normalZ);

if (angleInDegrees > overhangAngle && normalZ < 0) {
  // Needs support
  supportVolume += triangleArea × heightFromBed;
}
```

### Stability Calculation | محاسبه پایداری

```typescript
// Base area (bottom 5% of model)
const baseArea = calculateContactArea(bottomTriangles);

// Center of gravity height
const cogHeight = totalMoment / totalVolume;

// Stability score
stability = (baseArea / maxArea) × 0.7 +
            (1 - cogHeight / modelHeight) × 0.3;
```

### Rotation Matrix Application | اعمال ماتریس چرخش

```typescript
// Create rotation matrix from Euler angles
const matrix = new THREE.Matrix4()
  .makeRotationFromEuler(rotation);

// Apply to geometry
geometry.applyMatrix4(matrix);

// Recalculate normals for proper rendering
geometry.computeVertexNormals();
```

## Performance | عملکرد

- Analysis time: ~2-5 seconds for typical models
- زمان تحلیل: 2-5 ثانیه برای مدل‌های معمولی

- 48 orientations tested
- 48 جهت‌گیری آزمایش شده

- Real-time progress feedback
- بازخورد پیشرفت در زمان واقعی

## Best Practices | بهترین روش‌ها

### When to Use | چه زمانی استفاده کنید

✅ **Always recommended for:**
- Complex organic shapes
- اشکال پیچیده ارگانیک

- Models with many overhangs
- مدل‌های با اورهنگ زیاد

- Functional parts requiring strength
- قطعات کاربردی نیازمند استحکام

❌ **May skip for:**
- Simple geometric shapes (cubes, cylinders)
- اشکال هندسی ساده

- Models already optimally oriented
- مدل‌های که از قبل جهت‌گیری بهینه دارند

- Very large models (>10MB STL)
- مدل‌های بسیار بزرگ

### Material Considerations | ملاحظات مواد

Different materials benefit from different priorities:
مواد مختلف از اولویت‌های مختلفی بهره می‌برند:

- **PLA**: Focus on support reduction
- **ABS**: Prioritize warping prevention (stability)
- **PETG**: Balance between support and surface quality
- **TPU**: Maximize bed adhesion

## Troubleshooting | عیب‌یابی

### Optimization Takes Too Long | بهینه‌سازی طولانی است

```javascript
// Reduce sampling density (default: 48 orientations)
// در کد orientationOptimizer.ts
private readonly samplingDensity = 24; // کاهش به 24
```

### Unexpected Orientation | جهت‌گیری غیرمنتظره

- Check the AI analysis explanation
- بررسی توضیحات تحلیل هوش مصنوعی

- Review alternative orientations
- بررسی جهت‌گیری‌های جایگزین

- Consider material-specific requirements
- در نظر گرفتن نیازهای خاص مواد

### Support Volume Still High | حجم ساپورت هنوز بالاست

Some models inherently require supports. The AI finds the **best** orientation, not necessarily a **perfect** one.

برخی مدل‌ها ذاتاً نیاز به ساپورت دارند. هوش مصنوعی **بهترین** جهت را پیدا می‌کند، نه لزوماً یک جهت **کامل**.

## Future Enhancements | بهبودهای آینده

Planned features:
ویژگی‌های برنامه‌ریزی شده:

- [ ] Custom orientation weights per material
- [ ] Support for multi-part orientations
- [ ] Visual orientation preview in 3D viewer
- [ ] Machine learning from user feedback
- [ ] Batch orientation optimization

## Files Modified | فایل‌های تغییر یافته

```
backend/src/services/orientationOptimizer.ts   (NEW - 600+ lines)
backend/src/services/orcaSlicerService.ts      (UPDATED)
backend/src/routes/slicing.ts                  (UPDATED)
frontend/src/components/GCodeGenerator.tsx     (UPDATED)
frontend/src/components/GCodeGenerator.css     (UPDATED)
package.json                                   (UPDATED - @types/three)
```

## Credits | اعتبارات

- Three.js for 3D geometry processing
- OpenAI GPT-4o-mini for AI analysis
- Community feedback and testing

---

Made with ❤️ by AIPMS Team
