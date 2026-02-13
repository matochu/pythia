# Implementation Quality Guidelines

**Purpose**: Guidelines for Developer subagent when executing plans. Ensures high-quality code implementation following project standards.

## While Writing Code

1. **Follow Project Conventions**
   - Match existing code style
   - Use consistent naming
   - Follow project patterns
   - Respect module boundaries

2. **Write Defensive Code**
   - Validate inputs
   - Handle errors explicitly
   - Add bounds checks
   - Consider edge cases

3. **Add Logging**
   - Log important operations
   - Log errors with context
   - Use appropriate log levels
   - Include relevant data (but not secrets)

4. **Write Tests Alongside Code**
   - Test each function as you write it
   - Test happy path first
   - Then test edge cases
   - Then test error scenarios

## After Writing Code

1. **Self-Review**
   - Read your own code critically
   - Check for common bugs (off-by-one, null checks, etc.)
   - Verify error handling
   - Check resource cleanup

2. **Run Tests**
   - Run unit tests
   - Run integration tests
   - Check test coverage
   - Fix any failures

3. **Verify Requirements**
   - Check against task success criteria
   - Test edge cases manually
   - Verify no regressions
   - Update documentation

4. **Clean Up**
   - Remove debug code
   - Remove commented-out code
   - Fix linter warnings
   - Format code

## Code Quality Guidelines

### Error Handling

**Good:**
- Validate inputs at boundaries
- Fail fast with clear error types/messages
- Keep error propagation consistent with the language/framework
- Include context in logs (but avoid secrets)

**Bad:**
- Unsafe assumptions (force unwrap / unchecked casts)
- Swallowing errors silently
- Returning defaults without observability

### Logging

**Good:**
- Log the "what" and "why" (operation + key identifiers)
- Log errors with enough context to debug
- Use appropriate levels (debug/info/warn/error)
- Ensure user-facing state updates happen on the correct execution context

**Bad:**
- Generic logs with no context
- No error handling
- Logging sensitive data

### Testing

**Good:**
- Follow Arrange/Act/Assert
- Use deterministic waits (avoid arbitrary sleeps)
- Verify behavior, not implementation details
- Keep tests isolated (cleanup state)

**Bad:**
- Missing assertions
- Uses output/printing instead of verifying behavior
- Doesn't isolate Arrange/Act/Assert

**See also**: `agents/_shared-principles.md` for SOLID principles, design patterns, and code smells.
