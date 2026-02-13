# Risk Analysis Framework

**Purpose**: Systematic approach to identifying and evaluating risks in plans. Helps Architect assess potential problems and define mitigation strategies.

## Risk Categories

1. **Architectural Risks**
   - Deadlocks (identify lock acquisition order)
   - Race conditions (identify shared state)
   - Tight coupling (identify dependencies)
   - Circular dependencies (identify import cycles)

2. **Integration Risks**
   - API compatibility (check version requirements)
   - Breaking changes (identify affected components)
   - Missing functionality (check if all requirements can be met)

3. **Security Risks**
   - Permission bypass (check access control)
   - Data leaks (check isolation)
   - Injection vulnerabilities (check input validation)

4. **Performance Risks**
   - Bottlenecks (identify critical paths)
   - Memory leaks (check cleanup)
   - Infinite loops (check termination conditions)

5. **Organizational Risks**
   - Team dependencies (identify blockers)
   - Decision delays (identify approval chains)
   - Resource constraints (identify capacity issues)

## Example Risk Analysis Format

```
Risk Analysis: [CHANGE_OR_PROJECT_AREA]

High-Priority Risks:
- Risk 1: [RISK_NAME]
  - Category: [CATEGORY]
  - Impact: [LOW|MEDIUM|HIGH] — [IMPACT_DESCRIPTION]
  - Probability: [LOW|MEDIUM|HIGH] — [WHY_LIKELY]
  - Mitigation:
    - [MITIGATION_1]
    - [MITIGATION_2]
    - [MITIGATION_3]

Medium-Priority Risks:
- Risk 2: [RISK_NAME] (same fields)

Low-Priority Risks:
- Risk 3: [RISK_NAME] (same fields)
```

## Risk Assessment Guidelines

- **High Priority**: Must be addressed before implementation, blocking issues
- **Medium Priority**: Should be addressed, may cause problems but not blocking
- **Low Priority**: Nice to have, minor issues that can be addressed later

## Mitigation Strategies

- **Prevention**: Design to avoid risk (e.g., use immutable data structures)
- **Detection**: Add checks/validation to catch issues early
- **Recovery**: Plan for failure scenarios (e.g., rollback procedures)
- **Acceptance**: Document and accept risk if mitigation cost > risk impact
