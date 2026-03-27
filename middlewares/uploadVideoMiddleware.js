const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const ApiError = require('../utils/apiError');

// ✅ إعداد Cloudinary للفيديو
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ✅ التحقق من صيغة الفيديو
const fileFilter = (req, file, cb) => {
  console.log('📁 File received:', {
    fieldname: file.fieldname,
    originalname: file.originalname,
    mimetype: file.mimetype,
    size: file.size
  });
  
  const allowedTypes = ['video/mp4', 'video/mov', 'video/avi', 'video/mkv', 'video/webm','video/flv','video/x-flv','application/octet-stream'];
  
  if (allowedTypes.includes(file.mimetype)) {
    console.log('✅ File type allowed');
    cb(null, true);
  } else {
    console.log('❌ File type not allowed:', file.mimetype);
    cb(new ApiError(`Only video files (mp4, mov, avi, mkv, webm, flv) are allowed. Got: ${file.mimetype}`, 400), false);
  }
};

// ✅ تخزين الفيديو مؤقتًا في الذاكرة
const storage = multer.memoryStorage();

const upload = multer({ 
  storage, 
  fileFilter,
  limits: { fileSize: 500 * 1024 * 1024 } // 500MB
});

// ✅ Middleware معالجة الأخطاء
exports.uploadVideo = (req, res, next) => {
  const uploadSingle = upload.single('videoFile');
  
  uploadSingle(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      // خطأ من multer نفسه
      if (err.code === 'LIMIT_FILE_SIZE') {
        return next(new ApiError('File too large. Maximum size is 500MB', 400));
      }
      return next(new ApiError(`Upload error: ${err.message}`, 400));
    } else if (err) {
      // خطأ تاني
      return next(err);
    }
    // ✅ كل شيء تمام
    next();
  });
};