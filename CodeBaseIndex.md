# MStress Codebase Index.

## Project Overview:

MStress is a comprehensive mental health assessment platform that combines AI-powered analysis with user-friendly interfaces to provide stress detection and mental health tracking.

## Directory Structure:

### Root Level:
- `backend/` - Node.js/Express backend server.
- `frontend/` - React frontend application.
- `ai-services/` - Python FastAPI AI services.
- `docs/` - Documentation files.
- `.env` files - Environment configuration.

### Backend (`backend/`):
```
backend/
├── models/              # Mongoose database models
│   ├── User.js         # User schema with role system (user, human_reviewer, admin)
│   ├── Assessment.js   # Assessment results and data
│   ├── Question.js     # Assessment questions with role targeting
│   └── AdminLog.js     # Admin activity logging
├── routes/             # Express route handlers
│   ├── auth.js         # Authentication endpoints
│   ├── users.js        # User management endpoints
│   ├── assessments.js  # Assessment endpoints
│   ├── questions.js    # Question management endpoints
│   ├── export.js       # Data export endpoints
│   └── csv.js          # CSV handling endpoints
├── controllers/        # Business logic controllers
│   └── assessmentController.js
├── middleware/         # Express middleware
├── services/           # Business logic services
│   └── facialEmotionService.js
├── utils/              # Utility functions
├── server.js           # Main Express server
├── package.json        # Node.js dependencies
└── .env                # Environment variables
```

### Frontend (`frontend/`):
```
frontend/
├── src/
│   ├── pages/          # React page components
│   │   ├── auth/       # Authentication pages (LoginPage, RegisterPage)
│   │   ├── dashboard/  # Dashboard pages
│   │   ├── assessment/ # Assessment pages
│   │   └── admin/      # Admin pages
│   ├── components/     # Reusable React components
│   ├── services/       # API client services
│   ├── hooks/          # Custom React hooks
│   ├── context/        # React context providers
│   ├── styles/         # CSS/Tailwind styles
│   ├── App.jsx         # Main App component
│   └── main.jsx        # React entry point
├── public/             # Static assets
├── vite.config.js      # Vite configuration
├── package.json        # Node.js dependencies
└── .env                # Environment variables
```

### AI Services (`ai-services/`):
```
ai-services/
├── services/           # AI service modules
│   ├── roberta_sentiment_service.py      # RoBERTa sentiment analysis
│   ├── whisper_transcription_service.py  # Whisper speech-to-text
│   ├── fer_libreface_service.py          # Facial emotion recognition
│   ├── audio_analysis_service.py         # Audio feature extraction
│   └── __init__.py                       # Service module initialization
├── models/             # Pre-trained model files
├── main.py             # FastAPI application
├── requirements.txt    # Python dependencies
└── .env                # Environment variables
```

## Key Technologies:

### Backend:
- **Framework**: Express.js (Node.js).
- **Database**: MongoDB with Mongoose ODM.
- **Authentication**: JWT tokens, Google OAuth.
- **Password Hashing**: bcryptjs.
- **API Documentation**: Swagger/OpenAPI.

### Frontend:
- **Framework**: React 18.
- **Build Tool**: Vite.
- **Styling**: Tailwind CSS.
- **Routing**: React Router v6.
- **HTTP Client**: Axios.
- **State Management**: React Context API.

### AI Services:
- **Framework**: FastAPI (Python).
- **Server**: Uvicorn.
- **Sentiment Analysis**: RoBERTa (transformers library).
- **Speech-to-Text**: Whisper (OpenAI).
- **Facial Recognition**: OpenCV and CNN.
- **Audio Analysis**: librosa.
- **Deep Learning**: PyTorch.

## Database Schema:

### User Model:
- `_id`: ObjectId (primary key).
- `email`: String (unique).
- `password`: String (hashed).
- `name`: String.
- `role`: String (enum: 'user', 'human_reviewer', 'admin').
- `profile`: Object (organization, department, position, age, gender).
- `createdAt`: Date.
- `updatedAt`: Date.

### Assessment Model:
- `_id`: ObjectId.
- `user`: ObjectId (ref: User).
- `responses`: Array of response objects.
- `results`: Object (stressLevel, overallScore, etc.).
- `status`: String (enum: 'in_progress', 'completed').
- `completedAt`: Date.
- `createdAt`: Date.

### Question Model:
- `_id`: ObjectId.
- `questionText`: String.
- `questionType`: String (enum: 'multiple-choice', 'scale', 'text', 'yes-no', 'likert').
- `category`: String (enum: 'work_stress', 'academic_stress', etc.).
- `targetRoles`: Array (enum: 'user', 'human_reviewer', 'admin', 'all').
- `weight`: Number.
- `isActive`: Boolean.
- `order`: Number.

## API Endpoints:

### Authentication (`/api/auth/`):
- `POST /register` - User registration.
- `POST /login` - User login.
- `POST /logout` - User logout.
- `POST /refresh-token` - Refresh JWT token.

### Users (`/api/users/`):
- `GET /profile` - Get user profile.
- `PUT /profile` - Update user profile.
- `GET /` - List all users (admin only).
- `DELETE /:id` - Delete user (admin only).

### Assessments (`/api/assessments/`):
- `GET /` - Get user's assessments.
- `POST /` - Create new assessment.
- `GET /:id` - Get assessment details.
- `PUT /:id` - Update assessment.
- `DELETE /:id` - Delete assessment.

### Questions (`/api/questions/`):
- `GET /` - Get questions by role.
- `POST /` - Create question (admin only).
- `PUT /:id` - Update question (admin only).
- `DELETE /:id` - Delete question (admin only).

### AI Services (`/api/ai/`):
- `POST /sentiment` - Analyze text sentiment.
- `POST /transcribe` - Transcribe audio.
- `POST /emotion` - Recognize facial emotions.
- `POST /audio-analysis` - Analyze audio features.

## Role System:

### User:
- Regular user for stress assessments and mental health tracking.
- Can create and view own assessments.
- Can access personal dashboard.

### Human Reviewer:
- Reviews and analyzes user assessments.
- Provides feedback on assessments.
- Can view assigned assessments.

### Admin:
- Full system access.
- Can manage users and roles.
- Can upload and manage questionnaires.
- Can view system logs and analytics.

## Environment Variables:

### Backend (.env):
- `PORT` - Server port (default: 5000).
- `MONGODB_URI` - MongoDB connection string.
- `JWT_SECRET` - JWT signing secret.
- `GEMINI_API_KEY` - Google Gemini API key.
- `GOOGLE_MAPS_API_KEY` - Google Maps API key.
- `AI_SERVICE_URL` - AI services endpoint.

### AI Services (.env):
- `PORT` - Server port (default: 8000).
- `WHISPER_MODEL_SIZE` - Whisper model size (base, small, medium, large).
- `ROBERTA_MODEL_NAME` - RoBERTa model identifier.
- `DEVICE` - Computation device (cpu, cuda).

## Running the Application:

### Prerequisites:
- Node.js 16+.
- Python 3.11+.
- MongoDB.
- CUDA (optional, for GPU acceleration).

### Installation:
1. Install backend dependencies: `cd backend && npm install`.
2. Install frontend dependencies: `cd frontend && npm install`.
3. Install AI services dependencies: `cd ai-services && pip install -r requirements.txt`.

### Starting Services:
1. Start MongoDB: `mongod`.
2. Start backend: `cd backend && npm start`.
3. Start frontend: `cd frontend && npm run dev`.
4. Start AI services: `cd ai-services && python main.py`.

## Testing:

### Backend Tests:
- Run with: `npm test` (in backend directory).
- Test files: `*.test.js` or `*.spec.js`.

### Frontend Tests:
- Run with: `npm test` (in frontend directory).
- Test files: `*.test.jsx` or `*.spec.jsx`.

### AI Services Tests:
- Run with: `pytest` (in ai-services directory).
- Test files: `test_*.py` or `*_test.py`.

## Deployment:

The application is designed for deployment on:
- **Backend**: Node.js hosting (Heroku, AWS, DigitalOcean).
- **Frontend**: Static hosting (Vercel, Netlify, AWS S3).
- **AI Services**: Python hosting (AWS Lambda, Google Cloud Run, Docker).
- **Database**: MongoDB Atlas or self-hosted MongoDB.

## Contributing:

1. Create a feature branch: `git checkout -b feature/your-feature`.
2. Make changes and commit: `git commit -am 'Add feature'`.
3. Push to branch: `git push origin feature/your-feature`.
4. Submit a pull request.

## License:

This project is licensed under the MIT License.

