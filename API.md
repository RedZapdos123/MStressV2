# MStress API Documentation.

## Overview:

The MStress API is a comprehensive REST API for mental health assessment and management. The API is built with Node.js/Express and provides endpoints for authentication, assessments, user management, reviews, recommendations, and more.

**Base URL**: `http://localhost:5000/api`

**Authentication**: Most endpoints require a JWT token passed in the `Authorization` header as `Bearer <token>`.

---

## Authentication Endpoints:

### POST /auth/register

Register a new user account.

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!",
  "name": "John Doe"
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "message": "Account created successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "user",
    "profile": {},
    "preferences": {},
    "createdAt": "2025-10-20T00:00:00Z"
  }
}
```

**Authentication**: Not required.

---

### POST /auth/login

Authenticate a user and receive a JWT token.

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "user",
    "profile": {},
    "preferences": {},
    "lastLoginAt": "2025-10-20T00:00:00Z"
  }
}
```

**Authentication**: Not required.

---

### POST /auth/forgot-password

Request a password reset token.

**Request Body**:
```json
{
  "email": "user@example.com"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Password reset token generated successfully",
  "resetToken": "64_character_hex_string",
  "resetTokenExpiry": "2025-10-20T01:00:00Z"
}
```

**Error Response** (404 Not Found):
```json
{
  "success": false,
  "message": "No account found with this email address"
}
```

**Authentication**: Not required.

---

### POST /auth/reset-password

Reset user password using a valid reset token.

**Request Body**:
```json
{
  "resetToken": "64_character_hex_string",
  "newPassword": "NewSecurePassword123!"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Password reset successfully. You can now login with your new password."
}
```

**Error Response** (400 Bad Request):
```json
{
  "success": false,
  "message": "Invalid or expired reset token"
}
```

**Authentication**: Not required.

---

### GET /auth/verify

Verify the validity of the current JWT token.

**Response** (200 OK):
```json
{
  "success": true,
  "valid": true,
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "user",
    "profile": {},
    "preferences": {},
    "lastLoginAt": "2025-10-20T00:00:00Z"
  }
}
```

**Authentication**: Required (JWT token).

---

## User Endpoints:

### GET /users/profile

Retrieve the current user's profile information.

**Response** (200 OK):
```json
{
  "success": true,
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "user",
    "profile": {
      "age": 25,
      "gender": "male"
    },
    "preferences": {
      "notifications": true,
      "dataSharing": false
    },
    "isEmailVerified": true,
    "lastLoginAt": "2025-10-20T00:00:00Z",
    "createdAt": "2025-10-15T00:00:00Z"
  }
}
```

**Authentication**: Required (JWT token).

---

### PUT /users/profile

Update user profile information and/or password.

**Request Body**:
```json
{
  "name": "Jane Doe",
  "currentPassword": "CurrentPassword123!",
  "newPassword": "NewPassword123!"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "name": "Jane Doe",
    "role": "user",
    "profile": {},
    "preferences": {}
  }
}
```

**Authentication**: Required (JWT token).

---

### GET /users/stats

Retrieve user statistics including assessment history and stress trends.

**Response** (200 OK):
```json
{
  "success": true,
  "stats": {
    "totalAssessments": 5,
    "latestAssessment": {
      "type": "standard",
      "score": 45,
      "stressLevel": "moderate",
      "completedAt": "2025-10-20T00:00:00Z"
    },
    "stressTrend": [
      { "score": 35, "level": "low" },
      { "score": 42, "level": "moderate" },
      { "score": 45, "level": "moderate" }
    ]
  }
}
```

**Authentication**: Required (JWT token).

---

### PUT /users/preferences

Update user preferences.

**Request Body**:
```json
{
  "preferences": {
    "notifications": false,
    "dataSharing": true,
    "reminderFrequency": "daily"
  }
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Preferences updated successfully",
  "preferences": {
    "notifications": false,
    "dataSharing": true,
    "reminderFrequency": "daily"
  }
}
```

**Authentication**: Required (JWT token).

---

### DELETE /users/account

Delete the user account and all associated data.

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Account and all associated data deleted successfully"
}
```

**Authentication**: Required (JWT token).

---

## Assessment Endpoints:

### GET /assessments/types

Get available assessment types.

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "assessment_types": [
      {
        "id": "standard",
        "name": "Standard Questionnaire Assessment",
        "description": "DASS-21 based questionnaire with sentiment analysis",
        "duration": "10-15 minutes",
        "questions": 20,
        "methods": ["questionnaire", "sentiment_analysis"]
      }
    ]
  }
}
```

**Authentication**: Not required.

---

### POST /assessments/standard

Submit a standard questionnaire assessment.

**Request Body**:
```json
{
  "userId": "user_id",
  "responses": {
    "q1": 2,
    "q2": 1,
    "q3": 3
  },
  "assessmentType": "standard"
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "assessment": {
    "id": "assessment_id",
    "userId": "user_id",
    "type": "standard",
    "results": {
      "overallScore": 45,
      "stressLevel": "moderate"
    },
    "completedAt": "2025-10-20T00:00:00Z"
  }
}
```

**Authentication**: Not required (should be protected in production).

---

### POST /assessments/detailed

Submit a detailed assessment with optional facial emotion recognition.

**Request Body**:
```json
{
  "userId": "user_id",
  "responses": {
    "q1": 2,
    "q2": 1
  },
  "facialImages": ["base64_encoded_image"],
  "assessmentType": "detailed_stress"
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "assessment": {
    "id": "assessment_id",
    "userId": "user_id",
    "type": "detailed_stress",
    "results": {
      "overallScore": 52,
      "stressLevel": "moderate",
      "facialEmotionAnalysis": {}
    },
    "completedAt": "2025-10-20T00:00:00Z"
  }
}
```

**Authentication**: Not required (should be protected in production).

---

### POST /assessments/multi-modal

Submit a multi-modal assessment with facial images and voice recordings.

**Request Body**:
```json
{
  "userId": "user_id",
  "responses": {
    "q1": 2,
    "q2": 1
  },
  "facialImages": ["base64_encoded_image"],
  "voiceRecordings": ["base64_encoded_audio"],
  "assessmentType": "multi_modal"
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "assessment": {
    "id": "assessment_id",
    "userId": "user_id",
    "type": "multi_modal",
    "results": {
      "overallScore": 48,
      "stressLevel": "moderate",
      "facialEmotionAnalysis": {},
      "voiceAnalysis": {}
    },
    "completedAt": "2025-10-20T00:00:00Z"
  }
}
```

**Authentication**: Not required (should be protected in production).

---

### GET /assessments/user/:userId

Get all assessments for a specific user.

**Response** (200 OK):
```json
{
  "success": true,
  "assessments": [
    {
      "id": "assessment_id",
      "userId": "user_id",
      "type": "standard",
      "results": {
        "overallScore": 45,
        "stressLevel": "moderate"
      },
      "completedAt": "2025-10-20T00:00:00Z"
    }
  ]
}
```

**Authentication**: Required (JWT token).

---

## Questions Endpoints:

### GET /questions

Get all active questions.

**Response** (200 OK):
```json
{
  "questions": [
    {
      "id": "question_id",
      "questionText": "How stressed do you feel?",
      "questionType": "scale",
      "category": "work_stress",
      "order": 1
    }
  ]
}
```

**Authentication**: Required (JWT token).

---

### GET /questions/all

Get all questions including inactive ones.

**Response** (200 OK):
```json
{
  "questions": [
    {
      "id": "question_id",
      "questionText": "How stressed do you feel?",
      "questionType": "scale",
      "category": "work_stress",
      "isActive": true,
      "order": 1
    }
  ]
}
```

**Authentication**: Required (JWT token).

---

## Recommendations Endpoints:

### GET /recommendations

Get personalized recommendations based on latest assessment.

**Query Parameters**:
- `latitude` (optional): User's latitude for nearby resources.
- `longitude` (optional): User's longitude for nearby resources.

**Response** (200 OK):
```json
{
  "success": true,
  "recommendations": [
    "Practice deep breathing exercises",
    "Take regular breaks from work"
  ],
  "resources": {
    "places": [
      {
        "name": "Mental Health Clinic",
        "address": "123 Main St",
        "openNow": true,
        "rating": 4.5
      }
    ]
  },
  "stressLevel": "moderate",
  "stressScore": 45,
  "assessmentType": "standard",
  "lastAssessmentDate": "2025-10-20T00:00:00Z"
}
```

**Authentication**: Required (JWT token).

---

### POST /recommendations/nearby-resources

Get nearby mental health resources based on geolocation.

**Request Body**:
```json
{
  "latitude": 40.7128,
  "longitude": -74.0060
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "places": [
    {
      "name": "Mental Health Clinic",
      "address": "123 Main St",
      "openNow": true,
      "rating": 4.5,
      "phone": "+1-555-0123"
    }
  ]
}
```

**Authentication**: Required (JWT token).

---

## Reviews Endpoints:

### GET /reviews/pending

Get all pending assessments for review.

**Response** (200 OK):
```json
{
  "success": true,
  "assessments": [
    {
      "id": "assessment_id",
      "user": {
        "id": "user_id",
        "name": "John Doe",
        "email": "john@example.com"
      },
      "results": {
        "overallScore": 45,
        "stressLevel": "moderate"
      },
      "reviewStatus": "pending",
      "hasReview": false
    }
  ]
}
```

**Authentication**: Required (JWT token, reviewer or admin role).

---

### POST /reviews/:assessmentId

Create or update a review for an assessment.

**Request Body**:
```json
{
  "reviewScore": 85,
  "comments": "Assessment appears accurate",
  "status": "reviewed",
  "riskAssessment": "moderate",
  "flaggedForFollowUp": false
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "message": "Review submitted successfully",
  "review": {
    "id": "review_id",
    "assessment": "assessment_id",
    "reviewer": "reviewer_id",
    "reviewScore": 85,
    "comments": "Assessment appears accurate",
    "status": "reviewed",
    "riskAssessment": "moderate",
    "createdAt": "2025-10-20T00:00:00Z"
  }
}
```

**Authentication**: Required (JWT token, reviewer or admin role).

---

### GET /reviews/:assessmentId

Get review details for a specific assessment.

**Response** (200 OK):
```json
{
  "success": true,
  "review": {
    "id": "review_id",
    "assessment": "assessment_id",
    "reviewer": {
      "id": "reviewer_id",
      "name": "Dr. Sanskriti Wakale",
      "email": "reviewer@example.com"
    },
    "reviewScore": 85,
    "comments": "Assessment appears accurate",
    "status": "reviewed",
    "riskAssessment": "moderate",
    "createdAt": "2025-10-20T00:00:00Z"
  }
}
```

**Authentication**: Required (JWT token).

---

### GET /reviews/user/:userId

Get all reviews for a user's assessments.

**Response** (200 OK):
```json
{
  "success": true,
  "reviews": [
    {
      "id": "review_id",
      "assessment": "assessment_id",
      "reviewer": {
        "id": "reviewer_id",
        "name": "Dr. Sanskriti Wakale"
      },
      "reviewScore": 85,
      "comments": "Assessment appears accurate",
      "status": "reviewed",
      "createdAt": "2025-10-20T00:00:00Z"
    }
  ]
}
```

**Authentication**: Required (JWT token).

---

## Error Responses:

All endpoints may return error responses with the following format:

**400 Bad Request**:
```json
{
  "success": false,
  "message": "Validation error or bad request"
}
```

**401 Unauthorized**:
```json
{
  "success": false,
  "message": "Invalid token or authentication required"
}
```

**403 Forbidden**:
```json
{
  "success": false,
  "message": "Access denied. Insufficient permissions."
}
```

**404 Not Found**:
```json
{
  "success": false,
  "message": "Resource not found"
}
```

**500 Internal Server Error**:
```json
{
  "success": false,
  "message": "Server error"
}
```

---

## Authentication:

Most endpoints require JWT authentication. Include the token in the `Authorization` header:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

JWT tokens expire after 7 days. Users must log in again to receive a new token.

---

## Rate Limiting:

Currently, there is no rate limiting implemented. This should be added in production.

---

## CORS:

The API accepts requests from the following origins:
- `http://localhost:3000`
- `http://localhost:5173`
- `http://localhost:5174`
- `http://localhost:5175`
- `http://localhost:8000`

---

## Version:

API Version: 1.0.0

Last Updated: October 21, 2025.

