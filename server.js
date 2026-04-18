const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");

const ApiError = require("./utils/apiError");
const { globalError } = require("./middlewares/errorMiddleware");
const dbConnection = require("./config/database");
const authRoute = require("./routes/authRoute");
const gradeRoute = require('./routes/gradeRoute');
const userRoute = require("./routes/userRoute");
const subjectRoute = require('./routes/subjectRoute');
const sectionRoute = require('./routes/sectionRoute');
const lessonRoute = require('./routes/lessonRoute');
const webhookRoute = require('./routes/webhookRoute');
const quizRoute = require('./routes/quizRoute');
const assignmentRoute = require('./routes/assignmentRoute');
const paymentRoute = require('./routes/paymentRoute');

// Load environment variables
dotenv.config({ path: "config.env" });

// Initialize express app
const app = express();

// Enable CORS for all routes
app.use(cors());

// ============================================================
// ✅ TEST Webhook endpoint (مباشرة في server.js)
// ============================================================
app.post('/webhooks/test/success', express.json(), async (req, res) => {
  console.log('🧪 TEST: Webhook reached directly in server.js');
  console.log('Body:', req.body);
  
  const { orderId } = req.body;
  
  if (!orderId) {
    return res.status(400).json({ error: 'orderId is required' });
  }
  
  try {
    await dbConnection();
    
    const paymentService = require('./services/paymentService');
    const StudentLesson = require('./models/studentLessonModel');
    
    const result = await paymentService.mockSuccessfulPayment(orderId);
    
    if (result && result.userId && result.lessonId) {
      await StudentLesson.findOneAndUpdate(
        { userId: result.userId, lessonId: result.lessonId },
        {
          hasAccess: true,
          purchaseDate: new Date(),
          purchasePrice: result.amount,
          purchaseCurrency: 'EGP'
        },
        { upsert: true }
      );
      console.log(`✅ StudentLesson updated for user ${result.userId}, lesson ${result.lessonId}`);
    }
    
    res.status(200).json({ success: true, message: 'Mock payment processed', data: result });
  } catch (error) {
    console.error('Error in test webhook:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================
// ✅ Webhook routes (مهم جداً: تكون قبل express.json)
// ============================================================
app.use('/', webhookRoute);

// ============================================================
// ✅ Body parsers (بعد الـ webhook)
// ============================================================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ============================================================
// ✅ Routes العامة (صحة السيرفر)
// ============================================================
app.get("/", (req, res) => {
  res.send("Server is running...");
});

app.get("/api/health", (req, res) => {
  res.status(200).json({ 
    status: "OK", 
    message: "Server is healthy",
    time: new Date().toISOString()
  });
});

// ============================================================
// ✅ API Routes
// ============================================================
app.use("/api/v1/auth", authRoute);
app.use("/api/v1/grades", gradeRoute);
app.use("/api/v1/users", userRoute);
app.use('/api/v1/subjects', subjectRoute);
app.use('/api/v1/sections', sectionRoute);
app.use('/api/v1/lessons', lessonRoute);
app.use('/api/v1', quizRoute);
app.use('/api/v1', assignmentRoute);
app.use('/api/v1/payment', paymentRoute);

// ============================================================
// ✅ معالجة المسارات غير المعروفة (404)
// ============================================================
app.use((req, res, next) => {
  next(new ApiError(`Can't find this route: ${req.originalUrl}`, 400));
});

// ============================================================
// ✅ Global error handling middleware
// ============================================================
app.use(globalError);

// ============================================================
// ✅ تشغيل السيرفر (اتصال واحد بقاعدة البيانات)
// ============================================================
const PORT = process.env.PORT || 8000;

const startServer = async () => {
  try {
    // اتصال واحد بقاعدة البيانات قبل تشغيل السيرفر
    await dbConnection();
    console.log('✅ Database connected successfully');
    
    const server = app.listen(PORT, () => {
      console.log(`✅ App running on port ${PORT}`);
      console.log(`📍 Health check: http://localhost:${PORT}/api/health`);
      console.log(`📍 Webhook endpoint: http://localhost:${PORT}/webhooks/paymob`);
    });

    // Handle unhandled promise rejections
    process.on("unhandledRejection", (err) => {
      console.error(`❌ UnhandledRejection Error: ${err.name} | ${err.message}`);
      server.close(() => {
        console.error("Shutting down...");
        process.exit(1);
      });
    });
    
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

// ============================================================
// ✅ للـ Vercel
// ============================================================
module.exports = app;