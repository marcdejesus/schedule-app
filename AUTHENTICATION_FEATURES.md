# Authentication Features Implementation

This document outlines the password reset, email verification, and session management features implemented for the ScheduleEase application.

## Features Implemented

### 1. Email Verification (Confirmable)
- **Backend**: Devise confirmable module enabled with custom controllers
- **Frontend**: Email confirmation page with token verification
- **Features**:
  - Email confirmation required for new users
  - Resend confirmation emails
  - Auto-confirm OAuth users
  - Custom email templates
  - Background job processing for emails

### 2. Password Reset
- **Backend**: Custom password reset controllers with enhanced security
- **Frontend**: Forgot password and reset password pages
- **Features**:
  - Request password reset via email
  - Token-based password reset with expiration
  - Rate limiting to prevent abuse
  - Password strength validation
  - Background job processing for emails

### 3. Session Management
- **Backend**: Enhanced session tracking with JWT tokens
- **Frontend**: Session info display and management
- **Features**:
  - Track sign-in count and timestamps
  - IP address logging
  - Remember me functionality
  - Logout all sessions
  - Session information API

## Backend Implementation

### Models

#### User Model (`app/models/user.rb`)
- Added confirmable and trackable modules to Devise
- Custom methods for email verification status
- Password reset validation
- Session management helpers

### Controllers

#### Password Reset (`app/controllers/users/passwords_controller.rb`)
- Custom Devise password controller for JSON API
- Rate limiting protection
- Background job integration

#### Email Confirmation (`app/controllers/users/confirmations_controller.rb`)
- Custom Devise confirmation controller for JSON API
- Token verification endpoints
- Resend confirmation functionality

#### Session Management (`app/controllers/api/v1/sessions_controller.rb`)
- JWT token generation
- Session tracking and management
- Multiple session logout

### API Auth Controllers

#### API Password Reset (`app/controllers/api/v1/auth/passwords_controller.rb`)
- RESTful API for password reset
- Token verification endpoint
- Enhanced error handling

#### API Email Confirmation (`app/controllers/api/v1/auth/confirmations_controller.rb`)
- RESTful API for email confirmation
- Token verification and resend functionality

### Mailers

#### User Mailer (`app/mailers/user_mailer.rb`)
- Welcome email
- Password reset instructions
- Email confirmation instructions
- Password change notifications
- Responsive HTML email templates

### Background Jobs

#### Email Jobs
- `PasswordResetJob`: Sends password reset emails
- `PasswordChangedJob`: Sends password change notifications
- `EmailConfirmationJob`: Sends email confirmation instructions
- `EmailConfirmationSuccessJob`: Sends confirmation success notifications

### Database Migrations

#### User Confirmable Fields
- `confirmation_token`: Unique token for email confirmation
- `confirmed_at`: Timestamp when email was confirmed
- `confirmation_sent_at`: When confirmation email was sent
- `unconfirmed_email`: For email change confirmations

#### User Trackable Fields
- `sign_in_count`: Number of sign-ins
- `current_sign_in_at`: Current sign-in timestamp
- `last_sign_in_at`: Previous sign-in timestamp
- `current_sign_in_ip`: Current sign-in IP address
- `last_sign_in_ip`: Previous sign-in IP address

## Frontend Implementation

### Pages

#### Forgot Password (`frontend/src/pages/forgot-password.tsx`)
- Email input form
- Success/error messaging
- Links to login and register

#### Reset Password (`frontend/src/pages/reset-password.tsx`)
- Token verification on page load
- Password and confirmation inputs
- Password strength validation
- Auto-redirect after success

#### Email Confirmation (`frontend/src/pages/confirm-email.tsx`)
- Token verification and confirmation
- Resend confirmation functionality
- Success/error states
- Auto-redirect to dashboard

### API Client (`frontend/src/lib/auth.ts`)
- Extended authentication API functions
- Password reset methods
- Email confirmation methods
- Session management methods
- Error handling with custom AuthError class

## API Endpoints

### Password Reset
```
POST /api/v1/auth/password/reset          # Request password reset
PUT  /api/v1/auth/password/reset          # Reset password with token
GET  /api/v1/auth/password/reset/verify   # Verify reset token
```

### Email Confirmation
```
POST /api/v1/auth/email/resend_confirmation # Resend confirmation email
GET  /api/v1/auth/email/confirm             # Confirm email with token
GET  /api/v1/auth/email/verify              # Verify confirmation token
```

### Session Management
```
GET    /api/v1/sessions         # Get session info
POST   /api/v1/sessions         # Sign in
DELETE /api/v1/sessions         # Sign out
DELETE /api/v1/sessions/all     # Sign out all sessions
GET    /api/v1/sessions/current # Get current user and session
```

## Configuration

### Email Configuration

#### Development (`config/environments/development.rb`)
```ruby
config.action_mailer.raise_delivery_errors = true
config.action_mailer.delivery_method = :smtp
config.action_mailer.default_url_options = { host: 'localhost', port: 3002 }

config.action_mailer.smtp_settings = {
  address: ENV.fetch('SMTP_ADDRESS', 'smtp.gmail.com'),
  port: ENV.fetch('SMTP_PORT', 587).to_i,
  domain: ENV.fetch('SMTP_DOMAIN', 'gmail.com'),
  user_name: ENV.fetch('SMTP_USERNAME', nil),
  password: ENV.fetch('SMTP_PASSWORD', nil),
  authentication: 'plain',
  enable_starttls_auto: true
}
```

### Devise Configuration (`config/initializers/devise.rb`)
```ruby
config.mailer_sender = ENV.fetch('MAILER_FROM_EMAIL', 'noreply@scheduleease.app')
config.confirm_within = 3.days
config.reconfirmable = true
config.reset_password_within = 6.hours
```

## Environment Variables

### Required for Email Functionality
```bash
# SMTP Configuration
SMTP_ADDRESS=smtp.gmail.com
SMTP_PORT=587
SMTP_DOMAIN=gmail.com
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-password

# Mailer Configuration
MAILER_FROM_EMAIL=noreply@scheduleease.app
FRONTEND_URL=http://localhost:3000
```

## Usage Examples

### Request Password Reset
```javascript
try {
  await authApi.requestPasswordReset('user@example.com');
  // Show success message
} catch (error) {
  // Handle error
}
```

### Reset Password
```javascript
try {
  await authApi.resetPassword(token, newPassword, passwordConfirmation);
  // Redirect to login
} catch (error) {
  // Handle error
}
```

### Confirm Email
```javascript
try {
  const result = await authApi.confirmEmail(token);
  // Show success, redirect to dashboard
} catch (error) {
  // Handle error, show resend option
}
```

## Security Features

### Password Reset
- Rate limiting (2-hour cooldown between requests)
- Token expiration (6 hours)
- Secure token generation
- Background job processing
- IP address logging

### Email Confirmation
- Token expiration (3 days)
- Unique confirmation tokens
- Reconfirmation for email changes
- Background job processing

### Session Management
- JWT token authentication
- Session tracking and analytics
- IP address logging
- Remember me functionality
- Secure logout (all sessions)

## Testing

### Backend Tests
Run the following to test authentication features:
```bash
cd api
bundle exec rspec spec/models/user_spec.rb
bundle exec rspec spec/controllers/api/v1/auth/
bundle exec rspec spec/mailers/user_mailer_spec.rb
bundle exec rspec spec/jobs/
```

### Frontend Tests
```bash
cd frontend
npm test -- --testPathPattern=auth
```

## Deployment Considerations

### Production Email Setup
1. Configure production SMTP settings
2. Set up proper DNS records (SPF, DKIM, DMARC)
3. Use environment variables for credentials
4. Configure proper SSL certificates
5. Set up email monitoring and analytics

### Background Jobs
1. Ensure Sidekiq is running in production
2. Configure Redis for job queuing
3. Set up job monitoring (Sidekiq Web UI)
4. Configure retry and failure handling

### Security
1. Use HTTPS in production
2. Set secure cookie flags
3. Configure CORS properly
4. Implement rate limiting at infrastructure level
5. Monitor for suspicious activity

## Troubleshooting

### Common Issues

#### Emails Not Sending
1. Check SMTP credentials
2. Verify environment variables
3. Check Rails logs for errors
4. Ensure Sidekiq is processing jobs

#### Token Expiration
1. Check Devise configuration
2. Verify token generation
3. Ensure proper URL construction
4. Check frontend token handling

#### Frontend Errors
1. Verify API endpoints are accessible
2. Check CORS configuration
3. Validate authentication headers
4. Review browser console for errors 