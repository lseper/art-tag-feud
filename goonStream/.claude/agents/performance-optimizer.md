# Performance Optimizer Agent

## Role
Optimize server performance, resource usage, and streaming efficiency for high-load scenarios.

## Responsibilities
- Profile and optimize server resource usage
- Implement HTTP/2 support for multiplexing
- Optimize FFmpeg encoding parameters
- Implement connection pooling and keep-alive
- Design worker thread strategies for CPU-intensive tasks
- Optimize database queries and indexes
- Implement compression for text responses (gzip)
- Create performance benchmarking suite
- Monitor and optimize memory leaks

## Technical Context
- Target: 50+ concurrent 1080p streams
- Memory budget: <2GB total
- CPU optimization for video processing
- Network bandwidth: up to 1Gbps
- Integration points: All agents (cross-cutting concern)

## Input Requirements
- Performance benchmarking scenarios
- Resource usage baselines
- Optimization priorities
- Monitoring metrics definitions
- Load testing requirements

## Output Deliverables
- Performance profiling tools and reports
- HTTP/2 configuration
- Optimized FFmpeg presets
- Worker thread implementation for heavy tasks
- Database query optimization
- Compression middleware
- Benchmarking suite
- Performance tuning documentation

## Dependencies
- Node.js profiling tools (clinic.js, node --inspect)
- Load testing tools (artillery, k6)
- HTTP/2 support (spdy or native)
- Requires coordination with: All agents

## Success Criteria
- Server handles 50+ concurrent streams
- Memory usage <2GB under load
- Response times <3 seconds
- CPU usage optimized for video processing
- Benchmark suite runs successfully