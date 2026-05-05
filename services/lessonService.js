const streamifier = require('streamifier');
const cloudinary = require('cloudinary').v2;
const Lesson = require('../models/lessonModel');
const Section = require('../models/sectionModel');
const StudentLesson = require('../models/studentLessonModel');
const asyncHandler = require('express-async-handler');
const ApiError = require('../utils/apiError');
const { factory } = require('./baseService');
const cacheService = require('./cacheService');
const lessonFactory = factory(Lesson, 'Lesson', { 
  hideInactive: true,
  
  // ✅ دالة مخصصة لمعالجة المستند قبل الرد في getOne (للمستخدم العادي فقط)
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

    // للمستخدم العادي
    if (req.user && req.user.role === 'user') {
      docs = docs.map(doc => {

        doc = doc.toObject();
        
        if (doc.isPremium) {
          delete doc.content;
        } else {
          if (doc.content) {
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
  
    // Cloudinary sends webhook to Hookdeck URL, then Hookdeck forwards to local /webhooks/eager-complete
    const fallbackHookdeckUrl = 'https://hkdk.events/YOUR_HOOKDECK_ENDPOINT';
    const notificationUrl = process.env.WEBHOOK_URL || fallbackHookdeckUrl;
    
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
      eager_notification_url: notificationUrl,
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

  // ✅ تحقق من وجود فيديو (باستخدام المصفوفة videos)
  if (!lesson.videos || lesson.videos.length === 0) {
    return next(new ApiError('Lesson has no video', 404));
  }

  // خذ أول فيديو (أو يمكن تحديد فيديو معين)
  const video = lesson.videos[0];

  // ✅ لو مجاني، تحقق بس من حالة الدرس
  if (!lesson.isPremium) {
    if (!lesson.isActive) {
      return next(new ApiError('Lesson not available', 404));
    }
    
    // ✅ توليد رابط جديد (60 ثانية)
    const newUrl = generateSecureVideoUrl(video.publicId, 60);
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
  const newUrl = generateSecureVideoUrl(video.publicId, 60);

  res.json({ 
    status: 'success',
    video: { hlsUrl: newUrl } 
  });
});

// ✅ رفع فيديو لدرس معين (يضيف للمصفوفة)
exports.uploadLessonVideo = asyncHandler(async (req, res, next) => {

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

    // 4) رفع الفيديو على Cloudinary
    const result = await uploadVideoToCloudinary(req.file.buffer, lesson._id);

    // ✅ إنشاء Thumbnail احترافي بدون حدود بيضاء
const thumbnailUrl = cloudinary.url(result.public_id, {
  resource_type: 'video',
  format: 'jpg',
  transformation: [
    {
      width: 800,
      height: 800,
      crop: 'fill',
      gravity: 'auto'
    },
    {
      start_offset: '2'
    }
  ]
});

    // 5) تجهيز بيانات الفيديو
    const newVideo = {
      publicId: result.public_id,
      hlsUrl: result.playback_url,
      mp4Url: result.secure_url,
      duration: result.duration,
      thumbnail: thumbnailUrl, // ✅ استخدام الصورة المعدلة
      title: req.body.title || `فيديو ${(lesson.videos?.length || 0) + 1}`,
      order: (lesson.videos?.length || 0) + 1,
      processingStatus: 'processing',
      eagerNotificationUrl: result.eagerNotificationUrl
    };

    // 6) إضافة الفيديو
    if (!lesson.videos) {
      lesson.videos = [];
    }
    lesson.videos.push(newVideo);

    // 7) حفظ
    await lesson.save();

    // 8) الرد
    res.status(202).json({
      status: 'accepted',
      message: 'Video uploaded successfully. It is being processed and will be available shortly.',
      data: {
        video: {
          publicId: newVideo.publicId,
          title: newVideo.title,
          processingStatus: 'processing',
          thumbnail: newVideo.thumbnail
        },
        allVideos: lesson.videos
      }
    });

  } catch (error) {
    console.error('❌ Video upload error:', error);
    return next(new ApiError(`Error uploading video: ${error.message}`, 500));
  }
});


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

// ✅ جلب درس واحد مع populate (للكويز والواجب)
exports.getLesson = asyncHandler(async (req, res, next) => {
  let query = Lesson.findById(req.params.id);
  
  // ✅ للمستخدم العادي، لا تظهر المحتوى النصي للدروس المدفوعة
  if (req.user && req.user.role === 'user') {
    query = query.select('-content.text');
  }
  
  // ✅ جلب البيانات المرتبطة (الكويز والواجب)
  const lesson = await query
    .populate('quizId')        // لجلب بيانات الكويز
    .populate('assignmentId'); // لجلب بيانات الواجب
  
  if (!lesson) {
    return next(new ApiError('Lesson not found', 404));
  }
  
  // ✅ التحقق من الحظر للمستخدم العادي
  if (req.user && req.user.role === 'user' && !lesson.isActive) {
    return next(new ApiError('Lesson not found', 404));
  }
  
  // ✅ للمستخدم العادي، إخفاء المحتوى النصي للدروس المدفوعة
  if (req.user && req.user.role === 'user') {
    const lessonObj = lesson.toObject();
    if (lessonObj.isPremium && lessonObj.content) {
      delete lessonObj.content.text;
    }
    return res.status(200).json({ status: 'success', data: lessonObj });
  }
  
  res.status(200).json({ status: 'success', data: lesson });
});

// ✅ جلب محتوى درس مع تجديد الرابط المؤمن + populate الكويز والواجب
exports.getLessonContent = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const userId = req.user._id;
  const userRole = req.user.role;
  
  // ✅ بناء مفتاح فريد للكاش (يعتمد على المستخدم ودوره)
  // للمستخدم العادي: مفتاح يعتمد على user ID عشان الـ hasAccess مختلف
  // للأدمن: مفتاح عام
  let cacheKey;
  if (userRole === 'user') {
    cacheKey = `lesson_content_user_${userId}_${id}`;
  } else {
    cacheKey = `lesson_content_admin_${id}`;
  }
  
  // ✅ حاول تجيب من الكاش
  let cachedData = cacheService.get(cacheKey);
  if (cachedData) {
    console.log(`✅ Cache hit for ${cacheKey}`);
    return res.status(200).json(cachedData);
  }
  
  console.log(`🔄 Cache miss for ${cacheKey}, fetching from DB...`);
  
  // ✅ جلب الدرس مع populate الكويز والواجب
  const lesson = await Lesson.findById(id)
    .populate('quizId')
    .populate('assignmentId');
  
  if (!lesson) {
    return next(new ApiError('Lesson not found', 404));
  }

  // ✅ التحقق من حالة الدرس (محظور أو لا)
  if (!lesson.isActive) {
    if (userRole === 'admin' || userRole === 'super_admin') {
      const responseData = { 
        data: lesson,
        warning: 'This lesson is inactive (hidden from regular users)'
      };
      cacheService.set(cacheKey, responseData, 300); // 5 دقائق فقط للأدمن
      return res.status(200).json(responseData);
    }
    return next(new ApiError('Lesson not found', 404));
  }

  // ✅ زيادة عدد مرات المشاهدة (لأي مستخدم) - دي متخزنهاش في الكاش
  await StudentLesson.findOneAndUpdate(
    { userId, lessonId: id },
    { 
      $inc: { accessCount: 1 },
      $set: { lastAccess: new Date() }
    },
    { upsert: true, new: true }
  );

  // ✅ لو الدرس مجاني
  if (!lesson.isPremium) {
    // توليد روابط مؤمنة لكل الفيديوهات (60 ثانية)
    if (lesson.videos && lesson.videos.length > 0) {
      lesson.videos = lesson.videos.map(video => {
        const videoObj = video.toObject ? video.toObject() : video;
        if (videoObj.publicId && videoObj.processingStatus === 'ready') {
          videoObj.hlsUrl = generateSecureVideoUrl(videoObj.publicId, 60);
        }
        return videoObj;
      });
    }
    
    const responseData = { data: lesson };
    cacheService.set(cacheKey, responseData, 600); // 10 دقائق
    return res.status(200).json(responseData);
  }

  // ✅ لو مدفوع، تحقق من شراء المستخدم
  const studentLesson = await StudentLesson.findOne({
    userId,
    lessonId: id,
    hasAccess: true
  });

  if (!studentLesson) {
    return next(new ApiError('You need to purchase this lesson first', 403));
  }

  // ✅ توليد روابط مؤمنة لكل الفيديوهات (60 ثانية)
  if (lesson.videos && lesson.videos.length > 0) {
    lesson.videos = lesson.videos.map(video => {
      const videoObj = video.toObject ? video.toObject() : video;
      if (videoObj.publicId && videoObj.processingStatus === 'ready') {
        videoObj.hlsUrl = generateSecureVideoUrl(videoObj.publicId, 60);
      }
      return videoObj;
    });
  }

  const responseData = { data: lesson };
  
  // ✅ للمستخدم العادي، الكاش له مدة أقل (لأن accessCount بيتغير)
  if (userRole === 'user') {
    cacheService.set(cacheKey, responseData, 300); // 5 دقائق
  } else {
    cacheService.set(cacheKey, responseData, 600); // 10 دقائق للأدمن
  }
  
  res.status(200).json(responseData);
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
exports.deleteLesson = lessonFactory.deleteOne;