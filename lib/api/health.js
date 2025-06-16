'use strict';

const respond = require('./responses');

module.exports = (context) => {
  respond.success(context, {
    message: 'OK',
    version: '1.0.0'
  });
};
