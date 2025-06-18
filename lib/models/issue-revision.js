'use strict';

const Sequelize = require('sequelize');
const sequelize = require('./connection');

module.exports = sequelize.define('issue_revision', {
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    field: 'id'
  },
  issue_id: {
    type: Sequelize.INTEGER,
    allowNull: false,
    references: {
      model: 'issues',
      key: 'id'
    }
  },
  title: {
    type: Sequelize.STRING,
    allowNull: false
  },
  description: {
    type: Sequelize.STRING,
    allowNull: false
  },
  revision_number: {
    type: Sequelize.INTEGER,
    allowNull: false,
    defaultValue: 1
  },
  changed_by: {
    type: Sequelize.STRING,
    defaultValue: 'unknown'
  },
  change_type: {
    type: Sequelize.ENUM('create', 'update'),
    allowNull: false,
    defaultValue: 'create'
  }
}, {
  timestamps: true,
  updatedAt: false, // Only track creation time for revisions
  createdAt: 'created_at',
  tableName: 'issue_revisions',
  indexes: [
    {
      fields: ['issue_id']
    },
    {
      fields: ['issue_id', 'revision_number'],
      unique: true
    }
  ]
});