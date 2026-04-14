const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../config.env') });

const Grade = require(path.join(__dirname, '../models/gradeModel'));
const Subject = require(path.join(__dirname, '../models/subjectModel'));
const Section = require(path.join(__dirname, '../models/sectionModel'));
const Lesson = require(path.join(__dirname, '../models/lessonModel'));
const Quiz = require(path.join(__dirname, '../models/quizModel'));
const User = require(path.join(__dirname, '../models/userModel'));
const StudentLesson = require(path.join(__dirname, '../models/studentLessonModel'));
async function checkData() {
  try {
    await mongoose.connect(process.env.DB_URI, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });
    
    console.log('\n📊 DATABASE STATISTICS\n');
    
    const gradesCount = await Grade.countDocuments();
    console.log(`Grades: ${gradesCount}`);
    
    const subjectsCount = await Subject.countDocuments();
    console.log(`Subjects: ${subjectsCount}`);
    
    const sectionsCount = await Section.countDocuments();
    console.log(`Sections: ${sectionsCount}`);
    
    const lessonsCount = await Lesson.countDocuments();
    console.log(`Lessons: ${lessonsCount}`);
    
    const quizzesCount = await Quiz.countDocuments();
    console.log(`Quizzes: ${quizzesCount}`);
    
    const usersCount = await User.countDocuments();
    console.log(`Users: ${usersCount}`);
    
    const studentLessonsCount = await StudentLesson.countDocuments();
    console.log(`StudentLessons: ${studentLessonsCount}`);
    
    console.log('\n📋 SAMPLE DATA\n');
    
    // First grade
    const firstGrade = await Grade.findOne().sort({ level: 1 });
    console.log(`✅ First Grade: ${firstGrade?.name} (Level: ${firstGrade?.level})`);
    
    // Subject
    const subject = await Subject.findOne();
    console.log(`✅ Subject: ${subject?.name}`);
    
    // First section
    const firstSection = await Section.findOne().populate('gradeId', 'name');
    console.log(`✅ First Section: ${firstSection?.name} - Grade: ${firstSection?.gradeId?.name}`);
    
    // First lesson
    const firstLesson = await Lesson.findOne().populate('sectionId', 'name');
    console.log(`✅ First Lesson: ${firstLesson?.title} (Section: ${firstLesson?.sectionId?.name})`);
    console.log(`   - Premium: ${firstLesson?.isPremium}, Price: ${firstLesson?.price}`);
    
    // First quiz
    const firstQuiz = await Quiz.findOne().populate('lessonId', 'title');
    console.log(`✅ First Quiz: ${firstQuiz?.title}`);
    console.log(`   - Questions: ${firstQuiz?.questions?.length}`);
    
    // Users
    const admin = await User.findOne({ role: 'admin' });
    const student = await User.findOne({ role: 'user' });
    console.log(`✅ Admin User: ${admin?.name} (${admin?.email})`);
    console.log(`✅ Student User: ${student?.name} (${student?.email})`);
    
    console.log('\n✅ Database verification completed!\n');
    
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    await mongoose.disconnect();
    process.exit(1);
  }
}

checkData();
