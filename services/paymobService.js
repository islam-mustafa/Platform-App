const crypto = require('crypto');
const ApiError = require('../utils/apiError');
const { PAYMOB_API } = require('../utils/constants');

// ✅ الرابط الأساسي من .env
const PAYMOB_BASE_URL = process.env.PAYMOB_API_URL || 'https://accept.paymob.com/api';

/**
 * دالة مساعدة لإرسال طلبات POST
 */
const postRequest = async (url, data, errorMessage) => {
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`${errorMessage}:`, error);
    throw new ApiError(errorMessage, 500);
  }
};

/**
 * الخطوة 1: الحصول على توكن المصادقة من Paymob
 */
const getAuthToken = async () => {
  const result = await postRequest(
    `${PAYMOB_BASE_URL}${PAYMOB_API.AUTH}`,
    { api_key: process.env.PAYMOB_API_KEY },
    'فشل الحصول على توكن Paymob'
  );
  
  if (!result?.token) {
    throw new ApiError('لم يتم استلام توكن من Paymob', 500);
  }
  
  console.log('✅ تم الحصول على توكن Paymob');
  return result.token;
};

/**
 * الخطوة 2: إنشاء طلب شراء (Order) في Paymob
 */
const createOrder = async (token, amount, merchantOrderId) => {
  const result = await postRequest(
    `${PAYMOB_BASE_URL}${PAYMOB_API.ORDER}`,
    {
      auth_token: token,
      delivery_needed: false,
      amount_cents: amount * 100,
      currency: 'EGP',
      merchant_order_id: merchantOrderId,
      items: []
    },
    'فشل إنشاء طلب الدفع'
  );
  
  if (!result?.id) {
    throw new ApiError('لم يتم استلام Order ID من Paymob', 500);
  }
  
  console.log(`✅ تم إنشاء طلب شراء: ${result.id}`);
  return result;
};

/**
 * الخطوة 3: الحصول على مفتاح الدفع (Payment Key)
 */
const getPaymentKey = async (token, orderId, amount, billingData, integrationId) => {
  const result = await postRequest(
    `${PAYMOB_BASE_URL}${PAYMOB_API.PAYMENT_KEY}`,
    {
      auth_token: token,
      amount_cents: amount * 100,
      expiration: 3600,
      order_id: orderId,
      billing_data: {
        email: billingData.email || 'customer@example.com',
        first_name: billingData.firstName || 'Customer',
        last_name: billingData.lastName || 'User',
        phone_number: billingData.phone || '01000000000',
        apartment: 'NA',
        floor: 'NA',
        street: 'NA',
        building: 'NA',
        shipping_method: 'NA',
        postal_code: 'NA',
        city: 'NA',
        country: 'NA',
        state: 'NA'
      },
      currency: 'EGP',
      integration_id: parseInt(integrationId)
    },
    'فشل الحصول على مفتاح الدفع'
  );
  
  if (!result?.token) {
    throw new ApiError('لم يتم استلام Payment Key من Paymob', 500);
  }
  
  console.log('✅ تم الحصول على مفتاح الدفع');
  return result.token;
};

/**
 * الخطوة 4: بناء رابط صفحة الدفع (للبطاقات)
 */
const buildIframeUrl = (paymentToken) => {
  return `${PAYMOB_BASE_URL}${PAYMOB_API.IFRAME}/${process.env.PAYMOB_IFRAME_ID}?payment_token=${paymentToken}`;
};

// ============================================================
// ✅ الدالة الرئيسية: إنشاء طلب دفع بالبطاقة
// ============================================================
exports.createCardPayment = async (lesson, user, idempotencyKey) => {
  try {
    const token = await getAuthToken();
    
    const merchantOrderId = `${lesson._id}_${user._id}_${Date.now()}`;
    const order = await createOrder(token, lesson.price, merchantOrderId);
    
    const billingData = {
      email: user.email,
      firstName: user.name?.split(' ')[0] || 'User',
      lastName: user.name?.split(' ')[1] || 'Name',
      phone: user.phone || '01000000000'
    };
    
    const paymentToken = await getPaymentKey(
      token,
      order.id,
      lesson.price,
      billingData,
      process.env.PAYMOB_CARD_INTEGRATION_ID
    );
    
    const iframeUrl = buildIframeUrl(paymentToken);
    
    return {
      iframeUrl,
      orderId: order.id.toString(),
      paymentToken,
      amount: lesson.price
    };
    
  } catch (error) {
    throw error;
  }
};

// ============================================================
// ✅ الدالة الرئيسية: إنشاء طلب دفع بالمحفظة (Mobile Wallet)
// ============================================================
exports.createWalletPayment = async (lesson, user, walletNumber, idempotencyKey) => {
  try {
    const token = await getAuthToken();
    
    const merchantOrderId = `${lesson._id}_${user._id}_${Date.now()}`;
    const order = await createOrder(token, lesson.price, merchantOrderId);
    
    const billingData = {
      email: user.email,
      firstName: user.name?.split(' ')[0] || 'User',
      lastName: user.name?.split(' ')[1] || 'Name',
      phone: walletNumber || user.phone || '01000000000'
    };
    
    const paymentToken = await getPaymentKey(
      token,
      order.id,
      lesson.price,
      billingData,
      process.env.PAYMOB_WALLET_INTEGRATION_ID
    );

    const walletResult = await postRequest(
      `${PAYMOB_BASE_URL}/acceptance/payments/pay`,
      {
        source: {
          identifier: walletNumber,
          subtype: 'WALLET'
        },
        payment_token: paymentToken
      },
      'فشل إرسال طلب الدفع للمحفظة'
    );

    // ✅ مؤقتاً: لنشوف الـ response الحقيقي من Paymob
    console.log('🔍 Wallet Result:', JSON.stringify(walletResult, null, 2));

    // ✅ Paymob بيرجع redirect_url أو iframe_redirection_url
    const redirectUrl = walletResult?.redirect_url || walletResult?.iframe_redirection_url;

    if (!redirectUrl) {
      console.error('❌ Wallet response keys:', Object.keys(walletResult));
      throw new ApiError('لم يتم استلام رابط الدفع من المحفظة', 500);
    }

    console.log('✅ تم إنشاء طلب دفع المحفظة');

    return {
      redirectUrl,
      orderId: order.id.toString(),
      paymentToken,
      amount: lesson.price
    };
    
  } catch (error) {
    throw error;
  }
};

// ============================================================
// ✅ الدالة الرئيسية: إنشاء طلب دفع كاش (فوري/أمان)
// ============================================================
exports.createCashPayment = async (lesson, user, idempotencyKey) => {
  try {
    const token = await getAuthToken();
    
    const merchantOrderId = `${lesson._id}_${user._id}_${Date.now()}`;
    const order = await createOrder(token, lesson.price, merchantOrderId);
    
    const billingData = {
      email: user.email,
      firstName: user.name?.split(' ')[0] || 'User',
      lastName: user.name?.split(' ')[1] || 'Name',
      phone: user.phone || '01000000000'
    };
    
    const paymentToken = await getPaymentKey(
      token,
      order.id,
      lesson.price,
      billingData,
      process.env.PAYMOB_CASH_INTEGRATION_ID
    );

    const cashResult = await postRequest(
      `${PAYMOB_BASE_URL}/acceptance/payments/pay`,
      {
        source: {
          identifier: 'AGGREGATOR',
          subtype: 'AGGREGATOR'
        },
        payment_token: paymentToken
      },
      'فشل إرسال طلب الدفع الكاش'
    );

    // ✅ مؤقتاً: لنشوف الـ response الحقيقي من Paymob
    console.log('🔍 Cash Result:', JSON.stringify(cashResult, null, 2));

    return {
      referenceNumber: cashResult?.id || cashResult?.bill_reference,
      orderId: order.id.toString(),
      paymentToken,
      amount: lesson.price,
      cashData: {
        reference: cashResult?.id,
        expiresAt: cashResult?.expiration_date,
      }
    };
    
  } catch (error) {
    throw error;
  }
};

/**
 * معالجة Webhook من Paymob
 */
exports.handleWebhook = async (webhookData, hmacSignature) => {
  const hmacSecret = process.env.PAYMOB_HMAC_SECRET;
  
  if (hmacSecret && hmacSecret !== 'test_hmac_secret') {
    const calculatedHmac = crypto
      .createHmac('sha512', hmacSecret)
      .update(JSON.stringify(webhookData))
      .digest('hex');
    
    if (calculatedHmac !== hmacSignature) {
      console.error('❌ توقيع HMAC غير صالح');
      throw new ApiError('توقيع غير صالح', 401);
    }
  }
  
  const transactionData = webhookData.obj || webhookData;
  const orderId = transactionData.order?.id || webhookData.order?.id;
  const paymobTransactionId = transactionData.id;
  const success = transactionData.success === true;
  const amount = transactionData.amount_cents ? transactionData.amount_cents / 100 : 0;
  
  return {
    orderId: orderId?.toString(),
    paymobTransactionId: paymobTransactionId?.toString(),
    success,
    amount
  };
};