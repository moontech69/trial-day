'use strict';

module.exports = {
    success: (context, data) => {
        context.body = data;
        context.status = data ? 200 : 204;
    },
    badRequest: (context, errors) => {
        context.body = {
            message: 'Bad Request',
            errors: errors
        };
        context.status = 400;
    },
    notFound: (context) => {
        context.body = { message: 'Not Found' };
        context.status = 404;
    }
};
