## 🔐 **Setting Up Google OAuth Credentials**

### **Step 1: Create Google OAuth Application**

1. **Go to Google Cloud Console**: https://console.cloud.google.com/
2. **Create or Select Project**: Choose an existing project or create a new one
3. **Enable Google+ API**:
   - Go to "APIs & Services" → "Library"
   - Search for "Google+ API" and enable it
4. **Create OAuth 2.0 Credentials**:
   - Go to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "OAuth 2.0 Client ID"
   - Choose "Web application"
   - Set the following redirect URIs:
     ```
     http://localhost:3001/auth/google_oauth2/callback
     http://localhost:3000/auth/google_oauth2/callback
     ```

### **Step 2: Copy Your Credentials**

After creating the OAuth client, Google will provide you with:
- **Client ID**: Something like `123456789-abcdefghijklmnop.apps.googleusercontent.com`
- **Client Secret**: Something like `GOCSPX-abcdefghijklmnop`

### **Step 3: Create Environment File**

Let me create a `.env` file for you:
Ran tool
Let me create the .env file using a different approach:
```bash

```
I apologize for the confusion. Let me provide you with the complete instructions for setting up your Google OAuth credentials manually:

## 🔐 **Complete Google OAuth Setup Instructions**

### **Step 1: Create Google OAuth Application**

1. **Visit Google Cloud Console**: https://console.cloud.google.com/
2. **Create/Select Project**: 
   - If you don't have a project, click "Create Project"
   - Name it something like "ScheduleEase App"
3. **Enable Google+ API**:
   - Navigate to "APIs & Services" → "Library"
   - Search for "Google+ API" 
   - Click on it and press "Enable"
4. **Configure OAuth Consent Screen**:
   - Go to "APIs & Services" → "OAuth consent screen"
   - Choose "External" (unless you have a G Suite domain)
   - Fill in required fields:
     - App name: "ScheduleEase"
     - User support email: your email
     - Developer contact: your email
5. **Create OAuth 2.0 Credentials**:
   - Go to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "OAuth 2.0 Client ID"
   - Application type: "Web application"
   - Name: "ScheduleEase Web Client"
   - **Authorized JavaScript origins**:
     ```
     http://localhost:3000
     http://localhost:3001
     ```
   - **Authorized redirect URIs**:
     ```
     http://localhost:3001/auth/google_oauth2/callback
     http://localhost:3000/auth/google_oauth2/callback
     ```

### **Step 2: Get Your Credentials**

After creating the OAuth client, Google will show you:
- **Client ID**: `123456789-abc123def456ghi789.apps.googleusercontent.com`
- **Client Secret**: `GOCSPX-abc123def456ghi789jkl012`

**⚠️ Important**: Copy these immediately and store them securely!

### **Step 3: Create Your .env File**

**Manually create a `.env` file** in your project root directory with this content:

```bash
# Database Configuration
DB_HOST=postgres
DB_PORT=5432
DB_NAME=scheduleease_development
DB_USERNAME=scheduleease
DB_PASSWORD=password
JWT_SECRET=your_jwt_secret_key_here_change_in_production

# Google OAuth Configuration
# Replace with your actual credentials from Google Cloud Console
GOOGLE_CLIENT_ID=YOUR_ACTUAL_CLIENT_ID_HERE
GOOGLE_CLIENT_SECRET=YOUR_ACTUAL_CLIENT_SECRET_HERE

# Frontend URL for OAuth redirects
FRONTEND_URL=http://localhost:3000
```

**Replace the placeholders**:
- `YOUR_ACTUAL_CLIENT_ID_HERE` → Your actual Google Client ID
- `YOUR_ACTUAL_CLIENT_SECRET_HERE` → Your actual Google Client Secret

### **Step 4: Verify Setup**

1. **Copy the template**:
   ```bash
   cp env.example .env
   ```

2. **Edit the .env file** and replace the Google OAuth placeholders with your actual credentials

3. **Test the setup**:
   ```bash
   docker-compose up api
   ```

### **Step 5: Security Notes**

1. **Never commit .env to git** - It's already in `.gitignore`
2. **Use different credentials for production**
3. **Restrict your OAuth credentials** to only the domains you need

### **Step 6: OAuth Flow Endpoints**

Once set up, these endpoints will be available:

- **Initiate OAuth**: `GET http://localhost:3001/auth/google_oauth2`
- **OAuth Callback**: `GET http://localhost:3001/auth/google_oauth2/callback`
- **OAuth Info**: `GET http://localhost:3001/auth/info` (shows current user)

### **Example Integration in Frontend**

```javascript
// Initiate Google OAuth login
const handleGoogleLogin = () => {
  window.location.href = 'http://localhost:3001/auth/google_oauth2';
};
```

### **Testing the Setup**

After setting up your credentials, you can test by:

1. Starting your Rails API server
2. Visiting `http://localhost:3001/auth/google_oauth2` in your browser
3. It should redirect you to Google's OAuth consent screen

Would you like me to help you with any specific part of this setup process?