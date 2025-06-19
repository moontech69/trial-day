'use strict';

const loggingMiddleware = async (ctx, next) => {
  const start = Date.now();
  const { method, url, ip } = ctx.request;
  
  if (process.env.NODE_ENV === 'development') {
    console.log(`→ ${method} ${url} from ${ip}`);
  }
  
  try {
    await next();
  } catch (error) {
    console.error(`✗ ${method} ${url} - Error: ${error.message}`);
    throw error;
  }
  
  const duration = Date.now() - start;
  const { status } = ctx;
  
  if (process.env.NODE_ENV === 'development') {
    const statusIcon = status >= 400 ? '✗' : '✓';
    console.log(`${statusIcon} ${method} ${url} - ${status} (${duration}ms)`);
  }
  
  if (process.env.NODE_ENV === 'production' && duration > 1000) {
    console.warn(`SLOW REQUEST: ${method} ${url} - ${status} (${duration}ms)`);
  }
};

module.exports = {
  loggingMiddleware
};