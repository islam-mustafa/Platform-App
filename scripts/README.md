# 🌱 Database Seeding Script

هذا المجلد يحتوي على سكريبتات لملء قاعدة البيانات MongoDB بالبيانات الوهمية (seed data) للاختبار.

## 📋 الملفات المتاحة

### 1. `seed.js` - السكريبت الرئيسي
سكريبت شامل يقوم بـ:
- ✅ حذف جميع البيانات القديمة من قاعدة البيانات
- ✅ إنشاء 3 صفوف دراسية (First, Second, Third Year)
- ✅ إنشاء مادة واحدة (اللغة العربية)
- ✅ إنشاء 12 قسم (4 أقسام × 3 صفوف)
- ✅ إنشاء 54 درس (تقريباً 4-5 دروس لكل قسم)
- ✅ إنشاء 54 كويز (كويز واحد لكل درس)
- ✅ إنشاء 3 مستخدمين (Admin + 2 Students)
- ✅ ربط الطالب ببعض الدروس

**الاستخدام:**
```bash
node scripts/seed.js
```

### 2. `checkSeed.js` - سكريبت التحقق
سكريبت للتحقق من اكتمال البيانات والتأكد من أن الـ seed تم بنجاح.

**الاستخدام:**
```bash
node scripts/checkSeed.js
```

---

## 📊 البيانات المُنشأة

### الصفوف (Grades) - 3
```
✅ الصف الأول الثانوي  (Level: 1)
✅ الصف الثاني الثانوي  (Level: 2)
✅ الصف الثالث الثانوي  (Level: 3)
```

### المادة (Subject) - 1
```
✅ اللغة العربية (hasSections: true)
```

### الأقسام (Sections) - 12
لكل صف:
- 🎯 النحو
- 🎯 البلاغة
- 🎯 النصوص
- 🎯 الأدب

### الدروس (Lessons) - 54
أمثلة:
- **النحو**: إعراب المبتدأ والخبر، الفعل الماضي والمضارع، إلخ
- **البلاغة**: الاستعارة والتشبيه، الكناية والمجاز، إلخ
- **النصوص**: نصوص الشعر الجاهلي، نصوص الشعر الحديث، إلخ
- **الأدب**: الأدب الجاهلي، الأدب الإسلامي، إلخ

كل درس يحتوي على:
- ✅ عنوان وصف
- ✅ محتوى نصي
- ✅ مدة الدرس (15-45 دقيقة)
- ✅ تصنيف مجاني/مدفوع
- ✅ سعر (0 للمجاني، 50 للمدفوع)

### الكويزات (Quizzes) - 54
كل درس يحتوي على كويز يتضمن:
- ✅ 5 أسئلة متنوعة
- ✅ أسئلة اختيار من متعدد (multiple choice)
- ✅ أسئلة صح/خطأ (true/false)
- ✅ وقت محدود: 10 دقائق
- ✅ درجة النجاح: 70%
- ✅ عدد المحاولات المسموحة: 3

### المستخدمون (Users) - 3
```
👤 Admin User
   Email: admin@example.com
   Password: admin123
   Role: admin

👤 Test User
   Email: user@example.com
   Password: user123
   Role: user

👤 Student Two
   Email: student2@example.com
   Password: student123
   Role: user
```

### ربط الطالب بالدروس (StudentLesson) - 10
- كل طالب لديه وصول إلى أول 10 دروس
- محاكاة التقدم في المتابعة

---

## 🚀 خطوات التشغيل

### 1️⃣ التأكد من الاتصال بـ MongoDB
تأكد من أن `config.env` يحتوي على `DB_URI` صحيح:
```env
DB_URI=mongodb+srv://nodeDevolopers:learn123@platform.lihp1bg.mongodb.net/?appName=platform
```

### 2️⃣ تشغيل السكريبت
```bash
cd d:\nodejs\Platform
node scripts/seed.js
```

### 3️⃣ التحقق من النتائج
```bash
node scripts/checkSeed.js
```

---

## 📊 النتيجة المتوقعة

عند تشغيل السكريبت بنجاح، ستظهر رسالة:
```
==================================================
📊 SEEDING SUMMARY
==================================================
✅ Grades created: 3
✅ Subjects created: 1
✅ Sections created: 12
✅ Lessons created: 54
✅ Quizzes created: 54
✅ Users created: 3
✅ StudentLessons created: 10
==================================================
✅ Database seeding completed successfully!
```

---

## ⚙️ ملاحظات تقنية

### متطلبات النماذج
يستخدم السكريبت النماذج التالية:
- ✅ Grade
- ✅ Subject
- ✅ Section
- ✅ Lesson
- ✅ Quiz
- ✅ User
- ✅ StudentLesson
- ✅ QuizAttempt (تنظيف)
- ✅ Submission (تنظيف)
- ✅ Assignment (تنظيف)

### تشفير كلمات المرور
- يتم استخدام `bcrypt` لتشفير كلمات المرور المرضى
- الطول الأدنى: 6 أحرف

### الحقول المضافة تلقائياً
- `timestamps`: createdAt, updatedAt
- `_id`: معرّف فريد لكل مستند

---

## 🔄 إعادة تشغيل Seed

لتشغيل السكريبت مرة أخرى وحذف البيانات السابقة:
```bash
node scripts/seed.js
```
**ملاحظة**: السكريبت يحذف جميع البيانات أولاً قبل الإنشاء الجديد!

---

## ❓ استكشاف الأخطاء

### خطأ: `DB_URI is not defined`
- تحقق من أن `config.env` موجود في المجلد الجذر
- تأكد من وجود متغير `DB_URI`

### خطأ: `Cannot find module`
- تأكد من تثبيت المتطلبات: `npm install`

### خطأ: `Connection timeout`
- تحقق من اتصال الإنترنت
- تأكد من صحة رابط MongoDB Atlas

---

## 📝 تعديل البيانات

لتخصيص البيانات، عدّل الدوال التالية في `seed.js`:
- `seedGrades()` - لتعديل الصفوف
- `seedSubject()` - لتعديل المادة
- `seedSections()` - لتعديل الأقسام
- `seedLessons()` - لتعديل الدروس
- `seedQuizzes()` - لتعديل الكويزات
- `seedUsers()` - لتعديل المستخدمين

---

✅ **تم إنشاء السكريبت بنجاح!** Ready to seed your database! 🌱
