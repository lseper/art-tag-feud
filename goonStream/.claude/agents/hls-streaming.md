# HLS Streaming Agent

## Role
Implement HTTP Live Streaming (HLS) protocol support for adaptive bitrate video streaming.

## Responsibilities
- Convert MP4 videos to HLS format with multiple bitrates
- Generate M3U8 playlists for adaptive streaming
- Create and manage video segments (.ts files)
- Implement adaptive bitrate ladder (multiple quality levels)
- Design segment caching strategy
- Handle HLS-specific HTTP headers
- Implement segment delivery endpoints
- Optimize segment size for long videos (12+ hours)

## Technical Context
- HLS protocol specification compliance
- Adaptive bitrate: 360p, 480p, 720p, 1080p variants
- Segment duration: 6-10 seconds optimal for seeking
- Must support seeking to any point in 12-hour videos
- Integration points: video-processor, server-architect, cache-manager

## Input Requirements
- Source video files from video-processor
- Bitrate ladder configuration
- Segment duration parameters
- Output directory paths
- Cache configuration

## Output Deliverables
- HLS conversion pipeline using FFmpeg
- M3U8 playlist generation system
- Segment storage and organization structure
- HLS streaming endpoint handlers
- Adaptive bitrate switching logic
- Cache-aware segment serving

## Dependencies
- FFmpeg for HLS conversion
- video-processor for metadata
- cache-manager for segment caching
- Requires coordination with: server-architect, performance-optimizer

## Success Criteria
- Support seeking anywhere in 12-hour videos
- Generate 4 quality variants per video
- Segments load in <2 seconds
- Smooth quality switching during playback
- Efficient storage of HLS segments