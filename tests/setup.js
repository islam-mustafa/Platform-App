const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongoServer;

// قبل ما أي اختبار يبدأ
beforeAll(async () => {
  // بنعمل قاعدة بيانات مؤقتة جديدة في الذاكرة
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();

  // بنربط Mongoose بقاعدة البيانات المؤقتة
  await mongoose.connect(uri);
  console.log('✅ Test database connected');
});

// بعد ما كل الاختبارات تخلص
afterAll(async () => {
  // بنقطع الاتصال
  await mongoose.disconnect();
  // بنقفل قاعدة البيانات المؤقتة
  await mongoServer.stop();
  console.log('🛑 Test database stopped');
});

// بعد كل اختبار على حدة
afterEach(async () => {
  // بنمسح كل البيانات من كل Collection
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany();
  }
  console.log('🧹 Cleaned up test database');
});