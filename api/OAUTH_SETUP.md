# Google OAuth Setup Guide

This guide explains how to set up Google OAuth authentication for the ScheduleEase API.

## Prerequisites

1. A Google Cloud Console project
2. Google OAuth 2.0 credentials (Client ID and Client Secret)

## Google Cloud Console Setup

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API (or Google People API)
4. Go to "Credentials" in the left sidebar
5. Click "Create Credentials" > "OAuth 2.0 Client IDs"
6. Configure the OAuth consent screen if prompted
7. Select "Web application" as the application type
8. Add authorized redirect URIs:
   - Development: `http://localhost:3001/users/auth/google_oauth2/callback`
   - Production: `https://yourdomain.com/users/auth/google_oauth2/callback`

## Environment Variables

Copy the `.env.example` file to `.env` and update the following variables:

```bash
# Google OAuth Configuration
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here

# Frontend URL for OAuth redirects (adjust for your setup)
FRONTEND_URL=http://localhost:3000
```

## API Endpoints

### Initiate OAuth Flow

- **GET** `/auth/google_oauth2` - Redirects to Google OAuth
- **GET** `/api/v1/auth/google` - Alternative API endpoint for OAuth initiation

### OAuth Callback

- **GET** `/users/auth/google_oauth2/callback` - Handles Google OAuth callback
- **GET** `/users/auth/failure` - Handles OAuth failures

## Frontend Integration

### Initiate OAuth from Frontend

```javascript
// Redirect to OAuth
window.location.href = `${API_BASE_URL}/auth/google_oauth2`;

// Or use a popup window
const authWindow = window.open(
  `${API_BASE_URL}/auth/google_oauth2`,
  'oauth',
  'width=500,height=600'
);
```

### Handle OAuth Callback

The API will redirect to your frontend URL with either:

**Success:**
```
${FRONTEND_URL}/auth/callback?token=JWT_TOKEN&success=true
```

**Failure:**
```
${FRONTEND_URL}/auth/callback?success=false&error=ERROR_MESSAGE
```

### Extract JWT Token

```javascript
// In your frontend callback handler
const urlParams = new URLSearchParams(window.location.search);
const token = urlParams.get('token');
const success = urlParams.get('success') === 'true';

if (success && token) {
  // Store token and redirect to dashboard
  localStorage.setItem('authToken', token);
  window.location.href = '/dashboard';
} else {
  // Handle error
  const error = urlParams.get('error');
  console.error('OAuth failed:', error);
}
```

## API Response Format

### Successful Authentication

```json
{
  "message": "Successfully authenticated with Google",
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "role": "client",
    "timezone": "UTC",
    "created_at": "2023-01-01T00:00:00.000Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Failed Authentication

```json
{
  "message": "Could not authenticate with Google",
  "errors": ["Email already exists", "..."]
}
```

## Usage with JWT

Include the JWT token in your API requests:

```javascript
const response = await fetch(`${API_BASE_URL}/api/v1/users/me`, {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});
```

## Security Notes

1. Always use HTTPS in production
2. Validate the `state` parameter to prevent CSRF attacks (if implementing custom flows)
3. Store JWT tokens securely (consider using httpOnly cookies for web apps)
4. Set appropriate token expiration times
5. Implement token refresh logic for long-lived applications

## Troubleshooting

### Common Issues

1. **"Invalid redirect URI"** - Check that your redirect URI in Google Console exactly matches your application URL
2. **"Invalid client ID"** - Verify your `GOOGLE_CLIENT_ID` environment variable
3. **"Access blocked"** - Your OAuth consent screen may need verification for production use
4. **CORS errors** - Ensure your frontend domain is properly configured in CORS settings

### Debug Mode

Enable Rails logging to see OAuth flow details:

```ruby
# In config/environments/development.rb
config.log_level = :debug
```

## Testing

You can test the OAuth flow by visiting:
```
http://localhost:3001/auth/google_oauth2
```

This should redirect you to Google's OAuth consent screen. 