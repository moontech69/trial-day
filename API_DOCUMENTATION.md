# Testlio Issues API Documentation

## Overview

The Testlio Issues API is a RESTful service for managing issues with comprehensive revision tracking, authentication, and comparison capabilities.

## Base URL

```
http://localhost:8080
```

## Authentication

Most endpoints require JWT authentication. Include the following headers:

```
Authorization: Bearer <jwt_token>
X-Client-ID: <client_identifier>
```

### Public Endpoints (No Authentication Required)

- `GET /` - API discovery
- `GET /health` - Health check
- `POST /auth/token` - Generate JWT token

## Endpoints

### Authentication

#### Generate JWT Token
```http
POST /auth/token
Content-Type: application/json

{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "email": "user@example.com",
  "expires_in": "24h",
  "token_type": "Bearer"
}
```

### Issues Management

#### Create Issue
```http
POST /issues
Authorization: Bearer <token>
X-Client-ID: <client_id>
Content-Type: application/json

{
  "title": "Bug in login system",
  "description": "Users cannot log in with valid credentials"
}
```

**Response (201):**
```json
{
  "issue": {
    "id": 1,
    "title": "Bug in login system",
    "description": "Users cannot log in with valid credentials",
    "created_by": "user@example.com",
    "updated_by": "user@example.com",
    "created_at": "2024-01-01T10:00:00Z",
    "updated_at": "2024-01-01T10:00:00Z"
  }
}
```

#### List Issues
```http
GET /issues?page=1&page_size=10
Authorization: Bearer <token>
X-Client-ID: <client_id>
```

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `page_size` (optional): Items per page (default: 10, max: 100)

**Response (200):**
```json
{
  "issues": [
    {
      "id": 1,
      "title": "Bug in login system",
      "description": "Users cannot log in with valid credentials",
      "created_by": "user@example.com",
      "updated_by": "user@example.com",
      "created_at": "2024-01-01T10:00:00Z",
      "updated_at": "2024-01-01T10:00:00Z"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 1,
    "totalItems": 1,
    "itemsPerPage": 10,
    "hasNextPage": false,
    "hasPrevPage": false
  }
}
```

#### Get Single Issue
```http
GET /issues/:id
Authorization: Bearer <token>
X-Client-ID: <client_id>
```

**Response (200):**
```json
{
  "issue": {
    "id": 1,
    "title": "Bug in login system",
    "description": "Users cannot log in with valid credentials",
    "created_by": "user@example.com",
    "updated_by": "user@example.com",
    "created_at": "2024-01-01T10:00:00Z",
    "updated_at": "2024-01-01T10:00:00Z"
  }
}
```

#### Update Issue
```http
PUT /issues/:id
Authorization: Bearer <token>
X-Client-ID: <client_id>
Content-Type: application/json

{
  "title": "Updated bug title",
  "description": "Updated description with more details"
}
```

**Response (200):**
```json
{
  "issue": {
    "id": 1,
    "title": "Updated bug title",
    "description": "Updated description with more details",
    "created_by": "user@example.com",
    "updated_by": "user2@example.com",
    "created_at": "2024-01-01T10:00:00Z",
    "updated_at": "2024-01-01T11:00:00Z"
  }
}
```

### Revisions

#### Get Issue Revisions
```http
GET /issues/:id/revisions
Authorization: Bearer <token>
X-Client-ID: <client_id>
```

**Response (200):**
```json
{
  "issue_id": 1,
  "revisions": [
    {
      "id": 1,
      "revision_number": 1,
      "title": "Bug in login system",
      "description": "Users cannot log in with valid credentials",
      "change_type": "create",
      "changed_by": "user@example.com",
      "created_at": "2024-01-01T10:00:00Z"
    },
    {
      "id": 2,
      "revision_number": 2,
      "title": "Updated bug title",
      "description": "Updated description with more details",
      "change_type": "update",
      "changed_by": "user2@example.com",
      "created_at": "2024-01-01T11:00:00Z"
    }
  ]
}
```

#### Compare Revisions
```http
GET /issues/:id/revisions/compare?from_revision=1&to_revision=2
Authorization: Bearer <token>
X-Client-ID: <client_id>
```

**Query Parameters:**
- `from_revision` (required): Source revision number
- `to_revision` (required): Target revision number

**Response (200):**
```json
{
  "issue_id": 1,
  "comparison": {
    "from_revision": 1,
    "to_revision": 2,
    "direction": "forward"
  },
  "before": {
    "revision_number": 1,
    "title": "Bug in login system",
    "description": "Users cannot log in with valid credentials",
    "changed_by": "user@example.com",
    "created_at": "2024-01-01T10:00:00Z"
  },
  "after": {
    "revision_number": 2,
    "title": "Updated bug title",
    "description": "Updated description with more details",
    "changed_by": "user2@example.com",
    "created_at": "2024-01-01T11:00:00Z"
  },
  "changes": {
    "title": {
      "from": "Bug in login system",
      "to": "Updated bug title"
    },
    "description": {
      "from": "Users cannot log in with valid credentials",
      "to": "Updated description with more details"
    }
  },
  "revisions": [
    {
      "id": 1,
      "revision_number": 1,
      "title": "Bug in login system",
      "description": "Users cannot log in with valid credentials",
      "change_type": "create",
      "changed_by": "user@example.com",
      "created_at": "2024-01-01T10:00:00Z"
    },
    {
      "id": 2,
      "revision_number": 2,
      "title": "Updated bug title",
      "description": "Updated description with more details",
      "change_type": "update",
      "changed_by": "user2@example.com",
      "created_at": "2024-01-01T11:00:00Z"
    }
  ],
  "summary": {
    "total_revisions_in_range": 2,
    "fields_changed": 2,
    "has_changes": true
  }
}
```

### Discovery & Health

#### API Discovery
```http
GET /
```

**Response (200):**
```json
{
  "message": "Testlio Issues API",
  "version": "1.0.0",
  "endpoints": [
    "GET /",
    "GET /health",
    "POST /auth/token",
    "GET /issues",
    "GET /issues/:id",
    "POST /issues",
    "PUT /issues/:id",
    "GET /issues/:id/revisions",
    "GET /issues/:id/revisions/compare"
  ]
}
```

#### Health Check
```http
GET /health
```

**Response (200):**
```json
{
  "status": "OK",
  "timestamp": "2024-01-01T10:00:00Z"
}
```

## Error Responses

### 400 Bad Request
```json
{
  "message": "Bad Request",
  "errors": [
    "Title is required",
    "Description is required"
  ]
}
```

### 401 Unauthorized
```json
{
  "message": "Unauthorized",
  "errors": [
    "Authorization header with Bearer token is required"
  ]
}
```

### 404 Not Found
```json
{
  "message": "Not Found"
}
```

### 500 Internal Server Error
```json
{
  "message": "Internal server error"
}
```

## Rate Limiting

- No rate limiting currently implemented
- Consider implementing rate limiting for production use

## Data Validation

### Issue Creation/Update
- `title`: Required, string, max 255 characters
- `description`: Required, string, max 10000 characters
- Both fields are trimmed and sanitized

### Pagination
- `page`: Minimum 1
- `page_size`: Minimum 1, maximum 100

### Revision Comparison
- `from_revision`: Required, positive integer
- `to_revision`: Required, positive integer
- Must be different values

## Security Features

- JWT token authentication
- Input sanitization
- SQL injection prevention via Sequelize ORM
- Request size limits (1MB)
- Error message sanitization

## Performance Features

- Database connection pooling
- Query optimization with explicit attributes
- Database indexes on frequently queried fields
- Pagination for large datasets
- Transaction support for data consistency

## Development Notes

- Environment: Node.js with Koa.js framework
- Database: MySQL with Sequelize ORM
- Authentication: JWT tokens
- Logging: Configurable based on NODE_ENV
- Error handling: Comprehensive with proper HTTP status codes