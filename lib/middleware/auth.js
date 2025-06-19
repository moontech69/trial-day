'use strict';

const jwt = require('jsonwebtoken');

// JWT secret - in production this should be from environment variables
const JWT_SECRET = process.env.JWT_SECRET || 'testlio-secret-key-for-development';

// List of endpoints that don't require authentication
const PUBLIC_ENDPOINTS = [
  '/',
  '/health',
  '/auth/token'
];

const authMiddleware = async (ctx, next) => {
  const path = ctx.path;
  
  // Skip authentication for public endpoints
  if (PUBLIC_ENDPOINTS.includes(path)) {
    await next();
    return;
  }
  
  // Check for X-Client-ID header
  const clientId = ctx.headers['x-client-id'];
  if (!clientId) {
    ctx.status = 400;
    ctx.body = {
      message: 'Bad Request',
      errors: ['X-Client-ID header is required']
    };
    return;
  }
  
  // Check for Authorization header
  const authHeader = ctx.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    ctx.status = 401;
    ctx.body = {
      message: 'Unauthorized',
      errors: ['Authorization header with Bearer token is required']
    };
    return;
  }
  
  // Extract token
  const token = authHeader.substring(7); // Remove 'Bearer ' prefix
  
  try {
    // Verify JWT token
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Add user info to context for use in other middleware/routes
    ctx.user = {
      email: decoded.email,
      clientId: clientId
    };
    
    await next();
  } catch (error) {
    ctx.status = 401;
    ctx.body = {
      message: 'Unauthorized',
      errors: ['Invalid or expired JWT token']
    };
  }
};

// Helper function to generate JWT tokens (for testing purposes)
const generateToken = (email, expiresIn = '24h') => {
  return jwt.sign({ email }, JWT_SECRET, { expiresIn });
};

module.exports = {
  authMiddleware,
  generateToken,
  JWT_SECRET
};