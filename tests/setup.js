const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongoServer;

// قبل ما أي اختبار يبدأ
beforeAll(async () => {
  // ✅ قطع أي connection موجود قبل ما نعمل connection جديد
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }

  // بنعمل قاعدة بيانات مؤقتة جديدة في الذاكرة
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  process.env.NODE_ENV = 'test';

  // بنربط Mongoose بقاعدة البيانات المؤقتة
  await mongoose.connect(uri);
  console.log('✅ Test database connected');
});

// بعد ما كل الاختبارات تخلص
afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
  
  // ✅ أضف السطر ده
  await new Promise(resolve => setTimeout(resolve, 500));
});

// بعد كل اختبار على حدة
afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany();
  }
  console.log('🧹 Cleaned up test database');
});