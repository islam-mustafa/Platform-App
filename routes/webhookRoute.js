const express = require('express');
const router = express.Router();
const Lesson = require('../models/lessonModel');

// Cloudinary -> Hookdeck -> local server
router.post('/webhooks/eager-complete', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const body = req.body.toString('utf8');
    const payload = JSON.parse(body);

    const publicId = payload.public_id || payload?.data?.public_id;

    if (!publicId) {
      console.log('⚠️ Webhook received without public_id');
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
    console.error('❌ Error processing webhook:', error);
    return res.status(500).json({ status: 'error', message: error.message });
  }
});

module.exports = router;