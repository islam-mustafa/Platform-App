const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../config.env') });

const Assignment = require(path.join(__dirname, '../models/assignmentModel'));
const Submission = require(path.join(__dirname, '../models/submissionModel'));

async function migrateAttachments() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(process.env.DB_URI, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });
    console.log('✅ Connected to MongoDB\n');

    // ==================== Migrate Assignments ====================
    console.log('📝 Migrating Assignment attachments...');
    
    const assignments = await Assignment.find({
      attachments: { $exists: true, $ne: [] }
    });
    
    let migratedCount = 0;
    for (const assignment of assignments) {
      // Check if attachments are already in new format
      if (assignment.attachments.length > 0 && typeof assignment.attachments[0] === 'object') {
        // Already in new format
        continue;
      }
      
      const newAttachments = [];
      for (const urlString of assignment.attachments) {
        if (typeof urlString === 'string') {
          // Extract filename and extension from URL
          let fullName = urlString.split('/').pop().split('?')[0];
          try {
            fullName = decodeURIComponent(fullName);
          } catch (e) {}
          
          // Extract extension from URL
          const urlParts = urlString.split('.');
          const extension = urlParts.length > 1 ? urlParts[urlParts.length - 1].split('?')[0].toLowerCase() : 'pdf';
          
          // Determine filename without extension
          let filename = fullName;
          if (fullName.endsWith(`.${extension}`)) {
            filename = fullName.substring(0, fullName.lastIndexOf('.'));
          }
          
          // MIME types mapping
          const mimeTypes = {
            'pdf': 'application/pdf',
            'doc': 'application/msword',
            'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'jpg': 'image/jpeg',
            'jpeg': 'image/jpeg',
            'png': 'image/png',
            'gif': 'image/gif',
            'zip': 'application/zip'
          };
          
          const mimeType = mimeTypes[extension] || 'application/octet-stream';
          
          newAttachments.push({
            filename: filename,
            extension: extension,
            mimeType: mimeType,
            url: urlString,
            publicId: fullName.replace(/\.[^/.]+$/, ''),
            uploadedAt: new Date()
          });
        }
      }
      
      if (newAttachments.length > 0) {
        assignment.attachments = newAttachments;
        await assignment.save();
        migratedCount++;
        console.log(`  ✅ Migrated assignment: ${assignment._id}`);
      }
    }
    
    console.log(`✅ Migrated ${migratedCount} assignments\n`);

    // ==================== Migrate Submissions ====================
    console.log('📬 Migrating Submission attachments...');
    
    const submissions = await Submission.find({
      attachments: { $exists: true, $ne: [] }
    });
    
    migratedCount = 0;
    for (const submission of submissions) {
      // Check if attachments are already in new format
      if (submission.attachments.length > 0 && typeof submission.attachments[0] === 'object') {
        // Already in new format
        continue;
      }
      
      const newAttachments = [];
      for (const urlString of submission.attachments) {
        if (typeof urlString === 'string') {
          // Extract filename and extension from URL
          let fullName = urlString.split('/').pop().split('?')[0];
          try {
            fullName = decodeURIComponent(fullName);
          } catch (e) {}
          
          // Extract extension from URL
          const urlParts = urlString.split('.');
          const extension = urlParts.length > 1 ? urlParts[urlParts.length - 1].split('?')[0].toLowerCase() : 'pdf';
          
          // Determine filename without extension
          let filename = fullName;
          if (fullName.endsWith(`.${extension}`)) {
            filename = fullName.substring(0, fullName.lastIndexOf('.'));
          }
          
          // MIME types mapping
          const mimeTypes = {
            'pdf': 'application/pdf',
            'doc': 'application/msword',
            'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'jpg': 'image/jpeg',
            'jpeg': 'image/jpeg',
            'png': 'image/png',
            'gif': 'image/gif',
            'zip': 'application/zip'
          };
          
          const mimeType = mimeTypes[extension] || 'application/octet-stream';
          
          newAttachments.push({
            filename: filename,
            extension: extension,
            mimeType: mimeType,
            url: urlString,
            publicId: fullName.replace(/\.[^/.]+$/, ''),
            uploadedAt: new Date()
          });
        }
      }
      
      if (newAttachments.length > 0) {
        submission.attachments = newAttachments;
        await submission.save();
        migratedCount++;
        console.log(`  ✅ Migrated submission: ${submission._id}`);
      }
    }
    
    console.log(`✅ Migrated ${migratedCount} submissions\n`);

    // Summary
    console.log('='.repeat(50));
    console.log('📊 MIGRATION SUMMARY');
    console.log('='.repeat(50));
    console.log(`✅ Total assignments migrated: Check above`);
    console.log(`✅ Total submissions migrated: Check above`);
    console.log('='.repeat(50));
    console.log('✅ Migration completed successfully!\n');

    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Error during migration:', error.message);
    console.error(error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

// Run Migration
migrateAttachments();
