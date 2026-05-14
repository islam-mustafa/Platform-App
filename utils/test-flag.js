const { getVariation, createUserContext } = require('./launchdarkly');

/**
 * اختبار feature flag
 */
const testFeatureFlag = async (user) => {
  try {
    const context = createUserContext(user);
    const flagValue = await getVariation('test-flag', context, false);
    
    console.log(`🔍 Feature flag 'test-flag' value: ${flagValue}`);
    
    return flagValue;
  } catch (error) {
    console.error('❌ Error testing feature flag:', error);
    return false;
  }
};

module.exports = { testFeatureFlag };