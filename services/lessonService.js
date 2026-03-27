const streamifier = require('streamifier');
const cloudinary = require('cloudinary').v2;
const Lesson = require('../models/lessonModel');
const Section = require('../models/sectionModel');
const StudentLesson = require('../models/studentLessonModel');
const asyncHandler = require('express-async-handler');
const ApiError = require('../utils/apiError');
const { factory } = require('./baseService');

const lessonFactory = factory(Lesson, 'Lesson', { 
  hideInactive: true,
  
  // ✅ دالة مخصصة لمعالجة المستند قبل الرد في getOne
  processOne: async (req, res, doc) => {
    // للمستخدم العادي
    if (req.user && req.user.role === 'user') {
      doc = doc.toObject();
      
      if (doc.isPremium) {
        delete doc.content;
      } else {
        if (doc.content) {
          delete doc.content.text;
        }
      }
    }
    res.status(200).json({ status: 'success', data: doc });
  },
  
  // ✅ دالة مخصصة لمعالجة المصفوفة قبل الرد في getAll
  processMany: async (req, res, docs) => {
    // للمستخدم العادي
    console.log('=================================');
    console.log('processMany called for', docs.length, 'lessons');
    console.log('User role:', req.user?.role);
    
    // للمستخدم العادي
    if (req.user && req.user.role === 'user') {
      docs = docs.map(doc => {
        console.log('Before:', doc._id, 'isPremium:', doc.isPremium);
        
        doc = doc.toObject();
        
        if (doc.isPremium) {
          console.log('  → Premium lesson, deleting all content');
          delete doc.content;
        } else {
          if (doc.content) {
            console.log('  → Free lesson, deleting text only');
            delete doc.content.text;
          }
        }
        
        return doc;
      });
    }
    
    res.status(200).json({
      status: 'success',
      results: docs.length,
      data: docs,
    });
  }
}); 

// ✅ دالة توليد رابط مؤمن (مدة موحدة 60 ثانية للاختبار)
const generateSecureVideoUrl = (publicId, expiresInSeconds = 60) => {
  const token = cloudinary.utils.generate_auth_token({
    key: process.env.CLOUDINARY_API_SECRET,
    duration: expiresInSeconds,
    acl: `/video/upload/${publicId}*` // ✅ FIX
  });

  const url = cloudinary.url(publicId, {
    resource_type: "video",
    type: "authenticated", // ✅ مهم جدًا
    secure: true,
    sign_url: true
  });

  return `${url}?auth_token=${token}`;
};

const uploadVideoToCloudinary = (buffer, lessonId) => {
  return new Promise((resolve, reject) => {
  
    // ✅ نضيف notification_url عشان نعرف لما التحويلات تخلص
    const baseUrl = process.env.BASE_URL || 'https://your-api.com';
    const notificationUrl =  process.env.WEBHOOK_URL || `https://webhook.site/93a56088-83d4-43ec-b29b-c29e73db9feb`;
    ت
    const options = {
      resource_type: "video",
      folder: "lessons",
      public_id: `lesson-${lessonId}-${Date.now()}`,
      timeout: 600000, // 10 دقائق
      eager: [
        { width: 640, height: 360, crop: "pad" },
        { width: 1280, height: 720, crop: "pad" },
        { width: 320, height: 180, crop: "pad", format: "jpg" }
      ],
      eager_async: true,
      eager_notification_url: notificationUrl, // ✅ الأهم هنا
      streaming_profile: "auto"
    };

    const uploadStream = cloudinary.uploader.upload_stream(
      options,
      (error, result) => {
        if (error) return reject(error);
        
        // ✅ إضافة حالة processing للمصفوفة
        const newVideo = {
          publicId: result.public_id,
          hlsUrl: result.playback_url,
          mp4Url: result.secure_url,
          duration: result.duration,
          thumbnail: result.thumbnail_url || null,
          title: 'جاري المعالجة...',
          processingStatus: 'processing',
          eagerNotificationUrl: notificationUrl
        };
        
        resolve({ ...result, newVideo });
      }
    );
    
    streamifier.createReadStream(buffer).pipe(uploadStream);
  });
};

// ✅ دالة تجديد رابط الفيديو (لما يقرب ينتهي)
exports.refreshVideoToken = asyncHandler(async (req, res, next) => {
  const lesson = await Lesson.findById(req.params.id);
  
  if (!lesson) {
    return next(new ApiError('Lesson not found', 404));
  }

  // ✅ تحقق من وجود فيديو
  if (!lesson.video?.publicId) {
    return next(new ApiError('Lesson has no video', 404));
  }

  // ✅ لو مجاني، تحقق بس من حالة الدرس
  if (!lesson.isPremium) {
    if (!lesson.isActive) {
      return next(new ApiError('Lesson not available', 404));
    }
    
    // ✅ توليد رابط جديد (60 ثانية)
    const newUrl = generateSecureVideoUrl(lesson.video.publicId, 60);
    return res.json({ 
      status: 'success',
      video: { hlsUrl: newUrl } 
    });
  }

  // ✅ لو مدفوع، تحقق من استمرار الصلاحية
  const studentLesson = await StudentLesson.findOne({
    userId: req.user._id,
    lessonId: lesson._id,
    hasAccess: true
  });

  if (!studentLesson) {
    return next(new ApiError('Your access has expired', 403));
  }

  // ✅ تحديث عدد مرات التجديد
  studentLesson.refreshCount = (studentLesson.refreshCount || 0) + 1;
  await studentLesson.save();

  // ✅ توليد رابط جديد (60 ثانية)
  const newUrl = generateSecureVideoUrl(lesson.video.publicId, 60);

  res.json({ 
    status: 'success',
    video: { hlsUrl: newUrl } 
  });
});

// ✅ رفع فيديو لدرس معين
// ✅ رفع فيديو لدرس معين (يضيف للمصفوفة)
exports.uploadLessonVideo = asyncHandler(async (req, res, next) => {
  console.log('📁 Received file:', req.file ? {
    size: req.file.size,
    mimetype: req.file.mimetype,
    originalname: req.file.originalname
  } : 'No file');
  
  // 1) التحقق من وجود الفيديو
  if (!req.file) {
    return next(new ApiError('Please upload a video file', 400));
  }

  // 2) التحقق من وجود الدرس
  const lesson = await Lesson.findById(req.params.id);
  if (!lesson) {
    return next(new ApiError('Lesson not found', 404));
  }

  // 3) التحقق من أن المستخدم أدمن
  if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
    return next(new ApiError('Only admins can upload videos', 403));
  }

  try {
    console.log(`📤 Uploading video for lesson: ${lesson.title} (${req.file.size} bytes)`);

    // 4) رفع الفيديو على Cloudinary
    const result = await uploadVideoToCloudinary(req.file.buffer, lesson._id);

    console.log('✅ Video uploaded to Cloudinary:', result.public_id);
    console.log('📨 Notification will be sent to:', result.eagerNotificationUrl);

    // 5) تجهيز بيانات الفيديو الجديد (مع حالة processing)
    const newVideo = {
      publicId: result.public_id,
      hlsUrl: result.playback_url,
      mp4Url: result.secure_url,
      duration: result.duration,
      thumbnail: result.thumbnail_url || null,
      title: req.body.title || `فيديو ${(lesson.videos?.length || 0) + 1}`,
      order: (lesson.videos?.length || 0) + 1,
      processingStatus: 'processing',      // ✅ حالة المعالجة
      eagerNotificationUrl: result.eagerNotificationUrl
    };

    // 6) إضافة الفيديو للمصفوفة
    if (!lesson.videos) {
      lesson.videos = [];
    }
    lesson.videos.push(newVideo);

    // 7) حفظ التغييرات
    await lesson.save();

    // 8) الرد (فوري) مع تحذير إن الفيديو لسه بيعالج
    res.status(202).json({
      status: 'accepted',
      message: 'Video uploaded successfully. It is being processed and will be available shortly.',
      data: {
        video: {
          publicId: newVideo.publicId,
          title: newVideo.title,
          processingStatus: 'processing'
        },
        notificationUrl: result.eagerNotificationUrl,
        allVideos: lesson.videos
      }
    });

  } catch (error) {
    console.error('❌ Video upload error:', error);
    return next(new ApiError(`Error uploading video: ${error.message}`, 500));
  }
});

// ✅ API endpoint لحذف فيديو
// ✅ حذف فيديو معين من الدرس
exports.deleteLessonVideo = asyncHandler(async (req, res, next) => {
  const { lessonId, videoIndex } = req.params;

  // 1) التحقق من وجود الدرس
  const lesson = await Lesson.findById(lessonId);
  if (!lesson) {
    return next(new ApiError('Lesson not found', 404));
  }

  // 2) التحقق من أن المستخدم أدمن
  if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
    return next(new ApiError('Only admins can delete videos', 403));
  }

  // 3) التحقق من وجود الفيديو في المصفوفة
  if (!lesson.videos || !lesson.videos[videoIndex]) {
    return next(new ApiError('Video not found at this index', 404));
  }

  const videoToDelete = lesson.videos[videoIndex];

  try {
    // 4) حذف الفيديو من Cloudinary
    console.log(`🗑️ Deleting video from Cloudinary: ${videoToDelete.publicId}`);
    
    const result = await cloudinary.uploader.destroy(videoToDelete.publicId, {
      resource_type: "video"
    });

    if (result.result !== 'ok') {
      console.warn(`⚠️ Cloudinary delete returned: ${result.result}`);
      // نكمل برضه لأن الفيديو اتوجد من المصفوفة
    }

    // 5) حذف الفيديو من المصفوفة
    lesson.videos.splice(videoIndex, 1);
    
    // 6) ✅ إعادة ترتيب الفيديوهات المتبقية
    lesson.videos.forEach((video, index) => {
      video.order = index + 1;
    });
    
    await lesson.save();

    res.status(200).json({
      status: 'success',
      message: 'Video deleted successfully',
      data: {
        remainingVideos: lesson.videos
      }
    });

  } catch (error) {
    console.error('❌ Error deleting video:', error);
    return next(new ApiError(`Error deleting video: ${error.message}`, 500));
  }
});

// ==================== دوال مخصصة ====================

// ✅ إنشاء درس
exports.createLesson = asyncHandler(async (req, res, next) => {
  const section = await Section.findById(req.body.sectionId);
  if (!section) {
    return next(new ApiError('Section not found', 404));
  }

  const lesson = await Lesson.create(req.body);
  res.status(201).json({ status: 'success', data: lesson });
});

// ✅ جلب محتوى درس مع تجديد الرابط المؤمن
exports.getLessonContent = asyncHandler(async (req, res, next) => {
  const lesson = await Lesson.findById(req.params.id);
  
  if (!lesson) {
    return next(new ApiError('Lesson not found', 404));
  }

  // ✅ التحقق من حالة الدرس (محظور أو لا)
  if (!lesson.isActive) {
    if (req.user.role === 'admin' || req.user.role === 'super_admin') {
      return res.status(200).json({ 
        data: lesson,
        warning: 'This lesson is inactive (hidden from regular users)'
      });
    }
    return next(new ApiError('Lesson not found', 404));
  }

  // ✅ زيادة عدد مرات المشاهدة (لأي مستخدم)
  const studentLesson = await StudentLesson.findOneAndUpdate(
    { userId: req.user._id, lessonId: lesson._id },
    { 
      $inc: { accessCount: 1 },
      $set: { lastAccess: new Date() }
    },
    { upsert: true, new: true }
  );

  // ✅ التحقق من حالة الفيديوهات (هل لسه بيعالج؟)
  if (lesson.videos && lesson.videos.length > 0) {
    const processingVideos = lesson.videos.filter(v => 
      v.processingStatus === 'processing' || v.processingStatus === 'pending'
    );
    
    if (processingVideos.length > 0) {
      return res.status(202).json({ 
        status: 'processing',
        message: 'Video is still being processed. Please check back later.',
        data: lesson
      });
    }
  }

  // ✅ لو الدرس مجاني
  if (!lesson.isPremium) {
    // توليد روابط مؤمنة لكل الفيديوهات (60 ثانية)
    if (lesson.videos && lesson.videos.length > 0) {
      lesson.videos = lesson.videos.map(video => {
        const videoObj = video.toObject();
        if (videoObj.publicId && videoObj.processingStatus === 'ready') {
          videoObj.hlsUrl = generateSecureVideoUrl(videoObj.publicId, 60);
        }
        return videoObj;
      });
    }
    return res.status(200).json({ data: lesson });
  }

  // ✅ لو مدفوع، تحقق من شراء المستخدم
  if (!studentLesson.hasAccess) {
    return next(new ApiError('You need to purchase this lesson first', 403));
  }

  // ✅ توليد روابط مؤمنة لكل الفيديوهات (60 ثانية)
  if (lesson.videos && lesson.videos.length > 0) {
    lesson.videos = lesson.videos.map(video => {
      const videoObj = video.toObject();
      if (videoObj.publicId && videoObj.processingStatus === 'ready') {
        videoObj.hlsUrl = generateSecureVideoUrl(videoObj.publicId, 60);
      }
      return videoObj;
    });
  }

  res.status(200).json({ data: lesson });
});

// ✅ جلب دروس قسم معين
exports.getLessonsBySection = asyncHandler(async (req, res, next) => {
  const { sectionId } = req.params;

  const section = await Section.findById(sectionId);
  if (!section) {
    return next(new ApiError('Section not found', 404));
  }

  let filter = { sectionId };
  if (req.user.role === 'user') {
    filter.isActive = true;
  }

  const lessons = await Lesson.find(filter).sort({ order: 1 });

  if (req.user.role === 'user') {
    lessons.forEach(lesson => {
      if (lesson.isPremium) {
        lesson.content = undefined;
      } else if (lesson.content) {
        lesson.content.text = undefined;
      }
    });
  }

  res.status(200).json({
    status: 'success',
    results: lessons.length,
    data: lessons,
  });
});

// ✅ تحديث درس
exports.updateLesson = asyncHandler(async (req, res, next) => {
  if (req.body.isPremium === false && req.body.price && req.body.price > 0) {
    return next(new ApiError('Free lessons cannot have a price', 400));
  }

  const lesson = await Lesson.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  if (!lesson) {
    return next(new ApiError('Lesson not found', 404));
  }

  res.status(200).json({ status: 'success', data: lesson });
});

// ✅ شراء درس
exports.purchaseLesson = asyncHandler(async (req, res, next) => {
  const lesson = await Lesson.findById(req.params.id);
  
  if (!lesson || !lesson.isPremium) {
    return next(new ApiError('Lesson not available for purchase', 404));
  }

  const existing = await StudentLesson.findOne({
    userId: req.user._id,
    lessonId: lesson._id
  });

  if (existing?.hasAccess) {
    return next(new ApiError('You already own this lesson', 400));
  }

  await StudentLesson.findOneAndUpdate(
    { userId: req.user._id, lessonId: lesson._id },
    { 
      hasAccess: true,
      purchaseDate: new Date(),
      purchasePrice: lesson.price,
      purchaseCurrency: lesson.currency || 'EGP',
      $inc: { accessCount: 0 } // تهيئة العداد
    },
    { upsert: true, new: true }
  );

  res.status(200).json({
    status: 'success',
    message: 'Lesson purchased successfully'
  });
});

// ✅ تبديل حالة الدرس
exports.toggleLessonStatus = asyncHandler(async (req, res, next) => {
  const lesson = await Lesson.findById(req.params.id);
  
  if (!lesson) {
    return next(new ApiError('Lesson not found', 404));
  }

  lesson.isActive = !lesson.isActive;
  await lesson.save();

  res.status(200).json({
    status: 'success',
    message: `Lesson ${lesson.isActive ? 'activated' : 'deactivated'} successfully`,
    data: lesson,
  });
});

// ✅ إعادة ترتيب الدروس
exports.reorderLessons = asyncHandler(async (req, res, next) => {
  const { lessons } = req.body;

  const bulkOps = lessons.map(({ id, order }) => ({
    updateOne: {
      filter: { _id: id },
      update: { order },
    },
  }));

  await Lesson.bulkWrite(bulkOps);

  res.status(200).json({
    status: 'success',
    message: 'Lessons reordered successfully',
  });
});

// ==================== استخدام factory للدوال الأساسية ====================
exports.getLessons = lessonFactory.getAll;
exports.getLesson = lessonFactory.getOne;
exports.deleteLesson = lessonFactory.deleteOne;