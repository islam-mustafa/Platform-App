const NodeCache = require('node-cache');

// إنشاء كاش جديد مع مدة صلاحية افتراضية (60 ثانية)
const cache = new NodeCache({ 
  stdTTL: 600,        // الوقت اللي البيانات تفضل فيه (10 دقائق)
  checkperiod: 120,   // تفحص كل 120 ثانية عشان تنضف
  useClones: false    // أسرع (لأننا مش بنعدل على البيانات)
});

/**
 * جلب بيانات من الكاش
 * @param {string} key - مفتاح البيانات
 * @returns {any} - البيانات أو null لو مش موجودة
 */
const get = (key) => {
  return cache.get(key);
};

/**
 * تخزين بيانات في الكاش
 * @param {string} key - مفتاح البيانات
 * @param {any} value - البيانات
 * @param {number} ttl - مدة الصلاحية بالثواني (اختياري)
 */
const set = (key, value, ttl = 600) => {
  cache.set(key, value, ttl);
};

/**
 * حذف بيانات من الكاش
 * @param {string} key - مفتاح البيانات
 */
const del = (key) => {
  cache.del(key);
};

/**
 * حذف كل البيانات اللي بتبدأ ب prefix معين
 * @param {string} prefix - بادئة المفتاح (زي 'subject_')
 */
const delByPrefix = (prefix) => {
  const keys = cache.keys();
  const keysToDelete = keys.filter(key => key.startsWith(prefix));
  cache.del(keysToDelete);
};

/**
 * مسح كل الكاش
 */
const flush = () => {
  cache.flushAll();
};

/**
 * جلب إحصائيات الكاش (للأدمن)
 */
const getStats = () => {
  return {
    keys: cache.keys().length,
    hits: cache.getStats().hits,
    misses: cache.getStats().misses,
    ksize: cache.getStats().ksize,
    vsize: cache.getStats().vsize
  };
};

module.exports = {
  get,
  set,
  del,
  delByPrefix,
  flush,
  getStats
};