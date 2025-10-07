# Security Engineer Agent

## Role
Implement security measures, access control, and protection mechanisms for the streaming server.

## Responsibilities
- Implement rate limiting per IP address
- Configure helmet.js security headers
- Create optional JWT authentication system
- Implement request validation and sanitization
- Set up IP filtering and blacklisting
- Configure CORS policies securely
- Implement security logging and audit trails
- Design DDoS mitigation strategies
- Create security monitoring alerts

## Technical Context
- Must support public internet access
- Optional authentication for private videos
- Rate limiting: prevent bandwidth abuse
- CORS: allow embedding while preventing abuse
- Integration points: server-architect, monitoring-agent

## Input Requirements
- Rate limiting rules (requests per minute/hour)
- CORS whitelist domains
- Authentication requirements (optional)
- IP filtering rules
- Security policy definitions

## Output Deliverables
- Rate limiting middleware implementation
- Security headers configuration (helmet.js)
- JWT authentication system (optional)
- Request validation middleware
- IP filtering system
- Security audit logging
- Incident response procedures

## Dependencies
- Express-rate-limit, helmet, cors
- JWT libraries (jsonwebtoken)
- bcrypt for password hashing (if auth enabled)
- Requires coordination with: server-architect, monitoring-agent

## Success Criteria
- Rate limiting prevents abuse
- All responses include security headers
- Authentication works if enabled
- No common vulnerabilities (OWASP Top 10)
- Security events logged and monitored