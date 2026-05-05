# API Documentation

This document describes the actual endpoint structure used in the current codebase for the requested route files.

## Common Headers

- `Content-Type: application/json` for JSON requests.
- `Authorization: Bearer <token>` for protected endpoints.
- `idempotency-key: <unique-string>` for payment checkout.
- `Content-Type: multipart/form-data` for upload endpoints.

## Auth Routes

### POST /api/v1/auth/signup
- Description: Create a new user account and return tokens. In dev mode, the user is auto-verified.
- Request headers: `Content-Type: application/json`
- Request body:
```json
{
  "name": "Ahmed Ali",
  "email": "ahmed@example.com",
  "phone": "01234567890",
  "parentPhone": "01122334455",
  "password": "123456",
  "passwordConfirm": "123456"
}
```
- Response example:
```json
{
  "status": "success",
  "message": "User created successfully (dev mode)",
  "data": {
    "_id": "user_id",
    "name": "Ahmed Ali",
    "email": "ahmed@example.com",
    "phone": "01234567890",
    "parentPhone": "01122334455",
    "role": "user"
  },
  "tokens": {
    "accessToken": "<access_token>",
    "refreshToken": "<refresh_token>"
  }
}
```
- Authentication required?: No

### POST /api/v1/auth/login
- Description: Authenticate a user and return access and refresh tokens.
- Request headers: `Content-Type: application/json`
- Request body:
```json
{
  "email": "ahmed@example.com",
  "password": "123456"
}
```
- Response example:
```json
{
  "status": "success",
  "data": {
    "_id": "user_id",
    "name": "Ahmed Ali",
    "email": "ahmed@example.com",
    "role": "user"
  },
  "tokens": {
    "accessToken": "<access_token>",
    "refreshToken": "<refresh_token>"
  }
}
```
- Authentication required?: No

### POST /api/v1/auth/refresh
- Description: Exchange a valid refresh token for a new access token and refresh token.
- Request headers: `Content-Type: application/json`
- Request body:
```json
{
  "refreshToken": "<refresh_token>"
}
```
- Response example:
```json
{
  "status": "success",
  "tokens": {
    "accessToken": "<new_access_token>",
    "refreshToken": "<new_refresh_token>"
  }
}
```
- Authentication required?: No

### GET /api/v1/auth/verifyEmail/:token
- Description: Verify a user email using the email verification token.
- Request headers: None
- Request body: None
- Response example:
```json
{
  "status": "success",
  "message": "Email verified successfully"
}
```
- Authentication required?: No

### POST /api/v1/auth/forgotPassword
- Description: Generate and email a password reset code.
- Request headers: `Content-Type: application/json`
- Request body:
```json
{
  "email": "ahmed@example.com"
}
```
- Response example:
```json
{
  "status": "Success",
  "message": "Reset code sent to email"
}
```
- Authentication required?: No

### POST /api/v1/auth/verifyResetCode
- Description: Verify the password reset code before allowing password reset.
- Request headers: `Content-Type: application/json`
- Request body:
```json
{
  "resetCode": "123456"
}
```
- Response example:
```json
{
  "status": "success"
}
```
- Authentication required?: No

### PUT /api/v1/auth/resetPassword
- Description: Reset the password after the reset code has been verified.
- Request headers: `Content-Type: application/json`
- Request body:
```json
{
  "email": "ahmed@example.com",
  "newPassword": "newpass123",
  "passwordConfirm": "newpass123"
}
```
- Response example:
```json
{
  "status": "success",
  "tokens": {
    "accessToken": "<access_token>",
    "refreshToken": "<refresh_token>"
  }
}
```
- Authentication required?: No

### POST /api/v1/auth/logout
- Description: Revoke a single refresh token for the current user.
- Request headers: `Authorization: Bearer <token>`, `Content-Type: application/json`
- Request body:
```json
{
  "refreshToken": "<refresh_token>"
}
```
- Response example:
```json
{
  "status": "success",
  "message": "Logged out successfully"
}
```
- Authentication required?: Yes

### POST /api/v1/auth/logoutAll
- Description: Revoke all refresh tokens for the current user.
- Request headers: `Authorization: Bearer <token>`
- Request body: None
- Response example:
```json
{
  "status": "success",
  "message": "Logged out from all devices successfully"
}
```
- Authentication required?: Yes

## Payment Routes

### POST /api/v1/payment/checkout
- Description: Start a lesson purchase flow and return payment data depending on payment method.
- Request headers: `Authorization: Bearer <token>`, `Content-Type: application/json`, `idempotency-key: <unique-string>`
- Request body:
```json
{
  "lessonId": "lesson_id",
  "paymentMethod": "card",
  "couponCode": "SAVE10",
  "walletNumber": "01000000000"
}
```
- Response example:
```json
{
  "status": "success",
  "message": "Payment initiated",
  "data": {
    "paymentMethod": "card",
    "orderId": "123456",
    "transactionId": "transaction_id",
    "iframeUrl": "https://...",
    "appliedCoupon": {
      "couponId": "coupon_id",
      "code": "SAVE10",
      "discountType": "percentage",
      "discountValue": 10,
      "discountAmount": 20,
      "originalAmount": 200,
      "finalAmount": 180
    },
    "originalPrice": 200,
    "finalPrice": 180
  }
}
```
- Authentication required?: Yes

### GET /api/v1/payment/status/:orderId
- Description: Fetch the current status of a payment transaction owned by the authenticated user.
- Request headers: `Authorization: Bearer <token>`
- Request body: None
- Response example:
```json
{
  "status": "success",
  "data": {
    "status": "completed",
    "amount": 180,
    "createdAt": "2026-04-21T10:00:00.000Z",
    "completedAt": "2026-04-21T10:02:00.000Z",
    "paymentMethod": "card",
    "appliedCoupon": {
      "code": "SAVE10"
    }
  }
}
```
- Authentication required?: Yes

### GET /api/v1/payment/transactions
- Description: Return all payment transactions for the authenticated user.
- Request headers: `Authorization: Bearer <token>`
- Request body: None
- Response example:
```json
{
  "status": "success",
  "results": 2,
  "data": [
    {
      "_id": "transaction_id",
      "lessonId": {
        "_id": "lesson_id",
        "title": "Lesson title"
      },
      "amount": 180,
      "status": "completed"
    }
  ]
}
```
- Authentication required?: Yes

## Lesson Routes

### GET /api/v1/lessons
- Description: Return paginated lessons. Regular users see content filtered by access rules.
- Request headers: `Authorization: Bearer <token>`
- Request body: None
- Response example:
```json
{
  "status": "success",
  "results": 10,
  "paginationResult": {
    "currentPage": 1,
    "numberOfPages": 2
  },
  "data": []
}
```
- Authentication required?: Yes

### GET /api/v1/lessons/:id
- Description: Return one lesson. For users, premium text content is hidden.
- Request headers: `Authorization: Bearer <token>`
- Request body: None
- Response example:
```json
{
  "status": "success",
  "data": {
    "_id": "lesson_id",
    "title": "Lesson title"
  }
}
```
- Authentication required?: Yes

### GET /api/v1/lessons/:id/content
- Description: Return the full lesson content, quiz, and assignment data. May also return a processing state.
- Request headers: `Authorization: Bearer <token>`
- Request body: None
- Response example:
```json
{
  "status": "success",
  "data": {
    "_id": "lesson_id",
    "title": "Lesson title",
    "videos": []
  }
}
```
- Other possible response example:
```json
{
  "status": "processing",
  "message": "Video is still being processed. Please check back later.",
  "data": {}
}
```
- Authentication required?: Yes

### POST /api/v1/lessons/:id/refresh-token
- Description: Return a new authenticated video URL for the lesson video.
- Request headers: `Authorization: Bearer <token>`
- Request body: None
- Response example:
```json
{
  "status": "success",
  "video": {
    "hlsUrl": "https://..."
  }
}
```
- Authentication required?: Yes

### GET /api/v1/lessons/section/:sectionId
- Description: Return all lessons under a section.
- Request headers: `Authorization: Bearer <token>`
- Request body: None
- Response example:
```json
{
  "status": "success",
  "results": 3,
  "data": []
}
```
- Authentication required?: Yes

### POST /api/v1/lessons/:id/purchase
- Description: Mark a premium lesson as purchased for the current user.
- Request headers: `Authorization: Bearer <token>`
- Request body: None
- Response example:
```json
{
  "status": "success",
  "message": "Lesson purchased successfully"
}
```
- Authentication required?: Yes

### POST /api/v1/lessons/:id/upload-video
- Description: Upload a lesson video to Cloudinary.
- Request headers: `Authorization: Bearer <token>`, `Content-Type: multipart/form-data`
- Request body:
```json
{
  "title": "Optional video title"
}
```
File field: `videoFile`
- Response example:
```json
{
  "status": "accepted",
  "message": "Video uploaded successfully. It is being processed and will be available shortly.",
  "data": {
    "video": {
      "publicId": "lesson-...",
      "title": "Optional video title",
      "processingStatus": "processing",
      "thumbnail": "https://..."
    },
    "allVideos": []
  }
}
```
- Authentication required?: Yes

### DELETE /api/v1/lessons/:lessonId/videos/:videoIndex
- Description: Delete a specific video from a lesson and re-order the remaining videos.
- Request headers: `Authorization: Bearer <token>`
- Request body: None
- Response example:
```json
{
  "status": "success",
  "message": "Video deleted successfully",
  "data": {
    "remainingVideos": []
  }
}
```
- Authentication required?: Yes

### POST /api/v1/lessons
- Description: Create a lesson.
- Request headers: `Authorization: Bearer <token>`, `Content-Type: application/json`
- Request body:
```json
{
  "title": "Lesson title",
  "description": "Optional description",
  "sectionId": "section_id",
  "order": 1,
  "isPremium": true,
  "price": 100,
  "content": {
    "videoUrl": "https://example.com/video",
    "duration": 120
  }
}
```
- Response example:
```json
{
  "status": "success",
  "data": {
    "_id": "lesson_id",
    "title": "Lesson title"
  }
}
```
- Authentication required?: Yes

### PUT /api/v1/lessons/:id
- Description: Update a lesson.
- Request headers: `Authorization: Bearer <token>`, `Content-Type: application/json`
- Request body:
```json
{
  "title": "Updated lesson title",
  "price": 100,
  "isPremium": true
}
```
- Response example:
```json
{
  "status": "success",
  "data": {
    "_id": "lesson_id",
    "title": "Updated lesson title"
  }
}
```
- Authentication required?: Yes

### DELETE /api/v1/lessons/:id
- Description: Delete a lesson.
- Request headers: `Authorization: Bearer <token>`
- Request body: None
- Response example:
```json
HTTP 204 No Content
```
- Authentication required?: Yes

### PATCH /api/v1/lessons/:id/toggle
- Description: Toggle lesson active state.
- Request headers: `Authorization: Bearer <token>`
- Request body: None
- Response example:
```json
{
  "status": "success",
  "message": "Lesson activated successfully",
  "data": {
    "_id": "lesson_id",
    "isActive": true
  }
}
```
- Authentication required?: Yes

### POST /api/v1/lessons/reorder
- Description: Reorder lessons using an array of id/order pairs.
- Request headers: `Authorization: Bearer <token>`, `Content-Type: application/json`
- Request body:
```json
{
  "lessons": [
    { "id": "lesson_1", "order": 1 },
    { "id": "lesson_2", "order": 2 }
  ]
}
```
- Response example:
```json
{
  "status": "success",
  "message": "Lessons reordered successfully"
}
```
- Authentication required?: Yes

## Quiz Routes

### GET /api/v1/quiz/lesson/:lessonId
- Description: Return the quiz for a lesson. Regular users get a stripped-down quiz payload.
- Request headers: `Authorization: Bearer <token>`
- Request body: None
- Response example:
```json
{
  "status": "success",
  "data": {
    "_id": "quiz_id",
    "title": "Quiz title",
    "questions": []
  }
}
```
- Authentication required?: Yes

### POST /api/v1/quizzes/:quizId/attempt
- Description: Start a quiz attempt.
- Request headers: `Authorization: Bearer <token>`
- Request body: None
- Response example:
```json
{
  "status": "success",
  "data": {
    "_id": "attempt_id",
    "status": "in_progress"
  }
}
```
- Authentication required?: Yes

### POST /api/v1/attempts/:attemptId/submit-all
- Description: Submit all answers for an attempt.
- Request headers: `Authorization: Bearer <token>`, `Content-Type: application/json`
- Request body:
```json
{
  "answers": [
    {
      "questionId": "question_id",
      "answer": 0
    }
  ]
}
```
- Response example:
```json
{
  "status": "success",
  "data": {
    "score": 8,
    "totalPoints": 10,
    "percentage": 80,
    "passed": true,
    "timeSpent": 120,
    "answers": []
  }
}
```
- Authentication required?: Yes

### GET /api/v1/quizzes/:quizId/attempts
- Description: Return attempts for the authenticated user on a quiz.
- Request headers: `Authorization: Bearer <token>`
- Request body: None
- Response example:
```json
{
  "status": "success",
  "results": 1,
  "data": []
}
```
- Authentication required?: Yes

### POST /api/v1/quiz/lesson/:lessonId
- Description: Create a quiz for a lesson.
- Request headers: `Authorization: Bearer <token>`, `Content-Type: application/json`
- Request body:
```json
{
  "title": "Quiz title",
  "description": "Optional description",
  "timeLimit": 30,
  "passingScore": 70,
  "attemptsAllowed": 2,
  "questions": [
    {
      "questionText": "Question text",
      "type": "multiple_choice",
      "points": 1,
      "options": [
        { "text": "A", "isCorrect": true },
        { "text": "B", "isCorrect": false }
      ]
    }
  ]
}
```
- Response example:
```json
{
  "status": "success",
  "data": {
    "_id": "quiz_id",
    "title": "Quiz title"
  }
}
```
- Authentication required?: Yes

### GET /api/v1/quizzes
- Description: Return all quizzes.
- Request headers: `Authorization: Bearer <token>`
- Request body: None
- Response example:
```json
{
  "status": "success",
  "results": 3,
  "data": []
}
```
- Authentication required?: Yes

### GET /api/v1/quizzes/:id
- Description: Return a single quiz.
- Request headers: `Authorization: Bearer <token>`
- Request body: None
- Response example:
```json
{
  "status": "success",
  "data": {
    "_id": "quiz_id"
  }
}
```
- Authentication required?: Yes

### PUT /api/v1/quizzes/:id
- Description: Update a quiz.
- Request headers: `Authorization: Bearer <token>`, `Content-Type: application/json`
- Request body:
```json
{
  "title": "Updated quiz title",
  "passingScore": 80
}
```
- Response example:
```json
{
  "status": "success",
  "data": {
    "_id": "quiz_id"
  }
}
```
- Authentication required?: Yes

### DELETE /api/v1/quizzes/:id
- Description: Delete a quiz and its attempts.
- Request headers: `Authorization: Bearer <token>`
- Request body: None
- Response example:
```json
HTTP 204 No Content
```
- Authentication required?: Yes

### GET /api/v1/quizzes/:quizId/attempts/admin
- Description: Return all attempts for a quiz with stats for admins.
- Request headers: `Authorization: Bearer <token>`
- Request body: None
- Response example:
```json
{
  "status": "success",
  "stats": {
    "totalAttempts": 10,
    "completedAttempts": 8
  },
  "data": []
}
```
- Authentication required?: Yes

### GET /api/v1/attempts/:attemptId/details
- Description: Return detailed attempt data for admins.
- Request headers: `Authorization: Bearer <token>`
- Request body: None
- Response example:
```json
{
  "status": "success",
  "data": {
    "_id": "attempt_id",
    "detailedAnswers": []
  }
}
```
- Authentication required?: Yes

### PATCH /api/v1/attempts/:attemptId/extend
- Description: Extend a quiz attempt time for admins.
- Request headers: `Authorization: Bearer <token>`, `Content-Type: application/json`
- Request body:
```json
{
  "extraMinutes": 10
}
```
- Response example:
```json
{
  "status": "success",
  "message": "Attempt time extended by 10 minutes",
  "data": {
    "attemptId": "attempt_id",
    "newExpiry": "2026-04-21T10:30:00.000Z"
  }
}
```
- Authentication required?: Yes

### DELETE /api/v1/quizzes/:quizId/users/:userId/attempts
- Description: Reset completed and expired attempts for a user on a quiz.
- Request headers: `Authorization: Bearer <token>`, `Content-Type: application/json`
- Request body:
```json
{
  "newAttemptsAllowed": 3
}
```
- Response example:
```json
{
  "status": "success",
  "message": "Student attempts reset. Deleted 2 completed attempts.",
  "data": {
    "userId": "user_id",
    "quizId": "quiz_id",
    "newAttemptsAllowed": 3
  }
}
```
- Authentication required?: Yes

### PATCH /api/v1/quizzes/:quizId/attempts/extend-all
- Description: Extend all active attempts for a quiz.
- Request headers: `Authorization: Bearer <token>`, `Content-Type: application/json`
- Request body:
```json
{
  "extraMinutes": 10
}
```
- Response example:
```json
{
  "status": "success",
  "message": "Extended 4 active attempts by 10 minutes",
  "data": {
    "extendedCount": 4,
    "extendedAttempts": []
  }
}
```
- Authentication required?: Yes

### PATCH /api/v1/attempts/:attemptId/reactivate
- Description: Reactivate an expired attempt for admins.
- Request headers: `Authorization: Bearer <token>`, `Content-Type: application/json`
- Request body:
```json
{
  "extraMinutes": 5
}
```
- Response example:
```json
{
  "status": "success",
  "message": "Expired attempt reactivated. New expiry: 2026-04-21T10:30:00.000Z",
  "data": {
    "_id": "attempt_id"
  }
}
```
- Authentication required?: Yes

## Assignment Routes

### GET /api/v1/files/:publicId(*)
- Description: Redirect to a file stored in Cloudinary.
- Request headers: `Authorization: Bearer <token>`
- Request body: None
- Response example:
```http
HTTP 302 Found
Location: https://res.cloudinary.com/...
```
- Authentication required?: Yes

### GET /api/v1/my-assignments
- Description: Return the current user's assignments with submission status.
- Request headers: `Authorization: Bearer <token>`
- Request body: None
- Response example:
```json
{
  "status": "success",
  "results": 2,
  "data": []
}
```
- Authentication required?: Yes

### GET /api/v1/assignments/:assignmentId/my-submission
- Description: Return the current user's submission for one assignment.
- Request headers: `Authorization: Bearer <token>`
- Request body: None
- Response example:
```json
{
  "status": "success",
  "data": {
    "_id": "submission_id"
  }
}
```
- Authentication required?: Yes

### POST /api/v1/assignments/:assignmentId/submit
- Description: Submit an assignment and optionally upload attachments.
- Request headers: `Authorization: Bearer <token>`, `Content-Type: multipart/form-data`
- Request body:
```json
{
  "content": "My answer text"
}
```
File field: `attachments`
- Response example:
```json
{
  "status": "success",
  "message": "Assignment submitted successfully",
  "data": {
    "_id": "submission_id",
    "status": "submitted"
  }
}
```
- Authentication required?: Yes

### GET /api/v1/assignments/:assignmentId/download/:fileIndex
- Description: Redirect to a downloadable file URL for an assignment attachment.
- Request headers: `Authorization: Bearer <token>`
- Request body: None
- Response example:
```http
HTTP 302 Found
Location: https://res.cloudinary.com/...
```
- Authentication required?: Yes

### POST /api/v1/assignment/lesson/:lessonId
- Description: Create an assignment for a lesson.
- Request headers: `Authorization: Bearer <token>`, `Content-Type: multipart/form-data`
- Request body:
```json
{
  "title": "Homework 1",
  "description": "Optional description",
  "instructions": "Do this carefully",
  "dueDate": "2026-05-01T00:00:00.000Z",
  "submissionType": "file",
  "allowedFileTypes": "pdf,jpg",
  "maxFileSize": 10485760,
  "maxPoints": 100,
  "passingPoints": 60,
  "isActive": true
}
```
File field: `attachments`
- Response example:
```json
{
  "status": "success",
  "data": {
    "_id": "assignment_id",
    "title": "Homework 1"
  }
}
```
- Authentication required?: Yes

### GET /api/v1/assignment/lesson/:lessonId
- Description: Return all assignments for one lesson.
- Request headers: `Authorization: Bearer <token>`
- Request body: None
- Response example:
```json
{
  "status": "success",
  "results": 1,
  "data": []
}
```
- Authentication required?: Yes

### GET /api/v1/assignments/:id
- Description: Return one assignment.
- Request headers: `Authorization: Bearer <token>`
- Request body: None
- Response example:
```json
{
  "status": "success",
  "data": {
    "_id": "assignment_id"
  }
}
```
- Authentication required?: Yes

### PUT /api/v1/assignments/:id
- Description: Update an assignment.
- Request headers: `Authorization: Bearer <token>`, `Content-Type: application/json`
- Request body:
```json
{
  "title": "Updated title",
  "dueDate": "2026-05-02T00:00:00.000Z"
}
```
- Response example:
```json
{
  "status": "success",
  "data": {
    "_id": "assignment_id"
  }
}
```
- Authentication required?: Yes

### DELETE /api/v1/assignments/:id
- Description: Delete an assignment and its related files/submissions.
- Request headers: `Authorization: Bearer <token>`
- Request body: None
- Response example:
```json
HTTP 204 No Content
```
- Authentication required?: Yes

### GET /api/v1/assignments/:assignmentId/submissions
- Description: Return all submissions for an assignment with stats.
- Request headers: `Authorization: Bearer <token>`
- Request body: None
- Response example:
```json
{
  "status": "success",
  "stats": {
    "total": 3,
    "submitted": 2,
    "late": 1,
    "graded": 1,
    "draft": 0,
    "averageGrade": 85
  },
  "data": []
}
```
- Authentication required?: Yes

### PATCH /api/v1/submissions/:submissionId/grade
- Description: Grade a submission.
- Request headers: `Authorization: Bearer <token>`, `Content-Type: application/json`
- Request body:
```json
{
  "grade": 90,
  "feedback": "Good work"
}
```
- Response example:
```json
{
  "status": "success",
  "data": {
    "_id": "submission_id",
    "grade": 90,
    "feedback": "Good work"
  }
}
```
- Authentication required?: Yes

## Coupon Routes

### POST /api/v1/coupons
- Description: Create a coupon.
- Request headers: `Authorization: Bearer <token>`, `Content-Type: application/json`
- Request body:
```json
{
  "code": "SAVE10",
  "discountType": "percentage",
  "discountValue": 10,
  "endDate": "2026-05-01T00:00:00.000Z",
  "minOrderAmount": 100,
  "usageLimit": 100,
  "perUserLimit": 1,
  "isActive": true
}
```
- Response example:
```json
{
  "status": "success",
  "data": {
    "_id": "coupon_id",
    "code": "SAVE10"
  }
}
```
- Authentication required?: Yes

### GET /api/v1/coupons
- Description: Return all coupons.
- Request headers: `Authorization: Bearer <token>`
- Request body: None
- Response example:
```json
{
  "status": "success",
  "results": 2,
  "paginationResult": {
    "currentPage": 1,
    "numberOfPages": 1
  },
  "data": []
}
```
- Authentication required?: Yes

### GET /api/v1/coupons/code/:code
- Description: Return one coupon by its code.
- Request headers: `Authorization: Bearer <token>`
- Request body: None
- Response example:
```json
{
  "status": "success",
  "data": {
    "_id": "coupon_id",
    "code": "SAVE10"
  }
}
```
- Authentication required?: Yes

### GET /api/v1/coupons/:id
- Description: Return one coupon by ID.
- Request headers: `Authorization: Bearer <token>`
- Request body: None
- Response example:
```json
{
  "status": "success",
  "data": {
    "_id": "coupon_id"
  }
}
```
- Authentication required?: Yes

### PUT /api/v1/coupons/:id
- Description: Update a coupon.
- Request headers: `Authorization: Bearer <token>`, `Content-Type: application/json`
- Request body:
```json
{
  "discountValue": 20,
  "isActive": false
}
```
- Response example:
```json
{
  "status": "success",
  "data": {
    "_id": "coupon_id"
  }
}
```
- Authentication required?: Yes

### DELETE /api/v1/coupons/:id
- Description: Delete a coupon.
- Request headers: `Authorization: Bearer <token>`
- Request body: None
- Response example:
```json
HTTP 204 No Content
```
- Authentication required?: Yes

## User Routes

### GET /api/v1/users/me
- Description: Return the authenticated user's profile.
- Request headers: `Authorization: Bearer <token>`
- Request body: None
- Response example:
```json
{
  "status": "success",
  "data": {
    "_id": "user_id",
    "name": "Ahmed Ali",
    "email": "ahmed@example.com"
  }
}
```
- Authentication required?: Yes

### PUT /api/v1/users/me
- Description: Update the authenticated user's profile fields.
- Request headers: `Authorization: Bearer <token>`, `Content-Type: application/json`
- Request body:
```json
{
  "name": "Ahmed Ali",
  "phone": "01234567890",
  "parentPhone": "01122334455"
}
```
- Response example:
```json
{
  "status": "success",
  "message": "Profile updated successfully",
  "data": {
    "_id": "user_id",
    "name": "Ahmed Ali"
  }
}
```
- Authentication required?: Yes

### PUT /api/v1/users/me/change-password
- Description: Change the authenticated user's password.
- Request headers: `Authorization: Bearer <token>`, `Content-Type: application/json`
- Request body:
```json
{
  "currentPassword": "123456",
  "newPassword": "newpass123",
  "passwordConfirm": "newpass123"
}
```
- Response example:
```json
{
  "status": "success",
  "message": "Password updated successfully"
}
```
- Authentication required?: Yes

### PUT /api/v1/users/me/image
- Description: Upload and set the authenticated user's profile image.
- Request headers: `Authorization: Bearer <token>`, `Content-Type: multipart/form-data`
- Request body: None
- File field: `profileImg`
- Response example:
```json
{
  "status": "success",
  "message": "Profile updated successfully",
  "data": {
    "_id": "user_id"
  }
}
```
- Authentication required?: Yes

### DELETE /api/v1/users/me/image
- Description: Delete the authenticated user's profile image.
- Request headers: `Authorization: Bearer <token>`
- Request body: None
- Response example:
```json
{
  "status": "success",
  "message": "Profile image deleted successfully",
  "data": {
    "_id": "user_id"
  }
}
```
- Authentication required?: Yes

### DELETE /api/v1/users/me
- Description: Deactivate the authenticated user's account.
- Request headers: `Authorization: Bearer <token>`
- Request body: None
- Response example:
```json
HTTP 204 No Content
```
- Authentication required?: Yes

### GET /api/v1/users
- Description: Return all users with pagination, filtering, search, and sorting.
- Request headers: `Authorization: Bearer <token>`
- Request body: None
- Response example:
```json
{
  "status": "success",
  "results": 2,
  "paginationResult": {
    "currentPage": 1,
    "numberOfPages": 1
  },
  "data": []
}
```
- Authentication required?: Yes

### GET /api/v1/users/:id
- Description: Return a single user by ID.
- Request headers: `Authorization: Bearer <token>`
- Request body: None
- Response example:
```json
{
  "status": "success",
  "data": {
    "_id": "user_id",
    "name": "Ahmed Ali"
  }
}
```
- Authentication required?: Yes

### POST /api/v1/users
- Description: Create a user from the admin area.
- Request headers: `Authorization: Bearer <token>`, `Content-Type: application/json`
- Request body:
```json
{
  "name": "New User",
  "email": "new@example.com",
  "phone": "01000000000",
  "parentPhone": "01111111111",
  "password": "123456",
  "passwordConfirm": "123456",
  "role": "user"
}
```
- Response example:
```json
{
  "status": "success",
  "data": {
    "_id": "user_id",
    "name": "New User"
  }
}
```
- Authentication required?: Yes

### PUT /api/v1/users/:id
- Description: Update a user by ID.
- Request headers: `Authorization: Bearer <token>`, `Content-Type: application/json`
- Request body:
```json
{
  "name": "Updated User",
  "phone": "01234567890",
  "role": "admin"
}
```
- Response example:
```json
{
  "status": "success",
  "data": {
    "_id": "user_id",
    "name": "Updated User"
  }
}
```
- Authentication required?: Yes

### DELETE /api/v1/users/:id
- Description: Delete a user by ID.
- Request headers: `Authorization: Bearer <token>`
- Request body: None
- Response example:
```json
HTTP 204 No Content
```
- Authentication required?: Yes

### PATCH /api/v1/users/:id/ban
- Description: Ban a user.
- Request headers: `Authorization: Bearer <token>`
- Request body: None
- Response example:
```json
{
  "status": "success",
  "message": "User banned successfully",
  "data": {
    "_id": "user_id",
    "isBanned": true
  }
}
```
- Authentication required?: Yes

### PATCH /api/v1/users/:id/unban
- Description: Unban a user.
- Request headers: `Authorization: Bearer <token>`
- Request body: None
- Response example:
```json
{
  "status": "success",
  "message": "User unbanned successfully",
  "data": {
    "_id": "user_id",
    "isBanned": false
  }
}
```
- Authentication required?: Yes

### PATCH /api/v1/users/:id/toggle-ban
- Description: Toggle a user's ban state.
- Request headers: `Authorization: Bearer <token>`
- Request body: None
- Response example:
```json
{
  "status": "success",
  "message": "User banned successfully",
  "data": {
    "_id": "user_id",
    "isBanned": true
  }
}
```
- Authentication required?: Yes

### POST /api/v1/users/admin
- Description: Create a new admin account. Super admin only.
- Request headers: `Authorization: Bearer <token>`, `Content-Type: application/json`
- Request body:
```json
{
  "name": "Admin Name",
  "email": "admin@example.com",
  "phone": "01000000000",
  "parentPhone": "01111111111",
  "password": "123456",
  "passwordConfirm": "123456"
}
```
- Response example:
```json
{
  "status": "success",
  "message": "Admin created successfully",
  "data": {
    "_id": "admin_user_id",
    "role": "admin"
  }
}
```
- Authentication required?: Yes

### DELETE /api/v1/users/admin/:id
- Description: Delete an admin account. Super admin only.
- Request headers: `Authorization: Bearer <token>`
- Request body: None
- Response example:
```json
HTTP 204 No Content
```
- Authentication required?: Yes
