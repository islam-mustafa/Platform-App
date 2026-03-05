class ApiFeatures {
  constructor(mongooseQuery, queryString) {
    this.mongooseQuery = mongooseQuery;
    this.queryString = queryString;
  }

  // 1️⃣ التصفية (Filtering)
  filter() {
    const queryStringObj = { ...this.queryString };
    const excludesFields = ['page', 'sort', 'limit', 'fields', 'keyword', 'search'];
    excludesFields.forEach((field) => delete queryStringObj[field]);
    
    // تحويل عوامل المقارنة (gte, gt, lte, lt)
    let queryStr = JSON.stringify(queryStringObj);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);

    this.mongooseQuery = this.mongooseQuery.find(JSON.parse(queryStr));
    return this;
  }

  // 2️⃣ الترتيب (Sorting)
  sort() {
    if (this.queryString.sort) {
      const sortBy = this.queryString.sort.split(',').join(' ');
      this.mongooseQuery = this.mongooseQuery.sort(sortBy);
    } else {
      this.mongooseQuery = this.mongooseQuery.sort('-createdAt');
    }
    return this;
  }

  // 3️⃣ اختيار الحقول (Field Limiting)
  limitFields() {
    if (this.queryString.fields) {
      const fields = this.queryString.fields.split(',').join(' ');
      this.mongooseQuery = this.mongooseQuery.select(fields);
    } else {
      this.mongooseQuery = this.mongooseQuery.select('-__v -password -passwordResetCode -emailVerificationToken');
    }
    return this;
  }

  // 4️⃣ 🔥 البحث المحسن (Search) - يدعم keyword و search
  search(modelName) {
    const searchTerm = this.queryString.search || this.queryString.keyword;
    
    if (searchTerm) {
      // استخدام text index للبحث السريع
      this.mongooseQuery = this.mongooseQuery.find({
        $text: { $search: searchTerm }
      });
      
      // إضافة درجة المطابقة للترتيب
      this.mongooseQuery = this.mongooseQuery
        .select({ score: { $meta: 'textScore' } })
        .sort({ score: { $meta: 'textScore' } });
    }
    return this;
  }

  // 5️⃣ التقسيم إلى صفحات (Pagination)
  paginate(countDocuments) {
    const page = this.queryString.page * 1 || 1;
    const limit = this.queryString.limit * 1 || 50;
    const skip = (page - 1) * limit;
    const endIndex = page * limit;

    // Pagination result
    const pagination = {
      currentPage: page,
      limit,
      numberOfPages: Math.ceil(countDocuments / limit)
    };

    // الصفحة التالية
    if (endIndex < countDocuments) {
      pagination.next = page + 1;
    }
    // الصفحة السابقة
    if (skip > 0) {
      pagination.prev = page - 1;
    }

    this.mongooseQuery = this.mongooseQuery.skip(skip).limit(limit);
    this.paginationResult = pagination;
    
    return this;
  }
}

module.exports = ApiFeatures;