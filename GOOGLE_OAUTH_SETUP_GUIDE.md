# Google OAuth 2.0 Setup Guide for MStress Platform

## 🔧 **GOOGLE CLOUD CONSOLE CONFIGURATION**

### **Step 1: Create Google Cloud Project**

1. **Go to Google Cloud Console**: https://console.cloud.google.com/
2. **Create New Project**:
   - Click "Select a project" → "New Project"
   - Project name: `MStress Mental Health Platform`
   - Organization: Your organization (optional)
   - Click "Create"

### **Step 2: Enable Google+ API**

1. **Navigate to APIs & Services**:
   - Go to "APIs & Services" → "Library"
   - Search for "Google+ API" or "People API"
   - Click "Enable"

### **Step 3: Configure OAuth Consent Screen**

1. **Go to OAuth Consent Screen**:
   - Navigate to "APIs & Services" → "OAuth consent screen"
   - Choose "External" for public app or "Internal" for organization-only
   - Click "Create"

2. **Fill Required Information**:
   ```
   App name: MStress Mental Health Platform
   User support email: your-email@domain.com
   App logo: (Optional - upload MStress logo)
   App domain: http://localhost:5173 (for development)
   Authorized domains: localhost (for development)
   Developer contact: your-email@domain.com
   ```

3. **Scopes Configuration**:
   - Add scopes: `email`, `profile`, `openid`
   - These are required for basic user information

4. **Test Users** (for development):
   - Add your email addresses for testing
   - Add: `iib2024017@iiita.ac.in` (admin user)

### **Step 4: Create OAuth 2.0 Credentials**

1. **Go to Credentials**:
   - Navigate to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "OAuth 2.0 Client IDs"

2. **Configure OAuth Client**:
   ```
   Application type: Web application
   Name: MStress Frontend Client
   
   Authorized JavaScript origins:
   - http://localhost:5173 (development)
   - https://yourdomain.com (production)
   
   Authorized redirect URIs:
   - http://localhost:5173 (development)
   - https://yourdomain.com (production)
   ```

3. **Save Client ID**:
   - Copy the generated Client ID (format: `xxxxx.apps.googleusercontent.com`)
   - Keep the Client Secret secure (not needed for frontend OAuth)

## 🔧 **MSTRESS PLATFORM CONFIGURATION**

### **Step 1: Environment Variables Setup**

Create `.env` file in `/frontend` directory:
```bash
# Frontend Environment Variables (Vite format)
VITE_GOOGLE_CLIENT_ID=your-actual-client-id.apps.googleusercontent.com
VITE_API_URL=http://localhost:5000
```

Create `.env` file in `/backend` directory:
```bash
# Backend Environment Variables
GOOGLE_CLIENT_ID=your-actual-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
NODE_ENV=development
JWT_SECRET=your-jwt-secret-key
MONGODB_URI=mongodb://localhost:27017/MStress
```

### **Step 2: Update Frontend Configuration**

The App.jsx is already configured to use environment variables:
```javascript
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "demo-client-id-for-development";
```

### **Step 3: Verify Backend Configuration**

The backend OAuth endpoint is configured at:
```
POST /api/auth/google/verify
GET /api/auth/google/health (for testing)
```

## 🧪 **TESTING OAUTH INTEGRATION**

### **Step 1: Test Backend Health**

```bash
curl http://localhost:5000/api/auth/google/health
```

Expected response:
```json
{
  "success": true,
  "message": "Google OAuth endpoint is available",
  "timestamp": "2025-08-23T...",
  "environment": "development"
}
```

### **Step 2: Test Frontend OAuth Button**

1. **Start Development Servers**:
   ```bash
   # Backend
   cd backend && npm start
   
   # Frontend
   cd frontend && npm run dev
   ```

2. **Navigate to Login Page**: http://localhost:5173/login
3. **Check Console**: Should see "Google OAuth script loaded successfully"
4. **Click Google Sign-In**: Should open Google authentication popup

### **Step 3: Test Complete OAuth Flow**

1. **Click "Sign in with Google"**
2. **Authenticate with Google**: Use test user account
3. **Verify Token Exchange**: Check browser network tab for `/api/auth/google/verify` request
4. **Confirm User Creation**: Check MongoDB for new user with `authProvider: 'google'`

## 🔧 **TROUBLESHOOTING COMMON ISSUES**

### **Error: "invalid_client - The OAuth client was not found"**

**Cause**: Incorrect or missing Google Client ID
**Solution**:
1. Verify Client ID in Google Cloud Console
2. Check environment variable `REACT_APP_GOOGLE_CLIENT_ID`
3. Ensure Client ID format: `xxxxx.apps.googleusercontent.com`

### **Error: "redirect_uri_mismatch"**

**Cause**: Redirect URI not authorized in Google Cloud Console
**Solution**:
1. Add `http://localhost:5173` to authorized JavaScript origins
2. Add `http://localhost:5173` to authorized redirect URIs
3. Wait 5-10 minutes for changes to propagate

### **Error: "access_denied"**

**Cause**: User not added to test users or app not verified
**Solution**:
1. Add user email to test users in OAuth consent screen
2. For production, submit app for verification

### **Error: "Provided button width is invalid: 100%"**

**Cause**: Invalid width parameter in GoogleLogin component
**Solution**: Already fixed - using `width={320}` instead of `width="100%"`

### **Console Error: "[GSI_LOGGER]: The given client ID is not found"**

**Cause**: Client ID not properly loaded or invalid
**Solution**:
1. Check `.env` file exists and has correct Client ID
2. Restart development server after adding environment variables
3. Verify Client ID in browser developer tools

## 🚀 **PRODUCTION DEPLOYMENT**

### **Step 1: Update OAuth Consent Screen**

1. **Add Production Domain**:
   - Authorized domains: `yourdomain.com`
   - App domain: `https://yourdomain.com`

2. **Submit for Verification** (if needed):
   - Required for apps with >100 users
   - Provide privacy policy and terms of service

### **Step 2: Update OAuth Credentials**

1. **Add Production URLs**:
   ```
   Authorized JavaScript origins:
   - https://yourdomain.com
   
   Authorized redirect URIs:
   - https://yourdomain.com
   ```

### **Step 3: Update Environment Variables**

Production `.env` files:
```bash
# Frontend (Vite format)
VITE_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
VITE_API_URL=https://api.yourdomain.com

# Backend
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
NODE_ENV=production
JWT_SECRET=your-secure-production-jwt-secret
MONGODB_URI=mongodb://your-production-mongodb-uri
```

## 📋 **QUICK SETUP CHECKLIST**

- [ ] Create Google Cloud Project
- [ ] Enable Google+ API or People API
- [ ] Configure OAuth consent screen
- [ ] Create OAuth 2.0 credentials
- [ ] Add authorized JavaScript origins and redirect URIs
- [ ] Copy Client ID to frontend `.env` file
- [ ] Test backend health endpoint
- [ ] Test OAuth button loading
- [ ] Test complete authentication flow
- [ ] Verify user creation in MongoDB

## 🔗 **USEFUL LINKS**

- **Google Cloud Console**: https://console.cloud.google.com/
- **OAuth 2.0 Playground**: https://developers.google.com/oauthplayground/
- **Google Identity Documentation**: https://developers.google.com/identity/gsi/web
- **React OAuth Google Library**: https://www.npmjs.com/package/@react-oauth/google

---

**Note**: For development testing, you can use the demo configuration, but for production deployment, you must configure a real Google OAuth 2.0 client ID following this guide.
