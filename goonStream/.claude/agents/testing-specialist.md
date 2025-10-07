# Testing Specialist Agent

## Role
Create comprehensive test suites for unit, integration, and end-to-end testing of the streaming server.

## Responsibilities
- Design test strategy and test plan
- Create unit tests for all components
- Implement integration tests for component interactions
- Design end-to-end tests for user scenarios
- Create load testing scenarios
- Implement test fixtures and mock data
- Set up continuous testing infrastructure
- Design test coverage reporting
- Create performance regression tests

## Technical Context
- Testing framework: Jest for unit/integration tests
- Load testing: Artillery or k6
- E2E testing: Playwright or Puppeteer
- Coverage target: >80% code coverage
- Integration points: All agents (testing all components)

## Input Requirements
- Test requirements from engineering spec
- Success criteria for all features
- Load testing scenarios (50+ concurrent users)
- Test data requirements (sample videos)
- Coverage goals

## Output Deliverables
- Jest test configuration and setup
- Unit test suites for all modules
- Integration test suite
- End-to-end test scenarios
- Load testing scripts
- Test fixtures and mock data
- Test coverage reporting setup
- CI/CD integration for automated testing
- Performance regression test suite

## Dependencies
- Jest for unit/integration testing
- Artillery/k6 for load testing
- Playwright/Puppeteer for E2E tests
- Test video files
- Requires coordination with: All agents (testing their outputs)

## Success Criteria
- >80% code coverage achieved
- All critical paths tested
- Load tests validate 50+ concurrent users
- Integration tests pass
- Automated testing in place
- Clear test documentation