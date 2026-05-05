# Platform API

Backend API لمنصة تعليمية مبنية بـ Node.js + Express + MongoDB.

## نظرة عامة

المشروع يدعم:
- مصادقة Access/Refresh Token.
- صلاحيات متعددة: `user`, `admin`, `super_admin`.
- إدارة المحتوى التعليمي: Grades, Subjects, Sections, Lessons.
- Quiz system (محاولات، تمديد وقت، إعادة تنشيط).
- Assignments (رفع مرفقات، تسليم، تصحيح).
- Payments + Transactions + Coupons.
- Cache admin endpoints.
- Cloudinary video uploads + Webhooks (Cloudinary وPaymob).

## Tech Stack

- Node.js
- Express `^4.18.2`
- Mongoose `^9.3.3`
- MongoDB Driver `^7.1.1`
- JWT `^9.0.3`
- Multer `^2.1.0`
- Cloudinary `^1.21.0`
- Nodemailer `^8.0.1`

## Requirements

- Node.js `>=18`
- MongoDB (Atlas أو Local)

## Environment Variables

أنشئ ملف `config.env` في جذر المشروع:

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

# Paymob
# عند عدم الضبط أو عند وضع PAYMOB_API_KEY=test_key يتم تشغيل Mock mode
PAYMOB_API_KEY=<paymob_api_key>
PAYMOB_HMAC_SECRET=<paymob_hmac_secret>

# اختياري: يستخدم في تدفق Webhook الخاص بـ Cloudinary (حسب implementation)
WEBHOOK_URL=https://hkdk.events/<your-endpoint>
```

## Local Setup

```bash
npm install
npm run dev
```

Default local URL:
- `http://localhost:3000`

Health check:
- `GET /api/health`

## NPM Scripts

- `npm run dev`: تشغيل باستخدام nodemon.
- `npm start`: تشغيل عادي باستخدام node.
- `npm run build`: Placeholder command.

## Webhooks

مهم: تم تركيب `app.use('/webhooks', webhookRoute)` قبل `express.json()` لدعم `raw body`.

### Cloudinary webhook
- `POST /webhooks/eager-complete`

### Paymob webhook
- `POST /webhooks/paymob`

### Test webhooks (mock)
- `POST /webhooks/test/success`
- `POST /webhooks/test/failed`

## API Routes (Current)

المسارات التالية حسب الملفات الحالية. أغلب المسارات تحتاج:
`Authorization: Bearer <token>`.

### Public / Utility
- `GET /`
- `GET /api/health`
- `POST /webhooks/eager-complete`
- `POST /webhooks/paymob`
- `POST /webhooks/test/success`
- `POST /webhooks/test/failed`

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

### Cache (`/api/v1/cache`)
- `GET /stats`
	Super admin only.
- `DELETE /flush`
	Super admin only.

## Notes

- في وضع Mock للدفع: اضبط `PAYMOB_API_KEY=test_key` أو اتركه بدون قيمة.
- إذا ظهر `EADDRINUSE` فذلك يعني أن المنفذ مستخدم من عملية أخرى.
- في اختبار webhooks، أي timeout غالبا يرتبط بالاتصال بقاعدة البيانات.

## Deployment

- `server.js` يصدّر `app`.
- حاليًا الكود يقوم بتشغيل السيرفر داخل نفس الملف عبر `startServer()`.
