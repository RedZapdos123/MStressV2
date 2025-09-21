# MStress Platform - Deployment Guide

## 🚀 **Production Deployment Instructions**

### **System Requirements**
- **Node.js**: 16.0.0 or higher
- **Python**: 3.8 or higher
- **MongoDB**: 4.4 or higher
- **RAM**: 8GB minimum (16GB recommended)
- **Storage**: 20GB minimum
- **GPU**: Optional (for faster AI processing)

### **Environment Setup**

#### **1. Clone and Setup**
```bash
git clone <repository-url>
cd MStress
```

#### **2. Frontend Setup**
```bash
cd frontend
npm install
npm run build
```

#### **3. Backend Setup**
```bash
cd ../backend
npm install
```

#### **4. AI Services Setup**
```bash
cd ../ai-services
pip install -r requirements.txt
```

### **Environment Variables**

#### **Backend (.env)**
```env
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb://localhost:27017/mstress
JWT_SECRET=your-super-secure-jwt-secret-key
AI_SERVICES_URL=http://localhost:8000
CORS_ORIGIN=https://yourdomain.com
```

#### **AI Services (.env)**
```env
MODEL_PATH=/app/models
DEVICE=cuda  # or cpu
LOG_LEVEL=INFO
MAX_WORKERS=4
```

### **Production Deployment**

#### **Option 1: Docker Deployment**
```yaml
# docker-compose.yml
version: '3.8'
services:
  frontend:
    build: ./frontend
    ports:
      - "80:80"
    environment:
      - VITE_API_URL=https://api.yourdomain.com
      - VITE_AI_API_URL=https://ai.yourdomain.com

  backend:
    build: ./backend
    ports:
      - "5000:5000"
    environment:
      - NODE_ENV=production
      - MONGODB_URI=mongodb://mongo:27017/mstress
      - JWT_SECRET=${JWT_SECRET}
    depends_on:
      - mongo

  ai-services:
    build: ./ai-services
    ports:
      - "8000:8000"
    environment:
      - DEVICE=cuda
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: 1
              capabilities: [gpu]

  mongo:
    image: mongo:4.4
    volumes:
      - mongo_data:/data/db
    environment:
      - MONGO_INITDB_DATABASE=mstress

volumes:
  mongo_data:
```

#### **Option 2: Traditional Server Deployment**

**1. Install Dependencies**
```bash
# Install Node.js, Python, MongoDB
sudo apt update
sudo apt install nodejs npm python3 python3-pip mongodb

# Install PM2 for process management
npm install -g pm2
```

**2. Setup Services**
```bash
# Start MongoDB
sudo systemctl start mongodb
sudo systemctl enable mongodb

# Setup Backend
cd backend
npm install --production
pm2 start server.js --name mstress-backend

# Setup AI Services
cd ../ai-services
pip install -r requirements.txt
pm2 start "python main.py" --name mstress-ai

# Setup Frontend (with Nginx)
cd ../frontend
npm run build
sudo cp -r dist/* /var/www/html/
```

**3. Nginx Configuration**
```nginx
# /etc/nginx/sites-available/mstress
server {
    listen 80;
    server_name yourdomain.com;

    # Frontend
    location / {
        root /var/www/html;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api/ {
        proxy_pass http://localhost:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # AI Services
    location /ai/ {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### **Security Configuration**

#### **1. SSL/TLS Setup**
```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d yourdomain.com
```

#### **2. Firewall Configuration**
```bash
# Configure UFW
sudo ufw allow 22    # SSH
sudo ufw allow 80    # HTTP
sudo ufw allow 443   # HTTPS
sudo ufw enable
```

#### **3. MongoDB Security**
```javascript
// Create admin user
use admin
db.createUser({
  user: "admin",
  pwd: "secure-password",
  roles: ["userAdminAnyDatabase"]
})

// Create application user
use mstress
db.createUser({
  user: "mstress_user",
  pwd: "secure-app-password",
  roles: ["readWrite"]
})
```

### **Monitoring & Maintenance**

#### **1. Health Checks**
```bash
# Check service status
pm2 status

# Check logs
pm2 logs mstress-backend
pm2 logs mstress-ai

# Monitor resources
pm2 monit
```

#### **2. Backup Strategy**
```bash
# Database backup
mongodump --db mstress --out /backup/$(date +%Y%m%d)

# Application backup
tar -czf /backup/mstress-app-$(date +%Y%m%d).tar.gz /path/to/mstress
```

#### **3. Log Rotation**
```bash
# Setup logrotate
sudo nano /etc/logrotate.d/mstress

/var/log/mstress/*.log {
    daily
    rotate 30
    compress
    delaycompress
    missingok
    notifempty
    create 644 www-data www-data
}
```

### **Performance Optimization**

#### **1. Database Indexing**
```javascript
// Create indexes for better performance
db.users.createIndex({ email: 1 })
db.assessments.createIndex({ user: 1, createdAt: -1 })
db.assessments.createIndex({ "results.stressLevel": 1 })
```

#### **2. Caching Strategy**
```javascript
// Redis for session caching
const redis = require('redis');
const client = redis.createClient();

// Cache frequently accessed data
app.use('/api', cacheMiddleware);
```

#### **3. Load Balancing**
```nginx
# Nginx load balancing
upstream backend {
    server localhost:5000;
    server localhost:5001;
    server localhost:5002;
}

upstream ai_services {
    server localhost:8000;
    server localhost:8001;
}
```

### **Scaling Considerations**

#### **1. Horizontal Scaling**
- Use multiple backend instances behind load balancer
- Scale AI services based on processing demand
- Implement database sharding for large datasets

#### **2. Vertical Scaling**
- Increase server resources for AI processing
- Use GPU acceleration for faster model inference
- Optimize database queries and indexing

#### **3. CDN Integration**
- Use CDN for static assets
- Cache API responses where appropriate
- Implement edge computing for global users

### **Troubleshooting**

#### **Common Issues**
1. **AI Models Not Loading**: Check model file paths and permissions
2. **Database Connection**: Verify MongoDB connection string and credentials
3. **CORS Errors**: Update CORS configuration for production domain
4. **Memory Issues**: Monitor and adjust Node.js heap size

#### **Debug Commands**
```bash
# Check service logs
journalctl -u nginx
pm2 logs --lines 100

# Test API endpoints
curl -X GET http://localhost:5000/api/health
curl -X GET http://localhost:8000/health

# Monitor system resources
htop
df -h
free -m
```

---

**This deployment guide ensures a secure, scalable, and maintainable production deployment of the MStress mental health assessment platform.**
