# Cache Manager Agent

## Role
Implement caching strategies for HLS segments and API responses to optimize performance.

## Responsibilities
- Design HLS segment caching strategy
- Implement in-memory cache for frequently accessed segments
- Create cache invalidation policies
- Implement disk cache for converted HLS files
- Design cache warming for popular videos
- Create cache statistics and monitoring
- Implement LRU cache eviction policies
- Design cache headers for HTTP responses

## Technical Context
- Cache target: HLS segments (.ts files) and playlists (.m3u8)
- Memory limit: <2GB total server usage
- Disk cache in hls_output/ directory
- Integration points: hls-streaming, performance-optimizer

## Input Requirements
- Cache size limits (memory and disk)
- Cache TTL policies
- Popular video identification logic
- Cache warming schedule
- Eviction policies

## Output Deliverables
- In-memory cache implementation (node-cache or similar)
- Disk cache management system
- Cache middleware for Express routes
- Cache statistics and monitoring
- Cache warming service
- HTTP cache header configuration

## Dependencies
- node-cache or similar in-memory cache
- File system for disk cache
- Requires coordination with: hls-streaming, monitoring-agent

## Success Criteria
- 80%+ cache hit rate for popular segments
- Reduced HLS conversion for cached videos
- Memory usage stays under limits
- Cache warms automatically on startup
- HTTP cache headers properly set