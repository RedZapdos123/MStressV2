# MStress API Documentation

## Overview
REST API for the MStress mental health platform.

## Base URLs
- Development: http://localhost:5000/api
- AI Services: http://localhost:8000

## Authentication
JWT tokens required for most endpoints:
Authorization: Bearer <token>

## Main Endpoints

### Authentication
- POST /api/auth/register - User registration
- POST /api/auth/login - User login
- GET /api/auth/google - Google OAuth

### Assessments
- GET /api/assessments - List assessments
- POST /api/assessments/submit - Submit responses
- GET /api/assessments/history - User history

### Recommendations
- GET /api/recommendations - Get AI recommendations
- POST /api/recommendations/feedback - Submit feedback

### Healthcare Facilities
- GET /api/facilities/nearby - Find nearby facilities
- GET /api/facilities/search - Search facilities

### Data Export
- GET /api/export/pdf - Export as PDF
- GET /api/export/csv - Export as CSV

## AI Services Endpoints
- POST /ai/assessment/analyze - Analyze responses
- POST /ai/recommendations/generate - Generate recommendations
- POST /ai/voice/analyze - Voice analysis
