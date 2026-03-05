// أدوار المستخدمين
exports.ROLES = {
  USER: 'user',
  ADMIN: 'admin',
  SUPER_ADMIN: 'super_admin',
};

// الحقول المسموح بتحديثها للمستخدم العادي
exports.ALLOWED_UPDATES = {
  USER: ['name', 'phone', 'parentPhone', 'profileImg'],
};

// الحقول الممنوع عرضها
exports.EXCLUDED_FIELDS = '-password -__v -passwordResetCode -emailVerificationToken';