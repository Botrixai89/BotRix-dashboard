# Authentication System Documentation

## Overview

The Botrix Dashboard now features a comprehensive, secure authentication system with the following capabilities:

- **User Registration** with email verification
- **Secure Login** with account locking protection
- **Password Reset** functionality
- **Token-based Authentication** with refresh tokens
- **Account Security** features

## Features

### 🔐 Security Features

- **Password Strength Validation**: Enforces strong password requirements
- **Account Locking**: Temporarily locks accounts after 5 failed login attempts
- **JWT Tokens**: Secure token-based authentication with configurable expiration
- **Refresh Tokens**: Automatic token refresh for better user experience
- **Email Validation**: Proper email format validation
- **Input Sanitization**: All inputs are properly sanitized and validated

### 📧 Email Verification

- **Email Verification Tokens**: Generated during registration
- **24-hour Expiration**: Tokens expire after 24 hours
- **Verification Status**: Tracked in user profile

### 🔑 Password Reset

- **Secure Reset Tokens**: Cryptographically secure tokens
- **1-hour Expiration**: Reset tokens expire after 1 hour
- **Email-based**: Reset links sent via email (implementation pending)

### 🛡️ Account Protection

- **Login Attempt Tracking**: Monitors failed login attempts
- **Automatic Locking**: Locks account after 5 failed attempts for 2 hours
- **Token Management**: Proper token cleanup and validation

## API Endpoints

### Authentication Routes

#### POST `/api/auth/signup`
Creates a new user account.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePass123!"
}
```

**Response:**
```json
{
  "message": "User created successfully. Please check your email to verify your account.",
  "user": {
    "_id": "user_id",
    "name": "John Doe",
    "email": "john@example.com",
    "isEmailVerified": false,
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

#### POST `/api/auth/login`
Authenticates a user and returns access tokens.

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "SecurePass123!"
}
```

**Response:**
```json
{
  "message": "Login successful",
  "user": {
    "_id": "user_id",
    "name": "John Doe",
    "email": "john@example.com",
    "isEmailVerified": false,
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

#### GET `/api/auth/me`
Returns the current authenticated user's information.

**Response:**
```json
{
  "user": {
    "_id": "user_id",
    "name": "John Doe",
    "email": "john@example.com",
    "isEmailVerified": false,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "lastLogin": "2024-01-01T00:00:00.000Z"
  }
}
```

#### POST `/api/auth/logout`
Logs out the current user and clears authentication cookies.

#### POST `/api/auth/refresh`
Refreshes the access token using a refresh token.

#### POST `/api/auth/forgot-password`
Initiates password reset process.

**Request Body:**
```json
{
  "email": "john@example.com"
}
```

**Response:**
```json
{
  "message": "Password reset link sent to your email"
}
```

#### POST `/api/auth/reset-password`
Resets password using a valid reset token.

**Request Body:**
```json
{
  "token": "reset_token_here",
  "password": "NewSecurePass123!"
}
```

## Password Requirements

Passwords must meet the following criteria:

- **Minimum Length**: 8 characters
- **Uppercase Letter**: At least one (A-Z)
- **Lowercase Letter**: At least one (a-z)
- **Number**: At least one (0-9)
- **Special Character**: At least one (!@#$%^&*(),.?":{}|<>)

## User Model Schema

```typescript
interface User {
  _id: string;
  email: string;
  name: string;
  password: string;
  avatar?: string;
  isEmailVerified: boolean;
  emailVerificationToken?: string;
  emailVerificationExpires?: Date;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  lastLogin?: Date;
  loginAttempts: number;
  lockUntil?: Date;
  refreshTokens: Array<{
    token: string;
    createdAt: Date;
    expiresAt: Date;
  }>;
  createdAt: Date;
  updatedAt: Date;
}
```

## Environment Variables

Required environment variables:

```env
# Database
MONGODB_URI=mongodb://localhost:27017/botrix-dashboard

# Authentication
JWT_SECRET=your-super-secret-jwt-key-change-in-production

# Application
NEXT_PUBLIC_BASE_URL=http://localhost:3000
NODE_ENV=development
```

## Security Best Practices

### 1. JWT Secret
- Use a strong, unique JWT secret in production
- Never commit the actual secret to version control
- Rotate secrets periodically

### 2. Password Security
- Passwords are hashed using bcrypt with 12 salt rounds
- Strong password requirements enforced
- Account locking prevents brute force attacks

### 3. Token Security
- Access tokens expire after 7 days
- Refresh tokens expire after 30 days
- Tokens are stored in httpOnly cookies
- Secure and SameSite flags set in production

### 4. Input Validation
- All inputs are validated and sanitized
- Email format validation
- Password strength validation
- XSS protection through proper escaping

## Error Handling

The authentication system provides comprehensive error handling:

### Common Error Responses

```json
{
  "error": "Validation failed",
  "details": [
    "Password must be at least 8 characters long",
    "Password must contain at least one uppercase letter"
  ]
}
```

```json
{
  "error": "Account is temporarily locked due to too many failed login attempts. Please try again later."
}
```

```json
{
  "error": "Invalid or expired reset token"
}
```

## Frontend Integration

### React Context

The authentication system uses React Context for state management:

```typescript
const { 
  user, 
  loading, 
  login, 
  signup, 
  logout, 
  forgotPassword, 
  resetPassword 
} = useAuth();
```

### Protected Routes

Use the `useRequireAuth` hook for protected routes:

```typescript
function ProtectedPage() {
  const { user, loading } = useRequireAuth();
  
  if (loading) return <LoadingSpinner />;
  if (!user) return null; // Will redirect to login
  
  return <YourProtectedContent />;
}
```

## Testing

### Manual Testing Checklist

- [ ] User registration with valid data
- [ ] User registration with invalid data (validation errors)
- [ ] User login with correct credentials
- [ ] User login with incorrect credentials
- [ ] Account locking after multiple failed attempts
- [ ] Password reset request
- [ ] Password reset with valid token
- [ ] Password reset with invalid token
- [ ] Token refresh functionality
- [ ] Logout functionality
- [ ] Protected route access
- [ ] Email verification flow

### API Testing

Test all endpoints with various scenarios:

1. **Valid requests** - Should return success responses
2. **Invalid data** - Should return appropriate error messages
3. **Missing authentication** - Should return 401 errors
4. **Expired tokens** - Should handle gracefully
5. **Rate limiting** - Should prevent abuse

## Deployment Considerations

### Production Setup

1. **Environment Variables**: Set all required environment variables
2. **JWT Secret**: Use a strong, unique secret
3. **Database**: Ensure MongoDB is properly configured
4. **HTTPS**: Enable HTTPS for secure cookie transmission
5. **CORS**: Configure CORS settings appropriately

### Monitoring

Monitor the following metrics:

- Failed login attempts
- Account lockouts
- Token refresh rates
- Password reset requests
- Email verification rates

## Troubleshooting

### Common Issues

1. **500 Internal Server Error on Signup**
   - Check MongoDB connection
   - Verify JWT_SECRET is set
   - Check server logs for detailed errors

2. **401 Unauthorized on /api/auth/me**
   - Verify cookies are being set properly
   - Check token expiration
   - Ensure proper CORS configuration

3. **Password Reset Not Working**
   - Verify email service configuration
   - Check token expiration times
   - Ensure proper URL generation

### Debug Mode

Enable debug logging by setting:

```env
NODE_ENV=development
DEBUG=auth:*
```

## Future Enhancements

- [ ] Email service integration for password reset
- [ ] Two-factor authentication (2FA)
- [ ] Social login (Google, GitHub, etc.)
- [ ] Session management dashboard
- [ ] Advanced security analytics
- [ ] Multi-tenant support
- [ ] API rate limiting
- [ ] Audit logging

## Support

For issues or questions about the authentication system:

1. Check the troubleshooting section
2. Review server logs for detailed error messages
3. Test with the provided manual testing checklist
4. Verify environment variable configuration 