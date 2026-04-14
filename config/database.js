const mongoose = require('mongoose');

const dbConnection = async () => {
  try {
    // ✅ للـ Vercel: نتجنب الاتصال المتكرر
    if (mongoose.connection.readyState >= 1) {
      console.log('Already connected to database');
      return mongoose.connection;
    }

    if (!process.env.DB_URI) {
      throw new Error('DB_URI is not defined in environment variables');
    }

    const conn = await mongoose.connect(process.env.DB_URI, {
      // Keep timeouts explicit for faster failure diagnosis in serverless/local runs.
      serverSelectionTimeoutMS: 10000,
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