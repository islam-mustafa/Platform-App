const LaunchDarkly = require('launchdarkly-node-server-sdk');

let ldClient = null;

/**
 * تهيئة LaunchDarkly client
 */
const initializeLD = async () => {
  try {
    const sdkKey = process.env.LAUNCHDARKLY_SDK_KEY;
    
    if (!sdkKey) {
      console.warn('⚠️ LAUNCHDARKLY_SDK_KEY not found in environment variables');
      return null;
    }

    // تهيئة العميل
    ldClient = LaunchDarkly.init(sdkKey, {
      // تكوين الـ logger (سيستخدم Winston اللي عندنا)
      logger: {
        debug: (...args) => console.log('[LD Debug]', ...args),
        info: (...args) => console.log('[LD Info]', ...args),
        warn: (...args) => console.warn('[LD Warn]', ...args),
        error: (...args) => console.error('[LD Error]', ...args),
      }
    });

    // انتظر حتى يصبح العميل جاهزًا
    await ldClient.waitForInitialization();
    console.log('✅ LaunchDarkly client initialized successfully');
    
    return ldClient;
  } catch (error) {
    console.error('❌ Failed to initialize LaunchDarkly:', error);
    return null;
  }
};

/**
 * الحصول على قيمة feature flag
 * @param {string} flagKey - مفتاح الفلاج
 * @param {Object} context - سياق المستخدم
 * @param {*} defaultValue - القيمة الافتراضية
 */
const getVariation = async (flagKey, context, defaultValue = false) => {
  if (!ldClient) {
    console.warn(`⚠️ LaunchDarkly client not ready, returning default for ${flagKey}`);
    return defaultValue;
  }
  
  try {
    return await ldClient.variation(flagKey, context, defaultValue);
  } catch (error) {
    console.error(`❌ Error getting variation for ${flagKey}:`, error);
    return defaultValue;
  }
};

/**
 * إنشاء سياق المستخدم
 * @param {Object} user - بيانات المستخدم من قاعدة البيانات
 */
const createUserContext = (user) => {
  return {
    kind: 'user',
    key: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
  };
};

/**
 * إغلاق الاتصال بـ LaunchDarkly
 */
const closeLD = async () => {
  if (ldClient) {
    await ldClient.close();
    console.log('🔒 LaunchDarkly client closed');
  }
};

module.exports = {
  initializeLD,
  getVariation,
  createUserContext,
  closeLD,
};