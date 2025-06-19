# Testlio Backend Assignment - Solution Documentation

## Overview
This document outlines the implementation approach, technical decisions, and trade-offs made during the development of the issue management REST API.

## Technical Decisions

### Task 1: Create Issue Endpoint
- **Endpoint**: `POST /issues`
- **Implementation**: Added validation for required fields (title, description)
- **Error Handling**: Returns 400 for validation errors, 500 for server errors
- **Response**: Returns 201 status with created issue data
- **Validation**: Trims whitespace and checks for empty/null values

### Task 2: List Issues Endpoint
- **Endpoint**: `GET /issues`
- **Implementation**: Returns paginated list of all issues
- **Pagination**: Supports `page` and `limit` query parameters
- **Default Values**: page=1, limit=10 (max limit=100)
- **Ordering**: Issues ordered by creation date (most recent first)
- **Response**: Includes issues array and pagination metadata
- **Validation**: Validates pagination parameters

### Task 3: Update Issue Endpoint
- **Endpoint**: `PUT /issues/:id`
- **Implementation**: Updates existing issue with partial or full data
- **Partial Updates**: Supports updating only title, only description, or both
- **Validation**: Validates issue ID and ensures non-empty values
- **Error Handling**: Returns 404 if issue not found, 400 for validation errors
- **Response**: Returns updated issue data
- **Data Integrity**: Trims whitespace and validates required fields

### Task 4: Issue Revisions Endpoint
- **Endpoint**: `GET /issues/:id/revisions`
- **Implementation**: Returns all revisions of a specific issue
- **Revision Tracking**: Automatically creates revisions on create/update operations
- **Data Model**: Separate IssueRevision model with foreign key to Issue
- **Ordering**: Revisions returned in chronological order (oldest first)
- **Metadata**: Includes revision number, change type, and timestamp
- **Transactions**: Uses database transactions for data consistency

### Task 5: JWT Authentication
- **Authentication**: JWT token required for all endpoints (except /, /health, /auth/token)
- **Headers**: X-Client-ID header required for all authenticated requests
- **Token Generation**: POST /auth/token endpoint for testing purposes
- **User Tracking**: Automatic population of created_by/updated_by fields
- **Security**: Bearer token validation with configurable JWT secret
- **Context Injection**: User email and client ID available in request context

### Task 6: Revision Comparison
- **Endpoint**: `GET /issues/:id/revisions/compare?from_revision=X&to_revision=Y`
- **Bidirectional**: Supports both forward (older→newer) and backward (newer→older) comparisons
- **Response Structure**: before/after snapshots, changes summary, revision trail
- **Change Detection**: Field-level difference analysis for title and description
- **Validation**: Comprehensive validation of issue ID, revision numbers, and existence
- **Metadata**: Includes comparison direction, statistics, and complete revision trail

### Architecture Decisions
- Maintained the existing Koa.js + Sequelize structure
- Used consistent error response format from existing responses.js
- Added proper HTTP status codes following REST conventions
- Implemented input validation to ensure data integrity

## Trade-offs
1. **Validation**: Implemented basic validation for now, could be extended with more sophisticated validation libraries like Joi
2. **Error Handling**: Used simple try-catch blocks, could be enhanced with custom error classes
3. **Database**: Maintained existing Sequelize setup for consistency
4. **Pagination**: Implemented server-side pagination with reasonable defaults and limits
5. **Ordering**: Default ordering by creation date, could be extended to support custom sorting
6. **Update Strategy**: Used PUT for full/partial updates, could also implement PATCH for explicit partial updates
7. **Concurrency**: Basic update without optimistic locking, could be enhanced for high-concurrency scenarios
8. **Revision Storage**: Full revision storage (stores complete state), could be optimized with delta storage for large datasets
9. **Revision Metadata**: Basic metadata tracking, could be extended with user context and change descriptions
10. **Authentication**: Simple JWT implementation for testing, production would need proper user management and token refresh
11. **Token Storage**: Stateless JWT tokens, could be enhanced with token blacklisting for logout functionality
12. **Comparison Algorithm**: Simple field-by-field comparison, could be enhanced with advanced diff algorithms for large text
13. **Revision Range**: Loads all revisions in range for trail, could be optimized for large revision counts

## Complete API Reference

### Authentication
- `POST /auth/token` - Generate JWT token for testing (public)

### Discovery & Health
- `GET /` - API discovery endpoint (public)
- `GET /health` - Health check endpoint (public)

### Issues Management (requires authentication)
- `GET /issues` - List issues with pagination and ordering
- `GET /issues/:id` - Get single issue by ID
- `POST /issues` - Create new issue
- `PUT /issues/:id` - Update existing issue

### Revisions & Comparison (requires authentication)
- `GET /issues/:id/revisions` - Get all revisions for an issue
- `GET /issues/:id/revisions/compare` - Compare two revisions

### Authentication Requirements
All endpoints except `/`, `/health`, and `/auth/token` require:
- `Authorization: Bearer <jwt_token>` header
- `X-Client-ID: <client_id>` header

## Performance Optimizations

### Database Performance
- **Connection Pooling**: Configured with 20 max connections, 5 min connections
- **Database Indexes**: Added indexes on frequently queried fields (created_at, updated_at, created_by, updated_by)
- **Query Optimization**: Explicit attribute selection to reduce data transfer
- **Transaction Support**: Ensures data consistency for revision tracking

### Security Enhancements
- **Input Sanitization**: Removes HTML tags, JavaScript protocols, and event handlers
- **Request Size Limits**: 1MB limit on JSON and text payloads
- **JWT Authentication**: Configurable secrets with 24-hour token expiration
- **Error Sanitization**: Prevents information leakage in error responses

### Application Performance
- **Request Logging**: Development logging with slow request detection in production
- **Error Handling**: Global error middleware with proper status codes
- **Pagination**: Limits result sets to prevent memory issues (max 100 items per page)
- **Input Validation**: Prevents invalid operations and SQL injection

### Caching Infrastructure
- **In-Memory Cache**: Simple cache implementation for frequently accessed data
- **Cache Invalidation**: Automatic cache clearing on data modifications
- **TTL Support**: Configurable time-to-live for cached items

## Testing Notes
- Environment setup requires Docker for MySQL database
- All endpoints follow REST API conventions
- JWT tokens valid for 24 hours by default
- Comprehensive error handling with appropriate HTTP status codes
- Input validation prevents empty/invalid data
- All tests passing in comprehensive test suite