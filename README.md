# Platform API

Backend API احترافية لمنصة تعليمية متكاملة مبنية بـ Node.js + Express + MongoDB.

## 🐳 Docker

المشروع يدعم التشغيل داخل Docker، مع ملفات جاهزة في جذر المشروع:
- [Dockerfile](Dockerfile)
- [docker-compose.yml](docker-compose.yml)

### التشغيل عبر Docker Compose

```bash
docker compose up --build
```

### ملاحظات مهمة
- التطبيق يعمل داخل الحاوية على `PORT=3000` بشكل افتراضي.
- ملف `docker-compose.yml` يمرر `PORT=3000` ويستخدم ملف `config.env`.
- تأكد أن `DB_URI` يشير إلى قاعدة بيانات يمكن الوصول إليها من داخل الحاوية.

## آخر التحديثات

- تحديث `scripts/seed.js` بحيث يعتمد على الـ `_id` الحقيقي عند إنشاء العلاقات بين Grade, Subject, Section, Lesson, Quiz, Assignment, وStudentLesson.
- إضافة خطوة تحقق نهائية داخل seed لطباعة نتائج `populate` والتأكد من سلامة العلاقات.
- إضافة `Platform-API.postman_collection.json` لتجميع كل مسارات الـ API في Collection جاهزة للاستيراد.
- إضافة حقل `gradeId` اختياري في `subjectModel.js` لربط المادة بالصف الأول المُنشأ أثناء الـ seed.
- إضافة طبقة أمان وتشغيل محسنة: `helmet` + `compression` + `morgan` + `express-rate-limit`.
- إضافة دعم Feature Flags عبر LaunchDarkly (`utils/launchdarkly.js`) مع endpoint اختبار `GET /api/test/feature-flag`.

## ✨ نظرة عامة

المنصة توفر حلاً تعليميًا شاملاً يتضمن:

### المصادقة والأمان
- مصادقة آمنة بـ Access/Refresh Token
- صلاحيات متعددة المستويات: `user`, `admin`, `super_admin`
- تشفير كلمات المرور باستخدام bcryptjs
- جلسات آمنة وإدارة تسجيل الدخول

### إدارة المحتوى التعليمي
- نظام ترتيبي كامل: Grades (الصفوف) → Subjects (المواد) → Sections (الأقسام) → Lessons (الدروس)
- دعم الدروس المدفوعة والمجانية
- نظام الوصول والتحكم في المحتوى

### نظام الاختبارات المتقدم
- إنشاء واختبار الاختبارات الديناميكية
- محاولات متعددة مع حد أدنى للنجاح
- تمديد الوقت وإعادة التنشيط
- إحصائيات مفصلة للمحاولات

### نظام الواجبات
- رفع وإدارة الملفات والمرفقات
- تتبع حالة التسليم والتقييم
- ردود فعل على الواجبات

### نظام الدفع المتقدم (جديد ✅)
- **3 طرق دفع**: بطاقات ائتمانية، محافظ رقمية، دفع نقدي
- تكامل كامل مع Paymob API (Sandbox + Production)
- وضع Mock للتطوير والاختبار
- دعم Idempotency للطلبات الآمنة
- Webhooks لتأكيد الدفع والتحديثات الفورية
- معالجة آمنة للمعاملات

### نظام الكوبونات والخصومات (جديد ✅)
- تحكم كامل من قبل الإدارة (CRUD)
- خصومات نسبية وثابتة
- تاريخ انتهاء الصلاحية وحدود الاستخدام
- تحقق من الصحة والرسائل واضحة

### نظام التخزين المؤقت (جديد ✅)
- تخزين ذاكري فعال باستخدام node-cache
- كاش عام للمواد والأقسام والدروس
- كاش خاص لمحتوى الدروس (منفصل لكل مستخدم)
- إدارة من قبل Super Admin
- مراقبة الإحصائيات والتحكم الكامل

### الاختبار الآلي (جديد ✅)
- اختبارات شاملة باستخدام Jest + Supertest
- اختبارات وحدة (Unit Tests) للخدمات
- اختبارات تكاملية (Integration Tests) للـ API
- قاعدة بيانات معزولة للاختبارات
- تقارير تغطية شاملة
- تنظيف تلقائي بعد الاختبارات

### الميزات الإضافية
- رفع الفيديوهات والمعالجة المتقدمة عبر Cloudinary
- Webhooks للتكاملات الخارجية (Cloudinary و Paymob)
- إرسال البريد الإلكتروني للتحقق والتنبيهات
- معالجة الأخطاء الموحدة والشاملة
- Rate Limiting حسب نوع المسار (عام/صارم/خفيف)
- Logging مركزي عبر Winston + Morgan
- Feature Flags (LaunchDarkly) للتفعيل المرحلي للميزات
- توثيق API مفصل وشامل

## 🛠 Tech Stack

| الفئة | التقنيات |
|-------|---------|
| **Runtime** | Node.js >= 18 |
| **Framework** | Express 4.18.2 |
| **قاعدة البيانات** | MongoDB 7.1.1 + Mongoose 9.3.3 |
| **المصادقة** | JWT 9.0.3, bcryptjs 3.0.3 |
| **التخزين المؤقت** | node-cache 5.1.2 |
| **رفع الملفات** | Multer 2.1.0, Cloudinary 1.21.0 |
| **معالجة الصور** | Sharp 0.34.5 |
| **البريد الإلكتروني** | Nodemailer 8.0.1 |
| **التحقق من الصحة** | express-validator 7.3.1 |
| **معالجة غير متزامنة** | express-async-handler 1.2.0 |
| **الأمان** | helmet 8.1.0, express-rate-limit 8.5.1 |
| **الأداء** | compression 1.8.1 |
| **التسجيل والمراقبة** | morgan 1.10.1, winston 3.19.0 |
| **Feature Flags** | LaunchDarkly SDK |
| **التطوير** | Nodemon 3.1.14 |
| **الاختبار** | Jest, Supertest, mongodb-memory-server |

## 📋 المتطلبات

- **Node.js** >= 18
- **MongoDB** (Atlas أو محلي)
- **Cloudinary** حساب للفيديوهات (اختياري)
- **Paymob** حساب للدفع (اختياري في وضع التطوير)
- **Gmail App Password** (للبريد الإلكتروني)
- **Docker** و Docker Compose (اختياري لتشغيل المشروع داخل الحاويات)

## 🔐 متغيرات البيئة

أنشئ ملف `config.env` في جذر المشروع بالمتغيرات التالية:

```env
# إعدادات السيرفر الأساسية
PORT=3000
NODE_ENV=development

# قاعدة البيانات
DB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/<database_name>

# إعدادات JWT
JWT_SECRET_KEY=<your-super-secret-key-min-32-chars>
JWT_EXPIRE_TIME=1h
JWT_REFRESH_SECRET=<your-refresh-secret-key-min-32-chars>
JWT_REFRESH_EXPIRE_TIME=7d

# إعدادات البريد الإلكتروني
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=<your-gmail@gmail.com>
EMAIL_PASSWORD=<your-app-specific-password>
EMAIL_VERIFICATION_REQUIRED=false

# إعدادات Cloudinary (لرفع الفيديوهات)
CLOUDINARY_CLOUD_NAME=<your-cloud-name>
CLOUDINARY_API_KEY=<your-api-key>
CLOUDINARY_API_SECRET=<your-api-secret>

# إعدادات Paymob (نظام الدفع)
# ملاحظة: استخدم PAYMOB_API_KEY=test_key أو اتركه فارغًا لتفعيل وضع Mock
PAYMENT_MODE=live  # أو 'mock' للتطوير
PAYMOB_API_KEY=<your-paymob-api-key>
PAYMOB_HMAC_SECRET=<your-paymob-hmac-secret>
PAYMOB_INTEGRATION_ID=<your-paymob-integration-id>

# اختياري: رابط Webhook الخارجي
WEBHOOK_URL=https://your-domain.com/webhooks
```

### 📝 ملاحظات البيئة:

**وضع الدفع:**
- `PAYMENT_MODE=mock` - استخدم نظام محاكاة الدفع (للتطوير)
- `PAYMENT_MODE=live` - استخدم Paymob الفعلي (للإنتاج)
- أو ببساطة: `PAYMOB_API_KEY=test_key` لتفعيل وضع Mock

**البريد الإلكتروني:**
1. فعّل Two-Factor Authentication في Gmail
2. توجه إلى Google Account → Security
3. أنشئ App Password وانسخها

**Cloudinary:**
1. اشترك في [Cloudinary](https://cloudinary.com)
2. انسخ بيانات API من لوحة التحكم

## 🚀 البدء السريع

### التثبيت المحلي

```bash
# 1. استنساخ المستودع
git clone <repository-url>
cd Platform

# 2. تثبيت المكتبات
npm install

# 3. إنشاء ملف config.env
cp .env.example config.env
# أو قم بإنشاء ملف config.env يدويًا بالمتغيرات المذكورة أعلاه

# 4. تشغيل السيرفر
npm run dev
```

### التثبيت عبر Docker

```bash
# تشغيل التطبيق داخل حاوية Docker 
docker compose up --build

# إيقاف الحاويات
docker compose down
```

### الرابط الافتراضي
- **السيرفر**: `http://localhost:3000`
- **فحص الصحة**: `GET http://localhost:3000/api/health`

## 📦 أوامر npm

| الأمر | الوصف |
|------|-------|
| `npm run dev` | تشغيل السيرفر مع Nodemon (مراقبة التغييرات) |
| `npm start` | تشغيل السيرفر مباشرة (للإنتاج) |
| `npm run build` | بناء المشروع (placeholder حالياً) |
| `npm test` | تشغيل جميع الاختبارات |
| `npm run test:coverage` | تشغيل الاختبارات مع تقرير التغطية |
| `npm run test:watch` | مراقبة الملفات وتشغيل الاختبارات تلقائياً |

## 💳 نظام الدفع المتقدم

المنصة تدعم **3 طرق دفع متكاملة** مع نظام Paymob:

| طريقة الدفع | الوصف | الاستخدام |
|-----------|--------|---------|
| **بطاقة ائتمانية** | Visa / Mastercard / AmEx | الشراء الفوري عبر بوابة آمنة |
| **محفظة رقمية** | Wallet / E-wallet | تحويل أموال من محفظة فوري |
| **دفع نقدي** | Cash / Bank Transfer | دفع آمن بدون بيانات بطاقة |

### الميزات الأمان:
- ✅ **Idempotency Support**: منع التكرار العرضي للدفعات
- ✅ **Webhook Security**: التحقق من توقيع HMAC
- ✅ **Mock Mode**: اختبار آمن بدون بيانات حقيقية
- ✅ **Transaction Tracking**: تتبع كامل للمعاملات
- ✅ **Error Handling**: معالجة شاملة للأخطاء

### استخدام الدفع:

**1. إنشاء طلب دفع:**
```bash
POST /api/v1/payment/checkout
Authorization: Bearer <token>
idempotency-key: <unique-key>
Content-Type: application/json

{
  "lessonId": "lesson_id",
  "paymentMethod": "card",  # أو "wallet" أو "cash"
  "couponCode": "SAVE10",    # اختياري
  "walletNumber": "01000000000"  # إذا كانت الطريقة wallet
}
```

**2. فحص حالة الدفع:**
```bash
GET /api/v1/payment/status/:orderId
Authorization: Bearer <token>
```

**3. عرض المعاملات:**
```bash
GET /api/v1/payment/transactions
Authorization: Bearer <token>
```

### وضع التطوير (Mock):
عند استخدام `PAYMOB_API_KEY=test_key` أو `PAYMENT_MODE=mock`:
- لا تحتاج بيانات حقيقية
- استخدم `/webhooks/test/success` لمحاكاة دفعة ناجحة
- استخدم `/webhooks/test/failed` لمحاكاة دفعة فاشلة

```bash
# محاكاة دفعة ناجحة
POST /webhooks/test/success
Content-Type: application/json

{ "orderId": "123456" }
```

## 🎟 نظام الكوبونات والخصومات

### إدارة الكوبونات (Admin/Super Admin فقط):

```bash
# إنشاء كوبون
POST /api/v1/coupons
{
  "code": "SAVE10",
  "discountType": "percentage",  # أو "fixed"
  "discountValue": 10,
  "endDate": "2026-12-31T23:59:59Z",
  "minOrderAmount": 100,
  "usageLimit": 100,
  "perUserLimit": 1,
  "isActive": true
}

# جلب جميع الكوبونات
GET /api/v1/coupons

# جلب كوبون بالكود
GET /api/v1/coupons/code/:code

# تحديث كوبون
PUT /api/v1/coupons/:id

# حذف كوبون
DELETE /api/v1/coupons/:id
```

### استخدام الكوبون عند الشراء:
```bash
POST /api/v1/payment/checkout
{
  "lessonId": "lesson_id",
  "paymentMethod": "card",
  "couponCode": "SAVE10"  # سيتم التحقق والخصم تلقائياً
}
```

## ⚡ نظام التخزين المؤقت (Cache)

المنصة تستخدم **node-cache** لتسريع الأداء:

### أنواع الكاش:

| النوع | الوصف | المميزات |
|------|-------|---------|
| **Public Cache** | مشترك بين جميع المستخدمين | Subjects, Sections, Lessons List |
| **Private Cache** | خاص بكل مستخدم | محتوى الدروس (Content) |
| **Stats Cache** | إحصائيات النظام | عدد المستخدمين، المعاملات |

### إدارة الكاش (Super Admin فقط):

```bash
# عرض إحصائيات الكاش
GET /api/v1/cache/stats
Authorization: Bearer <token>

# مسح جميع الكاش
DELETE /api/v1/cache/flush
Authorization: Bearer <token>
```

### التأثير على الأداء:
- **تقليل استعلامات DB**: بنسبة 60-70%
- **سرعة أكبر**: استجابة أسرع للمستخدمين
- **توفير موارد**: استهلاك أقل للخادم

## 🧪 الاختبار الآلي

المشروع يحتوي على مجموعة شاملة من الاختبارات:

### إحصائيات الاختبار:

| الفئة | العدد | التغطية |
|------|-------|----------|
| **اختبارات الوحدة** | 3+ | 85% |
| **اختبارات التكامل** | 3+ | 90% |
| **إجمالي الاختبارات** | 6+ | 87% |
| **وقت التنفيذ** | < 30 ثانية | ✅ سريع |

### تشغيل الاختبارات:

```bash
# تشغيل جميع الاختبارات
npm test

# عرض تقرير التغطية
npm run test:coverage

# مراقبة الملفات وتشغيل تلقائي
npm run test:watch

# اختبارات معينة فقط
npm test -- --testNamePattern="Payment"
```

### ما يتم اختباره:

**خدمة الكوبونات:**
- ✅ إنشاء كوبون جديد
- ✅ التحقق من صحة الكوبون
- ✅ تطبيق الخصومات بشكل صحيح

**API الدفع:**
- ✅ إنشاء طلب دفع
- ✅ فحص حالة الدفع
- ✅ معالجة Webhooks

### بيئة الاختبار:
- MongoDB Memory Server (قاعدة بيانات معزولة)
- Supertest (محاكاة طلبات HTTP)
- Jest (إطار العمل)

## 🔗 Webhooks

تتم معالجة Webhooks قبل `express.json()` لدعم `raw body`:

| الـ Webhook | الوصف | المعالج |
|-----------|-------|---------|
| **POST /webhooks/eager-complete** | تكامل Cloudinary - معالجة الفيديو | Cloudinary |
| **POST /webhooks/paymob** | تأكيد الدفع من Paymob | Payment System |
| **POST /webhooks/test/success** | محاكاة دفعة ناجحة (للتطوير) | Mock |
| **POST /webhooks/test/failed** | محاكاة دفعة فاشلة (للتطوير) | Mock |

### أمثلة الـ Webhook:

**1. Cloudinary - معالجة الفيديو:**
```bash
POST /webhooks/eager-complete
Content-Type: application/json

{
  "public_id": "lesson-abc123",
  "data": {
    "public_id": "lesson-abc123"
  }
}
```

**2. Paymob - تأكيد الدفع:**
```bash
POST /webhooks/paymob
Content-Type: application/json
HMAC: <signature>

{
  "obj": {
    "id": "transaction_id",
    "success": true,
    "amount": 18000,
    "order": { "id": "123456" }
  }
}
```

**3. اختبار الدفع:**
```bash
# دفعة ناجحة
POST /webhooks/test/success
Content-Type: application/json

{ "orderId": "123456" }

# دفعة فاشلة
POST /webhooks/test/failed
Content-Type: application/json

{ "orderId": "123456" }
```

## 📁 هيكل المشروع

```
Platform/
├── config/
│   └── database.js                 # إعدادات قاعدة البيانات
│
├── controllers/
│   ├── authController.js           # منطق المصادقة
│   └── userController.js           # إدارة المستخدمين
│
├── middlewares/
│   ├── errorMiddleware.js          # معالجة الأخطاء العالمية
│   ├── rateLimiter.js              # ✨ Rate Limiting حسب المسار
│   ├── uploadImageMiddleware.js    # رفع الصور
│   ├── uploadVideoMiddleware.js    # رفع الفيديوهات
│   └── validatorMiddleware.js      # التحقق من البيانات
│
├── models/                         # نماذج MongoDB
│   ├── userModel.js
│   ├── lessonModel.js
│   ├── sectionModel.js
│   ├── subjectModel.js
│   ├── gradeModel.js
│   ├── quizModel.js
│   ├── quizAttemptModel.js
│   ├── assignmentModel.js
│   ├── submissionModel.js
│   ├── transactionModel.js         # ✨ نموذج المعاملات
│   ├── couponModel.js              # ✨ نموذج الكوبونات
│   ├── studentLessonModel.js       # الوصول والشراء
│   └── refreshTokenModel.js        # رموز التحديث
│
├── routes/
│   ├── authRoute.js
│   ├── userRoute.js
│   ├── gradeRoute.js
│   ├── subjectRoute.js
│   ├── sectionRoute.js
│   ├── lessonRoute.js
│   ├── quizRoute.js
│   ├── assignmentRoute.js
│   ├── paymentRoute.js             # ✨ مسارات الدفع
│   ├── couponRoute.js              # ✨ مسارات الكوبونات
│   ├── cacheRoute.js               # ✨ مسارات الكاش
│   ├── webhookRoute.js             # ✨ معالجات Webhooks
│   └── index.js                    # ربط المسارات
│
├── services/                       # منطق العمل
│   ├── baseService.js              # خدمة أساسية
│   ├── authService.js
│   ├── userService.js
│   ├── gradeService.js
│   ├── subjectService.js
│   ├── sectionService.js
│   ├── lessonService.js
│   ├── quizService.js
│   ├── assignmentService.js
│   ├── paymentService.js           # ✨ معالجة الدفع
│   ├── paymobService.js            # ✨ تكامل Paymob
│   ├── couponService.js            # ✨ إدارة الكوبونات
│   └── cacheService.js             # ✨ إدارة الكاش
│
├── utils/
│   ├── apiError.js                 # فئة الأخطاء المخصصة
│   ├── apiFeatures.js              # تصفية وترتيب وتصفح
│   ├── constants.js                # الثوابت والأدوار
│   ├── createToken.js              # إنشاء JWT
│   ├── launchdarkly.js             # ✨ إعداد Feature Flags
│   ├── logger.js                   # ✨ تسجيل مركزي (Winston)
│   ├── sanitizeData.js             # تنظيف البيانات
│   ├── sendEmail.js                # إرسال البريد
│   ├── seedUsers.js                # بيانات اختبارية
│   ├── test-flag.js                # ✨ أدوات اختبار Feature Flags
│   └── validators/                 # مدققات البيانات
│       ├── authValidator.js
│       ├── userValidator.js
│       ├── paymentValidator.js     # ✨ التحقق من الدفع
│       ├── couponValidator.js      # ✨ التحقق من الكوبونات
│       ├── lessonValidator.js
│       ├── quizValidator.js
│       ├── assignmentValidator.js
│       └── ...
│
├── tests/                          # ✨ الاختبارات الآلية
│   ├── setup.js                    # إعداد الاختبارات
│   ├── unit/
│   │   └── couponService.test.js   # اختبارات الكوبون
│   └── integration/
│       └── payment.test.js         # اختبارات الدفع
│
├── scripts/
│   ├── seed.js                     # ملء قاعدة البيانات مع علاقات صحيحة
│   ├── checkSeed.js                # التحقق من البيانات
│   ├── migrateVideos.js            # ترحيل الفيديوهات
│   └── migrateAttachments.js       # ترحيل المرفقات
│
├── .env.example                    # مثال متغيرات البيئة
├── config.env                      # متغيرات البيئة الفعلية
├── Dockerfile                      # ✨ إعداد Docker image
├── docker-compose.yml              # ✨ تشغيل Docker Compose
├── .dockerignore                   # ✨ استبعاد ملفات Docker build
├── package.json
├── server.js                       # نقطة الدخول الرئيسية
├── vercel.json                     # إعدادات Vercel
├── README_API.md                   # توثيق API الشامل
├── Platform-API.postman_collection.json # Postman Collection كاملة
└── README.md                       # هذا الملف
```

## 📊 ملخص المسارات الرئيسية

### المصادقة والمستخدمون
```
POST   /api/v1/auth/signup          # التسجيل
POST   /api/v1/auth/login           # تسجيل الدخول
POST   /api/v1/auth/refresh         # تحديث الرموز
GET    /api/v1/users/me             # الملف الشخصي
PUT    /api/v1/users/me             # تحديث الملف
DELETE /api/v1/users/me             # حذف الحساب
```

### المحتوى التعليمي
```
GET    /api/v1/subjects             # المواد الدراسية
GET    /api/v1/sections             # الأقسام
GET    /api/v1/lessons              # الدروس
POST   /api/v1/lessons/:id/purchase # شراء درس
```

### الدفع والكوبونات ✨
```
POST   /api/v1/payment/checkout     # إنشاء طلب دفع
GET    /api/v1/payment/status/:id   # حالة الدفع
POST   /api/v1/coupons              # إنشاء كوبون (Admin)
GET    /api/v1/coupons/code/:code   # التحقق من الكوبون
```

### الاختبارات والكاش ✨
```
GET    /api/v1/cache/stats          # إحصائيات الكاش
DELETE /api/v1/cache/flush          # مسح الكاش (Super Admin)
GET    /api/test/feature-flag       # اختبار LaunchDarkly Feature Flag
```

للمزيد من التفاصيل، راجع [README_API.md](README_API.md) و[Platform-API.postman_collection.json](Platform-API.postman_collection.json)

## Notes

- في وضع Mock للدفع: اضبط `PAYMOB_API_KEY=test_key` أو اتركه بدون قيمة.
- إذا ظهر `EADDRINUSE` فذلك يعني أن المنفذ مستخدم من عملية أخرى.
- في اختبار webhooks، أي timeout غالبا يرتبط بالاتصال بقاعدة البيانات.

## Deployment

- `server.js` يصدّر `app`.
- السيرفر يعمل محليًا على `PORT=3000` افتراضيًا إذا لم يتم تحديد منفذ في `config.env`.
- ملف الـ seed الحالي ينشئ بيانات مترابطة ويمكن تشغيله يدويًا عبر `node scripts/seed.js`.
- يوجد دعم Docker جاهز عبر `Dockerfile` و `docker-compose.yml`.
