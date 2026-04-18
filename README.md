# Platform API

Backend API لمنصة تعليمية مبنية باستخدام Node.js + Express + MongoDB.

## نظرة عامة

المشروع يدعم:
- نظام مصادقة كامل Access/Refresh Token.
- صلاحيات متعددة: `user`, `admin`, `super_admin`.
- إدارة المحتوى التعليمي: Grades, Subjects, Sections, Lessons.
- رفع فيديوهات الدروس على Cloudinary.
- استقبال Webhooks من Cloudinary وPaymob.
- نظام Quiz كامل (محاولات، تصحيح، تمديد وقت، إعادة تنشيط).
- نظام Assignments مع مرفقات وتسليم وتصحيح.
- نظام Payments لشراء الدروس مع Transactions.
- نظام Coupons للتخفيضات على شراء الدروس.

## Tech Stack

- Node.js
- Express `^4.18.2`
- Mongoose `^9.3.3`
- MongoDB Driver `^7.1.1`
- JWT `^9.0.3`
- Multer `^2.1.0`
- Cloudinary `^1.21.0`
- Nodemailer `^8.0.1`

## إعداد البيئة

أنشئ ملف `config.env` (أو حدّثه) بالقيم التالية:

```env
PORT=3000
NODE_ENV=development

DB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/<db>

JWT_SECRET_KEY=<access_secret>
JWT_EXPIRE_TIME=1h
JWT_REFRESH_SECRET=<refresh_secret>
JWT_REFRESH_EXPIRE_TIME=1d

EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=<email>
EMAIL_PASSWORD=<app_password>
EMAIL_VERIFICATION_REQUIRED=false

CLOUDINARY_CLOUD_NAME=<cloud_name>
CLOUDINARY_API_KEY=<api_key>
CLOUDINARY_API_SECRET=<api_secret>

# Paymob (اختياري - عدم الضبط يعني Mock mode)
PAYMOB_API_KEY=<paymob_api_key>
PAYMOB_HMAC_SECRET=<paymob_hmac_secret>

# Hookdeck public URL (مهم لويبهوك Cloudinary)
WEBHOOK_URL=https://hkdk.events/<your-endpoint>
```

ملاحظة:
- إذا لم يتم وضع `WEBHOOK_URL` سيستخدم الكود قيمة fallback داخل `lessonService`.

## التشغيل المحلي

```bash
npm install
npm run dev
```

Local base URL:
- `http://localhost:3000`

Health check:
- `GET /api/health`

## Scripts

- `npm run dev`: تشغيل باستخدام nodemon.
- `npm start`: تشغيل عادي باستخدام node.
- `npm run build`: أمر placeholder.

## Local Project Structure File

تمت إضافة ملف محلي باسم `PROJECT_STRUCTURE.md` يحتوي على شجرة ملفات المشروع الحالية لتسهيل المراجعة السريعة.

مهم:
- الملف مخصص للاستخدام المحلي فقط.
- الملف متجاهل في Git عبر `.gitignore` حتى لا يتم رفعه إلى GitHub.
- عند تغيّر هيكل المشروع، حدّث الملف يدويًا حسب الحاجة.

## Hookdeck + Cloudinary Webhook

التدفق الحالي:
1. رفع الفيديو إلى Cloudinary من السيرفر.
2. Cloudinary يرسل webhook إلى Hookdeck URL الموجود في `WEBHOOK_URL`.
3. Hookdeck يعمل forward إلى السيرفر المحلي:
   - `POST /eager-complete`
4. السيرفر يحدّث حالة الفيديو إلى `ready` داخل `videos.$.processingStatus`.

### تشغيل Hookdeck CLI

```bash
npm install -g hookdeck-cli
hookdeck login
hookdeck listen 3000 --path /eager-complete
```

بعد تنفيذ `listen`، انسخ رابط `https://hkdk.events/...` وضعه في `WEBHOOK_URL`.

## Paymob Webhook

- endpoint الإنتاجي: `POST /paymob`
- endpoint اختبار محاكاة نجاح الدفع: `POST /webhooks/test/success`
- endpoint اختبار محاكاة فشل الدفع: `POST /webhooks/test/failed`

ملاحظة:
- عند غياب `PAYMOB_API_KEY` أو ضبطه على `test_key` يتم تشغيل Mock mode.

## API Routes (Current)

كل المسارات التالية تتبع `server.js` الحالي. المسارات المحمية تحتاج:
`Authorization: Bearer <token>`.

### Public / Utility
- `GET /`
- `GET /api/health`
- `POST /eager-complete`  (Cloudinary webhook endpoint)
- `POST /paymob`  (Paymob webhook endpoint)
- `POST /webhooks/test/success`  (Test payment webhook)
- `POST /webhooks/test/failed`  (Test payment webhook)

### Auth (`/api/v1/auth`)
- `POST /signup`
- `POST /login`
- `POST /refresh`
- `GET /verifyEmail/:token`
- `POST /forgotPassword`
- `POST /verifyResetCode`
- `PUT /resetPassword`
- `POST /logout`
- `POST /logoutAll`

### Users (`/api/v1/users`)
- `GET /me`
- `PUT /me`
- `PUT /me/change-password`
- `PUT /me/image`
- `DELETE /me/image`
- `DELETE /me`
- `GET /`
- `GET /:id`
- `POST /`
- `PUT /:id`
- `DELETE /:id`
- `PATCH /:id/ban`
- `PATCH /:id/unban`
- `PATCH /:id/toggle-ban`
- `POST /admin`
- `DELETE /admin/:id`

### Grades (`/api/v1/grades`)
- `GET /`
- `GET /:id`
- `POST /`
- `PUT /:id`
- `DELETE /:id`
- `PATCH /:id/toggle`

### Subjects (`/api/v1/subjects`)
- `GET /`
- `GET /:id`
- `GET /:id/structure`
- `POST /`
- `PUT /:id`
- `DELETE /:id`
- `PATCH /:id/toggle`

### Sections (`/api/v1/sections`)
- `GET /`
- `GET /:id`
- `POST /`
- `PUT /:id`
- `DELETE /:id`
- `PATCH /:id/toggle`
- `POST /reorder`

### Lessons (`/api/v1/lessons`)
- `GET /`
- `GET /:id`
- `GET /:id/content`
- `POST /:id/refresh-token`
- `GET /section/:sectionId`
- `POST /:id/purchase`
- `POST /:id/upload-video`
- `DELETE /:lessonId/videos/:videoIndex`
- `POST /`
- `PUT /:id`
- `DELETE /:id`
- `PATCH /:id/toggle`
- `POST /reorder`

### Quiz (`/api/v1`)
- `GET /quiz/lesson/:lessonId`
- `POST /quizzes/:quizId/attempt`
- `POST /attempts/:attemptId/submit-all`
- `GET /quizzes/:quizId/attempts`
- `POST /quiz/lesson/:lessonId`
- `GET /quizzes`
- `GET /quizzes/:id`
- `PUT /quizzes/:id`
- `DELETE /quizzes/:id`
- `GET /quizzes/:quizId/attempts/admin`
- `GET /attempts/:attemptId/details`
- `PATCH /attempts/:attemptId/extend`
- `DELETE /quizzes/:quizId/users/:userId/attempts`
- `PATCH /quizzes/:quizId/attempts/extend-all`
- `PATCH /attempts/:attemptId/reactivate`

### Assignments (`/api/v1`)
- `GET /files/:publicId(*)`
- `GET /my-assignments`
- `GET /assignments/:assignmentId/my-submission`
- `POST /assignments/:assignmentId/submit`
- `GET /assignments/:assignmentId/download/:fileIndex`
- `POST /assignment/lesson/:lessonId`
- `GET /assignment/lesson/:lessonId`
- `GET /assignments/:id`
- `PUT /assignments/:id`
- `DELETE /assignments/:id`
- `GET /assignments/:assignmentId/submissions`
- `PATCH /submissions/:submissionId/grade`

### Payments (`/api/v1/payment`)
- `POST /checkout`
- `GET /status/:orderId`
- `GET /transactions`

### Coupons (`/api/v1/coupons`)
- `POST /`
- `GET /`
- `GET /code/:code`
- `GET /:id`
- `PUT /:id`
- `DELETE /:id`

## ملاحظات تشغيل مهمة

- الـ webhook route مركب قبل `express.json()` حتى يتم استقبال `raw body` بشكل صحيح.
- endpoint الصحيح لويبهوك Cloudinary هو `POST /eager-complete` وليس تحت `/api/v1`.
- إذا ظهر خطأ `EADDRINUSE` فهذا يعني أن المنفذ `3000` مستخدم بالفعل.
- إذا ظهر timeout في Mongo أثناء webhook test، المشكلة غالبًا من اتصال قاعدة البيانات وليست من الراوت نفسه.

## نشر المشروع

المشروع جاهز للنشر على Vercel:
- `server.js` يصدّر `app`.
- تشغيل `app.listen` يتم فقط خارج production.
