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
  
  // Validation
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
    
    // Get user email from authenticated context
    const userEmail = context.user ? context.user.email : 'unknown';
    
    // Create issue and initial revision in a transaction
    const sequelize = require('../models/connection');
    const result = await sequelize.transaction(async (t) => {
      // Create the issue
      const issue = await Issue.create({
        title: trimmedTitle,
        description: trimmedDescription,
        created_by: userEmail,
        updated_by: userEmail
      }, { transaction: t });
      
      // Create the initial revision
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
    // Parse query parameters for pagination
    const page = parseInt(context.query.page) || 1;
    const limit = parseInt(context.query.limit) || 10;
    const offset = (page - 1) * limit;
    
    // Validate pagination parameters
    if (page < 1) {
      respond.badRequest(context, ['Page must be greater than 0']);
      return;
    }
    if (limit < 1 || limit > 100) {
      respond.badRequest(context, ['Limit must be between 1 and 100']);
      return;
    }
    
    // Get issues with pagination
    const { count, rows: issues } = await Issue.findAndCountAll({
      limit,
      offset,
      order: [['created_at', 'DESC']] // Most recent first
    });
    
    // Calculate pagination metadata
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
  
  // Validate issue ID
  if (!issueId || isNaN(issueId)) {
    respond.badRequest(context, ['Invalid issue ID']);
    return;
  }
  
  // Validation for update fields
  const errors = [];
  if (title !== undefined && (!title || title.trim() === '')) {
    errors.push('Title cannot be empty');
  }
  if (description !== undefined && (!description || description.trim() === '')) {
    errors.push('Description cannot be empty');
  }
  
  // Check if at least one field is provided for update
  if (title === undefined && description === undefined) {
    errors.push('At least one field (title or description) must be provided for update');
  }
  
  if (errors.length > 0) {
    respond.badRequest(context, errors);
    return;
  }
  
  try {
    // Find the issue first
    const issue = await Issue.findByPk(issueId);
    if (!issue) {
      respond.notFound(context);
      return;
    }
    
    // Prepare update data
    const updateData = {};
    if (title !== undefined) {
      updateData.title = title.trim();
    }
    if (description !== undefined) {
      updateData.description = description.trim();
    }
    
    // Get the next revision number
    const lastRevision = await IssueRevision.findOne({
      where: { issue_id: issueId },
      order: [['revision_number', 'DESC']]
    });
    const nextRevisionNumber = lastRevision ? lastRevision.revision_number + 1 : 1;
    
    // Get user email from authenticated context
    const userEmail = context.user ? context.user.email : 'unknown';
    
    // Add updated_by to update data
    updateData.updated_by = userEmail;
    
    // Update issue and create revision in a transaction
    const sequelize = require('../models/connection');
    const result = await sequelize.transaction(async (t) => {
      // Update the issue
      await issue.update(updateData, { transaction: t });
      
      // Create new revision with updated data
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
      
      // Reload to get updated data
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
  
  // Validate issue ID
  if (!issueId || isNaN(issueId)) {
    respond.badRequest(context, ['Invalid issue ID']);
    return;
  }
  
  try {
    // Check if issue exists
    const issue = await Issue.findByPk(issueId);
    if (!issue) {
      respond.notFound(context);
      return;
    }
    
    // Get all revisions for the issue
    const revisions = await IssueRevision.findAll({
      where: { issue_id: issueId },
      order: [['revision_number', 'ASC']], // Chronological order
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

module.exports = Issues;
