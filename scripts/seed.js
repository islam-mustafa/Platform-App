const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: './config.env' });

// Import Models
const Grade = require('../models/gradeModel');
const Subject = require('../models/subjectModel');
const Section = require('../models/sectionModel');
const Lesson = require('../models/lessonModel');
const Quiz = require('../models/quizModel');
const User = require('../models/userModel');
const StudentLesson = require('../models/studentLessonModel');
const QuizAttempt = require('../models/quizAttemptModel');
const Submission = require('../models/submissionModel');
const Assignment = require('../models/assignmentModel');

// ==================== Helper Functions ====================

const cleanDatabase = async () => {
  console.log('\n🧹 Cleaning database...');
  try {
    await Grade.deleteMany({});
    console.log('  ✅ Grades cleared');
    
    await Subject.deleteMany({});
    console.log('  ✅ Subjects cleared');
    
    await Section.deleteMany({});
    console.log('  ✅ Sections cleared');
    
    await Lesson.deleteMany({});
    console.log('  ✅ Lessons cleared');
    
    await Quiz.deleteMany({});
    console.log('  ✅ Quizzes cleared');
    
    await User.deleteMany({});
    console.log('  ✅ Users cleared');
    
    await StudentLesson.deleteMany({});
    console.log('  ✅ StudentLessons cleared');
    
    await QuizAttempt.deleteMany({});
    console.log('  ✅ QuizAttempts cleared');
    
    await Submission.deleteMany({});
    console.log('  ✅ Submissions cleared');
    
    await Assignment.deleteMany({});
    console.log('  ✅ Assignments cleared');
    
    console.log('✅ Database cleaned successfully\n');
  } catch (error) {
    console.error('❌ Error cleaning database:', error.message);
    throw error;
  }
};

// ==================== Seed Grades ====================

const seedGrades = async () => {
  console.log('📚 Creating Grades...');
  
  const grades = [
    { name: 'الصف الأول الثانوي', level: 1, order: 1, isActive: true },
    { name: 'الصف الثاني الثانوي', level: 2, order: 2, isActive: true },
    { name: 'الصف الثالث الثانوي', level: 3, order: 3, isActive: true },
  ];
  
  const createdGrades = await Grade.insertMany(grades);
  console.log(`✅ Created ${createdGrades.length} grades\n`);
  
  return createdGrades;
};

// ==================== Seed Subject ====================

const seedSubject = async () => {
  console.log('📖 Creating Subject...');
  
  const subject = {
    name: 'اللغة العربية',
    description: 'مادة اللغة العربية الشاملة - النحو والبلاغة والأدب والنصوص',
    hasSections: true,
    isActive: true,
    order: 1,
  };
  
  const createdSubject = await Subject.create(subject);
  console.log(`✅ Created subject: ${createdSubject.name}\n`);
  
  return createdSubject;
};

// ==================== Seed Sections ====================

const seedSections = async (grades, subject) => {
  console.log('🎯 Creating Sections...');
  
  const sectionNames = ['النحو', 'البلاغة', 'النصوص', 'الأدب'];
  let createdSections = [];
  
  for (const grade of grades) {
    for (let i = 0; i < sectionNames.length; i++) {
      const section = {
        name: sectionNames[i],
        subjectId: subject._id,
        gradeId: grade._id,
        description: `قسم ${sectionNames[i]} - الصف ${grade.name}`,
        order: i + 1,
        isActive: true,
        isDefault: false,
      };
      
      const createdSection = await Section.create(section);
      createdSections.push(createdSection);
    }
  }
  
  console.log(`✅ Created ${createdSections.length} sections (${sectionNames.length} sections × ${grades.length} grades)\n`);
  
  return createdSections;
};

// ==================== Seed Lessons ====================

const seedLessons = async (sections) => {
  console.log('📝 Creating Lessons...');
  
  const lessonTemplates = {
    'النحو': [
      { title: 'إعراب المبتدأ والخبر', description: 'تعلم كيفية إعراب المبتدأ والخبر بأنواعهما المختلفة' },
      { title: 'الفعل الماضي والفعل المضارع', description: 'شرح الفعل الماضي والمضارع والأمر' },
      { title: 'الجملة الاسمية والفعلية', description: 'التمييز بين الجملة الاسمية والفعلية' },
      { title: 'الحروف والأدوات', description: 'دراسة الحروف والأدوات النحوية' },
      { title: 'التوابع والبدل', description: 'النعت والإضافة والبدل والعطف' },
    ],
    'البلاغة': [
      { title: 'الاستعارة والتشبيه', description: 'شرح البلاغة والاستعارة والتشبيه' },
      { title: 'الكناية والمجاز', description: 'الكناية والمجاز والحقيقة' },
      { title: 'السجع والطباق', description: 'السجع والطباق والجناس' },
      { title: 'أساليب البلاغة', description: 'الأساليب البلاغية الأخرى' },
    ],
    'النصوص': [
      { title: 'نصوص الشعر الجاهلي', description: 'دراسة نصوص من الشعر الجاهلي' },
      { title: 'نصوص الشعر الحديث', description: 'نصوص من الشعر الحديث والمعاصر' },
      { title: 'نصوص النثر', description: 'نصوص من الكتابات النثرية' },
      { title: 'الخطب والرسائل', description: 'الخطب والرسائل القديمة' },
    ],
    'الأدب': [
      { title: 'الأدب الجاهلي', description: 'تاريخ الأدب الجاهلي وخصائصه' },
      { title: 'الأدب الإسلامي', description: 'الأدب في العصر الإسلامي' },
      { title: 'الأدب العباسي', description: 'الأدب والشعر في العصر العباسي' },
      { title: 'الأدب الحديث', description: 'الأدب والتيارات الحديثة' },
      { title: 'النقد الأدبي', description: 'مقدمة في النقد الأدبي' },
    ],
  };
  
  let createdLessons = [];
  let lessonOrder = {};
  
  for (const section of sections) {
    if (!lessonOrder[section.name]) {
      lessonOrder[section.name] = 0;
    }
    
    const templates = lessonTemplates[section.name] || [];
    
    for (let i = 0; i < templates.length; i++) {
      const isPremium = i % 3 === 0; // كل ثالث درس يكون مدفوع
      const price = isPremium ? 50 : 0; // 50 قرش للمدفوع
      
      const lesson = {
        title: templates[i].title,
        description: templates[i].description,
        sectionId: section._id,
        order: i + 1,
        isPremium: isPremium,
        price: price,
        currency: 'EGP',
        content: {
          text: `محتوى درس: ${templates[i].title}\n\nهذا هو المحتوى النصي للدرس يشرح الموضوع بشكل مفصل...`,
          attachments: [],
          duration: 15 + Math.floor(Math.random() * 30),
        },
        videos: [],
        isActive: true,
      };
      
      const createdLesson = await Lesson.create(lesson);
      createdLessons.push(createdLesson);
    }
  }
  
  console.log(`✅ Created ${createdLessons.length} lessons\n`);
  
  return createdLessons;
};

// ==================== Seed Quizzes ====================

const seedQuizzes = async (lessons) => {
  console.log('❓ Creating Quizzes...');
  
  let createdQuizzes = [];
  
  for (const lesson of lessons) {
    const quiz = {
      lessonId: lesson._id,
      title: `اختبار: ${lesson.title}`,
      description: `اختبر معلوماتك حول درس ${lesson.title}`,
      timeLimit: 10, // 10 دقائق
      passingScore: 70,
      attemptsAllowed: 3,
      shuffleQuestions: true,
      showResults: true,
      questions: [
        {
          questionText: 'ما هو الإعراب الصحيح لكلمة "محمد" في الجملة: انطلق محمد؟',
          type: 'multiple_choice',
          points: 1,
          options: [
            { text: 'فاعل مرفوع', isCorrect: true },
            { text: 'مبتدأ مرفوع', isCorrect: false },
            { text: 'مفعول به منصوب', isCorrect: false },
            { text: 'جار ومجرور', isCorrect: false },
          ],
          correctAnswer: 0,
          explanation: 'محمد هو فاعل الفعل "انطلق" ويجب أن يكون مرفوعاً',
          order: 1,
        },
        {
          questionText: 'الاستعارة هي تشبيه حذفت منه أداة التشبيه والمشبه به',
          type: 'true_false',
          points: 1,
          correctAnswer: true,
          explanation: 'هذا تعريف صحيح للاستعارة في البلاغة',
          order: 2,
        },
        {
          questionText: 'أي من الآتي يعتبر من أدوات العطف؟',
          type: 'multiple_choice',
          points: 1,
          options: [
            { text: 'في', isCorrect: false },
            { text: 'و', isCorrect: true },
            { text: 'على', isCorrect: false },
            { text: 'من', isCorrect: false },
          ],
          correctAnswer: 1,
          explanation: 'حرف الواو يعتبر من أهم أدوات العطف',
          order: 3,
        },
        {
          questionText: 'المجاز هو استخدام اللفظ في غير معناه الحقيقي',
          type: 'true_false',
          points: 1,
          correctAnswer: true,
          explanation: 'هذا تعريف صحيح للمجاز',
          order: 4,
        },
        {
          questionText: 'كم عدد حروف الجر في اللغة العربية؟',
          type: 'multiple_choice',
          points: 1,
          options: [
            { text: '18 حرف', isCorrect: true },
            { text: '20 حرف', isCorrect: false },
            { text: '25 حرف', isCorrect: false },
            { text: '10 أحرف', isCorrect: false },
          ],
          correctAnswer: 0,
          explanation: 'هناك 18 حرف جر في اللغة العربية',
          order: 5,
        },
      ],
      isActive: true,
      publishedAt: new Date(),
    };
    
    try {
      const createdQuiz = await Quiz.create(quiz);
      createdQuizzes.push(createdQuiz);
    } catch (error) {
      // تجاهل الأخطاء المتعلقة بـ unique constraint
      if (error.code === 11000) {
        console.log(`  ⚠️  Quiz already exists for lesson: ${lesson.title}`);
      } else {
        console.error(`  ❌ Error creating quiz for ${lesson.title}:`, error.message);
      }
    }
  }
  
  console.log(`✅ Created ${createdQuizzes.length} quizzes\n`);
  
  return createdQuizzes;
};

// ==================== Seed Users ====================

const seedUsers = async () => {
  console.log('👥 Creating Users...');
  
  const users = [
    {
      name: 'Admin User',
      email: 'admin@example.com',
      phone: '01012345678',
      parentPhone: '01112345678',
      password: 'admin123',
      role: 'admin',
      emailVerified: true,
      active: true,
    },
    {
      name: 'Test User',
      email: 'user@example.com',
      phone: '01098765432',
      parentPhone: '01198765432',
      password: 'user123',
      role: 'user',
      emailVerified: true,
      active: true,
    },
    {
      name: 'Student Two',
      email: 'student2@example.com',
      phone: '01055555555',
      parentPhone: '01155555555',
      password: 'student123',
      role: 'user',
      emailVerified: true,
      active: true,
    },
  ];
  
  let createdUsers = [];
  
  for (const user of users) {
    // Rely on User model pre-save middleware to hash password once.
    const createdUser = await User.create(user);
    createdUsers.push(createdUser);
  }
  
  console.log(`✅ Created ${createdUsers.length} users\n`);
  
  return createdUsers;
};

// ==================== Seed Student Lessons ====================

const seedStudentLessons = async (users, lessons) => {
  console.log('🎓 Creating StudentLesson records...');
  
  // ابحث عن الطالب (ليس الأدمن)
  const student = users.find(u => u.role === 'user');
  
  if (!student) {
    console.log('  ⚠️  No student user found, skipping StudentLesson creation\n');
    return [];
  }
  
  let createdStudentLessons = [];
  
  // أعطِ الطالب وصول لأول 10 دروس (المجانية وبعض المدفوعة)
  const studentLessonsData = [];
  for (let i = 0; i < Math.min(10, lessons.length); i++) {
    studentLessonsData.push({
      userId: student._id,
      lessonId: lessons[i]._id,
      hasAccess: true, // الطالب لديه وصول
      watchPercentage: Math.floor(Math.random() * 100),
      lastAccess: new Date(),
    });
  }
  
  try {
    // استخدم insertMany لتجاوز مشاكل middleware
    const created = await StudentLesson.insertMany(studentLessonsData, { ordered: false });
    createdStudentLessons = created;
  } catch (error) {
    // insertMany مع ordered: false سيُدرج ما هو ممكن ويسجل الأخطاء
    if (error.insertedDocs) {
      createdStudentLessons = error.insertedDocs;
      console.log(`  ⚠️  Partially created StudentLessons (${error.insertedDocs.length} out of ${studentLessonsData.length})`);
    } else {
      console.error(`  ❌ Error creating StudentLessons:`, error.message);
    }
  }
  
  console.log(`✅ Created ${createdStudentLessons.length} StudentLesson records\n`);
  
  return createdStudentLessons;
};

// ==================== Main Seed Function ====================

const seed = async () => {
  try {
    // Connect to MongoDB
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(process.env.DB_URI, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });
    console.log('✅ Connected to MongoDB\n');

    // Clean Database
    await cleanDatabase();

    // Seed Data
    const grades = await seedGrades();
    const subject = await seedSubject();
    const sections = await seedSections(grades, subject);
    const lessons = await seedLessons(sections);
    const quizzes = await seedQuizzes(lessons);
    const users = await seedUsers();
    const studentLessons = await seedStudentLessons(users, lessons);

    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('📊 SEEDING SUMMARY');
    console.log('='.repeat(50));
    console.log(`✅ Grades created: ${grades.length}`);
    console.log(`✅ Subjects created: 1`);
    console.log(`✅ Sections created: ${sections.length}`);
    console.log(`✅ Lessons created: ${lessons.length}`);
    console.log(`✅ Quizzes created: ${quizzes.length}`);
    console.log(`✅ Users created: ${users.length}`);
    console.log(`✅ StudentLessons created: ${studentLessons.length}`);
    console.log('='.repeat(50));
    console.log('✅ Database seeding completed successfully!\n');

    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Error during seeding:', error.message);
    console.error(error);
    await mongoose.disconnect();
    process.exit(1);
  }
};

// Run Seed
seed();
