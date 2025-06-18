'use strict';

const respond = require('./responses');
const Issue = require('../models/issue');

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
    const issue = await Issue.create({
      title: title.trim(),
      description: description.trim()
    });
    
    context.status = 201;
    context.body = { issue };
  } catch (error) {
    context.status = 500;
    context.body = { message: 'Internal server error', error: error.message };
  }
};

module.exports = Issues;
