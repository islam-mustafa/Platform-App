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

// Load environment variables
dotenv.config({ path: "config.env" });

// Initialize express app
const app = express();

// Enable CORS for all routes
app.use(cors());

// Body parser (JSON requests)
app.use(express.json());
app.use(express.static('public'));

// ✅ Middleware للاتصال بقاعدة البيانات (مهم لـ Vercel)
app.use(async (req, res, next) => {
  try {
    await dbConnection();
    next();
  } catch (error) {
    console.error('Database connection failed:', error);
    next(new ApiError('Database connection failed', 500));
  }
});

// Example route
app.get("/", (req, res) => {
  res.send("Server is running...");
});

// Health check endpoint (مهم لـ Vercel)
app.get("/api/health", (req, res) => {
  res.status(200).json({ 
    status: "OK", 
    message: "Server is healthy",
    time: new Date().toISOString()
  });
});

// Mount routes
app.use("/api/v1/auth", authRoute);
app.use("/api/v1/grades", gradeRoute);
app.use("/api/v1/users", userRoute);
app.use('/api/v1/subjects', subjectRoute);
app.use('/api/v1/sections', sectionRoute);
app.use('/api/v1/lessons', lessonRoute);

// Handle all undefined routes (Catch-all)
app.use((req, res, next) => {
  next(new ApiError(`Can't find this route: ${req.originalUrl}`, 400));
});

// Global error handling middleware
app.use(globalError);

// Start server - modified for Vercel
const PORT = process.env.PORT || 8000;

// فقط للتشغيل المحلي (مش على Vercel)
if (process.env.NODE_ENV !== 'production') {
  const server = app.listen(PORT, () => {
    console.log(`App running on port ${PORT}`);
  });

  // Handle unhandled promise rejections (للتشغيل المحلي فقط)
  process.on("unhandledRejection", (err) => {
    console.error(`UnhandledRejection Error: ${err.name} | ${err.message}`);
    server.close(() => {
      console.error("Shutting down...");
      process.exit(1);
    });
  });
}

// للـ Vercel - لازم نعمل export للتطبيق
module.exports = app;