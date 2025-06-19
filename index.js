'use strict';

const Koa = require('koa');
const bodyParser = require('koa-bodyparser');

const config = require('./config');
const router = require('./lib/routes');
const { authMiddleware } = require('./lib/middleware/auth');

const app = new Koa();

app.use(bodyParser());
app.use(authMiddleware);
app.use(router.routes());
app.use(router.allowedMethods());

app.listen(config.port);
console.log('Listening on http://localhost:%s/', config.port);
