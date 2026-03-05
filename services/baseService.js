const asyncHandler = require('express-async-handler');
const ApiError = require('../utils/apiError');
const ApiFeatures = require('../utils/apiFeatures');

exports.factory = (Model, modelName) => ({
  // جلب كل المستندات
  getAll: asyncHandler(async (req, res) => {
    const count = await Model.countDocuments();
    const apiFeatures = new ApiFeatures(Model.find(), req.query)
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

  // جلب مستند واحد
  getOne: asyncHandler(async (req, res, next) => {
    const doc = await Model.findById(req.params.id);
    if (!doc) return next(new ApiError(`${modelName} not found`, 404));
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
    const doc = await Model.findByIdAndDelete(req.params.id);
    if (!doc) return next(new ApiError(`${modelName} not found`, 404));
    res.status(204).send();
  }),
});