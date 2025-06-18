"use strict";

const respond = require("./responses");
const Issue = require("../models/issue");

const baseUrl = "http://localhost:8080";

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
	if (!title || title.trim() === "") {
		errors.push("Title is required");
	}
	if (!description || description.trim() === "") {
		errors.push("Description is required");
	}

	if (errors.length > 0) {
		respond.badRequest(context, errors);
		return;
	}

	try {
		const issue = await Issue.create({
			title: title.trim(),
			description: description.trim(),
		});

		context.status = 201;
		context.body = { issue };
	} catch (error) {
		context.status = 500;
		context.body = { message: "Internal server error", error: error.message };
	}
};

Issues.list = async (context) => {
	try {
		const page = parseInt(context.query.page) || 1;
		const limit = parseInt(context.query.limit) || 10;
		const offset = (page - 1) * limit;

		if (page < 1) {
			respond.badRequest(context, ["Page must be greater than 0"]);
			return;
		}
		if (limit < 1 || limit > 100) {
			respond.badRequest(context, ["Limit must be between 1 and 100"]);
			return;
		}

		const { count, rows: issues } = await Issue.findAndCountAll({
			limit,
			offset,
			order: [["created_at", "DESC"]],
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
				hasPrevPage,
			},
		};

		respond.success(context, response);
	} catch (error) {
		context.status = 500;
		context.body = { message: "Internal server error", error: error.message };
	}
};

module.exports = Issues;
