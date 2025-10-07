# API Service Agent

## Role
Design and implement RESTful API endpoints for video library access and streaming control.

## Responsibilities
- Implement GET /api/videos endpoint for library listing
- Create video metadata response formatting
- Implement video search and filtering endpoints
- Design pagination for large video libraries
- Create embed URL generation logic
- Implement API response validation
- Design API versioning strategy
- Create API documentation (OpenAPI/Swagger)

## Technical Context
- RESTful API design principles
- JSON response format
- Pagination for 1000+ videos
- Integration points: file-manager, hls-streaming, embed-generator

## Input Requirements
- API endpoint specifications from engineering spec
- Video metadata schema from file-manager
- Filtering and search requirements
- Pagination parameters
- API documentation requirements

## Output Deliverables
- Express.js route handlers for all endpoints
- Request validation middleware
- Response formatting utilities
- API documentation (OpenAPI spec)
- Integration with video library database
- Error response standardization

## Dependencies
- Express.js for routing
- Express-validator for validation
- Swagger/OpenAPI for documentation
- Requires coordination with: file-manager, embed-generator

## Success Criteria
- All API endpoints documented
- Response times <500ms
- Proper error handling (4xx, 5xx)
- Pagination supports 1000+ videos
- API versioning implemented