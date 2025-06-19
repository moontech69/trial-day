'use strict';

const Sequelize = require('sequelize');
const sequelize = require('./connection');

module.exports = sequelize.define('issue', {
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    field: 'id'
  },
  title: Sequelize.STRING,
  description: Sequelize.STRING,
  created_by: {
    type: Sequelize.STRING,
    defaultValue: 'unknown'
  },
  updated_by: {
    type: Sequelize.STRING,
    defaultValue: 'unknown'
  }
}, {
  timestamps: true,
  updatedAt: 'updated_at',
  createdAt: 'created_at',
  tableName: 'issues',
  indexes: [
    {
      fields: ['created_at']
    },
    {
      fields: ['updated_at']
    },
    {
      fields: ['created_by']
    },
    {
      fields: ['updated_by']
    }
  ]
});
