# Technical Debt Prioritization Methodology

## Table of Contents

- [Technical Debt Prioritization Methodology](#technical-debt-prioritization-methodology)
  - [Table of Contents](#table-of-contents)
  - [Introduction](#introduction)
  - [Connection to Existing Methodologies](#connection-to-existing-methodologies)
  - [Technical Debt Assessment System](#technical-debt-assessment-system)
    - [Basic Parameters](#basic-parameters)
    - [Additional Parameters](#additional-parameters)
    - [Priority Calculation](#priority-calculation)
    - [Extended Formula with Weights](#extended-formula-with-weights)
  - [Integration with Context-Oriented Methodologies](#integration-with-context-oriented-methodologies)
    - [Adaptation to ICE (for Daily Decisions)](#adaptation-to-ice-for-daily-decisions)
    - [Adaptation to User Pain vs. Dev Effort (for Sprint Planning)](#adaptation-to-user-pain-vs-dev-effort-for-sprint-planning)
    - [Adaptation to RICE (for Quarterly Planning)](#adaptation-to-rice-for-quarterly-planning)
    - [Adaptation to WSJF (for Balancing Technical Debt and New Features)](#adaptation-to-wsjf-for-balancing-technical-debt-and-new-features)
  - [Assessment and Prioritization Process](#assessment-and-prioritization-process)
    - [Step 1: Identifying Technical Debt Elements](#step-1-identifying-technical-debt-elements)
    - [Step 2: Basic Parameter Assessment](#step-2-basic-parameter-assessment)
    - [Step 3: Priority Calculation](#step-3-priority-calculation)
    - [Step 4: Contextual Adaptation](#step-4-contextual-adaptation)
    - [Step 5: Visualization and Analysis](#step-5-visualization-and-analysis)
    - [Step 6: Review and Update](#step-6-review-and-update)
  - [Tools and Templates](#tools-and-templates)
    - [Technical Debt Assessment Template](#technical-debt-assessment-template)
    - [Technical Debt Priority Calculator](#technical-debt-priority-calculator)
    - [Priority Visualizers](#priority-visualizers)
  - [Application Recommendations](#application-recommendations)
    - [For Daily Developer Decisions](#for-daily-developer-decisions)
    - [For Sprint Planning](#for-sprint-planning)
    - [For Quarterly Planning](#for-quarterly-planning)
    - [For Strategic Decisions](#for-strategic-decisions)
  - [Usage Examples](#usage-examples)
    - [Example 1: Inefficient API Assessment](#example-1-inefficient-api-assessment)
    - [Example 2: Sprint Prioritization](#example-2-sprint-prioritization)
  - [Success Metrics](#success-metrics)
  - [Related Documents](#related-documents)
  - [References](#references)

## Introduction

This document offers a comprehensive methodology for evaluating and prioritizing technical debt in the project. This methodology:

1. Is based on objective criteria
2. Is quantitative and allows for calculations
3. Integrates with existing prioritization methodologies in different contexts
4. Provides specific tools and templates for developers to use

Proper technical debt prioritization allows for:

- Focusing resources on the most important issues
- Objectively justifying technical decisions
- Balancing between new feature development and debt remediation
- Avoiding subjectivity in decision-making

## Connection to Existing Methodologies

This methodology extends and complements the approaches described in the [Prioritization Methods](prioritization-methods.md) document, adapting them specifically for technical debt assessment. It aligns with the technical debt classification system described in [Technical Debt Analysis](../architecture/tech-debt.md).

The main idea is to:

1. Provide a specialized system for technical debt assessment
2. Integrate it with context-specific prioritization methodologies
3. Ensure a unified assessment approach across all teams and contexts

## Technical Debt Assessment System

### Basic Parameters

The following basic parameters are used for technical debt assessment:

- **Severity**: Impact on development, quality, and user experience

  - **1 (Low)**: Minimal impact
  - **2 (Medium)**: Noticeable impact
  - **3 (High)**: Significant impact

- **Interest Rate**: How quickly the problem compounds over time

  - **1 (Slow)**: Problem doesn't tend to worsen
  - **2 (Moderate)**: Problem gradually worsens over time
  - **3 (Rapid)**: Problem quickly worsens and generates new problems

- **Principal**: Effort required to address the issue

  - **1 (Small)**: < 1 day of work
  - **2 (Medium)**: 2-5 days of work
  - **3 (Large)**: > 5 days of work or a team of developers

- **Intentionality**: Whether the debt was created deliberately
  - **Deliberate**: Conscious decision to optimize development speed
  - **Accidental**: Unintentional consequence of the development process

### Additional Parameters

To improve assessment, additional parameters are introduced:

- **Business Risk**: Impact on business metrics

  - **1 (Low)**: Virtually invisible to users/business
  - **2 (Medium)**: Affects some business metrics
  - **3 (High)**: Directly impacts key business metrics

- **Reach**: Number of users affected by the issue
  - Numerical value representing the scale of impact

### Priority Calculation

The basic priority calculation is performed using the formula:

```
Priority Score = (Severity × Interest Rate) ÷ Principal
```

Priority levels are determined as follows:

- **High Priority**: ≥ 2.0
- **Medium Priority**: 1.0 - 1.9
- **Low Priority**: < 1.0

An enhanced priority score that incorporates business impact can be calculated as:

```
Enhanced Priority Score = Priority Score × Business Risk
```

### Extended Formula with Weights

For fine-tuning prioritization, weights can be used:

```
Weighted Priority Score = (Severity × W₁ × Interest Rate × W₂) ÷ (Principal × W₃)
```

Where:

- W₁, W₂, W₃ - parameter weights (default = 1)

Weights can be adjusted for different debt types or contexts. For example, for architectural debt, the Interest Rate weight can be increased as it tends to accumulate faster.

## Integration with Context-Oriented Methodologies

### Adaptation to ICE (for Daily Decisions)

ICE (Impact, Confidence, Ease) - a simple and quick method for daily decisions.

```
ICE Score = Impact × Confidence × Ease
```

Adaptation for technical debt:

- **Impact**: Severity × Business Risk
- **Confidence**: (4 - Principal) × 2.5
- **Ease**: (4 - Principal) × 2.5

### Adaptation to User Pain vs. Dev Effort (for Sprint Planning)

For sprint planning:

```
User Pain = Severity × Interest Rate
Dev Effort = Principal × 3.3
```

Priority matrix:

- **Very High**: User Pain ≥ 6 and Dev Effort ≤ 3
- **High**: User Pain ≥ 4 and Dev Effort ≤ 6
- **Medium**: User Pain ≥ 2
- **Low**: User Pain < 2

### Adaptation to RICE (for Quarterly Planning)

RICE (Reach, Impact, Confidence, Effort) - for strategic decisions:

```
RICE Score = (Reach × Impact × Confidence) ÷ Effort
```

Adaptation for technical debt:

- **Reach**: Estimated number of users
- **Impact**: Severity × Business Risk
- **Confidence**: 100% - (Principal / 3 × 30%)
- **Effort**: Principal × 4 (weeks)

### Adaptation to WSJF (for Balancing Technical Debt and New Features)

WSJF (Weighted Shortest Job First) - for economic justification:

```
WSJF = Cost of Delay ÷ Job Size
```

Adaptation for technical debt:

- **User/Business Value**: Severity × 2
- **Time Criticality**: Interest Rate × 3
- **Risk Reduction**: Business Risk × 3
- **Cost of Delay**: Sum of the above
- **Job Size**: Principal × 3

## Assessment and Prioritization Process

### Step 1: Identifying Technical Debt Elements

1. Collect known technical debt elements from TODO/FIXME comments
2. Conduct static code analysis to identify potential issues
3. Survey the development team about known problems
4. Organize technical debt by categories (code, architecture, documentation, testing, etc.)

### Step 2: Basic Parameter Assessment

1. For each element, assess Severity, Interest Rate, Principal, and Intentionality
2. Add Business Risk and Reach assessment if possible
3. Document the rationale for each assessment for future tracking

### Step 3: Priority Calculation

1. Calculate Priority Score for each element
2. Calculate Enhanced Priority Score
3. Determine priority (High, Medium, Low)
4. Rank all technical debt elements by priority

### Step 4: Contextual Adaptation

1. For daily decisions, convert assessments to ICE Score
2. For sprint planning, use User Pain vs. Dev Effort
3. For quarterly planning, convert to RICE Score
4. For strategic decisions, use WSJF

### Step 5: Visualization and Analysis

1. Create a visual priority matrix
2. Analyze technical debt distribution by category
3. Create an "effort vs impact" analysis matrix to aid decision-making

### Step 6: Review and Update

1. Regularly review technical debt assessments (quarterly)
2. Update priorities based on new information
3. Track progress and effectiveness of debt reduction

## Tools and Templates

### Technical Debt Assessment Template

We've created a standardized template for assessing technical debt elements:

- [Technical Debt Assessment Template](../templates/technical-debt-assessment-template.md)

The template includes fields for all necessary assessments, calculations, and justifications, as well as adaptations to different methodologies.

### Technical Debt Priority Calculator

For automating calculations, we've created a calculator:

- [Technical Debt Priority Calculator (JavaScript)](../tools/technical-debt-calculator.js)
- [Calculator Web Interface](../tools/technical-debt-calculator.html)

The calculator allows quick calculation of all necessary metrics for different methodologies.

### Priority Visualizers

For visual representation of priorities, the following visualizations have been developed:

- Priority matrix
- Technical debt distribution by category
- "Effort vs Impact" analysis matrix

These visualizations can be generated using the calculator.

## Application Recommendations

### For Daily Developer Decisions

1. Assess technical debt using basic parameters
2. Calculate ICE Score
3. Focus on elements with the highest ICE Score
4. Apply the Boy Scout Rule (leave code better than you found it)

### For Sprint Planning

1. Assess User Pain and Dev Effort
2. Use the priority matrix for selection
3. Allocate 10-20% of sprint time for technical debt reduction
4. Start with Very High and High priority elements

### For Quarterly Planning

1. Calculate RICE Score for all significant technical debt elements
2. Create a visualization of debt distribution
3. Allocate resources based on RICE Score
4. Plan dedicated "technical debt sprints" each quarter

### For Strategic Decisions

1. Use WSJF for economic justification
2. Calculate Cost of Delay for accumulated technical debt
3. Determine the optimal balance between new feature development and debt reduction
4. Create a strategic debt reduction plan for 6-12 months

## Usage Examples

### Example 1: Inefficient API Assessment

**Debt Element**: Inefficient API request that makes many redundant calls

**Assessment**:

- Severity: 2 (Medium) - affects performance but not critical
- Interest Rate: 3 (Rapid) - problem worsens with each new screen
- Principal: 2 (Medium) - requires rewriting the API client
- Business Risk: 2 (Medium) - affects application speed

**Calculations**:

- Priority Score: (2 × 3) ÷ 2 = 3.0 (High)
- Enhanced Priority Score: 3.0 × 2 = 6.0 (High)
- ICE Score: 2×2 × (4-2)×2.5 × (4-2)×2.5 = 4 × 5 × 5 = 100
- User Pain: 2 × 3 = 6, Dev Effort: 2 × 3.3 = 6.6 → High Priority

**Decision**: Prioritize in the next sprint as a technical improvement.

### Example 2: Sprint Prioritization

The team has 5 technical debt elements:

| Debt                  | Severity | Interest | Principal | Business Risk | Priority |
| --------------------- | -------- | -------- | --------- | ------------- | -------- |
| Inefficient API       | 2        | 3        | 2         | 2             | High     |
| Outdated Dependencies | 2        | 2        | 2         | 2             | High     |
| Outdated Tests        | 2        | 1        | 3         | 1             | Low      |
| Code Duplication      | 1        | 2        | 1         | 1             | Medium   |
| Missing Documentation | 1        | 1        | 2         | 1             | Low      |

**Decision**: Include "Inefficient API" and "Outdated Dependencies" in the current sprint as priority technical debt tasks.

## Success Metrics

The effectiveness of the methodology is evaluated by the following metrics:

1. **Reduced Development Time**: Time to develop new features after addressing priority debt
2. **Improved Quality**: Reduction in errors and incidents
3. **Improved Resource Allocation**: More efficient use of developer time
4. **Decision-Making Transparency**: Clear justification for priorities
5. **Assessment Consistency**: Stability of assessments across different teams and developers

## Related Documents

- [Technical Debt Analysis](../architecture/tech-debt.md)
- [Prioritization Methods](./prioritization-methods.md)
- [Improvement Roadmap](../architecture/improvement-roadmap.md)
- [Technical Debt Assessment Template](../templates/technical-debt-assessment-template.md)

## References

- [Documentation Map](../navigation/documentation-map.md)
