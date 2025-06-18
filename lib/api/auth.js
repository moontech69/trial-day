'use strict';

const { generateToken } = require('../middleware/auth');
const respond = require('./responses');

const Auth = {};

Auth.generateToken = async (context) => {
  const { email } = context.request.body;
  
  // Validation
  if (!email || email.trim() === '') {
    respond.badRequest(context, ['Email is required']);
    return;
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.trim())) {
    respond.badRequest(context, ['Invalid email format']);
    return;
  }
  
  try {
    const token = generateToken(email.trim());
    
    context.status = 200;
    context.body = {
      token,
      email: email.trim(),
      expires_in: '24h',
      token_type: 'Bearer'
    };
  } catch (error) {
    context.status = 500;
    context.body = { 
      message: 'Internal server error', 
      error: error.message 
    };
  }
};

module.exports = Auth;