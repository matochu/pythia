# Planning Methodology

**Purpose**: Guidelines for Architect when creating plans. Ensures thorough evaluation of options and informed decision-making.

## Step 0: Check Existing Solutions First

**Before designing custom solution, always check:**

1. **Existing Libraries/Frameworks**
   - Is there a well-maintained library that solves this?
   - What's the community adoption? (GitHub stars, npm downloads, cargo downloads)
   - Is it actively maintained? (recent commits, issue response time)
   - Does it fit our requirements? (features, performance, license)

2. **Industry Standards**
   - Are there standard protocols/formats? (HTTP, JSON, Protocol Buffers)
   - Are there RFC specifications? (OAuth2, JWT, WebSocket)
   - What do successful projects use? (check similar open-source projects)

3. **Built-in Solutions**
   - Does the language/framework provide this? (std library, framework features)
   - Can we use platform APIs? (OS-level features, browser APIs)

**Decision Matrix:**

- **Existing solution:**
  - Use if: solves 80%+ of requirements, well-maintained, good fit
  - Consider if: solves 60–80%, needs minor customization
  - Avoid if: heavy dependency, unmaintained, significant limitations

- **Custom solution:**
  - Build if: unique requirements, no good alternatives, simple to implement
  - Consider if: medium complexity, can reuse existing patterns
  - Avoid if: reinventing the wheel, high complexity, maintenance burden

## When Evaluating Approaches

For each approach, analyze:

1. **Complexity**
   - Implementation difficulty (simple, medium, complex)
   - Learning curve for team
   - Dependencies required
   - Lines of code estimate

2. **Performance**
   - Expected throughput/latency
   - Resource usage (CPU, memory, I/O)
   - Scalability characteristics
   - Bottleneck identification

3. **Maintainability**
   - Code clarity and readability
   - Testing ease
   - Future extensibility
   - Documentation quality

4. **Risk**
   - Technical risks (race conditions, deadlocks)
   - Integration risks (API changes, breaking changes)
   - Operational risks (deployment, rollback)
   - Security risks (vulnerabilities, attack vectors)

5. **Trade-offs**
   - What do we gain?
   - What do we sacrifice?
   - Is it worth it?
   - What's the opportunity cost?

## Example Evaluation Template

```
Approach Evaluation: [PROBLEM_AREA]

Option 0: Existing Solutions
- Libraries/frameworks checked: [LIBS_CHECKED]
- Built-in/platform options checked: [PLATFORM_OPTIONS]
- Findings: [KEY_FINDINGS]

Option 1: [APPROACH_1_NAME]
- Pros: [PROS]
- Cons: [CONS]
- Complexity: [LOW|MEDIUM|HIGH]
- Performance: [EXPECTED_PERF]
- Maintainability: [EXPECTED_MAINT]
- Risk: [LOW|MEDIUM|HIGH]

Option 2: [APPROACH_2_NAME] (same fields)
Option 3: [APPROACH_3_NAME] (same fields)

Recommendation: [CHOSEN_APPROACH]
- Justification: [WHY]
- Trade-offs accepted: [TRADEOFFS]
- Migration path: [HOW_TO_EVOLVE_LATER]
```

**See also**: `agents/_shared-principles.md` for design patterns, SOLID principles, and code smells.
