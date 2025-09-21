# Mental Health Platform for Students and Professionals

A comprehensive AI-powered mental health assessment and support platform designed for students and working professionals. This platform provides stress measurement, sentiment analysis, personalized recommendations, and location-based healthcare facility discovery.

## 🌟 Features

### Core Functionality
- **AI-Powered Stress Assessment**: Advanced algorithms for measuring stress levels (0-100 scale)
- **Voice Analysis**: Real-time voice sentiment analysis using Whisper and advanced NLP
- **Personalized Recommendations**: AI-generated stress management suggestions via Google Gemini
- **Location-Based Services**: Nearby mental health facilities using Google Maps API
- **Data Export**: Professional PDF reports and CSV data export
- **Multi-User Support**: Separate interfaces for students, professionals, and administrators

### Authentication & Security
- **Google OAuth 2.0**: Primary authentication method
- **Email/Password Fallback**: Manual registration and login
- **Secure Session Management**: JWT-based authentication
- **Privacy Compliance**: GDPR-compliant data handling

### Modern UI/UX
- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **Dark/Light Mode**: User preference-based theming
- **Accessibility**: WCAG 2.1 AA compliance
- **Smooth Animations**: Modern micro-interactions

## 🏗️ Architecture

```
mental-health-platform/
├── frontend/                 # React application (Vite)
│   ├── src/
│   │   ├── components/       # Reusable UI components
│   │   ├── pages/           # Page components
│   │   ├── services/        # API services
│   │   ├── hooks/           # Custom React hooks
│   │   ├── contexts/        # React contexts
│   │   └── utils/           # Utility functions
│   ├── public/              # Static assets
│   └── package.json
├── backend/                  # Node.js/Express API
│   ├── routes/              # API routes
│   ├── models/              # Database models
│   ├── middleware/          # Express middleware
│   ├── controllers/         # Route controllers
│   ├── services/            # Business logic
│   └── server.js
├── ai-services/             # Python AI backend
│   ├── models/              # AI/ML models
│   ├── services/            # AI processing services
│   ├── api/                 # FastAPI endpoints
│   └── requirements.txt
├── database/                # Database management
│   ├── schemas/             # Database schemas
│   ├── migrations/          # Database migrations
│   └── seeds/               # Seed data
├── docs/                    # Documentation
└── docker-compose.yml       # Container orchestration
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Python 3.9+ with conda/pip
- MongoDB 5.0+
- Git

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd mental-health-platform
```

2. **Setup Frontend**
```bash
cd frontend
npm install
npm run dev
```

3. **Setup Backend**
```bash
cd backend
npm install
npm start
```

4. **Setup AI Services**
```bash
cd ai-services
pip install -r requirements.txt
uvicorn app:app --reload --port 8000
```

5. **Access the application**
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000
- AI Services: http://localhost:8000
- API Documentation: http://localhost:8000/docs

## 🔧 Configuration

### Environment Variables

Create `.env` files in each service directory:

**Frontend (.env)**
```
VITE_API_URL=http://localhost:5000
VITE_AI_API_URL=http://localhost:8000
VITE_GOOGLE_CLIENT_ID=your_google_client_id
VITE_GOOGLE_MAPS_API_KEY=AIzaSyBw1lCX08SDNr6pbfcpD3cu7dAqdZjg6qo_DUMMY
```

**Backend (.env)**
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/mental_health_platform
JWT_SECRET=your_jwt_secret
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

**AI Services (.env)**
```
GEMINI_API_KEY=AIzaSyDw1lCX08SDNr6pbfcpD3cu7dAqdZjg6qo
DATABASE_URL=sqlite:///./mental_health.db
```

## 📊 User Roles

### Student Users
- Stress assessments focused on academic pressure
- Study-life balance recommendations
- Campus mental health resources
- Peer support features

### Professional Users
- Work-related stress analysis
- Career burnout prevention
- Work-life balance optimization
- Professional counseling resources

### Administrators
- User management and analytics
- Question set management
- System configuration
- Report generation

## 🧠 AI Capabilities

### Voice Analysis
- Real-time speech-to-text using OpenAI Whisper
- Sentiment analysis from voice patterns
- Stress level detection from vocal characteristics
- Multi-language support (English, Hindi)

### Personalized Recommendations
- Google Gemini AI integration
- Context-aware suggestions
- Adaptive learning from user feedback
- Evidence-based mental health strategies

### Assessment Engine
- DASS-21 compatible scoring
- Weighted multi-factor analysis
- Trend analysis and progress tracking
- Risk level categorization

## 🗺️ Location Services

### Healthcare Facility Discovery
- Google Maps API integration
- Nearby mental health clinics
- Hospital psychiatric departments
- Private practice therapists
- Community counseling centers

### Features
- Real-time location detection
- Distance and rating-based sorting
- Contact information and directions
- User reviews and ratings

## 📈 Data Export

### PDF Reports
- Professional assessment summaries
- Progress charts and trends
- Personalized recommendations
- Historical data analysis

### CSV Export
- Raw assessment data
- Trend analysis data
- Custom date range selection
- Data analysis compatibility

## 🔒 Security & Privacy

### Data Protection
- End-to-end encryption for sensitive data
- GDPR compliance
- User consent management
- Data retention policies

### Authentication Security
- OAuth 2.0 implementation
- JWT token management
- Session security
- Rate limiting

## 🧪 Testing

### Frontend Testing
```bash
cd frontend
npm run test
npm run test:e2e
```

### Backend Testing
```bash
cd backend
npm test
npm run test:integration
```

### AI Services Testing
```bash
cd ai-services
pytest
pytest --cov=.
```

## 📚 Documentation

- [API Documentation](./docs/api.md)
- [User Manual](./docs/user-manual.md)
- [Admin Guide](./docs/admin-guide.md)
- [Developer Guide](./docs/developer-guide.md)
- [Deployment Guide](./docs/deployment.md)

## 🤝 Contributing

Please read our [Contributing Guidelines](./docs/contributing.md) for details on our code of conduct and the process for submitting pull requests.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue on GitHub
- Email: support@mentalhealthplatform.com
- Documentation: [docs.mentalhealthplatform.com](https://docs.mentalhealthplatform.com)

## 🙏 Acknowledgments

- OpenAI Whisper for voice analysis
- Google Gemini for AI recommendations
- Google Maps for location services
- The mental health research community
