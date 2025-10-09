# Command: Create Command

<command_purpose>
This command provides step-by-step instructions for creating new command documents that follow the project's standardized format. Command documents serve as detailed guides for executing specific tasks with consistency. This command is designed to be executed by an LLM and verified by a human who maintains the documentation system.
</command_purpose>

## Purpose

<purpose>
This command provides a structured approach to creating new command documents in the project's documentation system. Standardized commands improve consistency, reduce errors, and make processes repeatable across the team. The LLM should use this command to generate new command documents, which will then be reviewed by a human documentation maintainer.

**Key Benefits:**

- **Consistency**: All commands follow the same proven structure
- **Quality**: Built-in quality rubric and validation steps
- **Clarity**: Clear instructions reduce LLM hallucination
- **Maintainability**: Standardized format makes updates easier

</purpose>

## Quick Reference

<quick_ref>

**Goal**: Create production-ready command documents that LLMs can execute reliably

**Key Steps**:

1. Preparation → 2. Template → 3. Reasoning → 4. Structure → 5. Examples → 6. Validation → 7. Integration

**Self-Check**: Use the comprehensive checklist before finalizing

**Methodology**: Apply Prompt Engineering best practices + Spark/Slow Thinking

**Safety**: STOP and request clarification if requirements are unclear

</quick_ref>

## Self-Check Points

Before finalizing a new command, verify:

**Content Quality:**

- [ ] All required sections are present (Purpose, Prerequisites, Usage, Checklist, Steps, Examples, Issues, References)
- [ ] Each step is clear, actionable, and testable
- [ ] Safety and stop conditions are defined
- [ ] Quality rubric scores are 4+ in all dimensions
- [ ] At least one edge case and acceptance criteria are included
- [ ] Methodology integration is referenced

**Format & Structure:**

- [ ] Format choice is appropriate for task complexity (XML/Markdown/Hybrid)
- [ ] For complex commands: XML tags used for critical sections
- [ ] For simple commands: Token-efficient Markdown structure
- [ ] All links use mdc: format
- [ ] Examples follow Few-Shot pattern (`<example>` + `<bad>` + `<good>` + `<rule>`)
- [ ] No AI writing patterns (delve, crucial, leverage, robust)

**LLM Optimization:**

- [ ] Instructions are clear and direct (no ambiguity)
- [ ] Context engineering principles applied (Goldilocks zone)
- [ ] Token count is optimized for task complexity
- [ ] Chain-of-thought enabled for complex reasoning
- [ ] Output format is clearly specified

## Methodology Integration

- **Instruction Improvement**: Use [Improve Instruction](mdc:commands/improve-instruction.md) and [Spark-Improve Instruction](mdc:commands/improve-instruction-spark.md) for systematic quality enhancement
- **Documentation Guidelines**: Follow [Documentation Guidelines](mdc:methodology/documentation-guidelines.md) for structure and cross-referencing
- **Quality Rubric**: Apply the rubric below for self-assessment
- **Human-Like Writing**: Apply [Write Human Documentation](mdc:commands/doc-writing.md) guidelines to avoid AI writing patterns

---

## Prompt Engineering Best Practices for Commands

<prompt_engineering>

Commands are consumed by LLMs, so format and structure significantly impact performance. This section provides research-backed best practices for writing effective LLM instructions.

### XML vs Markdown: When to Use Each Format

<format_comparison>

#### Overview

When writing commands for LLMs (especially Claude), choosing between XML tags and Markdown formatting significantly impacts comprehension and output quality.

#### Research-Backed Findings

<research_insights>

**Performance Variance:**

- GPT-3.5's performance varies by **up to 40%** based on prompt format alone
- GPT-4 showed **over 300%** performance differences between JSON and plain text on coding tasks
- Larger models (GPT-4, Claude Sonnet) are more resilient to format variations

**Model-Specific Preferences:**

- **Claude**: Specifically trained on XML tags, shows strong preference for XML structure
- **GPT-4**: Tends to favor Markdown formatting
- **GPT-3.5**: Shows preference for JSON formatting
- **No universal format**: Optimal choice depends on the specific model and task

</research_insights>

#### When to Use XML Tags

<xml_use_cases>

**Best For:**

- Complex, multi-component commands (context + instructions + examples)
- Strict sectioning and deep nesting requirements
- When output parsing is needed (automated processing)
- Multi-part reasoning tasks
- Claude-based applications (specifically trained for XML)

**Advantages:**

- **Clarity**: Explicit structural boundaries prevent misinterpretation
- **Accuracy**: Reduces errors from ambiguous prompt sections (up to 40% improvement)
- **Flexibility**: Easy to find, add, remove, or modify sections
- **Parseability**: Easier to extract specific parts from LLM output
- **Nesting**: Hierarchical structure for complex relationships

**Disadvantages:**

- **Verbosity**: Higher token count than Markdown
- **Cost**: More tokens = higher API costs
- **Complexity**: Less human-readable for simple prompts

**Example:**

```xml
<instructions>
Create a new command document following these requirements.
</instructions>

<requirements>
<audience>Developers and LLMs</audience>
<sections>
  <section name="Purpose" required="true"/>
  <section name="Prerequisites" required="true"/>
  <section name="Steps" required="true"/>
</sections>
</requirements>

<output_format>
<command>
  <title>Command: [Name]</title>
  <purpose>[Description]</purpose>
  <steps>
    <step number="1">[Action]</step>
  </steps>
</command>
</output_format>
```

</xml_use_cases>

#### When to Use Markdown

<markdown_use_cases>

**Best For:**

- Simple, straightforward commands
- Human-readable documentation
- Token-efficient communication
- Quick iterations and edits
- GPT-4 applications

**Advantages:**

- **Token Efficiency**: Lighter than JSON, XML, or HTML (lower costs)
- **Readability**: Familiar, human-friendly format
- **Simplicity**: Easy to write and edit
- **Speed**: Quick to structure without closing tags
- **Familiarity**: Widely adopted format

**Disadvantages:**

- **Ambiguity**: Whitespace and indentation can cause parsing issues
- **Less Structured**: Harder to enforce strict hierarchies
- **Parsing**: More difficult to extract specific sections programmatically

**Example:**

```markdown
## Instructions

Create a new command document following these requirements.

## Requirements

**Audience**: Developers and LLMs

**Required Sections**:

- Purpose
- Prerequisites
- Steps

## Output Format

# Command: [Name]

## Purpose

[Description]

## Steps

1. [Action]
```

</markdown_use_cases>

#### Hybrid Approach (Recommended for Commands)

<hybrid_strategy>

**Best Practice**: Combine both formats to leverage their strengths

**Strategy:**

1. Use **Markdown** for outer structure (H1, H2, H3 headings)
2. Use **XML tags** for critical sections that need precise boundaries
3. This balances readability with structural clarity

**Example:**

```markdown
# Command: Create API Documentation

## Purpose

This command generates comprehensive API documentation from source code.

## Instructions

<instructions>
Analyze the codebase and extract all public API endpoints.
For each endpoint, document: method, path, parameters, responses.
Use the output format specified below.
</instructions>

## Input

<codebase>
[Source code will be inserted here]
</codebase>

## Expected Output

<api_documentation>
<endpoint>
<method>GET</method>
<path>/api/users</path>
<description>Retrieves list of users</description>
<parameters>

<param name="limit" type="integer" required="false"/>
</parameters>
<responses>
<response code="200" description="Success"/>
</responses>
</endpoint>
</api_documentation>
```

**Benefits:**

- Readable Markdown structure for humans
- XML precision for LLM parsing
- Token-efficient where possible
- Strict boundaries where needed

</hybrid_strategy>

#### Decision Matrix

<decision_guide>

| Factor                     | Use XML       | Use Markdown  | Use Hybrid     |
| -------------------------- | ------------- | ------------- | -------------- |
| Model is Claude            | ✅ Primary    | ⚠️ Acceptable | ✅ Recommended |
| Model is GPT-4             | ⚠️ Acceptable | ✅ Primary    | ✅ Recommended |
| Complex structure needed   | ✅ Yes        | ❌ No         | ✅ Yes         |
| Need output parsing        | ✅ Yes        | ❌ Difficult  | ✅ Yes         |
| Token cost is critical     | ❌ No         | ✅ Yes        | ⚠️ Balance     |
| Human readability priority | ❌ No         | ✅ Yes        | ✅ Yes         |
| Multi-level nesting        | ✅ Yes        | ⚠️ Limited    | ✅ Yes         |
| Quick iteration needed     | ❌ Slower     | ✅ Yes        | ⚠️ Medium      |

</decision_guide>

#### Claude-Specific Recommendations

<claude_guidelines>

**Official Anthropic Guidance:**

> "Claude has been specifically tuned to pay special attention to XML tags. Use them to clearly separate different parts of your prompt (instructions, context, examples, etc.)"

**Best Practices for Claude:**

1. **Be consistent**: Use same tag names throughout commands
2. **Make tags descriptive**: `<user_query>` better than `<input>`
3. **Nest appropriately**: Use hierarchy to show relationships
4. **Combine with techniques**: Pair XML with chain-of-thought, few-shot examples
5. **No canonical tags**: Tag names should make contextual sense

**Common Tag Patterns for Commands:**

- `<instructions>` / `<task>` - Main task description
- `<context>` / `<background>` - Background information
- `<examples>` / `<example>` - Few-shot examples
- `<input>` / `<data>` - Input data or parameters
- `<output_format>` / `<response_template>` - Expected output structure
- `<thinking>` / `<analysis>` - For chain-of-thought reasoning
- `<constraints>` / `<requirements>` - Rules and limitations
- `<validation>` / `<checks>` - Validation criteria

</claude_guidelines>

</format_comparison>

### Core Prompt Engineering Techniques

<techniques>

Apply these techniques sequentially when crafting command instructions (based on Anthropic recommendations):

1. **Be Clear and Direct**

   - Provide explicit, unambiguous instructions
   - Avoid leaving room for interpretation
   - State requirements explicitly rather than implying them

2. **Use Examples (Few-Shot Prompting)**

   - Include 2-5 diverse, canonical examples
   - Show both good and bad cases
   - Avoid stuffing edge cases—focus on representative scenarios
   - Structure: `<example>` + `<bad>` + `<good>` + `<rule>`

3. **Enable Chain-of-Thought**

   - Add dedicated thinking sections: `<thinking>`, `<analysis>`
   - Use phrases like "think through this step by step"
   - Improves accuracy for complex tasks

4. **Structure with XML Tags**

   - Claude is specifically trained to recognize XML-style tags
   - Tags act as signposts for different content types
   - Improves parsing and reduces ambiguity

5. **System Prompts**

   - Assign specific roles or personas
   - Define behavioral boundaries
   - Establish tone and style expectations

6. **Response Prefilling**

   - Begin Claude's response to guide format
   - Ensures consistent output structure

7. **Prompt Chaining**
   - Break complex tasks into sequential steps
   - Each step produces input for the next

</techniques>

### Context Engineering Principles

<context_engineering>

**The Goldilocks Zone:**
Find the right "altitude" for instructions:

- **Too low**: Hardcoded logic, brittle, over-specified
- **Too high**: Vague guidance, unpredictable behavior
- **Just right**: Specific enough to guide, flexible enough to adapt

**Optimal Context Formula:**

> "The smallest possible set of high-signal tokens that maximize the likelihood of desired outcome"

**Structure Your Command Prompts:**

```markdown
## Background

[Essential context only - what the LLM needs to know]

## Core Instructions

[Primary task and behavioral rules]

## Input/Data

[What the LLM will work with]

## Output Requirements

[Expected response format and constraints]

## Validation

[How to verify success]
```

**Principles:**

- Start minimal, add based on failure modes
- Test empirically against success criteria
- "Minimal ≠ short" — provide sufficient information upfront
- Remove redundancy, keep signal high

</context_engineering>

### Token Efficiency

<token_optimization>

**Optimize for Signal-to-Noise:**

1. Remove redundant instructions
2. Use concise language (but stay clear)
3. Prefer Markdown over verbose formats for simple structures
4. Use XML only where precision is needed
5. Consolidate related instructions
6. Use references instead of repetition

**Example Optimization:**

❌ **Verbose (125 tokens):**

```markdown
It is very important that you should always make sure to carefully
check and verify that all of the user's input has been properly
validated before you proceed with processing the request, and you
should also ensure that you handle any potential errors appropriately.
```

✅ **Concise (25 tokens):**

```markdown
1. Validate all user input
2. Handle errors gracefully
3. Process only after validation succeeds
```

**Token Count Guidelines:**

- **Simple commands**: 200-500 tokens
- **Medium commands**: 500-1500 tokens
- **Complex commands**: 1500-3000 tokens
- **Above 3000 tokens**: Consider breaking into sub-commands

</token_optimization>

### Key Takeaways

<summary>

1. **Model matters**: Claude prefers XML, GPT-4 prefers Markdown, GPT-3.5 prefers JSON
2. **Task complexity matters**: Complex tasks benefit from XML structure
3. **Hybrid is powerful**: Combine Markdown readability with XML precision
4. **Performance varies 40-300%**: Format choice significantly impacts results
5. **Test empirically**: Don't assume—measure performance with your actual commands
6. **Token efficiency matters**: Balance clarity with cost
7. **Start minimal**: Add complexity only when needed based on failure modes

</summary>

</prompt_engineering>

---

## Quality Rubric

| Dimension           | 1 (Low)         | 3 (Medium)      | 5 (High)               |
| ------------------- | --------------- | --------------- | ---------------------- |
| **Clarity**         | Unclear         | Mostly clear    | Crystal clear          |
| **Determinism**     | Ambiguous       | Some ambiguity  | Fully deterministic    |
| **Testability**     | No tests        | Basic tests     | Comprehensive tests    |
| **Safety**          | No safety rules | Basic safety    | Robust safety/fallback |
| **Completeness**    | Major gaps      | Minor gaps      | Complete coverage      |
| **Maintainability** | Hard to update  | Moderate effort | Easy to maintain       |

## Safety & Stop Conditions

<safety_rules>

**Critical Rules:**

- **No Hallucination**: If requirements are unclear, **STOP immediately** and request clarification
- **No Assumptions**: Never assume missing information—ask explicitly
- **No Placeholders**: Don't leave [TODO] or [TBD] markers—complete the content or remove the section

**Stop Conditions (MUST halt execution):**

- ❌ Missing required information (purpose, audience, scope)
- ❌ Conflicting requirements (incompatible objectives)
- ❌ Insufficient permissions (cannot access referenced files)
- ❌ Unclear success criteria (how to validate the command)

**Fallback Strategy:**

- ✅ Use default values **only if explicitly documented** in this command
- ✅ Request human guidance when encountering edge cases
- ✅ Escalate to human reviewer if stuck for >2 iterations

**Error Handling:**

```xml
<error_response>
I need clarification on: [specific unclear point]
Current understanding: [what you think it means]
Question: [specific question to resolve]
Impact if wrong: [what could go wrong]
</error_response>
```

</safety_rules>

## Prerequisites

<prerequisites>

Before creating a new command document, verify you have:

**Required Information:**

- [ ] **Purpose**: Clear definition of what the command accomplishes
- [ ] **Audience**: Who will use this command (developers, LLMs, technical writers, mixed)
- [ ] **Scope**: Boundaries of what's included/excluded
- [ ] **Success Criteria**: How to validate the command works correctly

**Context & Resources:**

- [ ] **Current Date**: For proper timestamping (`date +%Y-%m-%d`)
- [ ] **Related Docs**: Identified dependencies and related documentation
- [ ] **Project Structure**: Access to documentation directories
- [ ] **Template Access**: Can access command template if available

**LLM-Specific:**

- [ ] **Format Choice**: Decided on XML/Markdown/Hybrid based on complexity
- [ ] **Examples Ready**: Have 2-5 examples to demonstrate usage
- [ ] **Edge Cases Identified**: Know the unusual scenarios to document

</prerequisites>

## Workspace Usage

This command can be used in any project workspace:

```bash
# Reference the command
@create-command.md

# Execute with project context
Execute this command for my project at [project-path]

# Example usage
@create-command.md
Context: My project needs a new command for API documentation
Objective: Create a command that generates API documentation
Target Audience: Developers and technical writers
Scope: REST API documentation generation
```

## Command Checklist

<execution_checklist>

**Phase 1: Planning & Analysis**

- [ ] Get current date using `date +%Y-%m-%d`
- [ ] Define clear command title and purpose
- [ ] Identify target audience and their expertise level
- [ ] Determine command complexity (simple/medium/complex)
- [ ] Choose appropriate format (XML/Markdown/Hybrid)

**Phase 2: Structure & Content**

- [ ] List all prerequisites needed before execution
- [ ] Create comprehensive checklist of steps (3-7 main steps)
- [ ] Perform thorough analysis of task requirements
- [ ] Detail each step with clear instructions
- [ ] Add 2-5 practical usage examples (Few-Shot pattern)

**Phase 3: Quality & Validation**

- [ ] Document common issues and solutions (table format)
- [ ] Add references to related documentation (mdc: format)
- [ ] Validate command against quality rubric (4+ all dimensions)
- [ ] Check for AI writing patterns (delve, crucial, leverage, robust)
- [ ] Verify all XML tags are properly closed

**Phase 4: Integration & Finalization**

- [ ] Update documentation map
- [ ] Add **Last Updated** date
- [ ] Request human review if any uncertainty remains

</execution_checklist>

## Step 1: Prepare for Command Creation

Before starting, gather necessary information:

```bash
# Get the current date for proper timestamping
date +%Y-%m-%d

# Determine commands directory based on project structure
# For standard Pythia structure: .pythia/commands/
# For custom structure: adapt to your project's documentation layout
COMMANDS_PATH=".pythia/commands"

# Create directory if it doesn't exist
mkdir -p "$COMMANDS_PATH"

# Review existing commands for reference
ls -la "$COMMANDS_PATH"
```

Determine the following:

1. Command name (should be descriptive and action-oriented)
2. Primary purpose (what task does it accomplish)
3. Target audience (who will use this command)
4. Required skill level (beginner, intermediate, advanced)

> **NOTE**: Always verify with the human documentation maintainer if there are any doubts about the target audience or command purpose. When in doubt, explicitly ask for clarification.

## Step 2: Create the Command File

Create a new file in the commands directory using kebab-case:

```bash
# Create the command file
touch "$COMMANDS_PATH/command-name.md"
```

## Step 3: Use the Command Template

Copy content from the command template and adapt it to your specific command:

````bash
# Determine templates directory
TEMPLATES_PATH=".pythia/templates"

# Copy template if available
if [ -f "$TEMPLATES_PATH/command-template.md" ]; then
    cat "$TEMPLATES_PATH/command-template.md" > "$COMMANDS_PATH/command-name.md"
else
    # Create basic structure if template doesn't exist
    cat > "$COMMANDS_PATH/command-name.md" << 'EOF'
# Command: [Command Name]

> **IMPORTANT**: [Brief description of what this command does]

## Purpose

[Clear description of the command's purpose and benefits]

## Prerequisites

[List of requirements before executing this command]

## Workspace Usage

This command can be used in any project workspace:

```bash
# Reference the command
@command-name.md

# Execute with project context
Execute this command for my project at [project-path]

# Example usage
@command-name.md
Context: [Project context]
Objective: [Specific objective]
Requirements: [Key requirements]
````

EOF
fi

````

> **IMPORTANT**: Always use relative paths and adapt to your project's documentation structure. This ensures the command works in any workspace.

When filling in the template:

1. **Be concise but complete** - Include all necessary information without redundancy
2. **Use active voice** - Write instructions as direct actions
3. **Include practical examples** - Show real-world applications
4. **Add error handling** - Document common issues and solutions
5. **Link related resources** - Connect to other relevant documentation

## Step 4: LLM Reasoning and Analysis

As an LLM creating a command document, dedicate specific attention to reasoning about the command. This mandatory step should include:

1. **Task Analysis** - Break down the main task into logical components
2. **Edge Case Identification** - Consider unusual scenarios or potential issues
3. **Audience Adaptation** - Analyze how to adapt content for the target audience
4. **Execution Flow** - Document the logical flow of execution
5. **Dependencies and Constraints** - Identify system dependencies and constraints

Document your reasoning in a clear, structured format to demonstrate understanding of the task. This will improve the quality of the resulting command and help the human reviewer provide more targeted feedback.

## Step 5: Structure the Command Steps

Organize the command steps logically, following these principles:

1. **Sequential ordering** - Steps should follow a logical sequence
2. **Independent when possible** - Each step should be self-contained
3. **Verification points** - Include checks to confirm successful completion
4. **Error recovery** - Provide guidance for handling failures
5. **Clear progress indicators** - Use checkboxes for tracking completion

Example structure:

```markdown
## Step 1: Preparation

Actions to prepare for the main task.

## Step 2: Main Operation

Core actions that accomplish the primary purpose.

## Step 3: Verification

Steps to verify successful completion.

## Step 4: Integration

How to integrate this work with the broader system.
````

## Step 6: Add Examples and Edge Cases

Include at least two examples:

1. A basic example showing the simplest use case
2. An advanced example demonstrating more complex scenarios

Also add a section for common issues and solutions:

```markdown
## Common Issues and Solutions

| Issue                               | Solution                                                            |
| ----------------------------------- | ------------------------------------------------------------------- |
| Command fails with permission error | Ensure you have the necessary permissions with `chmod +x script.sh` |
| Resources not found                 | Verify paths in config.json and check if files exist                |
```

## Step 7: Validate and Integrate

Validate the new command:

```bash
# Read configuration
CONFIG_PATH="../config.json"
PROJECT_ROOT=$(jq -r '.project_root' $CONFIG_PATH)
DOCS_PATH=$(jq -r '.docs_path' $CONFIG_PATH)

# Validate documentation links
npm run docs:validate-links

# Update documentation map
npm run docs:update-map
```

Check that:

1. All links are functional
2. The command follows the standard format
3. All sections are properly filled
4. Examples are practical and correct
5. Steps are clear and complete

## Examples

<practical_examples>

### Example 1: Creating a Simple Command

<example_scenario>
**Scenario**: Create a command for updating project dependencies

<steps>
```bash
# Get current date
date +%Y-%m-%d  # Output: 2025-10-09

# Create command file

touch .pythia/commands/update-dependencies.md

# Use Hybrid approach (Markdown + XML for critical sections)

````
</steps>

<output_structure>
```markdown
# Command: Update Dependencies

<command_purpose>
Updates all project dependencies to their latest compatible versions.
</command_purpose>

## Instructions

<instructions>
1. Review current dependency versions in package.json
2. Run npm outdated to identify updates
3. Update dependencies one at a time
4. Test after each update
5. Commit changes with descriptive message
</instructions>

## Validation

<validation>
- [ ] All tests pass
- [ ] No breaking changes introduced
- [ ] package-lock.json updated
</validation>
````

</output_structure>

<analysis>
**Why this works:**
- Simple command → Hybrid approach (Markdown + XML for key sections)
- Clear step-by-step instructions
- Validation criteria explicitly defined
- Token-efficient but precise
</analysis>
</example_scenario>

---

### Example 2: Complex Command with Multiple Components

<example_scenario>
**Scenario**: Create a command for API documentation generation

<steps>
```bash
# This is a complex command - use XML for structure
touch .pythia/commands/generate-api-docs.md
```
</steps>

<output_structure>

```markdown
# Command: Generate API Documentation

<command_purpose>
Analyzes codebase and generates comprehensive API documentation.
</command_purpose>

<instructions>
<context>
This command extracts API endpoints from source code and creates
standardized documentation following OpenAPI 3.0 specification.
</context>

<input>
<codebase_path>src/api/</codebase_path>
<output_path>docs/api/</output_path>
<format>OpenAPI 3.0</format>
</input>

<processing_steps>

1. Scan all files in codebase_path
2. Extract endpoints, parameters, responses
3. Generate OpenAPI specification
4. Create human-readable markdown docs
5. Validate against OpenAPI schema
   </processing_steps>

<output_format>
<api_spec>
<endpoint method="GET" path="/api/users">
<description>...</description>
<parameters>...</parameters>
</endpoint>
</api_spec>
</output_format>
</instructions>
```

</output_structure>

<analysis>
**Why this works:**
- Complex command → Heavy XML usage for precision
- Multiple nested components clearly separated
- Easy to parse programmatically
- Explicit input/output specifications
</analysis>
</example_scenario>

---

### Example 3: Edge Case - Custom Project Structure

<example_scenario>
**Scenario**: Command for non-standard documentation directory

<steps>
```bash
# Adapt to custom structure
CUSTOM_DOCS="custom_.pythia/commands"
mkdir -p "$CUSTOM_DOCS"
touch "$CUSTOM_DOCS/special-case.md"
```
</steps>

<handling>
**Key Adaptations:**
- Verify directory structure before creating files
- Use environment variables for path configuration
- Include path validation in prerequisites
- Document the custom structure clearly

**Example prerequisite addition:**

```markdown
<prerequisites>
- [ ] Custom documentation path configured
- [ ] CUSTOM_DOCS environment variable set
- [ ] Directory exists and is writable
</prerequisites>
```

</handling>

<analysis>
**Why this matters:**
- Edge cases need explicit documentation
- Path validation prevents errors
- Environment variables provide flexibility
- Prerequisites catch configuration issues early
</analysis>
</example_scenario>

</practical_examples>

---

### Acceptance Criteria

<acceptance_criteria>

**Completeness:**

- ✅ Command file created in correct location
- ✅ All required sections present and filled (not [TODO])
- ✅ Self-check points completed (all ✓)
- ✅ At least one edge case documented

**Quality:**

- ✅ Quality rubric scores 4+ in all dimensions
- ✅ Safety and stop conditions defined
- ✅ No AI writing patterns (delve, crucial, leverage)
- ✅ Examples follow Few-Shot pattern

**Structure:**

- ✅ Format appropriate for complexity (XML/Markdown/Hybrid)
- ✅ All XML tags properly closed (if used)
- ✅ Links use mdc: format
- ✅ **Last Updated** date added

</acceptance_criteria>

## Common Issues and Solutions

| Issue                          | Solution                                                                         |
| ------------------------------ | -------------------------------------------------------------------------------- |
| Command steps are too granular | Consolidate related steps; aim for 3-7 main steps with sub-steps as needed       |
| Missing prerequisites          | Review the command with someone unfamiliar with it to identify assumed knowledge |
| Unclear success criteria       | Add specific verification steps that confirm successful completion               |
| Too technical for audience     | Adjust language and detail level to match the target audience's expertise        |
| Command becomes outdated       | Include maintenance notes and schedule regular reviews                           |
| LLM lacks context              | Request specific information from the human reviewer when needed                 |

## Related Documents

### Templates & Guidelines

- [Command Template](mdc:templates/command-template.md)
- [Documentation Guidelines](mdc:methodology/documentation-guidelines.md)
- [Write Human Documentation](mdc:commands/doc-writing.md) - Avoid AI writing patterns

### Validation & Quality

- [Validate Documentation](mdc:commands/validate-documentation.md)
- [Improve Instruction](mdc:commands/improve-instruction.md)
- [Documentation Map](mdc:navigation/documentation-map.md)

### Research & Best Practices

- [Claude: Use XML Tags to Structure Prompts](https://docs.claude.com/en/docs/build-with-claude/prompt-engineering/use-xml-tags) - Official Anthropic guidance
- [Effective Context Engineering for AI Agents](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents) - Anthropic engineering blog
- [Does Prompt Formatting Have Any Impact on LLM Performance?](https://arxiv.org/html/2411.10541v1) - Research study on XML vs Markdown performance

---

## Summary

<command_summary>

**Core Principle**: Create production-ready command documents that LLMs can execute reliably by combining clear structure, comprehensive examples, and rigorous validation.

**Key Takeaways**:

1. **Safety First**: STOP and request clarification when requirements are unclear
2. **Format Matters**: Choose XML/Markdown/Hybrid based on task complexity (40-300% performance impact)
3. **Structure Wins**: Use XML tags for critical sections, Markdown for readability
4. **Examples Essential**: Include 2-5 Few-Shot examples with `<bad>`, `<good>`, `<analysis>`
5. **Validate Rigorously**: Quality rubric 4+ in all dimensions before finalizing
6. **No AI Patterns**: Avoid delve, crucial, leverage, robust—write clearly
7. **Test Empirically**: Commands must work reliably, not just read well

**Before Finalizing:**

- ✅ All prerequisites checked and documented
- ✅ Safety & stop conditions clearly defined
- ✅ Format appropriate for complexity
- ✅ Examples demonstrate usage (not just describe)
- ✅ Quality rubric scores 4+ across all dimensions
- ✅ Human review requested if any uncertainty

**Format Decision Guide:**

- **Simple command** (200-500 tokens) → Markdown with optional XML tags
- **Medium command** (500-1500 tokens) → Hybrid (Markdown + XML for key sections)
- **Complex command** (1500-3000 tokens) → Heavy XML with Markdown wrapper
- **Above 3000 tokens** → Consider breaking into sub-commands

</command_summary>

---

**Last Updated**: 2025-10-09

## Versioning & Iteration

- **Iterative Improvement**: Commands should be reviewed and improved regularly using [Improve Instruction](mdc:commands/improve-instruction.md) and [Spark-Improve Instruction](mdc:commands/improve-instruction-spark.md)
- **Version Tracking**: Update the "Last Updated" line with each major change
- **Feedback**: Incorporate reviewer and user feedback in each iteration
- **Format Evolution**: As LLM capabilities improve, adjust XML/Markdown balance based on empirical testing
