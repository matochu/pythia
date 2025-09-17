# Task Examples

## Example 1: Simple Feature Implementation

**File**: `task-2025-01-add-form-validation.md`

```markdown
---
title: 'Add Form Validation'
type: task
category: feature
priority: medium
complexity: low
created: 2025-01-15
status: completed
---

# Task: Add Form Validation

## Summary

Implement client-side validation for user registration form to improve user experience and data quality.

## Context

The user registration form currently has no validation, leading to poor user experience and invalid data submissions.

## Objectives

- Add real-time validation for all form fields
- Display clear error messages to users
- Prevent form submission with invalid data
- Improve overall user experience

## Scope

**In Scope:**

- Email format validation
- Password strength validation
- Required field validation
- Real-time error display

**Out of Scope:**

- Server-side validation (separate task)
- Password reset functionality
- Email verification

## Implementation Plan

### Phase 1: Setup (Complexity: Low)

- [ ] Install validation library
- [ ] Create validation utility functions
- [ ] Set up error message components

### Phase 2: Implementation (Complexity: Low)

- [ ] Add email validation
- [ ] Add password strength validation
- [ ] Add required field validation
- [ ] Implement real-time error display

### Phase 3: Testing (Complexity: Low)

- [ ] Unit tests for validation functions
- [ ] Integration tests for form behavior
- [ ] User acceptance testing

## Success Criteria

- [ ] All form fields have appropriate validation
- [ ] Error messages are clear and helpful
- [ ] Form cannot be submitted with invalid data
- [ ] Validation works in all supported browsers
- [ ] No regression in existing functionality

## Dependencies

- [Form Component](mdc:components/form-component.md)
- [Validation Library](mdc:libraries/validation.md)

## Quality Control

- [ ] Unit tests written and passing
- [ ] Integration tests written and passing
- [ ] Code review completed
- [ ] User acceptance testing completed

## Progress Tracking

- [x] Planning completed
- [x] Implementation started
- [x] Testing completed
- [x] Documentation updated
- [x] Task completed

## Implementation Summary

Successfully implemented form validation using Yup library. All validation rules working correctly with clear error messages. No regressions detected.
```

## Example 2: Complex System Refactoring

**File**: `task-2025-01-refactor-database-layer.md`

```markdown
---
title: 'Refactor Database Layer'
type: task
category: technical
priority: high
complexity: high
created: 2025-01-10
status: in-progress
---

# Task: Refactor Database Layer

## Summary

Refactor the existing database layer to improve performance, maintainability, and scalability while maintaining backward compatibility.

## Context

The current database layer has grown organically and now has performance issues, tight coupling, and poor testability. This refactoring is critical for future scalability.

## Objectives

- Improve database query performance by 50%
- Reduce coupling between database and business logic
- Increase test coverage to 90%
- Maintain 100% backward compatibility
- Implement connection pooling

## Scope

**In Scope:**

- Query optimization
- Connection pooling implementation
- Repository pattern implementation
- Unit test coverage
- Performance monitoring

**Out of Scope:**

- Database schema changes
- Migration to different database system
- API changes

## Implementation Plan

### Phase 1: Research & Analysis (Complexity: Medium)

- [ ] Analyze current performance bottlenecks
- [ ] Research best practices for database layer design
- [ ] Create technical design document
- [ ] Identify breaking changes and mitigation strategies

### Phase 2: Foundation (Complexity: High)

- [ ] Implement connection pooling
- [ ] Create repository interfaces
- [ ] Set up performance monitoring
- [ ] Create comprehensive test suite

### Phase 3: Migration (Complexity: High)

- [ ] Implement new repository classes
- [ ] Migrate existing queries
- [ ] Update business logic to use new interfaces
- [ ] Implement backward compatibility layer

### Phase 4: Optimization (Complexity: Medium)

- [ ] Optimize slow queries
- [ ] Implement caching layer
- [ ] Fine-tune connection pool settings
- [ ] Performance testing and validation

## Success Criteria

- [ ] 50% improvement in average query response time
- [ ] 90% test coverage for database layer
- [ ] Zero breaking changes for existing API
- [ ] Connection pool reduces connection overhead by 80%
- [ ] All existing functionality works unchanged

## Dependencies

- [Database Performance Analysis](mdc:contexts/technical/database-performance-analysis.md)
- [Repository Pattern Design](mdc:contexts/technical/repository-pattern-design.md)
- [Performance Monitoring Setup](mdc:contexts/technical/performance-monitoring-setup.md)

## Risks and Mitigation

- **Risk**: Breaking existing functionality
  - **Mitigation**: Comprehensive test suite and gradual migration
- **Risk**: Performance regression
  - **Mitigation**: Continuous performance monitoring and benchmarking
- **Risk**: Extended downtime
  - **Mitigation**: Blue-green deployment strategy

## Quality Control

- [ ] AI Solution Analysis completed
- [ ] Performance benchmarks established
- [ ] Comprehensive test suite created
- [ ] Code review by senior developers
- [ ] Load testing completed

## Progress Tracking

- [x] Planning completed
- [x] Research & Analysis completed
- [x] Foundation started
- [ ] Migration in progress
- [ ] Optimization pending

## Implementation Summary

[To be completed after implementation]
```

## Example 3: Bug Fix Task

**File**: `task-2025-01-fix-memory-leak.md`

```markdown
---
title: 'Fix Memory Leak in Image Processing'
type: task
category: bugfix
priority: high
complexity: medium
created: 2025-01-12
status: completed
---

# Task: Fix Memory Leak in Image Processing

## Summary

Fix memory leak in image processing module that causes application crashes after processing large batches of images.

## Context

Users report application crashes when processing more than 50 images in a batch. Memory usage grows continuously and eventually causes out-of-memory errors.

## Objectives

- Identify root cause of memory leak
- Fix memory leak without affecting functionality
- Add memory monitoring to prevent future issues
- Ensure stable processing of 100+ images

## Scope

**In Scope:**

- Memory leak investigation
- Fix implementation
- Memory monitoring
- Testing with large batches

**Out of Scope:**

- Image processing algorithm optimization
- UI improvements for batch processing
- New image format support

## Implementation Plan

### Phase 1: Investigation (Complexity: Medium)

- [ ] Profile memory usage during image processing
- [ ] Identify objects not being garbage collected
- [ ] Analyze memory allocation patterns
- [ ] Document findings

### Phase 2: Fix Implementation (Complexity: Medium)

- [ ] Fix identified memory leaks
- [ ] Add proper cleanup in image processing
- [ ] Implement memory monitoring
- [ ] Add unit tests for memory management

### Phase 3: Testing (Complexity: Low)

- [ ] Test with various image sizes
- [ ] Test with large batches (100+ images)
- [ ] Monitor memory usage over time
- [ ] Performance regression testing

## Success Criteria

- [ ] Memory usage remains stable during batch processing
- [ ] No memory leaks detected in profiling
- [ ] Application can process 100+ images without crashes
- [ ] Memory monitoring alerts on future issues
- [ ] No performance regression

## Dependencies

- [Memory Profiling Tools](mdc:tools/memory-profiling.md)
- [Image Processing Module](mdc:modules/image-processing.md)

## Quality Control

- [ ] Memory profiling completed
- [ ] Load testing with large batches
- [ ] Code review focused on memory management
- [ ] Performance regression testing

## Progress Tracking

- [x] Planning completed
- [x] Investigation completed
- [x] Fix implementation completed
- [x] Testing completed
- [x] Task completed

## Implementation Summary

Found memory leak in image buffer management. Fixed by properly disposing of image buffers after processing. Added memory monitoring to detect future issues. Successfully tested with 200+ image batches.
```

## Task Template Usage

### For Simple Tasks

- Use basic structure with essential sections
- Focus on clear objectives and success criteria
- Minimal context integration required

### For Complex Tasks

- Include all sections with detailed information
- Extensive context document integration
- Comprehensive risk assessment and mitigation
- AI Solution Analysis required

### For Bug Fixes

- Focus on root cause analysis
- Include investigation phase
- Emphasize testing and validation
- Document prevention measures

---

_Last Updated: 2025-09-15_
