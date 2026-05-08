const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config({ path: './config.env' });

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

const cleanDatabase = async () => {
  console.log('\n🧹 Cleaning database...');

  const collections = [
    [QuizAttempt, 'QuizAttempts'],
    [Submission, 'Submissions'],
    [StudentLesson, 'StudentLessons'],
    [Assignment, 'Assignments'],
    [Quiz, 'Quizzes'],
    [Lesson, 'Lessons'],
    [Section, 'Sections'],
    [Subject, 'Subjects'],
    [User, 'Users'],
    [Grade, 'Grades'],
  ];

  for (const [model, label] of collections) {
    await model.deleteMany({});
    console.log(`  ✅ ${label} cleared`);
  }

  console.log('✅ Database cleaned successfully\n');
};

const futureDate = (daysAhead) => {
  const date = new Date();
  date.setDate(date.getDate() + daysAhead);
  return date;
};

const seedGrades = async () => {
  console.log('📚 Creating grades...');

  const gradesData = [
    { name: 'الصف الأول الثانوي', level: 1, order: 1, isActive: true },
    { name: 'الصف الثاني الثانوي', level: 2, order: 2, isActive: true },
    { name: 'الصف الثالث الثانوي', level: 3, order: 3, isActive: true },
  ];

  const grades = [];
  for (const gradeData of gradesData) {
    const grade = await Grade.create(gradeData);
    grades.push(grade);
  }

  console.log(`✅ Created ${grades.length} grades\n`);
  return grades;
};

const seedSubject = async (grade) => {
  console.log('📖 Creating subject...');

  const subject = await Subject.create({
    name: 'اللغة العربية للمرحلة الثانوية',
    description: 'منصة عربية متكاملة لتدريس النحو والبلاغة والنصوص والأدب عبر دروس تفاعلية واختبارات وواجبات.',
    gradeId: grade?._id ?? null,
    hasSections: true,
    isActive: true,
    order: 1,
  });

  console.log(`✅ Created subject: ${subject.name}\n`);
  return subject;
};

const seedSections = async (grades, subject) => {
  console.log('🎯 Creating sections...');

  const sectionTemplates = [
    { name: 'النحو', description: 'شرح قواعد النحو من الأساسيات حتى الإعراب المتقدم.' },
    { name: 'البلاغة', description: 'شرح الصور البيانية والمحسنات البديعية وأنماط التعبير.' },
    { name: 'النصوص', description: 'تحليل النصوص الأدبية والشعرية وفهم الأفكار الرئيسة.' },
    { name: 'الأدب', description: 'استعراض العصور الأدبية وخصائص كل عصر وأبرز أعلامه.' },
  ];

  const sections = [];

  for (const grade of grades) {
    for (let index = 0; index < sectionTemplates.length; index++) {
      const template = sectionTemplates[index];
      const section = await Section.create({
        name: template.name,
        subjectId: subject._id,
        gradeId: grade._id,
        description: `${template.description} - ${grade.name}`,
        order: index + 1,
        isActive: true,
        isDefault: false,
      });

      sections.push(section);
    }
  }

  console.log(`✅ Created ${sections.length} sections\n`);
  return sections;
};

const lessonTemplates = {
  النحو: [
    { title: 'المبتدأ والخبر في الجملة الاسمية', description: 'فهم مكونات الجملة الاسمية وعلامات الإعراب الأساسية.' },
    { title: 'الفعل الماضي والمضارع والأمر', description: 'التعرف على الأزمنة الثلاثة وتوظيفها داخل الجمل.' },
    { title: 'التوابع: النعت والعطف والبدل', description: 'شرح التوابع وكيفية إعرابها داخل الجملة العربية.' },
  ],
  البلاغة: [
    { title: 'التشبيه والاستعارة', description: 'تمييز أركان التشبيه وفهم أنواع الاستعارة البلاغية.' },
    { title: 'الكناية والمجاز', description: 'استخدام الكناية والمجاز في التعبير الأدبي والقراءة التحليلية.' },
    { title: 'السجع والطباق والجناس', description: 'التعرف على المحسنات البديعية ودورها في إثراء النص.' },
  ],
  النصوص: [
    { title: 'تحليل نص شعري جاهلي', description: 'قراءة النص وتحديد الفكرة الرئيسة والصور الجمالية.' },
    { title: 'نصوص الشعر الحديث', description: 'فهم السمات الفنية للشعر الحديث والرمزية فيه.' },
    { title: 'النثر والخطابة', description: 'التمييز بين الأسلوب النثري والخطابي وأغراضه.' },
  ],
  الأدب: [
    { title: 'الأدب الجاهلي وخصائصه', description: 'التعرف على البيئة الجاهلية وخصائص الأدب فيها.' },
    { title: 'الأدب الإسلامي والأموي', description: 'مراحل تطور الأدب بعد الإسلام وأبرز الاتجاهات.' },
    { title: 'الأدب العباسي والحديث', description: 'مقارنة بين الأدب العباسي والاتجاهات الأدبية الحديثة.' },
  ],
};

const seedLessons = async (sections) => {
  console.log('📝 Creating lessons...');

  const lessons = [];

  for (const section of sections) {
    const templates = lessonTemplates[section.name] || [];

    for (let index = 0; index < templates.length; index++) {
      const template = templates[index];
      const isPremium = index % 2 === 1;
      const price = isPremium ? 75 : 0;

      const lesson = await Lesson.create({
        title: template.title,
        description: template.description,
        sectionId: section._id,
        order: index + 1,
        isPremium,
        price,
        currency: 'EGP',
        content: {
          text: `درس ${template.title} يشرح الفكرة خطوة بخطوة مع أمثلة عربية واضحة وتمارين تطبيقية للطالب.`,
          duration: 18 + (index * 7),
        },
        videos: [
          {
            publicId: `seed/${section.name.replace(/\s+/g, '-').toLowerCase()}-${index + 1}`,
            hlsUrl: null,
            mp4Url: null,
            duration: 900 + (index * 120),
            thumbnail: null,
            title: 'الفيديو التعليمي الرئيسي',
            order: 1,
            processingStatus: 'ready',
          },
        ],
        isActive: true,
      });

      lessons.push(lesson);
    }
  }

  console.log(`✅ Created ${lessons.length} lessons\n`);
  return lessons;
};

const buildQuizQuestions = (lessonTitle) => ([
  {
    questionText: `ما الفكرة الأساسية في درس "${lessonTitle}"؟`,
    type: 'multiple_choice',
    points: 2,
    options: [
      { text: 'فهم المفهوم وتطبيقه', isCorrect: true },
      { text: 'حفظ النص فقط', isCorrect: false },
      { text: 'تجاهل الأمثلة', isCorrect: false },
      { text: 'الاعتماد على التخمين', isCorrect: false },
    ],
    correctAnswer: 0,
    explanation: 'الهدف من الدرس هو الفهم العملي مع التطبيق.',
    order: 1,
  },
  {
    questionText: 'الشرح الواضح والأمثلة المتدرجة يساعدان الطالب على الفهم.',
    type: 'true_false',
    points: 1,
    correctAnswer: true,
    explanation: 'الشرح المتدرج والأمثلة من أفضل أساليب التعلم.',
    order: 2,
  },
  {
    questionText: 'ما أفضل خطوة بعد مشاهدة الدرس؟',
    type: 'multiple_choice',
    points: 2,
    options: [
      { text: 'حل التمارين والتأكد من الفهم', isCorrect: true },
      { text: 'إغلاق المنصة نهائيًا', isCorrect: false },
      { text: 'تجاهل الاختبار', isCorrect: false },
      { text: 'حفظ العناوين فقط', isCorrect: false },
    ],
    correctAnswer: 0,
    explanation: 'حل التمارين يثبت المعلومات ويقيس مستوى الفهم.',
    order: 3,
  },
]);

const seedQuizzes = async (lessons) => {
  console.log('❓ Creating quizzes...');

  const quizzes = [];

  for (const lesson of lessons) {
    const quiz = await Quiz.create({
      lessonId: lesson._id,
      title: `اختبار ${lesson.title}`,
      description: `اختبار قصير يقيس فهم الطالب لدرس ${lesson.title}.`,
      timeLimit: 12,
      passingScore: 70,
      attemptsAllowed: 3,
      shuffleQuestions: true,
      showResults: true,
      questions: buildQuizQuestions(lesson.title),
      isActive: true,
      publishedAt: new Date(),
    });

    await Lesson.findByIdAndUpdate(lesson._id, { quizId: quiz._id });
    quizzes.push(quiz);
  }

  console.log(`✅ Created ${quizzes.length} quizzes\n`);
  return quizzes;
};

const buildAssignmentQuestions = (lessonTitle) => ([
  `لخّص الفكرة الأساسية في درس ${lessonTitle} في خمس جمل عربية سليمة.`,
  `اكتب مثالين تطبيقيين مرتبطين بدرس ${lessonTitle}.`,
  'اذكر نقطة واحدة ما زالت تحتاج إلى مراجعة بعد مشاهدة الدرس.',
]);

const seedAssignments = async (lessons) => {
  console.log('📄 Creating assignments...');

  const assignments = [];

  for (const lesson of lessons) {
    const assignment = await Assignment.create({
      lessonId: lesson._id,
      title: `واجب ${lesson.title}`,
      description: `واجب منزلي يراجع فهم الطالب لمحتوى ${lesson.title} من خلال تطبيق مباشر وتمرينات قصيرة.`,
      instructions: buildAssignmentQuestions(lesson.title).join('\n'),
      dueDate: futureDate(14),
      submissionType: 'both',
      allowedFileTypes: ['pdf', 'docx', 'jpg', 'png'],
      maxPoints: 100,
      passingPoints: 60,
      isActive: true,
      publishedAt: new Date(),
      attachments: [
        {
          filename: `${lesson.title}.pdf`,
          extension: 'pdf',
          mimeType: 'application/pdf',
          url: `https://example.com/assignments/${encodeURIComponent(lesson.title)}.pdf`,
          publicId: `assignments/${lesson._id}`,
          size: 1024,
        },
      ],
    });

    await Lesson.findByIdAndUpdate(lesson._id, { assignmentId: assignment._id });
    assignments.push(assignment);
  }

  console.log(`✅ Created ${assignments.length} assignments\n`);
  return assignments;
};

const seedUsers = async () => {
  console.log('👥 Creating users...');

  const usersData = [
    {
      name: 'مدير المنصة',
      email: 'admin@example.com',
      phone: '01012345678',
      parentPhone: '01112345678',
      password: 'admin123',
      role: 'admin',
      emailVerified: true,
      active: true,
    },
    {
      name: 'المشرف العام',
      email: 'superadmin@example.com',
      phone: '01022223333',
      parentPhone: '01122223333',
      password: 'superadmin123',
      role: 'super_admin',
      emailVerified: true,
      active: true,
    },
    {
      name: 'أحمد محمد',
      email: 'ahmed@example.com',
      phone: '01098765432',
      parentPhone: '01198765432',
      password: 'user123',
      role: 'user',
      emailVerified: true,
      active: true,
    },
    {
      name: 'سارة علي',
      email: 'sara@example.com',
      phone: '01055554444',
      parentPhone: '01155554444',
      password: 'user123',
      role: 'user',
      emailVerified: true,
      active: true,
    },
  ];

  const users = [];

  for (const userData of usersData) {
    const user = await User.create(userData);
    users.push(user);
  }

  console.log(`✅ Created ${users.length} users\n`);
  return users;
};

const seedStudentLessons = async (users, lessons) => {
  console.log('🎓 Creating student lesson access records...');

  const students = users.filter((user) => user.role === 'user');
  const targetLessons = lessons.slice(0, Math.min(8, lessons.length));
  const studentLessons = [];

  for (const student of students) {
    for (const lesson of targetLessons) {
      const studentLesson = await StudentLesson.create({
        userId: student._id,
        lessonId: lesson._id,
        hasAccess: true,
        purchaseDate: new Date(),
        purchasePrice: lesson.isPremium ? lesson.price : 0,
        purchaseCurrency: 'EGP',
        accessCount: 1,
        refreshCount: 0,
        lastAccess: new Date(),
        watchPercentage: Math.floor(45 + Math.random() * 50),
        completed: false,
      });

      studentLessons.push(studentLesson);
    }
  }

  console.log(`✅ Created ${studentLessons.length} student lesson records\n`);
  return studentLessons;
};

const verifyRelationships = async () => {
  console.log('🔍 Verifying relationships...');

  const populatedLesson = await Lesson.findOne()
    .populate('sectionId', 'name gradeId subjectId order')
    .populate('quizId', 'title lessonId')
    .populate('assignmentId', 'title lessonId')
    .lean();

  const populatedQuiz = await Quiz.findOne()
    .populate('lessonId', 'title sectionId quizId assignmentId')
    .lean();

  const populatedStudentLesson = await StudentLesson.findOne()
    .populate('userId', 'name email role')
    .populate('lessonId', 'title sectionId quizId assignmentId')
    .lean();

  console.log('\n📌 Lesson with populated section/quiz/assignment:');
  console.log(JSON.stringify(populatedLesson, null, 2));

  console.log('\n📌 Quiz with populated lesson:');
  console.log(JSON.stringify(populatedQuiz, null, 2));

  console.log('\n📌 StudentLesson with populated user and lesson:');
  console.log(JSON.stringify(populatedStudentLesson, null, 2));
};

const seed = async () => {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(process.env.DB_URI, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });
    console.log('✅ Connected to MongoDB\n');

    await cleanDatabase();

    const grades = await seedGrades();
    const subject = await seedSubject(grades[0]);
    const sections = await seedSections(grades, subject);
    const lessons = await seedLessons(sections);
    const quizzes = await seedQuizzes(lessons);
    const assignments = await seedAssignments(lessons);
    const users = await seedUsers();
    const studentLessons = await seedStudentLessons(users, lessons);

    await verifyRelationships();

    console.log('\n' + '='.repeat(60));
    console.log('📊 SEEDING SUMMARY');
    console.log('='.repeat(60));
    console.log(`✅ Grades created: ${grades.length}`);
    console.log('✅ Subject created: 1');
    console.log(`✅ Sections created: ${sections.length}`);
    console.log(`✅ Lessons created: ${lessons.length}`);
    console.log(`✅ Quizzes created: ${quizzes.length}`);
    console.log(`✅ Assignments created: ${assignments.length}`);
    console.log(`✅ Users created: ${users.length}`);
    console.log(`✅ StudentLessons created: ${studentLessons.length}`);
    console.log('='.repeat(60));
    console.log('✅ Database seeding completed successfully!\n');

    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error during seeding:', error.message);
    console.error(error);

    try {
      await mongoose.disconnect();
    } catch (disconnectError) {
      console.error('❌ Error during MongoDB disconnect:', disconnectError.message);
    }

    process.exit(1);
  }
};

seed();
