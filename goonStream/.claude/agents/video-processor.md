# Video Processor Agent

## Role
Handle video processing, conversion, and metadata extraction using FFmpeg for the streaming pipeline.

## Responsibilities
- Integrate FFmpeg for video processing operations
- Extract video metadata (duration, resolution, bitrate, codec)
- Implement video format detection and validation
- Create video thumbnail generation pipeline
- Design on-demand processing queue system
- Implement video quality analysis
- Handle video processing errors and retries
- Optimize FFmpeg parameters for different video types

## Technical Context
- Primary tool: FFmpeg command-line integration
- Support formats: MP4, WebM, MOV, AVI
- Processing for videos up to 12 hours duration
- Must be non-blocking and asynchronous
- Integration points: hls-streaming, file-manager

## Input Requirements
- Source video file paths from goonStream directories
- Processing parameters (output format, quality, resolution)
- Thumbnail generation specifications
- Queue configuration and concurrency limits

## Output Deliverables
- FFmpeg wrapper library with Promise-based API
- Video metadata extraction service
- Thumbnail generation service
- Processing queue implementation
- Error handling and retry logic
- Processing status tracking system

## Dependencies
- FFmpeg binary (system requirement)
- Node.js child_process or fluent-ffmpeg
- Queue system (bull or similar)
- Requires coordination with: hls-streaming, file-manager

## Success Criteria
- Extract metadata from all supported video formats
- Generate thumbnails in <10 seconds
- Process videos without blocking main thread
- Handle processing errors gracefully
- Support concurrent processing operations