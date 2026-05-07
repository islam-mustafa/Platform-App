const request = require('supertest');
const app = require('../../server');

const User = require('../../models/userModel');
const Lesson = require('../../models/lessonModel');
const Section = require('../../models/sectionModel');
const Subject = require('../../models/subjectModel');
const Grade = require('../../models/gradeModel');
const Coupon = require('../../models/couponModel');

describe('Payment API - Integration Tests', () => {
  let accessToken;
  let testLessonId;

  // ✅ قبل كل test بننشئ البيانات من الأول عشان afterEach بيمسحها
  beforeEach(async () => {
    const grade = await Grade.create({ name: 'Test Grade', level: 1, isActive: true });
    const subject = await Subject.create({ 
      name: 'Test Subject', 
      gradeId: grade._id, 
      isActive: true, 
      hasSections: true 
    });
    const section = await Section.create({ 
      name: 'Test Section', 
      subjectId: subject._id, 
      gradeId: grade._id,
      order: 1, 
      isActive: true 
    });
    const lesson = await Lesson.create({
      title: 'Premium Lesson for Test',
      description: 'For testing',
      sectionId: section._id,
      isPremium: true,
      price: 100,
      isActive: true,
    });
    testLessonId = lesson._id.toString();

    await User.create({
      name: 'Test User',
      email: 'testuser@example.com',
      password: 'password123',
      phone: '01000000000',
      parentPhone: '01000000001',
      role: 'user',
      active: true,
      isBanned: false,
      emailVerified: true,
    });

    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'testuser@example.com', password: 'password123' });

    accessToken = loginRes.body.tokens?.accessToken;
  });

  // ✅ Test 1: شراء درس بدون Idempotency-Key (يرجع 400)
  test('POST /payment/checkout - missing idempotency-key', async () => {
    const response = await request(app)
      .post('/api/v1/payment/checkout')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        lessonId: testLessonId,
        paymentMethod: 'card',
      });

    expect(response.status).toBe(400);
    // ✅ بنتحقق من الـ errors array أو الـ message
    const bodyStr = JSON.stringify(response.body);
    expect(bodyStr).toContain('Idempotency');
  });

  // ✅ Test 2: شراء درس بكود خصم صالح
  test('POST /payment/checkout - with valid coupon', async () => {
    await Coupon.create({
      code: 'TEST20',
      discountType: 'percentage',
      discountValue: 20,
      endDate: new Date('2026-12-31'),
      isActive: true,
    });

    const response = await request(app)
      .post('/api/v1/payment/checkout')
      .set('Authorization', `Bearer ${accessToken}`)
      .set('Idempotency-Key', 'test-coupon-123')
      .send({
        lessonId: testLessonId,
        paymentMethod: 'card',
        couponCode: 'TEST20',
      });

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveProperty('appliedCoupon');
    expect(response.body.data.appliedCoupon.code).toBe('TEST20');
    expect(response.body.data).toHaveProperty('originalPrice', 100);
    expect(response.body.data).toHaveProperty('finalPrice', 80);
  },10000);

  // ✅ Test 3: شراء درس بكود خصم غير صالح (يرجع 400)
  test('POST /payment/checkout - with invalid coupon', async () => {
    const response = await request(app)
      .post('/api/v1/payment/checkout')
      .set('Authorization', `Bearer ${accessToken}`)
      .set('Idempotency-Key', 'test-invalid-coupon')
      .send({
        lessonId: testLessonId,
        paymentMethod: 'card',
        couponCode: 'INVALID',
      });

    expect(response.status).toBe(400);
    expect(response.body.message).toContain('Invalid coupon code');
  });
});