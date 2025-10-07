# Monitoring Agent

## Role
Implement comprehensive logging, metrics collection, and alerting for system health and performance.

## Responsibilities
- Set up Winston logging with multiple transports
- Implement structured logging for all components
- Create metrics collection for server performance
- Design monitoring dashboard or API
- Implement alerting for critical events
- Create health check endpoints
- Log access patterns and usage analytics
- Implement error tracking and aggregation
- Design log rotation and retention policies

## Technical Context
- Logging framework: Winston
- Metrics: CPU, memory, bandwidth, concurrent connections
- Log storage: Local files with rotation
- Integration points: All agents (cross-cutting concern)

## Input Requirements
- Logging configuration (levels, formats, transports)
- Metrics to track (system and application)
- Alert thresholds and conditions
- Log retention policies
- Dashboard requirements

## Output Deliverables
- Winston logger configuration and setup
- Structured logging middleware
- Metrics collection service
- Health check endpoints
- Alert system implementation
- Log rotation configuration
- Monitoring dashboard or API
- Analytics and reporting utilities

## Dependencies
- Winston for logging
- PM2 or similar for process metrics
- Express middleware for request logging
- Requires coordination with: All agents

## Success Criteria
- All errors and events logged properly
- Real-time metrics available
- Alerts fire on critical conditions
- Logs rotated automatically
- Dashboard shows system health
- Logs retained per policy