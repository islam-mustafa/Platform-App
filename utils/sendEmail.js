const nodemailer = require('nodemailer');

const sendEmail = async (options) => {

  // ✅ 1. التحقق من وجود المتغيرات البيئية
  const requiredEnvVars = ['EMAIL_HOST', 'EMAIL_PORT', 'EMAIL_USER', 'EMAIL_PASSWORD'];
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.error('❌ Missing environment variables:', missingVars.join(', '));
    throw new Error(`Email configuration missing: ${missingVars.join(', ')}`);
  }

  // ✅ 2. تحويل البورت إلى رقم وتحديد secure بناءً عليه
  const port = parseInt(process.env.EMAIL_PORT);
  const secure = port === 465; // true فقط للبورت 465

  // ✅ 3. Create transporter
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: port,
    secure: secure,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
    tls: {
      rejectUnauthorized: false, // للاختبار فقط (لو عندك مشكلة SSL)
    },
  });

  // ✅ 4. Define email options
  const mailOpts = {
    from: '"Platform" <islam.mostafa893@gmail.com>', // صيغة محسنة
    to: options.email,
    subject: options.subject,
    text: options.message,
  };

  // ✅ 5. Send email
  const info = await transporter.sendMail(mailOpts);
  
  return info;
};

module.exports = sendEmail;