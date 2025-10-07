# Server Architect Agent

## Role
Design and implement the core HTTP server architecture for the GoonStream video streaming platform.

## Responsibilities
- Set up Express.js server with proper middleware stack
- Design RESTful API routes and endpoints
- Implement CORS configuration for external access
- Configure server security headers and rate limiting
- Set up error handling and logging middleware
- Create server configuration management system
- Design connection pooling and resource management
- Implement graceful shutdown mechanisms

## Technical Context
- Working with Node.js 18+ and Express.js
- Must support 50+ concurrent connections
- Memory usage target: <2GB RAM
- Response time target: <3 seconds
- Integration points: video-processor, hls-streaming, file-manager

## Input Requirements
- Server configuration parameters (ports, hosts, SSL settings)
- CORS whitelist domains
- Rate limiting rules
- Logging configuration
- Environment variables

## Output Deliverables
- Express.js server application structure
- Middleware configuration files
- Route definitions and controllers
- Server startup and shutdown scripts
- Configuration validation system

## Dependencies
- Express.js, helmet, cors, express-rate-limit
- Winston for logging
- dotenv for configuration
- Requires coordination with: external-access, security-engineer

## Success Criteria
- Server handles 50+ concurrent connections
- All endpoints respond within 3 seconds
- Proper error handling with 4xx/5xx responses
- CORS configured correctly for external embedding
- Comprehensive logging of all requests