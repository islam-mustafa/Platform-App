const asyncHandler = require('express-async-handler');
const ApiError = require('../utils/apiError');
const ApiFeatures = require('../utils/apiFeatures');

exports.factory = (Model, modelName, options = {}) => ({
  
  // ✅ جلب كل المستندات (مع مراعاة الدور)
  getAll: asyncHandler(async (req, res) => {
    // بناء الفلتر الأساسي
    let filter = {};
    
    // لو في فلتر إضافي من options (مثلاً hideInactive)
    if (options.hideInactive) {
      // لو المستخدم عادي، شوف النشط بس
      if (req.user && req.user.role === 'user') {
        filter.isActive = true;
      }
    }
    
    // لو في فلتر مخصص من الراوت (مثل subjectId, gradeId)
    const queryFilter = { ...filter, ...req.queryFilter };
    
    const count = await Model.countDocuments(queryFilter);
    const apiFeatures = new ApiFeatures(Model.find(queryFilter), req.query)
      .paginate(count)
      .filter()
      .search(modelName)
      .limitFields()
      .sort();

    const docs = await apiFeatures.mongooseQuery;
    
    res.status(200).json({
      status: 'success',
      results: docs.length,
      paginationResult: apiFeatures.paginationResult,
      data: docs,
    });
  }),

  // ✅ جلب مستند واحد (مع مراعاة الدور)
  getOne: asyncHandler(async (req, res, next) => {
    const doc = await Model.findById(req.params.id);
    
    if (!doc) {
      return next(new ApiError(`${modelName} not found`, 404));
    }

    // لو في خاصية hideInactive والمستخدم عادي والمستند مش نشط
    if (options.hideInactive && 
        req.user && 
        req.user.role === 'user' && 
        doc.isActive === false) {
      return next(new ApiError(`${modelName} not found`, 404));
    }

    res.status(200).json({ status: 'success', data: doc });
  }),

  // إنشاء مستند جديد
  createOne: asyncHandler(async (req, res) => {
    const doc = await Model.create(req.body);
    res.status(201).json({ status: 'success', data: doc });
  }),

  // تحديث مستند
  updateOne: asyncHandler(async (req, res, next) => {
    const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!doc) return next(new ApiError(`${modelName} not found`, 404));
    res.status(200).json({ status: 'success', data: doc });
  }),

  // حذف مستند
 deleteOne: asyncHandler(async (req, res, next) => {
    // 1) جلب المستند قبل الحذف (عشان نعرف الـ IDs)
    const doc = await Model.findById(req.params.id);
    
    if (!doc) {
      return next(new ApiError(`${modelName} not found`, 404));
    }

    // 2) ✅ حذف المرتبطين (لو في options.cascade)
    if (options.cascade && Array.isArray(options.cascade)) {
      for (const relation of options.cascade) {
        const { model: RelatedModel, filter, message } = relation;
        
        // بناء فلتر الحذف (مثلاً { gradeId: doc._id })
        const filterObj = {};
        filterObj[filter] = doc._id;
        
        // جلب المستندات المرتبطة قبل الحذف (اختياري)
        const relatedDocs = await RelatedModel.find(filterObj);
        
        if (relatedDocs.length > 0) {
          console.log(`Deleting ${relatedDocs.length} related ${message || ''}...`);
          await RelatedModel.deleteMany(filterObj);
        }
      }
    }

    // 3) حذف المستند نفسه
    await Model.findByIdAndDelete(req.params.id);

    res.status(204).send();
  }),
});
