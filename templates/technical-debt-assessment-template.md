# Technical Debt Assessment Template

## Identifier and Basic Information

**Name**: [Technical debt element name]  
**Category**: [Code / Architecture / Documentation / Testing / Infrastructure / Knowledge / Reliability]  
**Location**: [Modules/Files/Components affected by this technical debt]  
**Detection Date**: [YYYY-MM-DD]  
**Detected By**: [Name/Team]

## Impact Assessment

### Basic Parameters

**Severity (1-3)**: [Rating]  
_Rationale_: [Rating explanation]

**Interest Rate (1-3)**: [Rating]  
_Rationale_: [Rating explanation]

**Principal (1-3)**: [Rating]  
_Rationale_: [Rating explanation]

**Intentionality**: [Deliberate / Accidental]  
_Rationale_: [Explanation]

### Additional Parameters

**Business Risk (1-3)**: [Rating]  
_Rationale_: [Explanation of business impact]

**Reach (number of users)**: [Rating, if applicable]  
_Rationale_: [Explanation]

## Priority Calculation

**Priority Score**: (Severity × Interest Rate) ÷ Principal = [Calculation]  
**Enhanced Priority Score**: Priority Score × Business Risk = [Calculation]  
**Priority Level**: [High (≥ 2.0) / Medium (1.0-1.9) / Low (< 1.0)]

## Adaptation to Different Prioritization Methodologies

### ICE Score (for daily decisions)

- Impact (= Severity × Business Risk): [Calculation]
- Confidence (= (4 - Principal) × 2.5): [Calculation]
- Ease (= (4 - Principal) × 2.5): [Calculation]
- **ICE Score**: Impact × Confidence × Ease = [Calculation]

### User Pain vs Dev Effort (for sprint planning)

- User Pain (= Severity × Interest Rate): [Calculation]
- Dev Effort (= Principal × 3.3): [Calculation]
- **Priority**: [Very High / High / Medium / Low] (based on User Pain vs Dev Effort matrix)

### RICE Score (for quarterly planning)

- Reach: [Rating]
- Impact (= Severity × Business Risk): [Calculation]
- Confidence (= 100% - (Principal / 3 × 30%)): [Calculation]%
- Effort (= Principal × 4 weeks): [Calculation]
- **RICE Score**: (Reach × Impact × Confidence) ÷ Effort = [Calculation]

## Resolution Recommendations

**Proposed Solution**: [Description of proposed approach]  
**Timeframe**: [Short-term / Medium-term / Long-term]  
**Expected Benefits**: [Description of benefits from resolution]  
**Non-resolution Risks**: [Description of risks if not resolved]

## History and Tracking

**Related Tasks**: [Links to Jira/GitHub tasks]  
**Last Review Date**: [YYYY-MM-DD]  
**Status**: [Active / In Progress / Resolved / Accepted]

---

## Template Usage Instructions

### How to Rate Parameters

**Severity**

- **1 (Low)**: Minimal impact on development, quality, and user experience
- **2 (Medium)**: Noticeable impact on development speed, code quality, or UX
- **3 (High)**: Significant impact, substantially reduces development speed or product quality

**Interest Rate**

- **1 (Slow)**: Problem doesn't tend to worsen
- **2 (Moderate)**: Problem gradually worsens over time
- **3 (Rapid)**: Problem quickly worsens and generates new problems

**Principal**

- **1 (Small)**: Requires less than 1 day of work by one developer
- **2 (Medium)**: Requires 2-5 days of work by one developer
- **3 (Large)**: Requires more than 5 days of work or multiple developers

**Business Risk**

- **1 (Low)**: Virtually invisible to users/business
- **2 (Medium)**: Affects some business metrics or noticeable to some users
- **3 (High)**: Directly impacts key business metrics (conversion, retention, revenue) or user experience

### Assessment Example

**Debt Element**: Lack of centralized analytics service

**Severity**: 2 (Medium)  
_Rationale_: Scattered analytics creates codebase maintenance issues and potentially leads to data loss, but the application continues to function.

**Interest Rate**: 2 (Moderate)  
_Rationale_: The problem intensifies with each new screen as duplicate implementations are added.

**Principal**: 2 (Medium)  
_Rationale_: Refactoring requires creating a centralized service and updating all calls, taking 3-4 days.

**Business Risk**: 3 (High)  
_Rationale_: Analytics are key for business decisions; inaccurate data leads to incorrect conclusions.

**Priority Score**: (2 × 2) ÷ 2 = 2.0  
**Enhanced Priority Score**: 2.0 × 3 = 6.0  
**Priority Level**: High

**ICE Score**:

- Impact (2 × 3) = 6
- Confidence ((4 - 2) × 2.5) = 5
- Ease ((4 - 2) × 2.5) = 5
- ICE Score: 6 × 5 × 5 = 150

**RICE Score**:

- Reach: 100,000 users (all active users)
- Impact: 6
- Confidence: 100% - (2/3 × 30%) = 80%
- Effort: 2 × 4 = 8 weeks
- RICE Score: (100,000 × 6 × 0.8) ÷ 8 = 60,000

## References

- [Documentation Map](../navigation/documentation-map.md)

- [Technical Debt Prioritization](../methodology/technical-debt-prioritization.md)

- [Technical Debt Prioritization](../methodology/technical-debt-prioritization.md)
