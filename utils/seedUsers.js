const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');

// Load env
dotenv.config({ path: './config.env' });

// Import User Model
const User = require('../models/userModel');

// Connect to DB
mongoose.connect(process.env.DB_URI)
  .then(() => console.log('✅ Database connected for seeding'))
  .catch(err => {
    console.error('❌ DB Connection Error:', err);
    process.exit(1);
  });

// Users Data
const users = [
  {
    name: 'Islam Mostafa',
    email: 'islam@example.com',
    phone: '01098974166',
    parentPhone: '01198974166',
    password: '123456',
    role: 'admin',
    emailVerified: true,
  },
  {
    name: 'Ahmed Ali',
    email: 'ahmed@example.com',
    phone: '01234567890',
    parentPhone: '01122334455',
    password: '123456',
    role: 'user',
    emailVerified: true,
  },
  {
    name: 'Mona Hassan',
    email: 'mona@example.com',
    phone: '01122334455',
    parentPhone: '01099887766',
    password: '123456',
    role: 'user',
    emailVerified: false,
  },
  {
    name: 'Omar Khaled',
    email: 'omar@example.com',
    phone: '01551234567',
    parentPhone: '01221234567',
    password: '123456',
    role: 'instructor',
    emailVerified: true,
  },
  {
    name: 'Eslam AlGamel',
    email: 'eslamalgamel4@gmail.com',
    phone: '01098974166',
    parentPhone: '01198974166',
    password: 'asdf1234',
    role: 'user',
    emailVerified: true,
  },
];

// Hash passwords before saving
const hashPasswords = async () => {
  const saltRounds = 12;
  for (let user of users) {
    user.password = await bcrypt.hash(user.password, saltRounds);
  }
};

// Insert data
const seedUsers = async () => {
  try {
    await hashPasswords();

    // Delete existing users (optional) – تعليق لو عايز تحافظ على البيانات القديمة
    // await User.deleteMany();
    // console.log('🗑️  Old users deleted');

    await User.insertMany(users);
    console.log('✅ Users seeded successfully!');
    console.log('📧 Emails seeded:');
    users.forEach(u => console.log(`   - ${u.email} / password: ${u.passwordOriginal || 'same as above'}`));

    process.exit();
  } catch (error) {
    console.error('❌ Error seeding users:', error);
    process.exit(1);
  }
};

seedUsers();