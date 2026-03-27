// scripts/migrateVideos.js
const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config({ path: '../config.env' });

const Lesson = require('../models/lessonModel');

const migrateVideos = async () => {
  try {
    await mongoose.connect(process.env.DB_URI);
    console.log('✅ Connected to database');

    // 1) جلب كل الدروس اللي عندها video (قديم) ومفيش videos
    const lessons = await Lesson.find({
      video: { $exists: true, $ne: null },
      $or: [
        { videos: { $exists: false } },
        { videos: { $size: 0 } }
      ]
    });

    console.log(`📊 Found ${lessons.length} lessons to migrate`);

    for (const lesson of lessons) {
      if (lesson.video && lesson.video.publicId) {
        // نقل الفيديو القديم للمصفوفة الجديدة
        lesson.videos = [{
          publicId: lesson.video.publicId,
          hlsUrl: lesson.video.hlsUrl,
          mp4Url: lesson.video.mp4Url,
          duration: lesson.video.duration || 0,
          thumbnail: lesson.video.thumbnail || null,
          title: 'فيديو 1',
          order: 1
        }];
        
        // اختياري: نشيل الحقل القديم
        // lesson.video = undefined;
        
        await lesson.save();
        console.log(`✅ Migrated lesson: ${lesson._id}`);
      }
    }

    console.log('🎉 Migration completed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

migrateVideos();
