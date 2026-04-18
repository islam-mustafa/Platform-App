const express = require('express');
const crypto = require('crypto');
const Lesson = require('../models/lessonModel');
const paymentService = require('../services/paymentService');
const StudentLesson = require('../models/studentLessonModel');
const Transaction = require('../models/transactionModel');
const asyncHandler = require('express-async-handler');

const router = express.Router();

// ============================================================
// 🔵 Webhook 1: Cloudinary (معالجة الفيديوهات)
// ============================================================
router.post('/eager-complete', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const body = req.body.toString('utf8');
    const payload = JSON.parse(body);

    const publicId = payload.public_id || payload?.data?.public_id;

    if (!publicId) {
      console.log('⚠️ Cloudinary webhook received without public_id');
      return res.status(200).json({ status: 'ok', message: 'No public_id in payload' });
    }

    const updateResult = await Lesson.updateOne(
      { 'videos.publicId': publicId },
      { $set: { 'videos.$.processingStatus': 'ready' } }
    );

    if (updateResult.matchedCount === 0) {
      console.log(`⚠️ No lesson found for public_id: ${publicId}`);
      return res.status(200).json({ status: 'ok', message: 'No matching lesson found' });
    }

    console.log(`✅ Video ${publicId} marked as ready`);
    return res.status(200).json({ status: 'ok' });
  } catch (error) {
    console.error('❌ Error processing Cloudinary webhook:', error);
    return res.status(500).json({ status: 'error', message: error.message });
  }
});

// ============================================================
// 🟢 Webhook 2: Paymob (معالجة الدفع)
// ============================================================
router.post('/paymob', express.raw({ type: 'application/json' }), asyncHandler(async (req, res) => {
  console.log('📨 Paymob webhook received at:', new Date().toISOString());
  
  let webhookBody;
  let hmacSignature = req.headers['hmac'];
  
  try {
    if (req.body && Buffer.isBuffer(req.body)) {
      webhookBody = JSON.parse(req.body.toString());
    } else if (typeof req.body === 'object') {
      webhookBody = req.body;
    } else {
      webhookBody = JSON.parse(req.body);
    }
  } catch (error) {
    console.error('❌ Failed to parse webhook body:', error);
    return res.status(400).send('Bad Request');
  }
  
  console.log('📦 Paymob webhook body:', JSON.stringify(webhookBody, null, 2));
  
  const isMockMode = process.env.PAYMOB_API_KEY === 'test_key' || !process.env.PAYMOB_API_KEY;
  
  let paymentResult;
  
  if (isMockMode) {
    console.log('🟡 Running in MOCK mode - using mock webhook processing');
    
    const { orderId, success, paymobTransactionId } = webhookBody;
    
    if (!orderId) {
      console.warn('⚠️ Mock webhook: No orderId provided');
      return res.status(200).send('OK');
    }
    
    paymentResult = await paymentService.handlePaymentWebhook({
      orderId,
      paymobTransactionId: paymobTransactionId || `mock_${Date.now()}`,
      success: success !== false,
      amount: webhookBody.amount
    });
  } else {
    if (hmacSignature) {
      const isValid = verifyPaymobHmac(webhookBody, hmacSignature);
      if (!isValid) {
        console.error('❌ Invalid HMAC signature - possible fraud attempt');
        return res.status(401).send('Unauthorized');
      }
      console.log('✅ HMAC signature verified');
    }
    
    const paymobData = webhookBody.obj || webhookBody;
    const orderId = paymobData.order?.id || webhookBody.order?.id;
    const paymobTransactionId = paymobData.id;
    const success = paymobData.success === true;
    
    paymentResult = await paymentService.handlePaymentWebhook({
      orderId: orderId?.toString(),
      paymobTransactionId: paymobTransactionId?.toString(),
      success,
      amount: paymobData.amount
    });
  }
  
  if (paymentResult.processed && paymentResult.success && paymentResult.transaction) {
    const { userId, lessonId, amount } = paymentResult.transaction;
    
    console.log(`✅ Updating StudentLesson: user=${userId}, lesson=${lessonId}`);
    
    await StudentLesson.findOneAndUpdate(
      { userId, lessonId },
      {
        hasAccess: true,
        purchaseDate: new Date(),
        purchasePrice: amount,
        purchaseCurrency: 'EGP',
        $setOnInsert: {
          accessCount: 0,
          refreshCount: 0,
          watchPercentage: 0,
          lastPosition: 0
        }
      },
      { 
        upsert: true,
        new: true,
        setDefaultsOnInsert: true
      }
    );
    
    console.log(`✅ StudentLesson updated successfully`);
  }
  
  res.status(200).send('OK');
}));

/**
 * التحقق من HMAC Signature (لـ Paymob الحقيقي)
 */
function verifyPaymobHmac(body, receivedHmac) {
  const hmacSecret = process.env.PAYMOB_HMAC_SECRET;
  
  if (!hmacSecret || hmacSecret === 'test_hmac_secret') {
    console.warn('⚠️ No valid HMAC secret configured');
    return true;
  }
  
  try {
    const calculatedHmac = crypto
      .createHmac('sha512', hmacSecret)
      .update(JSON.stringify(body))
      .digest('hex');
    
    return calculatedHmac === receivedHmac;
  } catch (error) {
    console.error('❌ HMAC verification error:', error);
    return false;
  }
}

// ============================================================
// 🧪 Webhooks تجريبية للتطوير فقط (Mock)
// ============================================================

  
  // محاكاة دفع ناجح
  router.post('/test/success', asyncHandler(async (req, res) => {
    const { orderId } = req.body;
    
    if (!orderId) {
      return res.status(400).json({ error: 'orderId is required' });
    }
    
    console.log(`🧪 TEST: Simulating successful payment for order ${orderId}`);
    
    const result = await paymentService.mockSuccessfulPayment(orderId);
    
    if (result && result.userId && result.lessonId) {
      await StudentLesson.findOneAndUpdate(
        { userId: result.userId, lessonId: result.lessonId },
        {
          hasAccess: true,
          purchaseDate: new Date(),
          purchasePrice: result.amount,
          purchaseCurrency: 'EGP'
        },
        { upsert: true }
      );
    }
    
    res.status(200).json({ success: true, message: 'Mock successful payment processed', data: result });
  }));
  
  // محاكاة دفع فاشل
  router.post('/test/failed', asyncHandler(async (req, res) => {
    const { orderId } = req.body;
    
    if (!orderId) {
      return res.status(400).json({ error: 'orderId is required' });
    }
    
    console.log(`🧪 TEST: Simulating failed payment for order ${orderId}`);
    
    const result = await paymentService.mockFailedPayment(orderId);
    
    res.status(200).json({ success: true, message: 'Mock failed payment processed', data: result });
  }));


module.exports = router;