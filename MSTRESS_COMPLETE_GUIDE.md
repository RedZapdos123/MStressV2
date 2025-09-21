# MStress - Complete Mental Health Assessment Platform

![MStress Platform](assets/logo.jpg)

**MStress** is a comprehensive mental health assessment platform that combines evidence-based psychological assessments with cutting-edge AI technologies including facial emotion recognition, questionnaire analysis, and personalized recommendations.

## 🌟 **PLATFORM OVERVIEW**

### **Dual Assessment Methods**
MStress provides two primary assessment approaches:

1. **Standard Questionnaire Assessment**
   - Traditional validated psychological questionnaires
   - Evidence-based stress measurement scales
   - Quick 10-15 minute assessments
   - Immediate AI-powered analysis

2. **Comprehensive Multi-Modal Assessment**
   - Questionnaire responses + Facial emotion recognition
   - Advanced computer vision analysis
   - Enhanced accuracy through multiple data sources
   - Privacy-protected local image processing

### **Target Users**
- **Students**: Academic stress, exam anxiety, social pressures
- **Professionals**: Work-life balance, career stress, burnout assessment
- **Healthcare Providers**: Patient assessment tools and analytics
- **Administrators**: Platform management and user oversight

## 🚀 **KEY FEATURES**

### **Assessment Technologies**
- ✅ **Facial Emotion Recognition**: Real-time emotion analysis using OpenCV and PyTorch
- ✅ **Questionnaire Analysis**: Validated psychological assessment tools
- ✅ **AI-Powered Insights**: Personalized recommendations and stress level analysis
- ✅ **Progress Tracking**: Long-term mental health trend monitoring
- ✅ **Crisis Support Integration**: Emergency contact resources and professional referrals

### **Technical Capabilities**
- ✅ **Multi-Service Architecture**: React frontend, Node.js backend, Python AI services
- ✅ **Real-Time Processing**: Live facial emotion analysis with immediate feedback
- ✅ **Privacy-First Design**: Local image processing, no permanent storage
- ✅ **Responsive UI**: Mobile-first design with accessibility compliance
- ✅ **Data Export**: PDF reports, CSV data export, progress charts
- ✅ **Interactive Analytics**: Chart.js visualizations with export capabilities

### **Security & Privacy**
- ✅ **HIPAA Compliance**: Secure data handling and encryption
- ✅ **Local Processing**: Facial images processed locally, not stored
- ✅ **Secure Authentication**: JWT-based session management
- ✅ **Data Protection**: Encrypted storage and transmission

## 🏗️ **ARCHITECTURE**

### **Three-Service Architecture**
```
┌─────────────────────┐    ┌─────────────────────┐    ┌─────────────────────┐
│     Frontend        │    │      Backend        │    │   AI Services       │
│   React + Vite      │◄──►│  Node.js + Express  │◄──►│ Python + FastAPI    │
│   Port: 5173        │    │    Port: 5000       │    │   Port: 8000        │
│                     │    │                     │    │                     │
│ • Assessment UI     │    │ • API Gateway       │    │ • Facial Emotion    │
│ • Camera Interface  │    │ • Authentication    │    │ • Assessment Analysis│
│ • Results Display   │    │ • Data Management   │    │ • Recommendations   │
│ • Analytics Charts  │    │ • Health Checks     │    │ • Computer Vision   │
└─────────────────────┘    └─────────────────────┘    └─────────────────────┘
```

### **Component Structure**
```
MStress/
├── frontend/                    # React Application
│   ├── src/
│   │   ├── components/
│   │   │   ├── AssessmentForm.jsx
│   │   │   ├── FacialEmotionCapture.jsx
│   │   │   ├── ComprehensiveAssessment.jsx
│   │   │   ├── charts/
│   │   │   │   ├── StressTrendChart.jsx
│   │   │   │   └── AdminAnalyticsChart.jsx
│   │   │   └── layout/
│   │   │       ├── Header.jsx
│   │   │       └── Footer.jsx
│   │   ├── pages/
│   │   │   ├── HomePage.jsx
│   │   │   ├── AssessmentPage.jsx
│   │   │   ├── DashboardPage.jsx
│   │   │   └── ResultsPage.jsx
│   │   └── contexts/
│   │       └── AuthContext.jsx
├── backend/                     # Node.js API Server
│   ├── controllers/
│   │   └── assessmentController.js
│   ├── routes/
│   │   └── assessments.js
│   ├── models/                  # Database models
│   └── server.js
├── ai-services/                 # Python AI Services
│   ├── models/
│   │   ├── facial_behavior_analyzer.py
│   │   └── comprehensive_assessment_controller.py
│   ├── services/
│   │   ├── facial_emotion_service.py
│   │   └── assessment_service.py
│   ├── main.py
│   └── requirements.txt
└── scripts/
    └── health-check.js
```

## 🚀 **QUICK START GUIDE**

### **Prerequisites**
- **Node.js** v18.0.0+
- **Python** v3.9.0+
- **npm** v8.0.0+
- **Git** (for cloning)

### **Installation Steps**

1. **Clone and Setup**
   ```bash
   git clone <repository-url>
   cd MStress
   ```

2. **Install Backend Dependencies**
   ```bash
   cd backend
   npm install express cors dotenv express-validator axios
   cd ..
   ```

3. **Install Frontend Dependencies**
   ```bash
   cd frontend
   npm install
   cd ..
   ```

4. **Install AI Services Dependencies**
   ```bash
   cd ai-services
   pip install -r requirements.txt
   cd ..
   ```

### **Starting the Platform**

#### **Method 1: Individual Services (Recommended)**

**Terminal 1 - Backend:**
```bash
cd backend
node server.js
```
✅ Backend running on http://localhost:5000

**Terminal 2 - AI Services:**
```bash
cd ai-services
python main.py
```
✅ AI Services running on http://localhost:8000

**Terminal 3 - Frontend:**
```bash
cd frontend
npm run dev
```
✅ Frontend running on http://localhost:5173

#### **Method 2: Health Check**
```bash
node scripts/health-check.js
```

Expected output:
```
🏥 MStress Platform Health Check
================================
✅ Backend API is running (200)
✅ AI Services is running (200)
✅ Frontend is running
📊 All services are healthy
```

## 🧪 **TESTING THE PLATFORM**

### **Complete User Workflow Test**

1. **Access the Platform**
   - Open browser: http://localhost:5173
   - Click "Get Started" to register

2. **Standard Assessment**
   - Navigate to "Assessment"
   - Select "Standard Stress Assessment"
   - Complete questionnaire (15-20 questions)
   - View results and recommendations

3. **Comprehensive Assessment with Facial Emotion**
   - Select "Comprehensive Stress Assessment"
   - Complete questionnaire
   - Allow camera access for facial emotion capture
   - Take photo for emotion analysis
   - Review combined results

4. **Dashboard Analytics**
   - View progress tracking charts
   - Export data as PDF/CSV
   - Review historical assessments

### **API Testing**

**Test Backend Health:**
```bash
curl http://localhost:5000/api/health
```

**Test AI Services:**
```bash
curl http://localhost:8000/health
```

**Test Assessment Endpoints:**
```bash
curl http://localhost:5000/api/assessments/types
curl http://localhost:5000/api/assessments/health
```

## 📊 **FACIAL EMOTION RECOGNITION**

### **Technology Stack**
- **Computer Vision**: OpenCV for face detection
- **Deep Learning**: PyTorch CNN for emotion classification
- **Emotion Categories**: Happy, Sad, Angry, Fear, Surprise, Disgust, Neutral
- **Stress Mapping**: Emotions mapped to stress indicators

### **Privacy & Security**
- **Local Processing**: Images processed in browser/local server
- **No Storage**: Photos not permanently stored
- **Encrypted Transmission**: Secure data transfer
- **User Consent**: Explicit permission required

### **Accuracy & Reliability**
- **Multi-Frame Analysis**: Multiple emotion samples for accuracy
- **Confidence Scoring**: Reliability metrics provided
- **Fallback Mechanisms**: Graceful degradation if camera unavailable
- **Mock Data Support**: Testing without camera access

## 📈 **ANALYTICS & REPORTING**

### **User Analytics**
- Stress level trends over time
- Assessment completion rates
- Improvement tracking
- Category-specific insights

### **Admin Analytics**
- Platform usage statistics
- User engagement metrics
- Assessment type popularity
- System performance monitoring

### **Export Capabilities**
- PDF assessment reports
- CSV data export
- Chart image downloads
- Historical data archives

## 🔧 **CONFIGURATION**

### **Environment Variables**

**Backend (.env):**
```env
PORT=5000
NODE_ENV=development
AI_SERVICES_URL=http://localhost:8000
```

**Frontend (.env):**
```env
VITE_API_BASE_URL=http://localhost:5000/api
VITE_AI_SERVICES_URL=http://localhost:8000
```

**AI Services (.env):**
```env
PORT=8000
ENVIRONMENT=development
MODEL_PATH=models/emotion_model.pth
```

## 🛠️ **DEVELOPMENT**

### **Adding New Assessment Types**
1. Update assessment types in `backend/routes/assessments.js`
2. Add questions to the questions endpoint
3. Update frontend assessment selection
4. Test with new assessment flow

### **Extending Facial Emotion Recognition**
1. Train new emotion models in `ai-services/models/`
2. Update emotion categories in `facial_emotion_service.py`
3. Modify stress mapping algorithms
4. Test with diverse facial expressions

### **Customizing UI Components**
1. Modify components in `frontend/src/components/`
2. Update styling with Tailwind CSS classes
3. Test responsive design across devices
4. Ensure accessibility compliance

## 🆘 **TROUBLESHOOTING**

### **Common Issues**

**Camera Access Denied:**
- Ensure HTTPS or localhost access
- Check browser permissions
- Verify camera hardware availability

**AI Services Not Starting:**
- Install Python dependencies: `pip install -r requirements.txt`
- Check Python version compatibility
- Verify PyTorch installation

**Backend API Errors:**
- Check Node.js version
- Install missing dependencies
- Verify port availability (5000)

**Frontend Build Issues:**
- Clear npm cache: `npm cache clean --force`
- Delete node_modules and reinstall
- Check Vite configuration

### **Performance Optimization**
- Use GPU acceleration for AI services if available
- Optimize image resolution for facial analysis
- Implement caching for repeated assessments
- Monitor memory usage during processing

## 🎯 **PRODUCTION DEPLOYMENT**

### **Security Checklist**
- [ ] Enable HTTPS for all services
- [ ] Configure proper CORS policies
- [ ] Set up authentication middleware
- [ ] Implement rate limiting
- [ ] Enable logging and monitoring
- [ ] Configure backup systems

### **Scalability Considerations**
- Containerize services with Docker
- Implement load balancing
- Set up database clustering
- Configure CDN for static assets
- Monitor resource usage

## 📞 **SUPPORT & RESOURCES**

### **Crisis Support Integration**
- **National Suicide Prevention Lifeline**: 988
- **Crisis Text Line**: Text HOME to 741741
- **Emergency Services**: 911

### **Professional Resources**
- Mental health provider directory
- Telehealth platform integration
- Professional referral system
- Crisis intervention protocols

---

**MStress Platform** - Advancing mental health through technology 💙

*Built with React, Node.js, Python, OpenCV, PyTorch, and modern web technologies*
