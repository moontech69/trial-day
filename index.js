'use strict';

const Koa = require('koa');
const bodyParser = require('koa-bodyparser');

const config = require('./config');
const router = require('./lib/routes');
const { authMiddleware } = require('./lib/middleware/auth');
const { sanitizationMiddleware } = require('./lib/middleware/sanitization');
const { loggingMiddleware } = require('./lib/middleware/logging');

const app = new Koa();

// Error handling middleware
app.use(async (ctx, next) => {
  try {
    await next();
  } catch (err) {
    ctx.status = err.status || 500;
    ctx.body = {
      message: err.status === 500 ? 'Internal server error' : err.message,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    };
    console.error('Error:', err);
  }
});

app.use(loggingMiddleware);
app.use(bodyParser({
  jsonLimit: '1mb', // Limit JSON payload size
  textLimit: '1mb', // Limit text payload size
  enableTypes: ['json', 'form'] // Only allow JSON and form data
}));
app.use(sanitizationMiddleware);
app.use(authMiddleware);
app.use(router.routes());
app.use(router.allowedMethods());

app.listen(config.port);
console.log('Listening on http://localhost:%s/', config.port);
