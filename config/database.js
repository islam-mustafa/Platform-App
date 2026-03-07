const mongoose = require('mongoose');

const dbConnection = async () => {
  try {
    // ✅ للـ Vercel: نتجنب الاتصال المتكرر
    if (mongoose.connection.readyState >= 1) {
      console.log('Already connected to database');
      return mongoose.connection;
    }

    const conn = await mongoose.connect(process.env.DB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      // ⏱️ مهلة الاتصال (مهم لـ Vercel)
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    
    console.log(`✅ Database Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error('❌ Database connection error:', error);
    // في Vercel، لو حصل خطأ في الاتصال، نرمي الخطأ
    throw error;
  }
};

module.exports = dbConnection;