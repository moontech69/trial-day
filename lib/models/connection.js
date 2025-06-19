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
            max: 20,       
            min: 5,        
            acquire: 30000,
            idle: 10000,   
            evict: 1000    
        },
        logging: process.env.NODE_ENV === 'development' ? console.log : false,
        benchmark: process.env.NODE_ENV === 'development',
        retry: {
            max: 3
        }
    }
);
