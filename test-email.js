// IMPORTANT: Load env variables first
require('dotenv').config({ path: './config.env' });

const sendEmail = require('./utils/sendEmail');

async function test() {
  try {
    console.log('1. Testing email...');
    console.log('2. Environment check:');
    console.log('   HOST:', process.env.EMAIL_HOST || '❌ Missing');
    console.log('   PORT:', process.env.EMAIL_PORT || '❌ Missing');
    console.log('   USER:', process.env.EMAIL_USER ? '✅ Set' : '❌ Missing');
    console.log('   PASS:', process.env.EMAIL_PASSWORD ? '✅ Set' : '❌ Missing');
    
    if (!process.env.EMAIL_HOST || !process.env.EMAIL_PORT || !process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
      throw new Error('Missing email configuration');
    }

    await sendEmail({
      email: 'eslamalgamel4@gmail.com',
      subject: 'Test Email',
      message: 'Hello, this is a test email',
    });
    
    console.log('✅ Test passed!');
    
  } catch (error) {
    console.log('❌ Test failed:', error.message);
    console.log('   Full error:', error);
  }
}

test();