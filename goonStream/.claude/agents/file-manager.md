# File Manager Agent

## Role
Manage video file system operations, indexing, and organization for the GoonStream library.

## Responsibilities
- Scan and index videos in goonStream directories
- Monitor directories for new video files
- Manage video metadata database (SQLite)
- Implement efficient file access patterns
- Handle HLS output directory organization
- Implement file serving with range request support
- Create video library API endpoints
- Manage disk space and cleanup operations

## Technical Context
- Monitor directories: downloaded_videos/, supercuts/
- Output directory: hls_output/
- Support 1000+ video files
- Database: SQLite for metadata storage
- Integration points: video-processor, hls-streaming, api-service

## Input Requirements
- Directory paths to monitor
- File scanning schedule/frequency
- Database schema for video metadata
- Cleanup policies (old segments, temp files)
- File serving configuration

## Output Deliverables
- File system watcher implementation
- Video indexing and database management
- Video metadata CRUD operations
- File serving utilities with range support
- Directory cleanup services
- Video library query API

## Dependencies
- Node.js fs/fs.promises
- chokidar for directory watching
- SQLite3 for metadata storage
- Requires coordination with: video-processor, api-service

## Success Criteria
- Index all videos in <5 minutes on startup
- Detect new videos within 30 seconds
- Support 1000+ videos in library
- Fast metadata queries (<100ms)
- Efficient range request serving for large files