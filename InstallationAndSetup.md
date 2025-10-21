# MStress Installation and Setup Guide:

## System Requirements:

### Minimum Requirements:
- **OS**: Windows 11, macOS 10.15+, or Linux (Ubuntu 20.04+).
- **RAM**: 8GB minimum (16GB recommended).
- **Storage**: 10GB free space.
- **Processor**: Intel i5 or equivalent.

### Software Requirements:
- **Node.js**: v16.0.0 or higher.
- **Python**: 3.11 or higher.
- **MongoDB**: 4.4 or higher.
- **Git**: Latest version.

### Optional (for GPU acceleration):
- **CUDA**: 11.8 or higher.
- **cuDNN**: 8.6 or higher.
- **NVIDIA GPU**: CUDA-capable GPU with 2GB+ VRAM.

## Installation Steps:

### 1. Clone the Repository:

```bash
git clone https://github.com/yourusername/MStress.git
cd MStress
```

### 2. Install Backend Dependencies:

```bash
cd backend
npm install
```

**Key Dependencies:**
- express: Web framework.
- mongoose: MongoDB ODM.
- jsonwebtoken: JWT authentication.
- bcryptjs: Password hashing.
- dotenv: Environment variables.
- cors: Cross-origin resource sharing.
- @google/generative-ai: Gemini API.
- @googlemaps/google-maps-services-js: Google Maps API.

### 3. Install Frontend Dependencies

```bash
cd ../frontend
npm install
```

**Key Dependencies:**
- react: UI framework
- react-router-dom: Routing
- axios: HTTP client
- tailwindcss: CSS framework
- vite: Build tool

### 4. Install AI Services Dependencies

```bash
cd ../ai-services
pip install -r requirements.txt
```

**Key Dependencies:**
- fastapi: Web framework
- uvicorn: ASGI server
- torch: Deep learning framework
- transformers: NLP models (RoBERTa)
- openai-whisper: Speech-to-text
- librosa: Audio analysis
- opencv-python: Computer vision
- scikit-learn: Machine learning

### 5. Setup MongoDB

#### Option A: Local MongoDB Installation

**Windows:**
```bash
# Download from https://www.mongodb.com/try/download/community
# Run installer and follow instructions
# Start MongoDB service
net start MongoDB
```

**macOS:**
```bash
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community
```

**Linux (Ubuntu):**
```bash
sudo apt-get install -y mongodb
sudo systemctl start mongodb
```

#### Option B: MongoDB Atlas (Cloud)

1. Go to https://www.mongodb.com/cloud/atlas
2. Create a free account
3. Create a cluster
4. Get connection string
5. Update `MONGODB_URI` in `.env` files

### 6. Environment Configuration

#### Backend Configuration (`backend/.env`)

```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/mstress
JWT_SECRET=your_super_secret_jwt_key_here
GEMINI_API_KEY=AIzaSyAEDoFGqQz2pY43o151CXYk_tFrFwDsIvI
GOOGLE_MAPS_API_KEY=AIzaSyAxKfKRiyQ5ppgy98sIIs3ilN9z1ANpo0Y
AI_SERVICE_URL=http://localhost:8000
CORS_ORIGIN=http://localhost:3000,http://localhost:5173
```

#### Frontend Configuration (`frontend/.env`)

```env
VITE_API_URL=http://localhost:5000
VITE_AI_SERVICE_URL=http://localhost:8000
VITE_GOOGLE_MAPS_API_KEY=AIzaSyAxKfKRiyQ5ppgy98sIIs3ilN9z1ANpo0Y
```

#### AI Services Configuration (`ai-services/.env`)

```env
ENVIRONMENT=development
PORT=8000
HOST=0.0.0.0
WHISPER_MODEL_SIZE=base
ROBERTA_MODEL_NAME=cardiffnlp/twitter-roberta-base-sentiment-latest
DEVICE=cpu
LOG_LEVEL=INFO
```

### 7. Download AI Models

The AI models will be automatically downloaded on first run:

```bash
cd ai-services
python -c "from services.roberta_sentiment_service import get_sentiment_analyzer; get_sentiment_analyzer()"
python -c "from services.whisper_transcription_service import get_transcription_service; get_transcription_service()"
```

**Note:** First download may take 10-30 minutes depending on internet speed.

## Running the Application

### Terminal 1: Start MongoDB

```bash
# Windows
net start MongoDB

# macOS
brew services start mongodb-community

# Linux
sudo systemctl start mongodb
```

### Terminal 2: Start Backend Server

```bash
cd backend
npm start
```

Expected output:
```
📊 Connected to MongoDB database
🔗 Database: mongodb://localhost:27017/mstress
🚀 Server running on http://localhost:5000
```

### Terminal 3: Start Frontend Development Server

```bash
cd frontend
npm run dev
```

Expected output:
```
VITE v4.x.x  ready in xxx ms

➜  Local:   http://localhost:5173/
➜  press h to show help
```

### Terminal 4: Start AI Services

```bash
cd ai-services
python main.py
```

Expected output:
```
Starting MStress AI Services...
INFO:     Uvicorn running on http://0.0.0.0:8000
```

## Verification

### Check Backend Health

```bash
curl http://localhost:5000/health
```

### Check Frontend

Open browser: http://localhost:5173

### Check AI Services

```bash
curl http://localhost:8000/health
```

## Database Seeding

To populate the database with test data, run the populate-test-data script:

```bash
cd backend
node scripts/populate-test-data.js
```

This will create:
- 1 reviewer account (Mridankan Mandal).
- 1 admin account (Admin User).
- 15 regular users with Indian names.
- 15 assessments with various types and stress levels.
- 10 reviews linked to assessments.

**Test Credentials:**
- Reviewer Email: `reviewer@mstress.com` | Password: `reviewer123`
- Admin Email: `admin@mstress.com` | Password: `admin123`
- Sample User Email: `user1@example.com` | Password: `password123`
- Sample User Email: `user2@example.com` | Password: `password123`

## Troubleshooting

### MongoDB Connection Error

**Problem:** `MongooseError: Cannot connect to MongoDB`

**Solution:**
1. Ensure MongoDB is running: `mongod` or `net start MongoDB`
2. Check connection string in `.env`
3. Verify MongoDB is listening on port 27017

### Port Already in Use

**Problem:** `Error: listen EADDRINUSE: address already in use :::5000`

**Solution:**
```bash
# Find process using port
lsof -i :5000  # macOS/Linux
netstat -ano | findstr :5000  # Windows

# Kill process
kill -9 <PID>  # macOS/Linux
taskkill /PID <PID> /F  # Windows
```

### Python Dependencies Error

**Problem:** `ModuleNotFoundError: No module named 'torch'`

**Solution:**
```bash
cd ai-services
pip install --upgrade pip
pip install -r requirements.txt
```

### CUDA/GPU Issues

**Problem:** Models running slowly or CUDA errors

**Solution:**
1. Set `DEVICE=cpu` in `ai-services/.env`
2. Or install CUDA: https://developer.nvidia.com/cuda-downloads
3. Reinstall PyTorch with CUDA support

### Frontend Build Errors

**Problem:** `npm ERR! code ERESOLVE`

**Solution:**
```bash
cd frontend
npm install --legacy-peer-deps
```

## Development Workflow

### Making Changes

1. Create feature branch: `git checkout -b feature/your-feature`
2. Make changes in respective directories
3. Test changes locally
4. Commit changes: `git commit -am 'Add feature'`
5. Push to branch: `git push origin feature/your-feature`

### Code Style

- **Backend**: Use ESLint (configured in package.json)
- **Frontend**: Use Prettier (configured in package.json)
- **AI Services**: Use Black and Flake8

### Running Tests

```bash
# Backend tests
cd backend && npm test

# Frontend tests
cd frontend && npm test

# AI Services tests
cd ai-services && pytest
```

## Production Deployment

### Backend Deployment

1. Set `NODE_ENV=production`
2. Use production MongoDB URI
3. Set strong `JWT_SECRET`
4. Deploy to Node.js hosting (Heroku, AWS, DigitalOcean)

### Frontend Deployment

1. Build: `npm run build`
2. Deploy `dist/` folder to static hosting (Vercel, Netlify)

### AI Services Deployment

1. Use production DEVICE setting
2. Deploy to Python hosting (AWS Lambda, Google Cloud Run)
3. Use Docker for containerization

## Next Steps

1. Create admin account
2. Upload assessment questionnaires
3. Configure email notifications
4. Set up backup strategy
5. Configure monitoring and logging

## Support

For issues and questions:
- Check documentation in `CodeBaseIndex.md`
- Review error logs in respective directories
- Check GitHub issues: https://github.com/yourusername/MStress/issues

