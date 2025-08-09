# Command: Analyze AI Solutions

> **IMPORTANT**: This command provides a deterministic, repeatable procedure for analysing and critiquing typical AI‑generated solutions (code, design proposals, architectural diagrams, documentation) to prevent over‑engineering, redundant logic, verbose documentation, and unsound implementations.

## Purpose

Offer a systematic approach for reviewers and LLMs to evaluate AI‑generated output, ensuring simplicity, correctness, maintainability, and alignment with Thea project standards. This command helps maintain code quality by identifying over-engineering, redundant logic, and architectural inconsistencies in AI-generated solutions.

## Prerequisites

1. Access to the AI‑generated solution to be analysed (code repository, design doc, or attachment)
2. Familiarity with Thea project coding standards and architectural guidelines
3. Linting and static‑analysis tools installed locally or in CI (e.g., ESLint, TypeScript compiler)
4. Unit‑testing framework set up (Vitest for Thea project)
5. **Optional**: Complexity analysis tools (e.g., `ts-complex`, `plato`)

## Workspace Usage

This command can be used in any project workspace:

```bash
# Reference the command
@analyze-ai-solutions.md

# Execute with project context
Execute this command for my project at [project-path]

# Example usage
@analyze-ai-solutions.md
Context: PR #123 adds AI‑generated order‑processing service
Objective: Evaluate for over‑engineering and redundant logic
Scope: service layer code only
```

## Self‑Check Points

Before finalising an analysis, verify:

- [ ] All five evaluation dimensions (Complexity, Redundancy, Documentation, Soundness, Integration) reviewed
- [ ] At least one automated and one manual check completed per dimension
- [ ] All identified issues categorised by severity (blocker, major, minor, nitpick)
- [ ] Recommendations are actionable and testable
- [ ] No new architectural inconsistencies introduced
- [ ] Acceptance criteria met (see below)

## Methodology Integration

- **Instruction Improvement**: Apply _Improve Instruction_ and _Spark‑Improve Instruction_ commands to refine feedback loops
- **Documentation Guidelines**: Follow project _Documentation Guidelines_ for structure, cross‑referencing, and link format
- **Quality Rubric**: Use rubric below for self‑assessment of the analysis report

## Quality Rubric

| Dimension                           | 1 (Low)            | 3 (Medium)                | 5 (High)                        |
| ----------------------------------- | ------------------ | ------------------------- | ------------------------------- |
| **Clarity**                         | Vague              | Mostly clear              | Crystal‑clear, no ambiguity     |
| **Determinism**                     | Random             | Some non‑deterministic    | Fully deterministic, repeatable |
| **Testability**                     | None               | Basic unit tests          | Comprehensive tests + coverage  |
| **Safety**                          | Absent             | Basic fallback            | Robust safety & stop conditions |
| **Completeness**                    | Sparse             | Minor gaps                | Exhaustive coverage             |
| **Maintainability**                 | Hard               | Moderate effort           | Easy to maintain & extend       |
| **Heuristic Simplicity (KISS/DRY)** | Violations rampant | Occasional issues spotted | AI gate ensures adherence       |

## Safety & Stop Conditions

- **No Hallucination**: If requirements or solution intent are unclear, **STOP** and request clarification.
- **Stop Conditions**:

  - Missing business requirements or acceptance criteria
  - Conflicting architectural constraints
  - Critical security or data‑loss risk detected

- **Fallback**: Suggest simplified alternative only when original intent is validated by stakeholders.

## Command Checklist

- [ ] Clone or open the AI‑generated solution branch
- [ ] Run static‑analysis / linter
- [ ] Generate complexity metrics report
- [ ] Execute unit tests (or scaffold tests if missing)
- [ ] Inspect documentation for verbosity and correctness
- [ ] Cross‑check architecture against project standards
- [ ] Compile findings into structured review report (template provided below)

## Step 1: Preparation

1. **Gather Context**
   - Identify business requirements, target module, and stakeholders.
   - Confirm acceptance criteria and definition of done.
2. **Set Up Tooling**
   - Ensure linters, test runners, and complexity tools are configured.
   - Export baseline metrics for comparison (complexity, LOC, coverage).
3. **Create Review Branch (Optional)**
   - If heavy refactor needed, create `review/fixes-<ticket>` branch.

## Step 2: Static Evaluation

0. **Diff-aware scope (default)**

- Analyze only changed source files relative to main branch. Skip heavy checks if no relevant file changes.

```bash
# Identify changed files against main (adjust remote if needed)
git fetch origin main
git diff --name-only origin/main...HEAD -- 'src/**/*.{ts,tsx,js,jsx}' > .review/changed-files.txt || true

# If the list is empty, you may skip heavy checks
CHANGED_COUNT=$(wc -l < .review/changed-files.txt | xargs)
echo "Changed files: $CHANGED_COUNT"
```

1. **Complexity & Duplication Analysis**

   **Complexity Analysis Tools (Globally Installed):**

   ```bash
   # Tools are already installed globally:
   # - ts-complex for TypeScript complexity analysis
   # - jscpd for code duplication detection
   # - plato for comprehensive analysis
   ```

   **Usage Examples:**

   ```bash
   # Run ts-complex on specific files (globally installed)
   ts-complex --format json --output complexity-report.json src/hooks/useHealthCheck.ts

   # Run jscpd for duplication detection (globally installed)
   jscpd --reporters json,html --output ./reports/duplication src/

   # Generate HTML reports for visualization
   ts-complex --format html --output complexity-report.html src/
   ```

   - **Run `ts-complex`** (or **`plato`**) to compute cyclomatic & cognitive complexity and generate an HTML report – **ESLint не потрібен**. Fail the PR if **any function exceeds 10 cyclomatic complexity (CC)** or if the **file‑level average CC > 7**.
   - **Generate a SonarQube/SonarCloud report** (or locally with `sonar-scanner`) and enforce:

     - **Cognitive complexity ≤ 15** per function
     - **Duplicate blocks < 3 %** of the changed code

   - **Track trend metrics** with `radon cc` (Python) or `ts-complex`/`plato` (TypeScript). Publish diff results in the CI comment so reviewers see whether the PR _raises_ or _lowers_ CC vs `main`.
   - **Gate the pipeline**: if CC, cognitive complexity, or duplication exceeds thresholds **or grows > 20 % relative to `main`**, the build fails. Exceptions require explicit reviewer sign‑off plus a TODO ticket to repay the debt.
   - **Persist metrics** to `complexity-history.json` (or Sonar history) so architectural owners can audit trends each sprint.

2. **AI Heuristic Review (KISS / DRY / YAGNI)**

   **LLM-Based Analysis Tools:**

   ```bash
   # complexity-report is already installed globally for complexity analysis
   ```

   **Usage Examples:**

   ```bash
   # Analyze specific files for complexity (globally installed)
   complexity-report src/hooks/useHealthCheck.ts
   ```

   **LLM Analysis Process:**

   - Provide the code diff as context input to the LLM for analysis
   - The model must return **minified JSON** with fields: `kiss_score (0‑5)`, `duplicate_segments`, `yagni_flags`, `simplification_suggestions`
   - **Analysis Focus**: Detect KISS violations, DRY principle violations, and YAGNI (You Aren't Gonna Need It) issues
   - **CI gate**: fail the PR if `kiss_score ≤ 2` **or** any `yagni_flags` exist, unless a senior reviewer explicitly approves and creates a follow‑up ticket
   - Persist the JSON as `.review/llm-kiss-dry.json` and attach it to the PR for auditability and future trend analysis

3. **Redundancy Detection**

   **Redundancy Detection Tools (Globally Installed):**

   ```bash
   # Tools are already installed globally:
   # - jscpd for code duplication detection
   # - ts-unused-exports for finding unused exports
   # - unimported for finding unused imports
   ```

   **Usage Examples:**

   ```bash
   # Run jscpd for duplication detection (globally installed)
   jscpd --reporters json,html --output ./reports/duplication src/

   # Find unused exports (globally installed)
   ts-unused-exports tsconfig.json

   # Find unused imports (globally installed)
   unimported --init
   unimported
   ```

   - Search for duplicate logic, dead code, unreachable branches.
   - Use similarity detectors (`jscpd`, `flake‑finder`).

4. **Documentation Check**
   - Ensure docs are concise (≤ 25% of code size).
   - Remove self‑evident comments; focus on why, not what.

## Step 3: Dynamic Evaluation

1. **Unit & Integration Tests**
   - Run existing tests; verify ≥90% pass rate.
   - Add missing edge‑case tests (null, boundary, concurrency).
2. **Behavioural Validation**

   - Compare outputs with specification examples.
   - Validate exception handling, logging, and performance.

3. **Coverage Collection (no config)**
   - Collect coverage after tests (Vitest/Jest) and surface summary percentage. Treat coverage < 85% as a blocker unless explicitly approved.
   ```bash
   # Vitest example
   vitest run --coverage --reporter=verbose || true
   # Read JSON summary if available
   if [ -f coverage/coverage-summary.json ]; then
     node -e "const s=require('./coverage/coverage-summary.json').total; console.log('Coverage total:', s.statements.pct+'%')"
   fi
   ```

## Step 4: Architectural & Integration Review

1. **Dependency Graph**
   - Visualise module dependencies; flag new high‑coupling edges.
   - Ensure layering rules (e.g., controllers ≠ data access) are respected.
2. **Cross‑Cutting Concerns**
   - Verify security, caching, transactions, i18n are handled consistently.
3. **Deployment & Ops**
   - Confirm config files, CI scripts, Dockerfiles align with infra standards.

## Step 5: Report & Recommendation

Use the template below:

```markdown
### Summary

- **Status**: [approve / changes requested]
- **Overall Risk**: [low / medium / high]

### Findings

| ID   | Severity | Area          | Description                             | Recommendation                    |
| ---- | -------- | ------------- | --------------------------------------- | --------------------------------- |
| F‑01 | Major    | Complexity    | Function `calculateTax` has CC 22 (>10) | Split into smaller pure functions |
| F‑02 | Minor    | Documentation | 200‑line README, redundant details      | Trim to high‑level overview       |

### Metrics

- Cyclomatic Complexity Mean: 6.3 (threshold ≤7)
- Lines of Code Added: 1,254
- Test Coverage: 78% (target ≥85%)

### Next Steps

1. Refactor high‑complexity sections (F‑01, F‑03).
2. Add tests for boundary conditions (T‑02).
3. Reduce documentation verbosity by 40%.

### Acceptance Criteria Met?

_No – Coverage below threshold; see Next Steps._
```

## Outputs to Memory Bank

Create lightweight artifacts so results are discoverable and reusable by LLM and humans.

- JSON (machine‑readable): `.pythia/memory-bank/sessions/YYYY-MM-DD-task-<slug>-ai-review.json`
- Markdown summary (PR/task friendly): `.pythia/memory-bank/sessions/YYYY-MM-DD-task-<slug>-ai-review.md`

JSON minimal schema:

```json
{
  "task_id": "task-YYYY-MM-slug",
  "coverage_pct": 87,
  "complexity": { "max": 9, "avg": 6.1 },
  "duplication_changed_pct": 1.2,
  "kiss_score": 4,
  "yagni_flags": [],
  "blocking": [],
  "recommendations": ["Extract util from duplicated blocks in A/B"]
}
```

Markdown summary template:

```markdown
## AI Review Summary (YYYY-MM-DD)

- Coverage: 87% (target ≥85%)
- Complexity: max=9, avg=6.1
- Duplication on changed: 1.2%
- KISS: 4/5; YAGNI: none
- Blocking: none
- Next steps: Extract util from A/B; add test for edge-case Z
```

Link both artifacts in the task under “AI Solution Analysis Results”. Generate once before “Under Review” and once before “Completed”.

## Common Issues and Solutions

| Issue                                           | Solution                                                      |
| ----------------------------------------------- | ------------------------------------------------------------- |
| Excessive cyclomatic complexity (≥15)           | Refactor into smaller pure functions; apply strategy pattern  |
| Duplicate logic across services                 | Extract shared module; DRY principle                          |
| Overly defensive programming (premature checks) | Remove redundant validations; rely on type system & contracts |
| AI‑hallucinated dependencies (unused packages)  | Remove packages; run `npm prune` / `pip‑autorem`              |
| Documentation copies code verbatim              | Replace with high‑level rationale and examples                |
| Non‑deterministic unit tests                    | Isolate randomness; inject seeds; mock external calls         |

## Edge Cases

- **Generated code with proprietary licence text** → Escalate to legal immediately.
- **Security‑sensitive code (encryption, auth)** → Require senior security review.
- **Real‑time systems with hard latency constraints** → Include performance profiling in Step 3.

## Examples

### Basic Example: Reviewing a Small Utility Library

1. Run linter (`eslint .`) – 0 errors.
2. Complexity report – max CC 4.
3. Docs concise (README 120 lines).
4. Coverage 95%.
5. **Status**: _approve_.

### Advanced Example: Large Service with SoapUI Integration

1. Complexity – 8 functions >15 CC → refactor.
2. Duplicate SOAP client code in 3 files → extract common client.
3. Coverage 62% → add tests.
4. Docs 1,300 lines → compress.
5. **Status**: _changes requested_.

## Acceptance Criteria

- Complexity metrics within thresholds defined in Thea project standards
- Test coverage ≥85% or justified deviation
- No major or blocker findings outstanding
- Documentation concise, focusing on intent and rationale

## Related Documents

- [Review Pull Request](mdc:commands/review-pull-request.md)
- [Analyze Pull Request Impact](mdc:commands/analyze-pull-request-impact.md)
- [Project Structure](mdc:project-structure.md)

---

**Last Updated**: 2025-07-30

## Versioning & Iteration

- **Iterative Improvement**: Review this command quarterly using _Improve Instruction_ commands.
- **Version Tracking**: Update _Last Updated_ date with each major change.
- **Feedback Loop**: Incorporate reviewer and user feedback into successive iterations.
