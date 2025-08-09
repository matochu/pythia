# Guide: Prioritization Methods

## Table of Contents

- [Prioritization Methods for the Project](#prioritization-methods-for-the-project)
  - [Table of Contents](#table-of-contents)
  - [Introduction](#introduction)
  - [Prioritization Models](#prioritization-models)
    - [ICE (Impact, Confidence, Ease)](#ice-impact-confidence-ease)
    - [User Pain vs. Dev Effort](#user-pain-vs-dev-effort)
    - [RICE (Reach, Impact, Confidence, Effort)](#rice-reach-impact-confidence-effort)
    - [WSJF (Weighted Shortest Job First)](#wsjf-weighted-shortest-job-first)
    - [Value vs. Effort Matrix](#value-vs-effort-matrix)
  - [Appropriate Contexts for Each Model](#appropriate-contexts-for-each-model)
    - [Daily Development Decisions](#daily-development-decisions)
    - [Sprint Planning](#sprint-planning)
    - [Quarterly Planning](#quarterly-planning)
    - [Technical Debt Reduction](#technical-debt-reduction)
    - [Feature Development](#feature-development)
  - [Implementation Guidelines](#implementation-guidelines)
    - [Templates for Decision Making](#templates-for-decision-making)
    - [Integration with Project Management Tools](#integration-with-project-management-tools)
    - [Regular Review Process](#regular-review-process)
  - [Case Studies](#case-studies)
    - [Analytics Improvement Prioritization](#analytics-improvement-prioritization)
    - [State Management Refactoring](#state-management-refactoring)
  - [Conclusion](#conclusion)
  - [References](#references)

## Introduction

Building a successful Smart TV interface involves countless potential improvements, from performance optimizations to new features. Effective prioritization is essential for ensuring that development resources are focused on delivering the highest value with the available resources. This document outlines the prioritization methodologies that will be used in the project for decision-making at various levels, from day-to-day development choices to strategic architectural decisions.

The goal of these prioritization methods is to:

1. Provide objective criteria for deciding what to work on first
2. Ensure alignment between development priorities and project principles
3. Balance immediate user needs with long-term architectural health
4. Create a common language for discussing priorities across teams
5. Make the trade-offs in decision-making explicit and transparent

These prioritization models are not meant to be rigid rules but rather frameworks to inform discussions and decisions. They help bring structure and objectivity to the decision-making process while still allowing for contextual judgment.

## Prioritization Models

### ICE (Impact, Confidence, Ease)

ICE is a simple, fast prioritization method that rates tasks on a scale of 1-10 for three factors:

- **Impact**: How much positive effect will this change have on users or the business?
- **Confidence**: How confident are we in our assessment of impact and ease?
- **Ease**: How easy is it to implement this change? (higher = easier)

**ICE Score = Impact × Confidence × Ease**

**Benefits of ICE:**

- Quick and intuitive scoring
- Easily explainable to stakeholders
- Works well for smaller tasks and improvements
- Accounts for uncertainty through the confidence score

**Example:**

| Task                            | Impact (1-10) | Confidence (1-10) | Ease (1-10) | ICE Score |
| ------------------------------- | ------------- | ----------------- | ----------- | --------- |
| Implement analytics retry logic | 7             | 9                 | 8           | 504       |
| Refactor complex component      | 8             | 6                 | 4           | 192       |
| Fix navigation bug              | 9             | 10                | 7           | 630       |

In this example, fixing the navigation bug would be prioritized first, followed by implementing analytics retry logic, and then refactoring the complex component.

### User Pain vs. Dev Effort

This model specifically focuses on alleviating user pain points, which is crucial for Smart TV interfaces where usability directly impacts engagement:

- **User Pain (1-10)**: How much does this issue negatively affect the user experience?
- **Dev Effort (1-10)**: How much development effort is required to fix it? (higher = more effort)

Items with high user pain and low dev effort are prioritized first.

**Benefits of User Pain vs. Dev Effort:**

- Puts user experience at the center of prioritization
- Simple, two-dimensional model that's easy to visualize
- Effective for addressing usability issues
- Aligns well with user-centric design principles

**Example:**

| Issue                      | User Pain (1-10) | Dev Effort (1-10) | Priority  |
| -------------------------- | ---------------- | ----------------- | --------- |
| Focus management confusion | 9                | 4                 | Very High |
| Slow loading content cards | 8                | 7                 | High      |
| Minor visual inconsistency | 3                | 2                 | Low       |

In this example, focus management confusion would be addressed first due to high user pain and moderate effort, followed by slow loading content cards, and then minor visual inconsistencies.

### RICE (Reach, Impact, Confidence, Effort)

RICE is a more comprehensive model that factors in how many users are affected by an improvement:

- **Reach**: The number of users affected by the improvement in a given time period
- **Impact (1-3)**: How much this improvement will affect those users (1 = minimal, 2 = significant, 3 = massive)
- **Confidence (10-100%)**: Your level of confidence in the estimates (expressed as a percentage)
- **Effort**: Estimated person-weeks or story points required for implementation

**RICE Score = (Reach × Impact × Confidence) ÷ Effort**

**Benefits of RICE:**

- Accounts for scale of impact (number of users affected)
- More data-driven than simpler models
- Explicitly considers the resources required
- Good for strategic, larger-scope decisions

**Example:**

| Initiative               | Reach (users) | Impact (1-3) | Confidence (%) | Effort (weeks) | RICE Score |
| ------------------------ | ------------- | ------------ | -------------- | -------------- | ---------- |
| Home screen redesign     | 100,000       | 3            | 80%            | 12             | 20,000     |
| Performance optimization | 100,000       | 2            | 90%            | 3              | 60,000     |
| New content category     | 30,000        | 2            | 70%            | 5              | 8,400      |

In this example, performance optimization would be prioritized first due to its high reach, substantial impact, high confidence, and relatively low effort.

### WSJF (Weighted Shortest Job First)

WSJF is useful for balancing the value of work against its size, particularly when considering technical debt versus new features:

- **Cost of Delay**: The economic impact of not doing the work, combining:
  - User/Business Value
  - Time Criticality
  - Risk Reduction/Opportunity Enablement
- **Job Size**: The effort required to complete the work

**WSJF = Cost of Delay ÷ Job Size**

**Benefits of WSJF:**

- Economic approach to prioritization
- Considers the cost of delaying work
- Balances value against effort
- Helpful for justifying technical debt reduction

**Example:**

| Initiative                | User Value (1-10) | Time Criticality (1-10) | Risk Reduction (1-10) | Cost of Delay | Job Size (1-10) | WSJF |
| ------------------------- | ----------------- | ----------------------- | --------------------- | ------------- | --------------- | ---- |
| Refactor state management | 5                 | 7                       | 9                     | 21            | 8               | 2.63 |
| Add new feature           | 8                 | 6                       | 2                     | 16            | 5               | 3.20 |
| Reduce bundle size        | 6                 | 4                       | 7                     | 17            | 3               | 5.67 |

In this example, reducing bundle size would be prioritized first due to moderate value but very small job size, followed by adding the new feature, and then refactoring state management.

### Value vs. Effort Matrix

This simple 2x2 matrix helps visualize tasks based on their value and the effort required:

- **Value**: The benefit to users and the business (Low to High)
- **Effort**: The resources required to implement (Low to High)

The matrix creates four quadrants:

1. **Quick Wins** (High Value, Low Effort): Implement immediately
2. **Big Bets** (High Value, High Effort): Plan carefully and consider breaking down
3. **Fill-Ins** (Low Value, Low Effort): Do when resources are available
4. **Time Sinks** (Low Value, High Effort): Avoid or reconsider approach

**Benefits of Value vs. Effort Matrix:**

- Visual representation that's easy to understand
- Facilitates group discussions
- Helps identify obvious priorities and items to avoid
- Works well with whiteboards during planning sessions

## Appropriate Contexts for Each Model

Different prioritization models work best in different contexts. Here's when to use each model:

### Daily Development Decisions

**Best Model: ICE**

ICE is ideal for day-to-day development decisions and smaller improvements due to its simplicity and speed. It helps product managers and developers quickly assess which small enhancements or bug fixes to tackle first during sprint planning or backlog refinement.

**When to use:**

- Prioritizing bug fixes
- Deciding between small improvements
- Daily stand-up discussions
- Quick triage of new issues

### Sprint Planning

**Best Model: User Pain vs. Dev Effort**

For sprint planning, especially for user-facing issues, the User Pain vs. Dev Effort model helps focus on delivering the most value to users. It ensures that high-impact usability issues are addressed promptly, which is critical for TV platforms.

**When to use:**

- Sprint planning sessions
- Prioritizing usability improvements
- Addressing user feedback
- Fixing issues that directly impact users

### Quarterly Planning

**Best Model: RICE**

For major features and quarterly planning, RICE provides a more comprehensive view that factors in the scale of impact. It helps leadership teams make data-informed decisions about which larger initiatives to pursue.

**When to use:**

- Quarterly roadmap planning
- Major feature prioritization
- Resource allocation across teams
- Strategic technical initiatives

### Technical Debt Reduction

**Best Model: WSJF**

When balancing technical debt reduction against new features, WSJF helps quantify the economic benefit of investing in architecture and code quality. It provides a framework for justifying necessary but less visible work.

**When to use:**

- Technical debt prioritization
- Architectural improvement planning
- Balancing maintenance vs. new development
- Making economic cases for refactoring

### Feature Development

**Best Model: Value vs. Effort Matrix**

For initial feature prioritization and planning sessions, the Value vs. Effort Matrix provides a visual way to identify quick wins and avoid time sinks. It works well for collaborative sessions with mixed technical and non-technical stakeholders.

**When to use:**

- Feature brainstorming sessions
- Initial backlog creation
- Cross-functional planning meetings
- Stakeholder prioritization discussions

## Implementation Guidelines

### Templates for Decision Making

To facilitate consistent application of these prioritization models, we provide the following templates:

**ICE Scoring Template:**

```
Task: [Description]
Impact (1-10): [Score]
Confidence (1-10): [Score]
Ease (1-10): [Score]
ICE Score: [Impact × Confidence × Ease]
Rationale: [Brief explanation]
```

**User Pain vs. Dev Effort Template:**

```
Issue: [Description]
User Pain (1-10): [Score]
Dev Effort (1-10): [Score]
Priority: [High/Medium/Low based on combination]
User Scenarios Affected: [Brief description]
```

**RICE Scoring Template:**

```
Initiative: [Description]
Reach (users per time period): [Number]
Impact (1-3): [Score]
Confidence (10-100%): [Percentage]
Effort (person-weeks): [Number]
RICE Score: [(Reach × Impact × Confidence) ÷ Effort]
Key Assumptions: [List any critical assumptions]
```

**WSJF Template:**

```
Initiative: [Description]
User/Business Value (1-10): [Score]
Time Criticality (1-10): [Score]
Risk Reduction/Opportunity Enablement (1-10): [Score]
Cost of Delay: [Sum of the above]
Job Size (1-10): [Score]
WSJF: [Cost of Delay ÷ Job Size]
Business Justification: [Brief explanation]
```

### Integration with Project Management Tools

These prioritization models can be integrated into project management tools:

1. **Jira Custom Fields**: Create custom fields for ICE, RICE, or WSJF scores
2. **Prioritization Meetings**: Schedule regular prioritization sessions before sprint planning
3. **Documentation**: Link prioritization decisions to tickets for transparency
4. **Automation**: Set up automatic prioritization based on scores where possible

### Regular Review Process

To ensure that prioritization remains effective:

1. **Quarterly Review**: Assess whether prioritization methods are leading to desired outcomes
2. **Calibration**: Periodically calibrate scoring across team members to ensure consistency
3. **Learning Loop**: Review completed work to check if actual impact matched predictions
4. **Method Adjustment**: Be willing to refine methods based on project-specific needs

## Case Studies

### Analytics Improvement Prioritization

**Context**: The team needs to prioritize several improvements to the analytics system.

**Options**:

1. Implement retry mechanism for failed analytics transmissions
2. Create a centralized analytics service
3. Add offline support for analytics events
4. Develop a developer dashboard for analytics monitoring

**ICE Scoring**:

| Improvement                   | Impact | Confidence | Ease | ICE Score |
| ----------------------------- | ------ | ---------- | ---- | --------- |
| Retry mechanism               | 7      | 9          | 8    | 504       |
| Centralized analytics service | 8      | 7          | 5    | 280       |
| Offline support               | 6      | 8          | 4    | 192       |
| Developer dashboard           | 5      | 7          | 3    | 105       |

**Decision**: Implement the retry mechanism first as a quick win that significantly improves data reliability, followed by the centralized analytics service as a foundation for further improvements.

### State Management Refactoring

**Context**: The team is considering refactoring the Redux state management to improve maintainability and potentially switch to Zustand.

**WSJF Scoring**:

| Aspect              | Score (1-10) | Rationale                                                          |
| ------------------- | ------------ | ------------------------------------------------------------------ |
| User/Business Value | 5            | Indirect user benefit through future development speed             |
| Time Criticality    | 7            | Growing technical debt is increasingly slowing feature development |
| Risk Reduction      | 9            | High risk of increasing complexity if not addressed                |
| Cost of Delay       | 21           | Sum of the above                                                   |
| Job Size            | 8            | Significant effort across multiple sprints                         |
| WSJF                | 2.63         | Cost of Delay ÷ Job Size                                           |

**Comparison with other initiatives**:

| Initiative                   | WSJF | Priority |
| ---------------------------- | ---- | -------- |
| State management refactoring | 2.63 | Medium   |
| Performance improvements     | 5.67 | High     |
| New feature development      | 3.20 | Medium   |

**Decision**: Prioritize performance improvements first, then new features, while starting the state management refactoring incrementally alongside these initiatives to balance immediate needs with long-term architectural health.

## Conclusion

Effective prioritization is crucial for making informed decisions about where to focus development resources. The models outlined in this document provide frameworks for making these decisions more objective, transparent, and aligned with the project's goals.

By selecting the appropriate model for each context and consistently applying it, the project can ensure that development efforts deliver the maximum value to users and the business while maintaining a healthy, sustainable codebase.

Remember that these models should inform but not replace human judgment. They provide a starting point for discussions but should always be balanced with qualitative insights, strategic considerations, and team expertise.

---

## How to use with tasks/LLM

- During task creation (`@create-task.md`), add a brief prioritization note using ICE/RICE/WSJF summary as appropriate.
- In planning phases within a task, include a small scoring table (copy one of the templates above) and link to any supporting context.
- For tech-debt items, use WSJF by default; for UX issues, use User Pain vs Dev Effort; for quick fixes, use ICE.
- Reference this guide from tasks via `mdc:guides/guide-prioritization-methods.md` once renamed.

## References

- [Implementation Approach](implementation-approach.md)
- [Documentation Map](../navigation/documentation-map.md)
