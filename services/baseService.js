const asyncHandler = require('express-async-handler');
const ApiError = require('../utils/apiError');
const ApiFeatures = require('../utils/apiFeatures');

exports.factory = (Model, modelName, options = {}) => ({
  
  // ✅ جلب كل المستندات (مع مراعاة الدور ودعم processMany)
  getAll: asyncHandler(async (req, res) => {
    // بناء الفلتر الأساسي
    let filter = {};
    
    if (options.hideInactive) {
      if (req.user && req.user.role === 'user') {
        filter.isActive = true;
      }
    }
    
    const queryFilter = { ...filter, ...req.queryFilter };
    
    const count = await Model.countDocuments(queryFilter);
    const apiFeatures = new ApiFeatures(Model.find(queryFilter), req.query)
      .paginate(count)
      .filter()
      .search(modelName)
      .limitFields()
      .sort();

    const docs = await apiFeatures.mongooseQuery;
    
    // ✅ لو في processMany مخصص، استخدمه
    if (options.processMany) {
      return options.processMany(req, res, docs);
    }
    
    res.status(200).json({
      status: 'success',
      results: docs.length,
      paginationResult: apiFeatures.paginationResult,
      data: docs,
    });
  }),

  // ✅ جلب مستند واحد (مع مراعاة الدور ودعم processOne)
getOne: asyncHandler(async (req, res, next) => {
  const doc = await Model.findById(req.params.id);
  
  if (!doc) {
    return next(new ApiError(`${modelName} not found`, 404));
  }

  // ✅ أولاً: التحقق من الحظر للمستخدم العادي
  if (options.hideInactive && 
      req.user && 
      req.user.role === 'user' && 
      doc.isActive === false) {
    return next(new ApiError(`${modelName} not found`, 404));
  }

  // ✅ ثانياً: لو في دالة مخصصة (processOne) شغلها
  if (options.processOne) {
    return options.processOne(req, res, doc);
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
    const doc = await Model.findById(req.params.id);
    
    if (!doc) {
      return next(new ApiError(`${modelName} not found`, 404));
    }

    if (options.cascade && Array.isArray(options.cascade)) {
      for (const relation of options.cascade) {
        const { model: RelatedModel, filter, message } = relation;
        
        const filterObj = {};
        filterObj[filter] = doc._id;
        
        const relatedDocs = await RelatedModel.find(filterObj);
        
        if (relatedDocs.length > 0) {
          console.log(`Deleting ${relatedDocs.length} related ${message || ''}...`);
          await RelatedModel.deleteMany(filterObj);
        }
      }
    }

    await Model.findByIdAndDelete(req.params.id);
    res.status(204).send();
  }),
});