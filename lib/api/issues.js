'use strict';

const respond = require('./responses');
const { Issue, IssueRevision } = require('../models');

const baseUrl = 'http://localhost:8080';

const Issues = {};

Issues.get = async (context) => {
  const issue = await Issue.findByPk(context.params.id);
  if (!issue) {
    respond.notFound(context);
    return;
  }
  respond.success(context, { issue });
};

Issues.create = async (context) => {
  const { title, description } = context.request.body;
  
  const errors = [];
  if (!title || title.trim() === '') {
    errors.push('Title is required');
  }
  if (!description || description.trim() === '') {
    errors.push('Description is required');
  }
  
  if (errors.length > 0) {
    respond.badRequest(context, errors);
    return;
  }
  
  try {
    const trimmedTitle = title.trim();
    const trimmedDescription = description.trim();
    
    const userEmail = context.user ? context.user.email : 'unknown';
    
    const sequelize = require('../models/connection');
    const result = await sequelize.transaction(async (t) => {
      const issue = await Issue.create({
        title: trimmedTitle,
        description: trimmedDescription,
        created_by: userEmail,
        updated_by: userEmail
      }, { transaction: t });
      
      await IssueRevision.create({
        issue_id: issue.id,
        title: trimmedTitle,
        description: trimmedDescription,
        revision_number: 1,
        change_type: 'create',
        changed_by: userEmail
      }, { transaction: t });
      
      return issue;
    });
    
    context.status = 201;
    context.body = { issue: result };
  } catch (error) {
    context.status = 500;
    context.body = { message: 'Internal server error', error: error.message };
  }
};

Issues.list = async (context) => {
  try {
    const page = parseInt(context.query.page) || 1;
    const limit = parseInt(context.query.limit) || 10;
    const offset = (page - 1) * limit;
    
    if (page < 1) {
      respond.badRequest(context, ['Page must be greater than 0']);
      return;
    }
    if (limit < 1 || limit > 100) {
      respond.badRequest(context, ['Limit must be between 1 and 100']);
      return;
    }
    
    const { count, rows: issues } = await Issue.findAndCountAll({
      attributes: ['id', 'title', 'description', 'created_by', 'updated_by', 'created_at', 'updated_at'], // Explicit attributes
      limit,
      offset,
      order: [['created_at', 'DESC']],
      distinct: true
    });
    
    const totalPages = Math.ceil(count / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;
    
    const response = {
      issues,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems: count,
        itemsPerPage: limit,
        hasNextPage,
        hasPrevPage
      }
    };
    
    respond.success(context, response);
  } catch (error) {
    context.status = 500;
    context.body = { message: 'Internal server error', error: error.message };
  }
};

Issues.update = async (context) => {
  const issueId = parseInt(context.params.id);
  const { title, description } = context.request.body;
  
  if (!issueId || isNaN(issueId)) {
    respond.badRequest(context, ['Invalid issue ID']);
    return;
  }
  
  const errors = [];
  if (title !== undefined && (!title || title.trim() === '')) {
    errors.push('Title cannot be empty');
  }
  if (description !== undefined && (!description || description.trim() === '')) {
    errors.push('Description cannot be empty');
  }
  
  if (title === undefined && description === undefined) {
    errors.push('At least one field (title or description) must be provided for update');
  }
  
  if (errors.length > 0) {
    respond.badRequest(context, errors);
    return;
  }
  
  try {
    const issue = await Issue.findByPk(issueId);
    if (!issue) {
      respond.notFound(context);
      return;
    }
    
    const updateData = {};
    if (title !== undefined) {
      updateData.title = title.trim();
    }
    if (description !== undefined) {
      updateData.description = description.trim();
    }
    
    const lastRevision = await IssueRevision.findOne({
      where: { issue_id: issueId },
      order: [['revision_number', 'DESC']]
    });
    const nextRevisionNumber = lastRevision ? lastRevision.revision_number + 1 : 1;
    
    const userEmail = context.user ? context.user.email : 'unknown';
    
    updateData.updated_by = userEmail;
    
    const sequelize = require('../models/connection');
    const result = await sequelize.transaction(async (t) => {
      await issue.update(updateData, { transaction: t });
      
      const finalTitle = updateData.title !== undefined ? updateData.title : issue.title;
      const finalDescription = updateData.description !== undefined ? updateData.description : issue.description;
      
      await IssueRevision.create({
        issue_id: issueId,
        title: finalTitle,
        description: finalDescription,
        revision_number: nextRevisionNumber,
        change_type: 'update',
        changed_by: userEmail
      }, { transaction: t });
      
      await issue.reload({ transaction: t });
      return issue;
    });
    
    respond.success(context, { issue: result });
  } catch (error) {
    context.status = 500;
    context.body = { message: 'Internal server error', error: error.message };
  }
};

Issues.revisions = async (context) => {
  const issueId = parseInt(context.params.id);
  
  if (!issueId || isNaN(issueId)) {
    respond.badRequest(context, ['Invalid issue ID']);
    return;
  }
  
  try {
    const issue = await Issue.findByPk(issueId);
    if (!issue) {
      respond.notFound(context);
      return;
    }
    
    const revisions = await IssueRevision.findAll({
      where: { issue_id: issueId },
      order: [['revision_number', 'ASC']],
      attributes: [
        'id',
        'revision_number',
        'title',
        'description',
        'change_type',
        'changed_by',
        'created_at'
      ]
    });
    
    const response = {
      issue_id: issueId,
      total_revisions: revisions.length,
      revisions
    };
    
    respond.success(context, response);
  } catch (error) {
    context.status = 500;
    context.body = { message: 'Internal server error', error: error.message };
  }
};

Issues.compareRevisions = async (context) => {
  const issueId = parseInt(context.params.id);
  const { from_revision, to_revision } = context.query;
  
  if (!issueId || isNaN(issueId)) {
    respond.badRequest(context, ['Invalid issue ID']);
    return;
  }
  
  const fromRev = parseInt(from_revision);
  const toRev = parseInt(to_revision);
  
  if (!fromRev || isNaN(fromRev)) {
    respond.badRequest(context, ['from_revision query parameter is required and must be a number']);
    return;
  }
  
  if (!toRev || isNaN(toRev)) {
    respond.badRequest(context, ['to_revision query parameter is required and must be a number']);
    return;
  }
  
  if (fromRev === toRev) {
    respond.badRequest(context, ['from_revision and to_revision must be different']);
    return;
  }
  
  try {
    const issue = await Issue.findByPk(issueId);
    if (!issue) {
      respond.notFound(context);
      return;
    }
    
    const [fromRevision, toRevision] = await Promise.all([
      IssueRevision.findOne({
        where: { issue_id: issueId, revision_number: fromRev }
      }),
      IssueRevision.findOne({
        where: { issue_id: issueId, revision_number: toRev }
      })
    ]);
    
    if (!fromRevision) {
      respond.badRequest(context, [`Revision ${fromRev} not found for issue ${issueId}`]);
      return;
    }
    
    if (!toRevision) {
      respond.badRequest(context, [`Revision ${toRev} not found for issue ${issueId}`]);
      return;
    }
    
    const isForward = fromRev < toRev;
    const startRev = isForward ? fromRev : toRev;
    const endRev = isForward ? toRev : fromRev;
    
    const revisionTrail = await IssueRevision.findAll({
      where: { 
        issue_id: issueId,
        revision_number: {
          [require('sequelize').Op.between]: [startRev, endRev]
        }
      },
      order: [['revision_number', 'ASC']],
      attributes: [
        'id',
        'revision_number',
        'title',
        'description',
        'change_type',
        'changed_by',
        'created_at'
      ]
    });
    
    const changes = {};
    
    if (fromRevision.title !== toRevision.title) {
      changes.title = {
        from: fromRevision.title,
        to: toRevision.title
      };
    }
    
    if (fromRevision.description !== toRevision.description) {
      changes.description = {
        from: fromRevision.description,
        to: toRevision.description
      };
    }
    
    const response = {
      issue_id: issueId,
      comparison: {
        from_revision: fromRev,
        to_revision: toRev,
        direction: isForward ? 'forward' : 'backward'
      },
      before: {
        revision_number: fromRevision.revision_number,
        title: fromRevision.title,
        description: fromRevision.description,
        changed_by: fromRevision.changed_by,
        created_at: fromRevision.created_at
      },
      after: {
        revision_number: toRevision.revision_number,
        title: toRevision.title,
        description: toRevision.description,
        changed_by: toRevision.changed_by,
        created_at: toRevision.created_at
      },
      changes,
      revisions: revisionTrail,
      summary: {
        total_revisions_in_range: revisionTrail.length,
        fields_changed: Object.keys(changes).length,
        has_changes: Object.keys(changes).length > 0
      }
    };
    
    respond.success(context, response);
  } catch (error) {
    context.status = 500;
    context.body = { message: 'Internal server error', error: error.message };
  }
};

module.exports = Issues;
