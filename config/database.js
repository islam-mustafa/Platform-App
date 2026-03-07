app.use(async (req, res, next) => {
  try {
    const mongoose = require('mongoose');
    
    console.log('🔍 DB_URI exists:', !!process.env.DB_URI);
    console.log('🔍 DB_URI prefix:', process.env.DB_URI ? process.env.DB_URI.substring(0, 20) + '...' : 'none');
    
    if (mongoose.connection.readyState !== 1) {
      console.log('🔄 Attempting to connect...');
      await mongoose.connect(process.env.DB_URI);
      console.log('✅ Connected');
    }
    
    next();
  } catch (error) {
    console.error('❌ Error:', {
      message: error.message,
      name: error.name,
      code: error.code
    });
    
    res.status(500).json({
      status: 'error',
      message: 'Database connection failed',
      error: {
        message: error.message,
        code: error.code
      }
    });
  }
});