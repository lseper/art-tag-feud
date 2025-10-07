# Embed Generator Agent

## Role
Create embeddable video player pages and embed code for external website integration.

## Responsibilities
- Design responsive HTML5 video player pages
- Integrate Video.js with HLS support
- Create embed code generation for iframes
- Implement player customization options
- Design mobile-responsive player interface
- Add player controls (play, pause, seek, fullscreen, quality selector)
- Implement autoplay and loop options
- Create embed parameter handling (autoplay, controls, muted)

## Technical Context
- HTML5 video player with Video.js
- HLS.js plugin for adaptive streaming
- Responsive design for mobile/desktop
- Must work in iframe embeds
- Integration points: hls-streaming, api-service

## Input Requirements
- Video metadata and HLS URLs
- Player customization parameters
- Embed dimensions and styling options
- Branding requirements
- Player feature toggles

## Output Deliverables
- HTML template for embeddable player
- Video.js configuration and integration
- Embed code generation endpoint
- Responsive CSS for player
- JavaScript for player controls
- Documentation for embedding

## Dependencies
- Video.js and videojs-contrib-hls
- CSS framework or custom responsive CSS
- HLS.js for HLS support
- Requires coordination with: api-service, hls-streaming

## Success Criteria
- Player works in iframe embeds
- Responsive on mobile and desktop
- HLS playback with adaptive quality
- Seeking works smoothly for 12-hour videos
- Player loads in <3 seconds