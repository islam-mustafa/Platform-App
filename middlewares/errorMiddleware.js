const ApiError = require('../utils/apiError');

// AsyncHandler middleware to wrap async functions and catch errors
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

const sendErrorForDev = (err, res) =>
  res.status(err.statusCode).json({
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack,
  });

const sendErrorForProd = (err, res) =>
  res.status(err.statusCode).json({
    status: err.status,
    message: err.message,
  });

const handleJwtInvalidSignature = () =>
  // control error in production mode
  new ApiError('Invalid token, please login again..', 401);

const handleJwtExpired = () =>
  new ApiError('Expired token, please login again..', 401);

// Global error middleware MUST have 4 parameters: err, req, res, next
// Express requires this signature to recognize it as an error handler
const globalError = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';
  if (process.env.NODE_ENV === 'development') {
    sendErrorForDev(err, res);
  } else {
    if (err.name === 'JsonWebTokenError') err = handleJwtInvalidSignature();
    if (err.name === 'TokenExpiredError') err = handleJwtExpired();
    sendErrorForProd(err, res);
  }
};

module.exports = { asyncHandler, globalError };

