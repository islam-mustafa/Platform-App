const Assignment = require('../models/assignmentModel');
const Submission = require('../models/submissionModel');
const Lesson = require('../models/lessonModel');
const StudentLesson = require('../models/studentLessonModel');
const asyncHandler = require('express-async-handler');
const ApiError = require('../utils/apiError');
const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');

// ✅ دالة رفع الملفات إلى Cloudinary مع الحفاظ على الاسم الكامل والامتداد
const uploadToCloudinary = (buffer, folder, originalname) => {
  return new Promise((resolve, reject) => {
    // استخراج الامتداد واسم الملف بشكل صحيح
    const lastDotIndex = originalname.lastIndexOf('.');
    const extension = lastDotIndex > 0 ? originalname.substring(lastDotIndex + 1).toLowerCase() : '';
    const nameWithoutExt = lastDotIndex > 0 ? originalname.substring(0, lastDotIndex) : originalname;
    
    const fullFileName = extension ? `${nameWithoutExt}.${extension}` : nameWithoutExt;
    
    let resourceType = 'raw';
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
    if (imageExtensions.includes(extension)) {
      resourceType = 'image';
    }
    
    const options = {
      resource_type: resourceType,
      folder: folder,
      public_id: fullFileName,
      type: 'upload',
      access_mode: 'public',
      use_filename: true,
      unique_filename: false
    };
    
    const uploadStream = cloudinary.uploader.upload_stream(
      options,
      (error, result) => {
        if (error) {
          console.error('❌ Upload error:', error);
          return reject(error);
        }
        console.log('✅ Uploaded:', result.secure_url);
        
        resolve({
          filename: nameWithoutExt,
          extension: extension,
          mimeType: extension === 'pdf' ? 'application/pdf' : 'application/octet-stream',
          url: result.secure_url,
          publicId: result.public_id,
          size: result.bytes || buffer.length,
          uploadedAt: new Date()
        });
      }
    );
    streamifier.createReadStream(buffer).pipe(uploadStream);
  });
};

// ==================== إدارة الواجبات (للأدمن) ====================

exports.createAssignment = asyncHandler(async (req, res, next) => {
  const { lessonId } = req.params;
    // ✅ للتحقق من وصول الملفات
console.log('📁 Files received:', req.files ? req.files.length : 0);
if (req.files && req.files.length > 0) {
  console.log('📄 File details:', req.files.map(f => f.originalname));
}
  const lesson = await Lesson.findById(lessonId);
  if (!lesson) {
    return next(new ApiError('Lesson not found', 404));
  }
  
  if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
    return next(new ApiError('Only admins can create assignments', 403));
  }
  
  const existingAssignment = await Assignment.findOne({ lessonId });
  if (existingAssignment) {
    return next(new ApiError('Assignment already exists for this lesson', 400));
  }
  
  const data = req.body;
  const dueDate = new Date(data.dueDate);
  if (isNaN(dueDate.getTime())) {
    return next(new ApiError('Invalid due date format', 400));
  }
  
  if (!data.title || data.title.length < 3) {
    return next(new ApiError('Assignment title must be at least 3 characters', 400));
  }
  
  // ✅ رفع الملفات المساعدة إلى Cloudinary
  let attachments = [];
  if (req.files && req.files.length > 0) {
    for (const file of req.files) {
      try {
        const fileMetadata = await uploadToCloudinary(file.buffer, 'assignments/attachments', file.originalname);
        attachments.push(fileMetadata);
        console.log(`✅ Uploaded: ${fileMetadata.filename}.${fileMetadata.extension}`);
      } catch (uploadError) {
        console.error('❌ Upload failed:', uploadError.message);
      }
    }
  }
  
  const assignment = await Assignment.create({
    lessonId,
    title: data.title,
    description: data.description,
    instructions: data.instructions,
    dueDate,
    submissionType: data.submissionType || 'file',
    allowedFileTypes: data.allowedFileTypes ? data.allowedFileTypes.split(',') : [],
    maxFileSize: parseInt(data.maxFileSize) || 10 * 1024 * 1024,
    maxPoints: parseInt(data.maxPoints) || 100,
    passingPoints: parseInt(data.passingPoints) || 60,
    attachments,
    isActive: data.isActive !== undefined ? data.isActive === 'true' : true
  });
  await Lesson.findByIdAndUpdate(lessonId, { assignmentId: assignment._id });

  res.status(201).json({
    status: 'success',
    data: assignment
  });
});


// ✅ دالة حذف ملف من Cloudinary
const deleteFileFromCloudinary = async (publicId, resourceType = 'raw') => {
  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType
    });
    console.log(`✅ Deleted from Cloudinary: ${publicId}`);
    return result;
  } catch (error) {
    console.error(`❌ Error deleting from Cloudinary: ${publicId}`, error);
    throw error;
  }
};

// ==================== إدارة الواجبات (للأدمن) ====================


// ✅ جلب واجبات درس معين
exports.getAssignmentsByLesson = asyncHandler(async (req, res, next) => {
  const { lessonId } = req.params;
  
  const lesson = await Lesson.findById(lessonId);
  if (!lesson) {
    return next(new ApiError('Lesson not found', 404));
  }
  
  const assignments = await Assignment.find({ lessonId }).sort('-createdAt');
  
  res.status(200).json({
    status: 'success',
    results: assignments.length,
    data: assignments
  });
});

// ✅ جلب واجب واحد
exports.getAssignment = asyncHandler(async (req, res, next) => {
  const assignment = await Assignment.findById(req.params.id);
  if (!assignment) {
    return next(new ApiError('Assignment not found', 404));
  }
  
  res.status(200).json({
    status: 'success',
    data: assignment
  });
});

// ✅ تحديث واجب
exports.updateAssignment = asyncHandler(async (req, res, next) => {
  if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
    return next(new ApiError('Only admins can update assignments', 403));
  }
  
  const assignment = await Assignment.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  );
  
  if (!assignment) {
    return next(new ApiError('Assignment not found', 404));
  }
  
  res.status(200).json({
    status: 'success',
    data: assignment
  });
});

// ✅ حذف واجب
exports.deleteAssignment = asyncHandler(async (req, res, next) => {
  if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
    return next(new ApiError('Only admins can delete assignments', 403));
  }

  const assignment = await Assignment.findById(req.params.id);
  if (!assignment) {
    return next(new ApiError('Assignment not found', 404));
  }

  if (assignment.attachments && assignment.attachments.length > 0) {
    for (const file of assignment.attachments) {
      if (file.publicId) {
        try {
          const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
          const ext = file.extension?.toLowerCase() || '';
          const resourceType = imageExtensions.includes(ext) ? 'image' : 'raw';
          await deleteFileFromCloudinary(file.publicId, resourceType);
        } catch (error) {
          console.warn(`⚠️ Could not delete file ${file.publicId}:`, error.message);
        }
      }
    }
  }
  
  const submissions = await Submission.find({ assignmentId: assignment._id });
  for (const submission of submissions) {
    if (submission.attachments && submission.attachments.length > 0) {
      for (const file of submission.attachments) {
        if (file.publicId) {
          try {
            const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
            const ext = file.extension?.toLowerCase() || '';
            const resourceType = imageExtensions.includes(ext) ? 'image' : 'raw';
            await deleteFileFromCloudinary(file.publicId, resourceType);
          } catch (error) {
            console.warn(`⚠️ Could not delete submission file ${file.publicId}:`, error.message);
          }
        }
      }
    }
  }
  
  await Submission.deleteMany({ assignmentId: assignment._id });
  await Assignment.findByIdAndDelete(req.params.id);
  
  res.status(204).send();
});

// ==================== تسليمات الطالب ====================

exports.getMySubmission = asyncHandler(async (req, res, next) => {
  const { assignmentId } = req.params;
  
  const submission = await Submission.findOne({
    userId: req.user._id,
    assignmentId
  });
  
  if (!submission) {
    return next(new ApiError('No submission found', 404));
  }
  
  res.status(200).json({
    status: 'success',
    data: submission
  });
});

// ✅ تقديم واجب (تسليم) مع دعم رفع ملفات
exports.submitAssignment = asyncHandler(async (req, res, next) => {
  const { assignmentId } = req.params;
  let { content } = req.body;
  let attachments = [];
  
  const assignment = await Assignment.findById(assignmentId);
  if (!assignment) {
    return next(new ApiError('Assignment not found', 404));
  }
  
  if (req.files && req.files.length > 0) {
    for (const file of req.files) {
      const fileMetadata = await uploadToCloudinary(file.buffer, 'assignments/submissions', file.originalname);
      attachments.push(fileMetadata);
    }
  }
  
  const lesson = await Lesson.findById(assignment.lessonId);
  if (req.user.role === 'user') {
    if (!lesson.isActive) return next(new ApiError('Lesson not available', 404));
    if (lesson.isPremium) {
      const studentLesson = await StudentLesson.findOne({
        userId: req.user._id,
        lessonId: lesson._id,
        hasAccess: true
      });
      if (!studentLesson) return next(new ApiError('You need to purchase this lesson first', 403));
    }
  }
  
  if (assignment.submissionType === 'file' && attachments.length === 0) {
    return next(new ApiError('File submission required', 400));
  }
  if (assignment.submissionType === 'text' && !content) {
    return next(new ApiError('Text submission required', 400));
  }
  if (assignment.submissionType === 'both' && !content && attachments.length === 0) {
    return next(new ApiError('Either text or file submission is required', 400));
  }
  
  const isLate = new Date() > assignment.dueDate;
  const status = isLate ? 'late' : 'submitted';
  
  // ✅ حذف الملفات القديمة من Cloudinary إذا كانت موجودة
  if (attachments.length > 0) {
    const existingSubmission = await Submission.findOne({
      userId: req.user._id,
      assignmentId
    });
    
    if (existingSubmission && existingSubmission.attachments && existingSubmission.attachments.length > 0) {
      for (const oldFile of existingSubmission.attachments) {
        if (oldFile.publicId) {
          try {
            const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
            const ext = oldFile.extension?.toLowerCase() || '';
            const resourceType = imageExtensions.includes(ext) ? 'image' : 'raw';
            await deleteFileFromCloudinary(oldFile.publicId, resourceType);
          } catch (error) {
            console.warn(`⚠️ Could not delete old file ${oldFile.publicId}:`, error.message);
          }
        }
      }
    }
  }
  
  const submission = await Submission.findOneAndUpdate(
    { userId: req.user._id, assignmentId },
    {
      content,
      attachments,
      status,
      submittedAt: new Date()
    },
    { upsert: true, new: true, runValidators: true }
  );
  
  res.status(200).json({
    status: 'success',
    message: isLate ? 'Assignment submitted late' : 'Assignment submitted successfully',
    data: submission
  });
});

// ==================== تصحيح الواجبات (للأدمن) ====================

exports.getSubmissionsByAssignment = asyncHandler(async (req, res, next) => {
  if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
    return next(new ApiError('Only admins can view all submissions', 403));
  }
  
  const { assignmentId } = req.params;
  
  const submissions = await Submission.find({ assignmentId })
    .populate('userId', 'name email')
    .sort('-submittedAt');
  
  const stats = {
    total: submissions.length,
    submitted: submissions.filter(s => s.status === 'submitted').length,
    late: submissions.filter(s => s.status === 'late').length,
    graded: submissions.filter(s => s.status === 'graded').length,
    draft: submissions.filter(s => s.status === 'draft').length,
    averageGrade: submissions.filter(s => s.grade !== null)
      .reduce((sum, s) => sum + s.grade, 0) / (submissions.filter(s => s.grade !== null).length || 1)
  };
  
  res.status(200).json({
    status: 'success',
    stats,
    data: submissions
  });
});

exports.gradeSubmission = asyncHandler(async (req, res, next) => {
  if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
    return next(new ApiError('Only admins can grade submissions', 403));
  }
  
  const { submissionId } = req.params;
  const { grade, feedback } = req.body;
  
  const submission = await Submission.findById(submissionId).populate('assignmentId');
  if (!submission) {
    return next(new ApiError('Submission not found', 404));
  }
  
  const assignment = submission.assignmentId;
  
  if (grade < 0 || grade > assignment.maxPoints) {
    return next(new ApiError(`Grade must be between 0 and ${assignment.maxPoints}`, 400));
  }
  
  submission.grade = grade;
  submission.feedback = feedback;
  submission.gradedAt = new Date();
  submission.gradedBy = req.user._id;
  submission.status = 'graded';
  
  await submission.save();
  
  res.status(200).json({
    status: 'success',
    data: submission
  });
});

// ✅ جلب كل واجبات الطالب
exports.getMyAssignments = asyncHandler(async (req, res, next) => {
  const studentLessons = await StudentLesson.find({ userId: req.user._id, hasAccess: true });
  const lessonIds = studentLessons.map(sl => sl.lessonId);
  
  const assignments = await Assignment.find({ lessonId: { $in: lessonIds }, isActive: true })
    .populate('lessonId', 'title')
    .sort({ dueDate: 1 });
  
  const assignmentsWithStatus = await Promise.all(assignments.map(async (assignment) => {
    const submission = await Submission.findOne({
      userId: req.user._id,
      assignmentId: assignment._id
    });
    
    return {
      ...assignment.toObject(),
      submissionStatus: submission?.status || 'not_submitted',
      grade: submission?.grade,
      feedback: submission?.feedback
    };
  }));
  
  res.status(200).json({
    status: 'success',
    results: assignmentsWithStatus.length,
    data: assignmentsWithStatus
  });
});

// ✅ تحميل ملف مرفق بالواجب

const crypto = require('crypto');

exports.downloadAssignmentAttachment = asyncHandler(async (req, res, next) => {
  const { assignmentId, fileIndex } = req.params;

  const assignment = await Assignment.findById(assignmentId);
  if (!assignment) {
    return next(new ApiError('Assignment not found', 404));
  }

  const lesson = await Lesson.findById(assignment.lessonId);

  if (req.user.role === 'user') {
    const studentLesson = await StudentLesson.findOne({
      userId: req.user._id,
      lessonId: lesson._id,
      hasAccess: true
    });

    if (!studentLesson && lesson.isPremium) {
      return next(new ApiError('You need to purchase this lesson first', 403));
    }
  }

  const fileMetadata = assignment.attachments[fileIndex];
  if (!fileMetadata) {
    return next(new ApiError('File not found', 404));
  }

  // ✅ استخراج البيانات
  let fileName, extension, publicId;

  if (typeof fileMetadata === 'string') {
    publicId = fileMetadata.split('/').pop().split('?')[0];
    const parts = publicId.split('.');
    extension = parts.length > 1 ? parts.pop().toLowerCase() : '';
    fileName = publicId;
  } else {
    extension = (fileMetadata.extension || '').toLowerCase();
    fileName = extension
      ? `${fileMetadata.filename}.${extension}`
      : fileMetadata.filename;
    publicId = fileMetadata.publicId;
  }

  // ✅ تحديد نوع الملف (image / raw)
  const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
  const resourceType = imageExtensions.includes(extension) ? 'image' : 'raw';

  try {
    // ✅ رابط مباشر بدون signed URL
    const downloadUrl = cloudinary.url(publicId, {
      resource_type: resourceType,
      secure: true,
      flags: 'attachment'
    });

    // ✅ إعادة التوجيه
    return res.redirect(downloadUrl);

  } catch (error) {
    console.error('❌ Download error:', error.message);
    return next(new ApiError('Error downloading file', 500));
  }
});
// ✅ عرض ملف PDF في المتصفح
exports.viewFile = asyncHandler(async (req, res, next) => {
  const publicId = req.params.publicId;

  if (!publicId) {
    return next(new ApiError('File identifier is required', 400));
  }

  try {
    // تقدر تخليها dynamic لو حابب
    const fileUrl = cloudinary.url(publicId, {
      resource_type: 'raw',
      secure: true
    });

    return res.redirect(fileUrl);

  } catch (error) {
    console.error('❌ View error:', error.message);
    return next(new ApiError('Error viewing file', 500));
  }
});