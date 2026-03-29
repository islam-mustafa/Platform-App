# Platform API

Backend API لمنصة تعليمية مبنية بـ Node.js وExpress وMongoDB.

المشروع لم يعد مقتصرًا على إدارة المستخدمين فقط، وأصبح يشمل:
- نظام مصادقة كامل مع `Access/Refresh Tokens`.
- إدارة المستخدمين والصلاحيات (`user`, `admin`, `super_admin`).
- إدارة المحتوى التعليمي: الصفوف، المواد، الأقسام، الدروس.
- دعم الدروس المجانية والمدفوعة مع شراء الدروس.
- رفع فيديوهات الدروس على Cloudinary مع Webhook لمعالجة التحويلات.
- نظام كويز متكامل مع محاولات الطالب ولوحة تحكم للأدمن.

## الميزات الحالية

### 1. Authentication
- تسجيل مستخدم جديد `signup`.
- تسجيل دخول `login`.
- تجديد `access token` عبر `refresh token` مع rotation.
- تسجيل خروج جهاز واحد أو كل الأجهزة.
- تفعيل البريد الإلكتروني (مع دعم وضع التطوير لتعطيل الإلزام).
- استرجاع كلمة المرور بالكود وتعيين كلمة جديدة.

### 2. User Management
- جلب/تعديل بيانات المستخدم الحالي.
- تغيير كلمة المرور.
- رفع/حذف صورة البروفايل.
- تعطيل الحساب الذاتي.

### 3. Admin & Super Admin
- CRUD للمستخدمين.
- حظر/فك حظر/تبديل حالة الحظر.
- حماية من حظر النفس أو إدارة أدمن آخر بدون صلاحية.
- إنشاء/حذف أدمن (Super Admin فقط).

### 4. Academic Content
- إدارة الصفوف `Grades`.
- إدارة المواد `Subjects` مع دعم `hasSections`.
- إدارة الأقسام `Sections` مع إعادة الترتيب.
- إدارة الدروس `Lessons` مع إعادة الترتيب وتفعيل/تعطيل.

### 5. Lesson Video Pipeline
- رفع فيديو الدرس عبر Cloudinary.
- حفظ أكثر من فيديو لكل درس.
- حالات معالجة الفيديو: `pending`, `processing`, `ready`, `failed`.
- Webhook endpoint لتأكيد اكتمال التحويلات.
- توليد روابط فيديو موقعة قصيرة العمر للمشاهدة.

### 6. Quiz System
- كويز واحد لكل درس.
- بدء محاولة كويز للطالب.
- تسليم كل الإجابات دفعة واحدة.
- تتبع المحاولات وحساب النتيجة/النسبة/النجاح.
- لوحة أدمن لإحصائيات المحاولات.
- تمديد وقت محاولة فردية أو كل المحاولات النشطة.
- إعادة تنشيط المحاولات المنتهية وإعادة تعيين محاولات طالب.

## Tech Stack

- Node.js
- Express `^4.18.2`
- Mongoose `^6.12.0`
- JWT (`jsonwebtoken ^9.0.3`)
- bcryptjs `^3.0.3`
- express-validator `^7.3.1`
- Multer `^2.1.0`
- Cloudinary `^1.21.0`
- Nodemailer `^8.0.1`

## Project Structure

```text
Platform/
   config/
      database.js
   controllers/
      authController.js
      userController.js
   middlewares/
      errorMiddleware.js
      uploadImageMiddleware.js
      uploadVideoMiddleware.js
      validatorMiddleware.js
   models/
      gradeModel.js
      lessonModel.js
      quizAttemptModel.js
      quizModel.js
      refreshTokenModel.js
      sectionModel.js
      studentLessonModel.js
      subjectModel.js
      userModel.js
   routes/
      authRoute.js
      gradeRoute.js
      index.js
      lessonRoute.js
      quizRoute.js
      sectionRoute.js
      subjectRoute.js
      userRoute.js
      webhookRoute.js
   scripts/
      migrateVideos.js
   services/
      authService.js
      baseService.js
      gradeService.js
      lessonService.js
      quizService.js
      sectionService.js
      subjectService.js
      userService.js
   utils/
      apiError.js
      apiFeatures.js
      constants.js
      createToken.js
      sanitizeData.js
      seedUsers.js
      sendEmail.js
      validators/
         authValidator.js
         gradeValidator.js
         lessonValidator.js
         quizValidator.js
         sectionValidator.js
         subjectValidator.js
         userValidator.js
   config.env
   package.json
   README.md
   routes-doc.json
   server.js
   test-email.js
   vercel.json
```

## Environment Variables

أنشئ/حدّث `config.env` بالقيم التالية:

```env
PORT=8000
NODE_ENV=development

DB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/<db>

JWT_SECRET_KEY=<your_access_secret>
JWT_EXPIRE_TIME=15m
JWT_REFRESH_SECRET=<your_refresh_secret>
JWT_REFRESH_EXPIRE_TIME=7d

EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=<your_email>
EMAIL_PASSWORD=<your_email_password_or_app_password>
EMAIL_VERIFICATION_REQUIRED=false

CLOUDINARY_CLOUD_NAME=<your_cloud_name>
CLOUDINARY_API_KEY=<your_cloudinary_key>
CLOUDINARY_API_SECRET=<your_cloudinary_secret>

BASE_URL=http://localhost:8000
WEBHOOK_URL=<public_webhook_url_for_cloudinary_notifications>
```

## Run Locally

```bash
npm install
npm run dev
```

Local base URL:
- `http://localhost:8000`

Health check:
- `GET /api/health`

## Scripts

- `npm run dev`: تشغيل بـ nodemon.
- `npm run start`: تشغيل عادي بـ node.
- `npm run build`: placeholder build command.

ملفات مساعدة:
- `test-email.js`: اختبار إعدادات البريد.
- `scripts/migrateVideos.js`: سكربت مساعد لهجرة/تعديل بيانات الفيديو.

## API Routes Summary

كل الـ routes (عدا العامة المذكورة) تحتاج `Authorization: Bearer <token>`.

### Auth Routes
- `POST /api/v1/auth/signup`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/refresh`
- `GET /api/v1/auth/verifyEmail/:token`
- `POST /api/v1/auth/forgotPassword`
- `POST /api/v1/auth/verifyResetCode`
- `PUT /api/v1/auth/resetPassword`
- `POST /api/v1/auth/logout`
- `POST /api/v1/auth/logoutAll`

### User Routes
- `GET /api/v1/users/me`
- `PUT /api/v1/users/me`
- `PUT /api/v1/users/me/change-password`
- `PUT /api/v1/users/me/image`
- `DELETE /api/v1/users/me/image`
- `DELETE /api/v1/users/me`

Admin/Super Admin:
- `GET /api/v1/users`
- `GET /api/v1/users/:id`
- `POST /api/v1/users`
- `PUT /api/v1/users/:id`
- `DELETE /api/v1/users/:id`
- `PATCH /api/v1/users/:id/ban`
- `PATCH /api/v1/users/:id/unban`
- `PATCH /api/v1/users/:id/toggle-ban`

Super Admin فقط:
- `POST /api/v1/users/admin`
- `DELETE /api/v1/users/admin/:id`

### Grades Routes
- `GET /api/v1/grades`
- `GET /api/v1/grades/:id`
- `POST /api/v1/grades`
- `PUT /api/v1/grades/:id`
- `DELETE /api/v1/grades/:id`
- `PATCH /api/v1/grades/:id/toggle`

### Subjects Routes
- `GET /api/v1/subjects`
- `GET /api/v1/subjects/:id`
- `GET /api/v1/subjects/:id/structure`
- `POST /api/v1/subjects`
- `PUT /api/v1/subjects/:id`
- `DELETE /api/v1/subjects/:id`
- `PATCH /api/v1/subjects/:id/toggle`

### Sections Routes
- `GET /api/v1/sections`
- `GET /api/v1/sections/:id`
- `POST /api/v1/sections`
- `PUT /api/v1/sections/:id`
- `DELETE /api/v1/sections/:id`
- `PATCH /api/v1/sections/:id/toggle`
- `POST /api/v1/sections/reorder`

### Lessons Routes
- `GET /api/v1/lessons`
- `GET /api/v1/lessons/:id`
- `GET /api/v1/lessons/:id/content`
- `POST /api/v1/lessons/:id/refresh-token`
- `GET /api/v1/lessons/section/:sectionId`
- `POST /api/v1/lessons/:id/purchase`

Admin/Super Admin:
- `POST /api/v1/lessons/:id/upload-video`
- `DELETE /api/v1/lessons/:lessonId/videos/:videoIndex`
- `POST /api/v1/lessons`
- `PUT /api/v1/lessons/:id`
- `DELETE /api/v1/lessons/:id`
- `PATCH /api/v1/lessons/:id/toggle`
- `POST /api/v1/lessons/reorder`

### Quiz Routes
Student:
- `GET /api/v1/quiz/lesson/:lessonId`
- `POST /api/v1/quizzes/:quizId/attempt`
- `POST /api/v1/attempts/:attemptId/submit-all`
- `GET /api/v1/quizzes/:quizId/attempts`

Admin/Super Admin:
- `POST /api/v1/quiz/lesson/:lessonId`
- `GET /api/v1/quizzes`
- `GET /api/v1/quizzes/:id`
- `PUT /api/v1/quizzes/:id`
- `DELETE /api/v1/quizzes/:id`
- `GET /api/v1/quizzes/:quizId/attempts/admin`
- `GET /api/v1/attempts/:attemptId/details`
- `PATCH /api/v1/attempts/:attemptId/extend`
- `DELETE /api/v1/quizzes/:quizId/users/:userId/attempts`
- `PATCH /api/v1/quizzes/:quizId/attempts/extend-all`
- `PATCH /api/v1/attempts/:attemptId/reactivate`

### Webhook Route
- `POST /api/v1/webhooks/eager-complete`

يستخدم لتلقي إشعارات Cloudinary بعد اكتمال eager transformations والتحقق من التوقيع.

## Roles & Authorization

- `user`: استخدام المحتوى والاختبارات حسب الصلاحيات.
- `admin`: إدارة المستخدمين والمحتوى والاختبارات.
- `super_admin`: كل صلاحيات الأدمن + إدارة الأدمنات + صلاحيات عليا.

ملاحظة: `super_admin` يمر تلقائيًا في `allowedTo` middleware.

## Security Notes

- Hashing لكلمات المرور باستخدام bcrypt (`12 rounds`).
- تخزين refresh tokens في قاعدة البيانات مع `TTL index` للحذف التلقائي.
- تحقق من حالة المستخدم (`active` / `isBanned`) في middleware الحماية.
- التحقق من Cloudinary webhook signature لمنع الطلبات المزيفة.

## Deployment

المشروع مجهز للتشغيل على Vercel:
- `server.js` يقوم بتصدير `app`.
- الاتصال بقاعدة البيانات مُدار بحيث يتجنب إعادة الاتصال المتكرر في بيئة serverless.

## ملاحظات مهمة

- ملف `routes-doc.json` قد لا يعكس كل الإضافات الجديدة؛ المرجع الأدق هو ملفات `routes/` و`services/`.
- تم تحديث هذا `README.md` ليتوافق مع الحالة الفعلية للكود حتى مارس 2026.
