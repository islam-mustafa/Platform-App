/**
 * ✅ الثوابت العامة للمشروع
 * تجمع كل القيم الثابتة في مكان واحد لتسهيل الصيانة وتجنب الأخطاء الإملائية
 */

// ============================================================
// 🔐 أدوار المستخدمين (User Roles)
// ============================================================
exports.ROLES = {
  USER: 'user',
  ADMIN: 'admin',
  SUPER_ADMIN: 'super_admin',
};

// ============================================================
// ✏️ الحقول المسموح بتحديثها للمستخدم العادي
// ============================================================
exports.ALLOWED_UPDATES = {
  USER: ['name', 'phone', 'parentPhone', 'profileImg'],
};

// ============================================================
// 🚫 الحقول الممنوع عرضها (للاستخدام مع select)
// ============================================================
exports.EXCLUDED_FIELDS = '-password -__v -passwordResetCode -emailVerificationToken';

// ============================================================
// 💳 نظام الدفع (Payment System)
// ============================================================

// حالات المعاملة (Transaction Status)
exports.PAYMENT_STATUS = {
  PENDING: 'pending',
  COMPLETED: 'completed',
  FAILED: 'failed'
};

// طرق الدفع (Payment Methods)
exports.PAYMENT_METHODS = {
  CARD: 'card',
  FAWRY: 'fawry',
  WALLET: 'wallet'
};

// العملات المدعومة (Currencies)
exports.CURRENCY = {
  EGP: 'EGP',
  USD: 'USD'
};

// مصدر الوصول للدرس (Access Source)
exports.ACCESS_SOURCE = {
  FREE: 'free',
  PURCHASED: 'purchased',
  SUBSCRIPTION: 'subscription'
};

// ============================================================
// 🌐 المسارات العامة (لا تحتاج صلاحيات إضافية)
// ============================================================
exports.PUBLIC_ROUTES = ['/payment/', '/webhooks/'];

// ============================================================
// 📦 ثوابت عامة أخرى
// ============================================================

// الحد الأقصى لحجم الملفات (10MB)
exports.MAX_FILE_SIZE = 10 * 1024 * 1024;

// صيغ الملفات المسموحة
exports.ALLOWED_FILE_TYPES = ['pdf', 'doc', 'docx', 'jpg', 'png', 'zip'];

// مدة صلاحية رابط إعادة تعيين كلمة المرور (10 دقائق)
exports.PASSWORD_RESET_EXPIRY_MINUTES = 10;