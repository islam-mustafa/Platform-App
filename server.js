const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");

const ApiError = require("./utils/apiError");
const { globalError } = require("./middlewares/errorMiddleware");
const dbConnection = require("./config/database");
const authRoute = require("./routes/authRoute");
const userRoute = require("./routes/userRoute");

// Load environment variables
dotenv.config({ path: "config.env" });

// Connect to MongoDB
dbConnection();

// Initialize express app
const app = express();

// Enable CORS for all routes
app.use(cors());

// Body parser (JSON requests)
app.use(express.json());
app.use(express.static('public')); // عشان يقرا ملفات HTML من مجلد public
// Example route
app.get("/", (req, res) => {
  res.send("Server is running...");
});

// Mount routes
app.use("/api/v1/auth", authRoute);
app.use("/api/v1/users", userRoute);

// Handle all undefined routes (Catch-all)
app.use((req, res, next) => {
  next(new ApiError(`Can't find this route: ${req.originalUrl}`, 400));
});

// Global error handling middleware
app.use(globalError);

// Start server
const PORT = process.env.PORT || 8000;
const server = app.listen(PORT, () => {
  console.log(`App running on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (err) => {
  console.error(`UnhandledRejection Error: ${err.name} | ${err.message}`);
  server.close(() => {
    console.error("Shutting down...");
    process.exit(1);
  });
});
