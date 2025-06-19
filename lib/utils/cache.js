'use strict';

class SimpleCache {
  constructor(defaultTTL = 300000) {
    this.cache = new Map();
    this.defaultTTL = defaultTTL;
  }

  set(key, value, ttl = this.defaultTTL) {
    const expiresAt = Date.now() + ttl;
    this.cache.set(key, { value, expiresAt });
    
    if (this.cache.size % 100 === 0) {
      this.cleanup();
    }
  }

  get(key) {
    const item = this.cache.get(key);
    if (!item) return null;
    
    if (Date.now() > item.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    
    return item.value;
  }

  delete(key) {
    return this.cache.delete(key);
  }

  clear() {
    this.cache.clear();
  }

  cleanup() {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiresAt) {
        this.cache.delete(key);
      }
    }
  }

  size() {
    return this.cache.size;
  }
}

const cache = new SimpleCache();

const generateCacheKey = {
  issuesList: (page, limit, orderBy, orderDir) => `issues:list:${page}:${limit}:${orderBy}:${orderDir}`,
  issue: (id) => `issue:${id}`,
  issueRevisions: (issueId) => `issue:${issueId}:revisions`,
  issueRevisionsCount: (issueId) => `issue:${issueId}:revisions:count`
};

const invalidateIssueCache = (issueId) => {
  cache.delete(generateCacheKey.issue(issueId));
  cache.delete(generateCacheKey.issueRevisions(issueId));
  cache.delete(generateCacheKey.issueRevisionsCount(issueId));
  
  for (const key of cache.cache.keys()) {
    if (key.startsWith('issues:list:')) {
      cache.delete(key);
    }
  }
};

module.exports = {
  cache,
  generateCacheKey,
  invalidateIssueCache
};