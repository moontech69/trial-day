'use strict';

const Issue = require('./issue');
const IssueRevision = require('./issue-revision');

// Define associations
Issue.hasMany(IssueRevision, {
  foreignKey: 'issue_id',
  as: 'revisions'
});

IssueRevision.belongsTo(Issue, {
  foreignKey: 'issue_id',
  as: 'issue'
});

module.exports = {
  Issue,
  IssueRevision
};