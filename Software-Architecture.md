# MStress Platform - Software Architecture

## 🏗️ System Overview

MStress is a comprehensive mental health assessment platform built with a modern three-tier architecture that combines traditional web technologies with advanced AI capabilities for multi-modal mental health analysis.

### Architecture Principles
- **Microservices Architecture**: Loosely coupled services for scalability
- **API-First Design**: RESTful APIs for all inter-service communication
- **Privacy by Design**: Local AI processing with minimal data retention
- **Responsive Design**: Mobile-first approach with progressive enhancement
- **Fault Tolerance**: Graceful degradation when AI services are unavailable

## 🔧 System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                             │
├─────────────────────────────────────────────────────────────────┤
│  React Frontend (Port 5173)                                    │
│  ├── Authentication & User Management                          │
│  ├── Assessment Interface                                      │
│  ├── Dashboard & Analytics                                     │
│  ├── Results Visualization                                     │
│  └── Emergency Resources                                       │
└─────────────────────────────────────────────────────────────────┘
                                │
                                │ HTTP/HTTPS
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                      APPLICATION LAYER                          │
├─────────────────────────────────────────────────────────────────┤
│  Node.js Backend API (Port 5000)                              │
│  ├── Authentication & Authorization                            │
│  ├── User Management                                           │
│  ├── Assessment Data Management                                │
│  ├── Data Export Services                                      │
│  └── Emergency Resource Management                             │
└─────────────────────────────────────────────────────────────────┘
                                │
                                │ HTTP/REST API
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                         AI LAYER                               │
├─────────────────────────────────────────────────────────────────┤
│  Python AI Services (Port 8000)                               │
│  ├── Facial Emotion Recognition                                │
│  ├── RoBERTa Sentiment Analysis                               │
│  ├── Whisper Speech-to-Text                                   │
│  ├── Voice Stress Analysis                                     │
│  └── Multi-Modal Assessment Processing                         │
└─────────────────────────────────────────────────────────────────┘
```

## 🎯 Service Architecture

### Frontend Service (React + Vite)
**Technology Stack:**
- React 18 with functional components and hooks
- Vite for fast development and building
- Tailwind CSS for responsive design
- React Router for client-side routing
- Context API for state management

**Key Components:**
```
src/
├── components/           # Reusable UI components
│   ├── common/          # Generic components (buttons, forms)
│   ├── assessment/      # Assessment-specific components
│   └── dashboard/       # Dashboard components
├── pages/               # Page-level components
│   ├── HomePage.jsx     # Landing page with features
│   ├── AssessmentPage.jsx # Assessment interface
│   ├── DashboardPage.jsx # User dashboard
│   ├── ResultsPage.jsx  # Assessment results
│   └── auth/           # Authentication pages
├── services/           # API communication
├── hooks/              # Custom React hooks
├── contexts/           # React contexts
└── utils/              # Utility functions
```

**Features:**
- Progressive Web App (PWA) capabilities
- Offline assessment completion
- Real-time camera integration
- Responsive design for all devices
- Accessibility compliance (WCAG 2.1)

### Backend Service (Node.js + Express)
**Technology Stack:**
- Node.js with Express.js framework
- JWT for authentication
- CORS for cross-origin requests
- Express middleware for request processing

**API Structure:**
```
routes/
├── auth.js             # Authentication endpoints
├── users.js            # User management
├── assessments.js      # Assessment CRUD operations
├── export.js           # Data export functionality
└── health.js           # Health check endpoints
```

**Key Features:**
- RESTful API design
- JWT-based authentication
- Request validation and sanitization
- Error handling and logging
- Data export (CSV/PDF)
- Rate limiting and security headers

### AI Services (Python + FastAPI)
**Technology Stack:**
- FastAPI for high-performance API
- PyTorch for deep learning models
- OpenCV for computer vision
- Transformers library for NLP
- Whisper for speech processing

**Service Architecture:**
```
ai-services/
├── models/              # AI model implementations
│   ├── emotion_model.py # Facial emotion recognition
│   ├── roberta_sentiment/ # RoBERTa model files
│   └── whisper/         # Whisper model files
├── services/            # Business logic services
│   ├── facial_emotion_service.py
│   ├── sentiment_analysis_service.py
│   └── speech_to_text_service.py
└── main.py             # FastAPI application
```

## 🤖 AI Model Architecture

### Facial Emotion Recognition
**Model Type:** Convolutional Neural Network (CNN)
**Input:** 48x48 grayscale facial images
**Output:** 7 emotion classes with confidence scores
**Processing Pipeline:**
1. Face detection using OpenCV Haar Cascades
2. Face preprocessing and normalization
3. CNN inference for emotion classification
4. Stress level calculation from emotion patterns

### Sentiment Analysis (RoBERTa)
**Model:** cardiffnlp/twitter-roberta-base-sentiment-latest
**Input:** Text responses from questionnaires
**Output:** Sentiment scores (negative, neutral, positive)
**Processing Pipeline:**
1. Text preprocessing and tokenization
2. RoBERTa transformer inference
3. Mental health keyword analysis
4. Stress indicator extraction

### Speech-to-Text & Voice Analysis (Whisper)
**Model:** OpenAI Whisper Base
**Input:** Audio recordings (WAV, MP3, etc.)
**Output:** Transcription + voice stress metrics
**Processing Pipeline:**
1. Audio preprocessing and normalization
2. Whisper transcription
3. Voice pattern analysis (rate, pauses, confidence)
4. Stress marker detection

## 📊 Data Flow Architecture

### Assessment Data Flow
```
User Input → Frontend Validation → Backend Processing → AI Analysis → Results Storage → Dashboard Display
```

**Detailed Flow:**
1. **User Interaction**: User completes assessment on frontend
2. **Data Validation**: Client-side and server-side validation
3. **AI Processing**: Multi-modal analysis by AI services
4. **Result Aggregation**: Backend combines AI results
5. **Storage**: Encrypted storage of assessment results
6. **Visualization**: Dashboard displays trends and insights

### Privacy-Preserving Data Flow
```
Facial Image → Local Processing → Feature Extraction → Disposal → Results Only
```

**Privacy Features:**
- Facial images processed locally, never stored
- Voice recordings processed in memory only
- Text data encrypted in transit and at rest
- User data deletion capabilities
- GDPR compliance mechanisms

## 🔒 Security Architecture

### Authentication & Authorization
- **JWT Tokens**: Stateless authentication
- **Role-Based Access**: Student/Professional/Admin roles
- **Session Management**: Secure token refresh
- **Password Security**: Bcrypt hashing with salt

### Data Protection
- **Encryption in Transit**: HTTPS/TLS 1.3
- **Encryption at Rest**: AES-256 encryption
- **Input Validation**: Comprehensive sanitization
- **Rate Limiting**: API abuse prevention

### Privacy Controls
- **Data Minimization**: Collect only necessary data
- **Local Processing**: AI models run locally
- **User Consent**: Explicit consent for data processing
- **Right to Deletion**: Complete data removal capabilities

## 🚀 Deployment Architecture

### Development Environment
```
Local Development:
├── Frontend: http://localhost:5173
├── Backend: http://localhost:5000
└── AI Services: http://localhost:8000
```

### Production Environment
```
Production Deployment:
├── Frontend: CDN + Static Hosting
├── Backend: Load Balanced API Servers
├── AI Services: GPU-Enabled Containers
└── Database: Encrypted Database Cluster
```

### Container Architecture
```yaml
# docker-compose.yml structure
services:
  frontend:
    build: ./frontend
    ports: ["80:80"]
  
  backend:
    build: ./backend
    ports: ["5000:5000"]
    environment:
      - NODE_ENV=production
  
  ai-services:
    build: ./ai-services
    ports: ["8000:8000"]
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: 1
              capabilities: [gpu]
```

## 📈 Scalability & Performance

### Horizontal Scaling
- **Frontend**: CDN distribution and caching
- **Backend**: Load balancer with multiple instances
- **AI Services**: GPU cluster for parallel processing
- **Database**: Read replicas and sharding

### Performance Optimizations
- **Frontend**: Code splitting and lazy loading
- **Backend**: Connection pooling and caching
- **AI Services**: Model optimization and batching
- **Database**: Indexing and query optimization

### Monitoring & Observability
- **Health Checks**: Automated service monitoring
- **Performance Metrics**: Response time tracking
- **Error Tracking**: Comprehensive error logging
- **User Analytics**: Privacy-compliant usage metrics

## 🔧 Configuration Management

### Environment Variables
```bash
# Frontend Configuration
VITE_API_URL=http://localhost:5000
VITE_AI_API_URL=http://localhost:8000

# Backend Configuration
PORT=5000
JWT_SECRET=your_jwt_secret
NODE_ENV=development

# AI Services Configuration
MODEL_PATH=/models
DEVICE=cuda
LOG_LEVEL=INFO
```

### Feature Flags
- **AI Model Selection**: Switch between models
- **Assessment Types**: Enable/disable features
- **Emergency Contacts**: Localized resource management
- **Export Formats**: Control available export options

## 🧪 Testing Architecture

### Testing Strategy
- **Unit Tests**: Individual component testing
- **Integration Tests**: Service interaction testing
- **End-to-End Tests**: Complete user journey testing
- **Performance Tests**: Load and stress testing

### Test Coverage
- **Frontend**: Jest + React Testing Library
- **Backend**: Jest + Supertest
- **AI Services**: pytest + unittest
- **API Tests**: Postman/Newman collections

## 📚 Documentation Architecture

### API Documentation
- **OpenAPI/Swagger**: Auto-generated API docs
- **Postman Collections**: Interactive API testing
- **Code Comments**: Inline documentation
- **Architecture Diagrams**: Visual system overview

### User Documentation
- **User Guides**: Step-by-step instructions
- **FAQ**: Common questions and answers
- **Privacy Policy**: Data handling transparency
- **Terms of Service**: Usage guidelines

---

This architecture supports a scalable, secure, and privacy-focused mental health assessment platform that can grow with user needs while maintaining high performance and reliability.
