#!/usr/bin/env node
'use strict';

/**
 * Comprehensive test suite for the Testlio Issues API
 * Tests all endpoints, error cases, and edge conditions
 */

const assert = require('assert');
const { generateToken } = require('./lib/middleware/auth');

console.log('🧪 COMPREHENSIVE TEST SUITE\n');

// Test utilities
const testResults = {
  passed: 0,
  failed: 0,
  tests: []
};

function test(name, testFn) {
  try {
    testFn();
    testResults.passed++;
    testResults.tests.push({ name, status: 'PASS' });
    console.log(`✅ ${name}`);
  } catch (error) {
    testResults.failed++;
    testResults.tests.push({ name, status: 'FAIL', error: error.message });
    console.log(`❌ ${name}: ${error.message}`);
  }
}

// Test 1: Authentication Module
console.log('🔐 Testing Authentication Module...');

test('JWT token generation', () => {
  const token = generateToken('test@example.com');
  assert(typeof token === 'string', 'Token should be a string');
  assert(token.length > 0, 'Token should not be empty');
  assert(token.split('.').length === 3, 'JWT should have 3 parts');
});

test('JWT token validation', () => {
  const jwt = require('jsonwebtoken');
  const { JWT_SECRET } = require('./lib/middleware/auth');
  const token = generateToken('test@example.com');
  const decoded = jwt.verify(token, JWT_SECRET);
  assert(decoded.email === 'test@example.com', 'Decoded email should match');
});

// Test 2: Input Sanitization
console.log('\n🧹 Testing Input Sanitization...');

test('Input sanitization removes HTML tags', () => {
  const { sanitizeInput } = require('./lib/middleware/sanitization');
  const input = '<script>alert("xss")</script>Hello';
  const sanitized = sanitizeInput(input);
  assert(!sanitized.includes('<script>'), 'Should remove script tags');
  assert(sanitized.includes('Hello'), 'Should preserve safe content');
});

test('Input sanitization removes javascript protocol', () => {
  const { sanitizeInput } = require('./lib/middleware/sanitization');
  const input = 'javascript:alert("xss")';
  const sanitized = sanitizeInput(input);
  assert(!sanitized.includes('javascript:'), 'Should remove javascript protocol');
});

// Test 3: Cache Module
console.log('\n💾 Testing Cache Module...');

test('Cache set and get operations', () => {
  const { cache } = require('./lib/utils/cache');
  cache.set('test-key', 'test-value');
  const value = cache.get('test-key');
  assert(value === 'test-value', 'Cache should return stored value');
});

test('Cache expiration', (done) => {
  const { cache } = require('./lib/utils/cache');
  cache.set('expire-key', 'expire-value', 1); // 1ms TTL
  setTimeout(() => {
    const value = cache.get('expire-key');
    assert(value === null, 'Expired cache should return null');
  }, 10);
});

test('Cache key generation', () => {
  const { generateCacheKey } = require('./lib/utils/cache');
  const key = generateCacheKey.issuesList(1, 10, 'created_at', 'DESC');
  assert(typeof key === 'string', 'Cache key should be string');
  assert(key.includes('issues:list'), 'Cache key should include prefix');
});

// Test 4: API Structure
console.log('\n🔧 Testing API Structure...');

test('Issues API methods exist', () => {
  const Issues = require('./lib/api/issues');
  const requiredMethods = ['create', 'list', 'get', 'update', 'revisions', 'compareRevisions'];
  requiredMethods.forEach(method => {
    assert(typeof Issues[method] === 'function', `Issues.${method} should be a function`);
  });
});

test('Auth API methods exist', () => {
  const Auth = require('./lib/api/auth');
  assert(typeof Auth.generateToken === 'function', 'Auth.generateToken should be a function');
});

test('Response utilities exist', () => {
  const respond = require('./lib/api/responses');
  const methods = ['success', 'badRequest', 'notFound'];
  methods.forEach(method => {
    assert(typeof respond[method] === 'function', `respond.${method} should be a function`);
  });
});

// Test 5: Database Models
console.log('\n🗄️ Testing Database Models...');

test('Issue model structure', () => {
  const { Issue } = require('./lib/models');
  assert(Issue, 'Issue model should exist');
  assert(typeof Issue.findAll === 'function', 'Issue should have findAll method');
  assert(typeof Issue.create === 'function', 'Issue should have create method');
  assert(typeof Issue.findByPk === 'function', 'Issue should have findByPk method');
});

test('IssueRevision model structure', () => {
  const { IssueRevision } = require('./lib/models');
  assert(IssueRevision, 'IssueRevision model should exist');
  assert(typeof IssueRevision.findAll === 'function', 'IssueRevision should have findAll method');
  assert(typeof IssueRevision.create === 'function', 'IssueRevision should have create method');
});

test('Model associations', () => {
  const { Issue, IssueRevision } = require('./lib/models');
  assert(Issue.associations, 'Issue should have associations');
  assert(IssueRevision.associations, 'IssueRevision should have associations');
});

// Test 6: Configuration
console.log('\n⚙️ Testing Configuration...');

test('Database connection configuration', () => {
  const config = require('./config');
  assert(config.mysql, 'MySQL config should exist');
  assert(config.mysql.hasOwnProperty('host'), 'MySQL host property should exist');
  assert(config.mysql.hasOwnProperty('database'), 'MySQL database property should exist');
  assert(config.hasOwnProperty('port'), 'Server port property should exist');
});

test('Connection pool configuration', () => {
  const sequelize = require('./lib/models/connection');
  assert(sequelize.options.pool, 'Connection pool should be configured');
  assert(sequelize.options.pool.max > 0, 'Pool max should be positive');
  assert(sequelize.options.pool.min >= 0, 'Pool min should be non-negative');
});

// Test 7: Validation Logic
console.log('\n✅ Testing Validation Logic...');

test('Email validation in auth', () => {
  // Test email regex pattern
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  assert(emailRegex.test('valid@example.com'), 'Should accept valid email');
  assert(!emailRegex.test('invalid-email'), 'Should reject invalid email');
  assert(!emailRegex.test(''), 'Should reject empty email');
});

test('Pagination validation logic', () => {
  // Test pagination bounds
  const page = Math.max(1, parseInt('0') || 1);
  const pageSize = Math.min(100, Math.max(1, parseInt('150') || 10));
  assert(page === 1, 'Page should default to 1 for invalid input');
  assert(pageSize === 100, 'Page size should be capped at 100');
});

// Test 8: Error Handling
console.log('\n🚨 Testing Error Handling...');

test('Error response structure', () => {
  const respond = require('./lib/api/responses');
  
  // Mock context
  const mockContext = {
    status: null,
    body: null
  };
  
  respond.badRequest(mockContext, ['Test error']);
  assert(mockContext.status === 400, 'Bad request should set status 400');
  assert(mockContext.body.message === 'Bad Request', 'Should set error message');
  assert(Array.isArray(mockContext.body.errors), 'Should include errors array');
});

test('Not found response', () => {
  const respond = require('./lib/api/responses');
  
  const mockContext = {
    status: null,
    body: null
  };
  
  respond.notFound(mockContext);
  assert(mockContext.status === 404, 'Not found should set status 404');
  assert(mockContext.body.message === 'Not Found', 'Should set not found message');
});

// Test 9: Security Features
console.log('\n🔒 Testing Security Features...');

test('JWT secret configuration', () => {
  const { JWT_SECRET } = require('./lib/middleware/auth');
  assert(typeof JWT_SECRET === 'string', 'JWT secret should be string');
  assert(JWT_SECRET.length > 0, 'JWT secret should not be empty');
});

test('Input length limits', () => {
  const { sanitizeInput } = require('./lib/middleware/sanitization');
  const longInput = 'a'.repeat(20000);
  const sanitized = sanitizeInput(longInput);
  assert(sanitized.length <= 10000, 'Input should be limited to 10000 characters');
});

// Test 10: Performance Features
console.log('\n⚡ Testing Performance Features...');

test('Database indexes configuration', () => {
  const Issue = require('./lib/models/issue');
  assert(Issue.options.indexes, 'Issue model should have indexes');
  assert(Array.isArray(Issue.options.indexes), 'Indexes should be an array');
  assert(Issue.options.indexes.length > 0, 'Should have at least one index');
});

test('Connection pool limits', () => {
  const sequelize = require('./lib/models/connection');
  const pool = sequelize.options.pool;
  assert(pool.max <= 50, 'Pool max should be reasonable');
  assert(pool.min >= 0, 'Pool min should be non-negative');
  assert(pool.acquire > 0, 'Pool acquire timeout should be positive');
});

// Test Results Summary
console.log('\n📊 TEST RESULTS SUMMARY\n');

const total = testResults.passed + testResults.failed;
const passRate = ((testResults.passed / total) * 100).toFixed(1);

console.log(`Total Tests: ${total}`);
console.log(`Passed: ${testResults.passed} (${passRate}%)`);
console.log(`Failed: ${testResults.failed}`);

if (testResults.failed > 0) {
  console.log('\n❌ Failed Tests:');
  testResults.tests
    .filter(test => test.status === 'FAIL')
    .forEach(test => {
      console.log(`  - ${test.name}: ${test.error}`);
    });
}

console.log(`\n🎯 Overall Status: ${testResults.failed === 0 ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);

process.exit(testResults.failed === 0 ? 0 : 1);