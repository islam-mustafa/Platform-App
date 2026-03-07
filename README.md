# Complete Production-Level User & Admin Management System

A robust, production-ready authentication and user management system built with Node.js, Express, MongoDB, and JWT tokens.

## 🚀 Features

### Authentication System
- ✅ **JWT Access & Refresh Tokens** with automatic rotation
- ✅ **User Signup** with email verification
- ✅ **User Login** with security checks
- ✅ **Logout** (single device & all devices)
- ✅ **Token Refresh** with rotation security pattern
- ✅ **Email Verification** system
- ✅ **Forgot Password** with 6-digit reset code
- ✅ **Reset Password** functionality

### User Features
- ✅ **Profile Management** (view, update)
- ✅ **Password Change** with validation
- ✅ **Profile Image Upload** with Sharp processing (600x600 JPEG) + Cloudinary storage
- ✅ **Account Deactivation**

### Admin Features
- ✅ **User Management** (CRUD operations)
- ✅ **Pagination & Filtering** for user lists
- ✅ **Ban/Unban Users**
- ✅ **Create Admin Accounts**
- ✅ **Role-Based Authorization**

### Security Features
- ✅ **bcrypt Password Hashing** (12 rounds)
- ✅ **JWT Verification Middleware**
- ✅ **Role-Based Access Control**
- ✅ **Ban & Deactivation Checks**
- ✅ **Super Admin Role** (level 2)
- ✅ **Admin Protection** (admins cannot control other admins)
- ✅ **Self-ban Prevention**
- ✅ **Base Service Factory Pattern**
- ✅ **Refresh Token Rotation** (prevents replay attacks)
- ✅ **Automatic Token Cleanup** (TTL indexes)

### Validation
- ✅ **Express-Validator** integration
- ✅ **Email Uniqueness** validation
- ✅ **Password Confirmation** matching
- ✅ **Phone Number Format** validation (Egyptian & Saudi)
- ✅ **MongoDB ObjectId** validation

## 📋 Tech Stack

- **Backend:** Node.js, Express.js 5.2.1
- **Database:** MongoDB with Mongoose 9.2.1
- **Authentication:** JWT (jsonwebtoken 9.0.3)
- **Password Hashing:** bcryptjs 3.0.3
- **Validation:** express-validator 7.3.1
- **File Upload:** Multer 2.1.0 + Sharp 0.34.5
- **Image Hosting:** Cloudinary 2.9.0
- **Email:** Nodemailer 8.0.1
- **Architecture:** MVC Pattern

## 🏗️ Project Structure

```
Platform/
├── config/
│   └── database.js              # MongoDB connection
├── controllers/
│   ├── authController.js        # Auth controller
│   └── userController.js        # User controller
├── middlewares/
│   ├── errorMiddleware.js       # Global error handler
│   ├── uploadImageMiddleware.js # Multer + Cloudinary configuration
│   └── validatorMiddleware.js   # Validation middleware
├── models/
│   ├── userModel.js             # User schema (with super_admin role)
│   └── refreshTokenModel.js     # Refresh token schema
├── routes/
│   ├── authRoute.js             # Auth routes
│   ├── userRoute.js             # User & admin routes
│   └── index.js                 # Routes index
├── services/
│   ├── authService.js           # Auth business logic
│   ├── baseService.js           # Base CRUD service (Factory Pattern)
│   └── userService.js           # User business logic
├── utils/
│   ├── apiError.js              # Custom error class
│   ├── apiFeatures.js           # Pagination & filtering
│   ├── createToken.js           # JWT token generation
│   ├── sanitizeData.js           # Response sanitization
│   ├── sendEmail.js             # Email utility
│   ├── constants.js             # Role constants & shared values
│   ├── cloudinary.js            # Cloudinary image service
│   ├── validators/
│   │   ├── authValidator.js    # Auth validation rules
│   │   └── userValidator.js     # User validation rules
├── validators/
│   ├── authValidator.js         # Auth validators
│   └── userValidator.js         # User validators
├── public/
│   ├── activation-success.html  # Email verification success page
│   └── verify-email.html        # Email verification page
├── config.env                   # Environment variables
├── package.json                 # Dependencies
├── server.js                    # Express app entry point
├── API_DOCUMENTATION.md         # Complete API docs
├── QUICK_START.md              # Quick start guide
├── SUMMARY.md                  # Implementation summary
├── BEFORE_AFTER_COMPARISON.md  # Code changes comparison
├── routes-doc.json             # Routes documentation JSON
└── README.md                    # This file
```

## 🚦 Quick Start

### Prerequisites
- Node.js installed
- MongoDB Atlas account or local MongoDB
- Gmail account (for email features)
- Cloudinary account (for image hosting)

### Installation

1. **Clone the repository**
```
bash
git clone <repository-url>
cd Platform
```

2. **Install dependencies**
```
bash
npm install
```

3. **Configure environment variables**

Update `config.env`:
```
env
PORT=3000
DB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/?appName=Cluster0

JWT_SECRET_KEY=your-secret-key-here
JWT_EXPIRE_TIME=15m
JWT_REFRESH_SECRET=your-refresh-secret-key-here
JWT_REFRESH_EXPIRE_TIME=1d

EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_VERIFICATION_REQUIRED=false

# Cloudinary
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

4. **Start the server**
```
bash
npm run dev
```

Server runs on `http://localhost:3000`

## 📚 Documentation

- **[API Documentation](API_DOCUMENTATION.md)** - Complete API reference with 22+ endpoints
- **[Quick Start Guide](QUICK_START.md)** - Step-by-step setup and testing guide
- **[Implementation Summary](SUMMARY.md)** - Detailed implementation checklist
- **[Code Changes](BEFORE_AFTER_COMPARISON.md)** - Before & after code comparison

## 🔌 API Endpoints

### Authentication (9 endpoints)
- `POST /api/v1/auth/signup` - Register new user
- `POST /api/v1/auth/login` - Login user
- `POST /api/v1/auth/refresh` - Refresh access token
- `POST /api/v1/auth/logout` - Logout from device
- `POST /api/v1/auth/logoutAll` - Logout from all devices
- `GET /api/v1/auth/verifyEmail/:token` - Verify email
- `POST /api/v1/auth/forgotPassword` - Request password reset
- `POST /api/v1/auth/verifyResetCode` - Verify reset code
- `PUT /api/v1/auth/resetPassword` - Reset password

### User Profile (5 endpoints)
- `GET /api/v1/users/me` - Get profile
- `PUT /api/v1/users/me` - Update profile
- `PUT /api/v1/users/me/change-password` - Change password
- `PUT /api/v1/users/me/image` - Upload profile image
- `DELETE /api/v1/users/me` - Deactivate account

### Admin (8 endpoints)
- `GET /api/v1/users` - Get all users (paginated)
- `GET /api/v1/users/:id` - Get single user
- `POST /api/v1/users` - Create user
- `POST /api/v1/users/admin` - Create admin
- `PUT /api/v1/users/:id` - Update user
- `DELETE /api/v1/users/:id` - Delete user
- `PATCH /api/v1/users/:id/ban` - Ban user
- `PATCH /api/v1/users/:id/unban` - Unban user
- `PATCH /api/v1/users/:id/toggle-ban` - Toggle ban status

### Super Admin Only (3 endpoints)
- `POST /api/v1/users/admin` - Create new admin
- `DELETE /api/v1/users/admin/:id` - Delete admin
- `GET /api/v1/users?role=admin` - Get all admins (with filter)

## 🔐 Security Best Practices

### Implemented
- ✅ Password hashing with bcrypt (12 rounds)
- ✅ JWT token-based authentication
- ✅ Refresh token rotation on every refresh
- ✅ Automatic cleanup of expired tokens (TTL indexes)
- ✅ Role-based access control
- ✅ Ban/deactivation checks
- ✅ Email verification requirement
- ✅ Input validation on all endpoints
- ✅ Password change invalidates old tokens

### Recommended for Production
- [ ] Rate limiting (express-rate-limit)
- [ ] Helmet.js for security headers
- [ ] CORS whitelist configuration
- [ ] HTTPS enforcement
- [ ] Request logging (Morgan)
- [ ] Error tracking (Sentry)
- [ ] File upload size limits
- [ ] MongoDB connection encryption

## 🧪 Testing

### Manual Testing with Postman

1. **Import collection** from API_DOCUMENTATION.md
2. **Set environment variables:**
   - `baseUrl`: http://localhost:3000/api/v1
   - `accessToken`: (set after login)
   - `refreshToken`: (set after login)

3. **Test authentication flow:**
   
```
   Signup → Verify Email → Login → Get Profile → Refresh Token
   
```

4. **Test admin features:**
   
```
   Create Admin → Login as Admin → Get Users → Ban User
   
```

### Automated Testing (Recommended)
```
bash
# Install testing dependencies
npm install --save-dev jest supertest

# Run tests
npm test
```

## 📦 Dependencies

```
json
{
  "bcryptjs": "^3.0.3",
  "cloudinary": "^2.9.0",
  "cors": "^2.8.6",
  "crypto": "^1.0.1",
  "dotenv": "^17.3.1",
  "express": "^5.2.1",
  "express-async-handler": "^1.2.0",
  "express-validator": "^7.3.1",
  "jsonwebtoken": "^9.0.3",
  "mongoose": "^9.2.1",
  "multer": "^2.1.0",
  "multer-storage-cloudinary": "^4.0.0",
  "nodemailer": "^8.0.1",
  "nodemon": "^3.1.14",
  "sharp": "^0.34.5",
  "streamifier": "^0.1.1",
  "uuid": "^13.0.0"
}
```

## 🔄 Token Flow

### Login Flow
1. User logs in with email/password
2. Server validates credentials
3. Server generates access token (15 min) and refresh token (1 day)
4. Refresh token stored in database
5. Both tokens returned to client

### Refresh Flow
1. Client sends refresh token
2. Server validates token from database
3. Server deletes old refresh token (rotation)
4. Server generates new access token and refresh token
5. Both tokens returned to client

### Logout Flow
1. Client sends refresh token
2. Server deletes refresh token from database
3. Access token remains valid until expiry (15 min)

## 🛠️ Development

### Start development server
```
bash
npm run dev
```

### Generate JWT secrets
```
bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

## 🚀 Deployment

### Environment Setup
1. Set `NODE_ENV=production`
2. Use strong JWT secrets
3. Configure MongoDB Atlas
4. Set up email service
5. Configure Cloudinary
6. Enable HTTPS
7. Configure CORS

### Deployment Platforms
- AWS (EC2, Elastic Beanstalk)
- Heroku
- DigitalOcean
- Vercel (serverless)
- Railway

## 📄 License

MIT License

## 👥 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## 📞 Support

For issues or questions:
1. Check [API Documentation](API_DOCUMENTATION.md)
2. Check [Quick Start Guide](QUICK_START.md)
3. Check [Implementation Summary](SUMMARY.md)
4. Review error messages in console
5. Verify environment variables

## ✨ Status

**Current Version:** 2.0.0  
**Status:** ✅ Production Ready  
**Last Updated:** March 2026  
**New Features:**
- ✅ Super Admin role
- ✅ Enhanced Admin protection system
- ✅ Toggle ban endpoint
- ✅ Base Service Factory (CRUD Pattern)
- ✅ Enhanced permissions matrix

---

**Built with ❤️ using Node.js, Express, and MongoDB**
