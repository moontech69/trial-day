'use strict';
const config = require('../../config');
const Sequelize = require('sequelize');

module.exports = new Sequelize(
    config.mysql.database,
    config.mysql.user,
    config.mysql.password,
    {
        host: config.mysql.host,
        port: config.mysql.port,
        dialect: 'mysql',
        pool: {
            max: 10,
            min: 0
        }
    }
);
