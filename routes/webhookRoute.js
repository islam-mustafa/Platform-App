const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const Lesson = require('../models/lessonModel');

// ✅ Webhook endpoint (مش محتاج مصادقة لأنه Cloudinary بيبعته)
router.post('/webhooks/eager-complete', express.raw({ type: 'application/json' }), async (req, res) => {
  console.log('📨 Webhook received at:', new Date().toISOString());
  
  // 1) تسجيل الـ headers (للتتبع)
  console.log('Headers:', {
    signature: req.headers['x-cld-signature'],
    timestamp: req.headers['x-cld-timestamp'],
    'content-type': req.headers['content-type']
  });
  
  // 2) الحصول على الـ body كـ string
  const body = req.body.toString();
  console.log('Body preview:', body.substring(0, 500) + '...');
  
  // 3) التحقق من التوقيع (مهم للأمان)
  const signature = req.headers['x-cld-signature'];
  const timestamp = req.headers['x-cld-timestamp'];
  
  if (!signature || !timestamp) {
    console.log('❌ Missing signature or timestamp');
    return res.sendStatus(400);
  }
  
  // 4) بناء الـ signed payload: body + timestamp
  const signedPayload = body + timestamp;
  
  // 5) حساب التوقيع المتوقع
  const expectedSignature = crypto
    .createHmac('sha1', process.env.CLOUDINARY_API_SECRET)
    .update(signedPayload)
    .digest('hex');
  
  // 6) مقارنة التوقيعات
  if (signature !== expectedSignature) {
    console.log('❌ Invalid signature');
    console.log('Expected:', expectedSignature);
    console.log('Received:', signature);
    return res.sendStatus(401);
  }
  
  console.log('✅ Signature verified');
  
  // 7) التحقق من أن الطلب مش قديم (أقل من ساعتين)
  const now = Math.floor(Date.now() / 1000);
  const requestTime = parseInt(timestamp);
  
  if (now - requestTime > 7200) { // ساعتين
    console.log('⚠️ Request too old');
    return res.sendStatus(400);
  }
  
  try {
    // 8) تحليل البيانات
    const data = JSON.parse(body);
    console.log('📦 Notification data:', {
      public_id: data.public_id,
      resource_type: data.resource_type,
      notification_type: data.notification_type,
      eager_count: data.eager ? data.eager.length : 0
    });
    
    // 9) البحث عن الدرس اللي فيه الفيديو ده
    const lesson = await Lesson.findOne({ "videos.publicId": data.public_id });
    
    if (!lesson) {
      console.log(`❌ Lesson not found for public_id: ${data.public_id}`);
      return res.sendStatus(404);
    }
    
    // 10) تحديث حالة الفيديو
    const videoIndex = lesson.videos.findIndex(v => v.publicId === data.public_id);
    
    if (videoIndex === -1) {
      console.log(`❌ Video not found in lesson: ${data.public_id}`);
      return res.sendStatus(404);
    }
    
    // 11) معالجة حسب نوع الإشعار
    if (data.notification_type === 'eager') {
      // تخزين التحويلات اللي وصلت
      if (!lesson.videos[videoIndex].eagerResults) {
        lesson.videos[videoIndex].eagerResults = [];
      }
      
      // إضافة التحويل الجديد
      data.eager.forEach(eager => {
        lesson.videos[videoIndex].eagerResults.push({
          transformation: eager.transformation,
          url: eager.secure_url || null,
          width: eager.width,
          height: eager.height,
          format: eager.format || 'mp4',
          receivedAt: new Date()
        });
      });
      
      console.log(`✅ Stored ${data.eager.length} eager transformations for ${data.public_id}`);
      
      // ✅ إذا وصلت كل التحويلات المطلوبة (360p, 720p, HLS, thumbnail)
      const expectedCount = 4; // 360p, 720p, HLS, thumbnail
      const receivedCount = lesson.videos[videoIndex].eagerResults.length;
      
      if (receivedCount >= expectedCount) {
        lesson.videos[videoIndex].processingStatus = 'ready';
        lesson.videos[videoIndex].title = lesson.videos[videoIndex].title.replace('جاري المعالجة...', 'جاهز');
        console.log(`✅ Video ${data.public_id} is now READY`);
      } else {
        console.log(`⏳ Still processing: ${receivedCount}/${expectedCount} transformations complete`);
      }
    }
    
    // 12) تحديث الفيديو
    await lesson.save();
    console.log(`✅ Updated lesson ${lesson._id}`);
    
    res.sendStatus(200);
    
  } catch (error) {
    console.error('❌ Error processing webhook:', error);
    res.sendStatus(500);
  }
});

module.exports = router;