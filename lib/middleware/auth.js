'use strict';

const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'testlio-secret-key-for-development';

const PUBLIC_ENDPOINTS = [
  '/',
  '/health',
  '/auth/token'
];

const authMiddleware = async (ctx, next) => {
  const path = ctx.path;
  
  if (PUBLIC_ENDPOINTS.includes(path)) {
    await next();
    return;
  }
  
  const clientId = ctx.headers['x-client-id'];
  if (!clientId) {
    ctx.status = 400;
    ctx.body = {
      message: 'Bad Request',
      errors: ['X-Client-ID header is required']
    };
    return;
  }
  
  const authHeader = ctx.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    ctx.status = 401;
    ctx.body = {
      message: 'Unauthorized',
      errors: ['Authorization header with Bearer token is required']
    };
    return;
  }
  
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    
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

const generateToken = (email, expiresIn = '24h') => {
  return jwt.sign({ email }, JWT_SECRET, { expiresIn });
};

module.exports = {
  authMiddleware,
  generateToken,
  JWT_SECRET
};