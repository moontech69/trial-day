'use strict';

const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  
  return input
    .trim()
    .replace(/[<>]/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .substring(0, 10000);
};

const sanitizationMiddleware = async (ctx, next) => {
  if (ctx.request.body && typeof ctx.request.body === 'object') {
    const sanitizedBody = {};
    for (const [key, value] of Object.entries(ctx.request.body)) {
      if (typeof value === 'string') {
        sanitizedBody[key] = sanitizeInput(value);
      } else {
        sanitizedBody[key] = value;
      }
    }
    ctx.request.body = sanitizedBody;
  }
  
  if (ctx.query && typeof ctx.query === 'object') {
    const sanitizedQuery = {};
    for (const [key, value] of Object.entries(ctx.query)) {
      if (typeof value === 'string') {
        sanitizedQuery[key] = sanitizeInput(value);
      } else {
        sanitizedQuery[key] = value;
      }
    }
    ctx.query = sanitizedQuery;
  }
  
  await next();
};

module.exports = {
  sanitizationMiddleware,
  sanitizeInput
};