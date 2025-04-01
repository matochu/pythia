# Command: Analyze Architecture

> **IMPORTANT**: This command provides a systematic approach to analyzing the architecture of an entire project or specific component, documenting findings in the contexts directory. It identifies strengths, weaknesses, improvement opportunities, and evaluates potential integration of third-party libraries. This analysis creates a foundation for architectural decisions and refactoring efforts.

## Purpose

This command enables thorough architectural analysis of a codebase, generating comprehensive documentation that captures the current state, identifies issues, and suggests improvements. By systematically examining code structure, patterns, dependencies, and architectural choices, it helps teams understand the system's strengths and limitations while providing actionable recommendations for enhancement.

## Prerequisites

Before executing this command, ensure you have:

1. [ ] Identified the scope of architecture analysis (entire project or specific component)
2. [ ] Gained sufficient access to the codebase and project documentation
3. [ ] Determined the specific architectural aspects to focus on (patterns, abstractions, dependencies)
4. [ ] Installed necessary analysis tools (dependency-cruiser, jscpd, etc.)
5. [ ] Obtained the current date for proper document timestamping
6. [ ] Identified key stakeholders for the architecture recommendations

## Command Checklist

- [ ] Read existing architecture documentation if available
- [ ] Analyze codebase structure using directory and file analysis
- [ ] Generate dependency graphs for the target component or system
- [ ] Identify architectural patterns in use
- [ ] Evaluate platform abstraction strategies
- [ ] Assess API design and consistency
- [ ] Identify code duplication and violation of DRY principles
- [ ] Evaluate adherence to SOLID principles
- [ ] Benchmark performance for critical operations
- [ ] Research potential third-party libraries for improvement
- [ ] Document strengths, weaknesses, and improvement opportunities
- [ ] Create clear recommendations with implementation paths
- [ ] Generate diagrams illustrating current and proposed architecture
- [ ] Save analysis document to the contexts/architecture directory

## Step 1: Setup Analysis Environment

Before starting, prepare your environment with necessary tools:

```bash
# Install dependency analysis tools
npm install -g dependency-cruiser
npm install -g jscpd
npm install -g madge

# Read configuration from config.json
CONFIG_PATH="../config.json"
CONTEXTS_PATH=$(jq -r '.paths.contexts' $CONFIG_PATH)
DOCS_PATH=$(jq -r '.docs_path' $CONFIG_PATH)

# Get the analysis name from user input or use default
if [ -z "$1" ]; then
  read -p "Enter a short name for this analysis: " ANALYSIS_NAME
  ANALYSIS_NAME=${ANALYSIS_NAME:-"system-overview"}
else
  ANALYSIS_NAME=$1
fi

# Create output directory if it doesn't exist
mkdir -p "${DOCS_PATH}${CONTEXTS_PATH}/architecture/"

# Get the current date for proper timestamping
CURRENT_DATE=$(date +%Y-%m-%d)

# Set the output document path
OUTPUT_FILE="${DOCS_PATH}${CONTEXTS_PATH}/architecture/analysis-$(date +%Y-%m-%d)-${ANALYSIS_NAME}.md"
```

## Step 2: Define Analysis Scope and Questions

Create a clear set of analysis questions to guide the architectural review:

1. **System Boundaries**:

   - What are the main components of the system?
   - How do they interact with each other?
   - What are the external dependencies?

2. **Architectural Patterns**:

   - What architectural patterns are currently in use?
   - Are they applied consistently?
   - Are they appropriate for the system's requirements?

3. **Dependency Structure**:

   - How are dependencies managed?
   - Are there circular dependencies?
   - Is there a clear dependency direction?

4. **Abstraction Layers**:

   - What abstractions exist in the codebase?
   - Are platform-specific implementations properly isolated?
   - How effective are the current abstraction strategies?

5. **API Design**:

   - How consistent are the APIs?
   - How well are they documented?
   - Do they follow common design principles?

6. **Performance Considerations**:
   - Are there obvious performance bottlenecks?
   - How is error handling implemented?
   - Are there resource management issues?

## Step 3: Analyze Code Structure and Dependencies

Analyze the codebase structure and dependencies:

```bash
# Generate directory structure
find src -type d -not -path "*/node_modules/*" -not -path "*/\.*" | sort > structure.txt

# Generate dependency graph for visualization
madge --image dependency-graph.png --extensions ts,tsx src/

# Find circular dependencies
madge --circular --extensions ts,tsx src/

# Generate dependency-cruiser report
depcruise --include-only "^src" --output-type dot src | dot -T svg > dependency-graph.svg

# Identify code duplication
jscpd ./src --pattern "**/*.ts" --reporters "html"
```

Analyze the outputs to identify:

1. Logical grouping of code
2. Separation of concerns
3. Dependency management
4. Potential architectural issues
5. Areas with high coupling

## Step 4: Evaluate Architectural Patterns and Abstractions

Review the codebase to identify architectural patterns and assess how effectively abstractions are implemented:

```bash
# Search for common patterns in the codebase
grep -r "interface" --include="*.ts" src/
grep -r "abstract class" --include="*.ts" src/
grep -r "implements" --include="*.ts" src/
grep -r "extends" --include="*.ts" src/

# Identify platform-specific code
find src -type f -name "*platform*" -o -name "*platform*"
grep -r "platform" --include="*.ts" src/

# Check for factory patterns, dependency injection, etc.
grep -r "factory" --include="*.ts" src/
grep -r "provider" --include="*.ts" src/
grep -r "inject" --include="*.ts" src/
```

Evaluate:

1. Consistency in pattern application
2. Effectiveness of abstraction for cross-platform support
3. Code organization and separation of concerns
4. Extensibility for new platforms or features

## Step 5: Analyze API Design and Consistency

Examine the API surface and evaluate its design quality:

```bash
# Extract public APIs
grep -r "export " --include="*.ts" src/ > exports.txt

# Find API inconsistencies (naming conventions, parameter patterns)
grep -r "function " --include="*.ts" src/ | sort > functions.txt
grep -r "const .* = " --include="*.ts" src/ | grep "=>" | sort > arrow-functions.txt

# Examine error handling patterns
grep -r "throw " --include="*.ts" src/ > error-throwing.txt
grep -r "try " -A 5 --include="*.ts" src/ > error-handling.txt
```

Review:

1. API naming consistency
2. Parameter patterns
3. Return value consistency
4. Error handling approaches
5. Documentation quality

## Step 6: Evaluate Code Quality and SOLID Principles

Assess code quality and adherence to SOLID principles:

```bash
# Find large files that might violate Single Responsibility
find src -type f -name "*.ts" -exec wc -l {} \; | sort -nr | head -20 > large-files.txt

# Look for potential violation of Interface Segregation
grep -r "interface " -A 20 --include="*.ts" src/ | grep -E "interface .* {$" > interfaces.txt

# Check for dependency inversion
grep -r "import " --include="*.ts" src/ > imports.txt
```

Analyze adherence to:

1. Single Responsibility Principle
2. Open/Closed Principle
3. Liskov Substitution Principle
4. Interface Segregation Principle
5. Dependency Inversion Principle

## Step 7: Research Third-Party Libraries for Improvement

Research potential libraries that could enhance the architecture:

```bash
# Check current dependencies
jq '.dependencies' package.json > current-dependencies.json

# Use web search for potential libraries for specific needs
# Document findings in the analysis
```

Consider libraries for:

1. Cross-platform abstractions
2. Performance optimization
3. State management
4. API layer enhancements
5. Testing and validation

Compare options based on:

- Maintenance status
- Community support
- Documentation quality
- Performance benchmarks
- License compatibility

## Step 8: Document Findings and Create Architecture Analysis

Create a comprehensive analysis document:

```bash
# Create the analysis document
touch $OUTPUT_FILE

# Add standard sections
cat > $OUTPUT_FILE << EOF
# Architecture Analysis: ${ANALYSIS_NAME}

> **Analysis Date**: ${CURRENT_DATE}

## Summary

Brief overview of the architecture analysis findings.

## Current State

### System Overview

Detailed description of the current architecture with component diagrams.

\`\`\`mermaid
graph TD
    A[Component A] --> B[Component B]
    A --> C[Component C]
    B --> D[Component D]
    C --> D
\`\`\`

### Strengths

- Strength 1
- Strength 2
- Strength 3

### Weaknesses

- Weakness 1
- Weakness 2
- Weakness 3

### Architectural Patterns

Analysis of patterns currently in use.

### Dependency Structure

Analysis of the dependency graph and potential issues.

### API Design

Evaluation of API consistency and quality.

## Improvement Opportunities

### Pattern Refinements

Recommendations for improving architectural patterns.

### Abstraction Enhancements

Suggestions for better platform abstractions.

### Dependency Management

Recommendations for improved dependency handling.

### Third-Party Libraries

Assessment of potential third-party libraries that could enhance the architecture.

| Library Name | Purpose | Pros | Cons | Recommendation |
|--------------|---------|------|------|----------------|
| Library 1    | Purpose | Pros | Cons | Recommendation |
| Library 2    | Purpose | Pros | Cons | Recommendation |

## Implementation Path

Prioritized recommendations with suggested implementation approach.

1. High-priority changes
   - Step 1
   - Step 2

2. Medium-priority changes
   - Step 1
   - Step 2

3. Long-term improvements
   - Step 1
   - Step 2

## Conclusion

Final assessment and next steps.

EOF
```

## Step 9: Validate and Integrate the Analysis

Review and finalize the analysis document:

```bash
# Validate the document
cat $OUTPUT_FILE
```

Ensure the document:

1. Covers all architectural aspects
2. Provides clear and actionable recommendations
3. Is backed by data from the analysis
4. Includes visual diagrams of current and proposed architecture
5. Has a clear implementation path

## Examples

### Basic Example: Analyzing a Single Component

```bash
# Read configuration from config.json
CONFIG_PATH="../config.json"
CONTEXTS_PATH=$(jq -r '.paths.contexts' $CONFIG_PATH)
DOCS_PATH=$(jq -r '.docs_path' $CONFIG_PATH)

# Set analysis scope to a specific component
ANALYSIS_NAME="sdk-platforms"
OUTPUT_FILE="${DOCS_PATH}${CONTEXTS_PATH}/architecture/analysis-$(date +%Y-%m-%d)-${ANALYSIS_NAME}.md"

# Generate component-specific dependency graph
madge --image component-dependency.png --extensions ts,tsx src/${ANALYSIS_NAME}/

# Focus analysis on the specific component
grep -r "interface" --include="*.ts" src/${ANALYSIS_NAME}/
grep -r "export " --include="*.ts" src/${ANALYSIS_NAME}/ > component-exports.txt

# Create targeted analysis document for the component
# Fill in findings specific to this component
# Include specific recommendations for this component
```

### Advanced Example: Full System Architecture Review

```bash
# Read configuration from config.json
CONFIG_PATH="../config.json"
CONTEXTS_PATH=$(jq -r '.paths.contexts' $CONFIG_PATH)
DOCS_PATH=$(jq -r '.docs_path' $CONFIG_PATH)

# Set analysis scope to the entire project
ANALYSIS_NAME="system-architecture"
OUTPUT_FILE="${DOCS_PATH}${CONTEXTS_PATH}/architecture/analysis-$(date +%Y-%m-%d)-${ANALYSIS_NAME}.md"

# Generate complete system dependency graph
madge --image system-dependency.png --extensions ts,tsx src/

# Create comprehensive diagrams for each architectural layer
# Frontend/UI Layer
# Business Logic Layer
# Data Access Layer
# External Integration Layer

# Include benchmark results for critical operations
# Document cross-cutting concerns (logging, error handling, etc.)
# Provide detailed migration path for architectural improvements
```

## Common Issues and Solutions

| Issue                                          | Solution                                                                                            |
| ---------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| Analysis scope too broad                       | Focus on critical components first or break analysis into multiple targeted documents               |
| Lack of existing documentation                 | Rely more on code analysis tools and generate architectural diagrams from the existing codebase     |
| Circular dependencies make analysis difficult  | Use tools like madge to identify and document circular dependencies as key improvement targets      |
| Inconsistent patterns across codebase          | Document pattern variations and suggest standardization approaches                                  |
| Third-party library evaluations are subjective | Create objective comparison criteria and back recommendations with community metrics and benchmarks |
| Implementation path lacks clear priorities     | Classify recommendations by impact and implementation difficulty in a prioritization matrix         |
| Architectural diagrams become outdated         | Suggest automated diagram generation tools that can be integrated into CI/CD                        |
| Analysis results in competing recommendations  | Present trade-offs and multiple options with pros and cons rather than single solutions             |

## Related Documents

- [Improve TypeScript Files](./improve-typescript-files.md)
- [Documentation Guidelines](../methodology/documentation-guidelines.md)
- [Code Quality Standards](../methodology/code-quality-standards.md)
- [Refactoring Guide](../guides/refactoring-guide.md)

---

**Last Updated**: 2023-05-17
