# Command: Write Human Documentation

<command_purpose>
This command provides guidelines for LLMs to write documentation that reads naturally and avoids common AI writing patterns. Use this when creating or editing any documentation to ensure it sounds human-written and professional.
</command_purpose>

## Purpose

This command helps LLMs produce high-quality, human-like documentation by identifying and avoiding common AI writing patterns. Based on extensive research of AI writing characteristics, this guide provides concrete rules and examples to make your documentation clear, concise, and natural.

## Quick Reference

<quick_ref>

**Goal**: Write documentation that is indistinguishable from quality human writing

**Key Principle**: Be direct, specific, and avoid flowery language

**Red Flags**:
- Overuse of certain phrases (delve, crucial, robust, leverage)
- Excessive formatting (bold text, em-dashes)
- Promotional tone (cutting-edge, revolutionary)

**Self-Check**: Review your text against the checklist before finalizing

</quick_ref>

## Prerequisites

Before using this command:

1. [ ] Understand the target audience and their expertise level
2. [ ] Know the specific purpose of the documentation
3. [ ] Have access to source material or requirements
4. [ ] Be familiar with the project's existing documentation style

## Self-Check Checklist

<self_check>
Before finalizing any documentation, verify:

**Language Quality**
- [ ] No overuse of "delve," "crucial," "vital," "robust," "enhance," "leverage"
- [ ] No promotional language ("cutting-edge," "revolutionary," "game-changing")
- [ ] No vague importance claims ("plays a pivotal role," "underscores the significance")
- [ ] No collaborative phrases ("Let's explore," "we can see")
- [ ] Active voice preferred over passive voice

**Formatting**
- [ ] No excessive use of em-dashes (—) or bold text
- [ ] No emoji unless explicitly required by the project style
- [ ] Proper heading hierarchy maintained

**Content Structure**
- [ ] Sections don't end with "Challenges and Future Prospects"
- [ ] No "Rule of Three" patterns (three parallel items everywhere)
- [ ] Specific facts over general statements
- [ ] No placeholder text or TODOs

</self_check>

## Language & Tone Guidelines

<guideline_examples>

### ❌ AVOID: Undue Emphasis on Symbolism

<example>
<bad>
The logo represents the company's commitment to innovation and symbolizes
the journey from idea to execution, embodying the core values of teamwork
and excellence.
</bad>

<good>
The logo was designed in 2019 by Jane Smith and features the company's
primary colors: blue and green.
</good>

<rule>
State facts. Avoid interpreting symbolism or deeper meaning unless directly sourced.
</rule>
</example>

### ❌ AVOID: Promotional Language

<example>
<bad>
This revolutionary platform leverages cutting-edge technology to deliver
game-changing solutions that empower users to achieve unprecedented results.
</bad>

<good>
This platform uses React and Node.js to provide real-time data processing.
It was released in March 2023 and currently has 10,000 active users.
</good>

<rule>
Use neutral, factual language. Avoid marketing superlatives.
</rule>
</example>

---

### ❌ AVOID: Editorializing

<example>
<bad>
It's important to note that this feature significantly enhances user
experience and plays a crucial role in the application's success.
</bad>

<good>
This feature allows users to export data in CSV format. According to
user surveys, 73% use this feature weekly.
</good>

<rule>
Present facts with sources. Don't add subjective importance judgments.
</rule>
</example>

---

### ❌ AVOID: Overuse of Certain Conjunctions

<example>
<bad>
Additionally, the system provides logging. Furthermore, it includes
monitoring. Moreover, it supports alerts.
</bad>

<good>
The system provides logging, monitoring, and alerts.
</good>

<rule>
Use simple connectors: "and," "but," "so," "because." Avoid: "moreover," "furthermore," "additionally," "hence," "thus."
</rule>
</example>

### ❌ AVOID: Generic Section Summaries

<example>
<bad>
In summary, this section explored the key concepts and their applications,
highlighting the importance of proper implementation.
</bad>

<good>
(Just end the section with the last substantial point)
</good>

<rule>
Don't add meta-commentary about what you just wrote. End sections naturally.
</rule>
</example>

---

### ❌ AVOID: "Challenges and Future Prospects" Conclusions

<example>
<bad>
## Challenges and Future Prospects

While the technology shows promise, challenges remain including scalability
and adoption. Future developments may address these limitations.
</bad>

<good>
## Current Limitations

- Maximum 1000 concurrent connections (as of v2.1)
- No built-in caching (planned for v3.0, Q2 2024)
</good>

<rule>
Be specific about limitations with versions/dates. Avoid vague future speculation.
</rule>
</example>

---

### ❌ AVOID: Negative Parallelisms

<example>
<bad>
The challenges include not only technical complexity but also resource
constraints. This affects not just development but also deployment.
</bad>

<good>
The main challenges are:

1. Technical complexity (requires senior developers)
2. Resource constraints (minimum 16GB RAM)
</good>

<rule>
Use simple lists. Avoid "not only...but also" and "not just...but" patterns.
</rule>
</example>

---

### ❌ AVOID: Forced Rule of Three

<example>
<bad>
This enhances performance, improves reliability, and increases efficiency.
The system is fast, scalable, and secure.
Benefits include cost savings, time efficiency, and improved outcomes.
</bad>

<good>
This reduces response time by 40%. The system handles up to 10,000
requests per second and uses end-to-end encryption.
</good>

<rule>
Use natural groupings. Don't force everything into groups of three.
</rule>
</example>

---

### ❌ AVOID: Vague Attributions

<example>
<bad>
Experts suggest that this approach is effective. It is widely regarded
as best practice. Many believe this is the optimal solution.
</bad>

<good>
According to the 2023 Stack Overflow Survey, 67% of developers prefer
this approach. The React documentation recommends this pattern.
</good>

<rule>
Name specific sources or remove the claim.
</rule>
</example>

---

### ❌ AVOID: Elegant Variation

<example>
<bad>
First paragraph: "The database stores user information..."
Second paragraph: "The data repository maintains client details..."
Third paragraph: "The information storage system keeps customer records..."
</bad>

<good>
Use the same term consistently: "The database stores user data..."
</good>

<rule>
Use consistent terminology. Don't vary terms just for variety.
</rule>
</example>

## Style Guidelines

<style_examples>

### ❌ AVOID: Excessive Title Case

<example>
<bad>
## How To Configure The System For Production Deployment
</bad>

<good>
## How to configure the system for production deployment
</good>

<rule>
Use sentence case for headings (only first word capitalized).
</rule>
</example>

---

### ❌ AVOID: Excessive Boldface

<example>
<bad>
The **configuration file** contains **several sections** including **database**,
**cache**, and **logging** settings. Each **section** has **specific parameters**.
</bad>

<good>
The configuration file contains several sections: database, cache, and
logging. Each section has specific parameters.
</good>

<rule>
Use bold sparingly, only for emphasis on truly important terms.
</rule>

<exception>
Always preserve backticks for technical terms in documentation:
- Code constants: `HEARTBEAT_TTL`, `FILES_CACHED`, `manifest.files`
- Boolean values: `pendingUpdate: true`, `hasUpdate: false`
- Technical variables: `timeSinceLastHeartbeat`, `lastHeartbeats`
- Function names: `client.navigate()`, `forceClientReload()`
</exception>
</example>

---

### ❌ AVOID: Emoji (Unless Project Requires It)

<example>
<bad>
## Getting Started 🚀

This guide will help you 📚 understand the basics ✨
</bad>

<good>
## Getting Started

This guide covers installation and basic usage.
</good>

<rule>
Avoid emoji in technical documentation unless project style requires it.
</rule>
</example>

---

### ❌ AVOID: Overuse of Em-Dashes

<example>
<bad>
The system—which was developed in 2023—uses React—a popular framework—to
provide real-time updates—crucial for user experience.
</bad>

<good>
The system was developed in 2023. It uses React to provide real-time updates,
which improves user experience.
</good>

<rule>
Use periods and commas. Save em-dashes for occasional parenthetical remarks.
</rule>
</example>

---

### ❌ AVOID: Letter-Like Writing

<example>
<bad>
Dear Reader,

I hope this guide finds you well. In this document, I will walk you
through the installation process. Thank you for your time and attention.

Best regards,
The Documentation Team
</bad>

<good>
## Installation

1. Download the installer from https://example.com/download
2. Run `npm install`
3. Configure the `.env` file
</good>

<rule>
Write documentation, not letters. Be direct and procedural.
</rule>
</example>

</style_examples>

</guideline_examples>

---

## Communication Guidelines

<communication_examples>

### ❌ AVOID: Collaborative Phrases

<example>
<bad>
Let's explore how the authentication works. As we can see, the process
involves several steps. Let's examine each one carefully.
</bad>

<good>
The authentication process involves three steps:

1. User submits credentials
2. Server validates against database
3. Server returns JWT token
</good>

<rule>
Don't address the reader directly. Just present the information.
</rule>
</example>

---

### ❌ AVOID: Knowledge-Cutoff Disclaimers

<example>
<bad>
Note: This information is current as of my last update in April 2024.
Please verify current details.
</bad>

<good>
(Include specific version numbers and dates within the content itself)
Version 2.1 was released on March 15, 2024.
</good>

<rule>
Never mention your knowledge cutoff. Include dates in content naturally.
</rule>
</example>

---

### ❌ AVOID: Placeholder Text

<example>
<bad>
[More details to be added here]
[TODO: Add code example]
[Insert company name]
</bad>

<good>
(Either include the real content or remove the section)
</good>

<rule>
Don't leave placeholder text. Complete the content or remove the section.
</rule>
</example>

</communication_examples>

---

## Specific Phrases to Avoid

<phrase_guidelines>

### High-Risk AI Phrases (Use Sparingly or Never)

| AI Phrase | Better Alternative | Example |
|-----------|-------------------|---------|
| "delve into" | "examine," "explore," "discuss" | Examine the API structure |
| "crucial" | "important," "necessary," "required" | Required for authentication |
| "vital" | "essential," "needed," "important" | Essential configuration step |
| "robust" | "reliable," "stable," specific metrics | Handles 10K requests/second |
| "enhance" | "improve," specify improvement | Improves response time by 40% |
| "leverage" | "use," "apply" | Use the caching system |
| "facilitate" | "enable," "allow," "make easier" | Enables faster processing |
| "utilize" | "use" | Use this endpoint |
| "implement" | "create," "build," "add" | Create the authentication flow |
| "comprehensive" | "complete," specify coverage | Covers all API endpoints |
| "innovative" | Avoid or cite specific innovation | First to support WebGL 2.0 |
| "cutting-edge" | Avoid promotional language | Uses latest ECMAScript features |
| "state-of-the-art" | Avoid promotional language | Released in 2024 |
| "seamless" | Specify integration method | Integrates via REST API |
| "empower" | Specify what users can do | Allows users to export data |

</phrase_guidelines>

### Overused Opening Patterns

❌ **Avoid:**

- "In today's digital landscape..."
- "In the realm of..."
- "When it comes to..."
- "It's important to note that..."
- "It's worth mentioning that..."
- "One of the key advantages is..."

✅ **Use:**

- Direct statements of fact
- Jump straight to the topic

**Bad:**

```markdown
In today's fast-paced development environment, it's important to note
that testing plays a crucial role in ensuring code quality.
```

**Good:**

```markdown
Testing prevents bugs from reaching production. This project uses Jest
for unit tests and Cypress for end-to-end tests.
```

---

## Practical Examples

<practical_examples>

### Example 1: API Documentation

<comparison>
<bad label="AI-like">
## Overview

This comprehensive API empowers developers to seamlessly integrate our
cutting-edge authentication system into their applications. Leveraging
industry-standard protocols, it provides a robust and secure solution
that enhances user experience while maintaining the highest levels of
data protection.

### Key Features

- **Robust Security**: Utilizing advanced encryption
- **Seamless Integration**: Easy to implement
- **Comprehensive Documentation**: Detailed guides
</bad>

<good label="Human-like">
## Authentication API

This API handles user authentication using OAuth 2.0. It returns JWT
tokens valid for 24 hours.

### Endpoints

- `POST /auth/login` - Authenticate user
- `POST /auth/refresh` - Refresh token
- `POST /auth/logout` - Invalidate token

### Security

- Tokens use RS256 signing
- All endpoints require HTTPS
- Rate limit: 100 requests per hour per IP
</good>

<analysis>
**What makes it better:**
- Specific protocol (OAuth 2.0) instead of "industry-standard"
- Concrete token validity (24 hours) instead of vague claims
- Real endpoints with HTTP methods
- Measurable security details (RS256, rate limits)
- No promotional language
</analysis>
</comparison>

### Example 2: Feature Description

<comparison>
<bad label="AI-like">
## Export Feature

The export functionality represents a significant enhancement to the user
experience, enabling stakeholders to efficiently extract data in multiple
formats. This feature not only supports CSV and JSON but also provides
robust filtering capabilities, thus empowering users to customize their
exports according to their specific needs.
</bad>

<good label="Human-like">
## Export Data

Users can export data in CSV or JSON format.

To export:

1. Click "Export" in the top-right menu
2. Select format (CSV or JSON)
3. Choose columns to include (optional)
4. Click "Download"

Exports are limited to 10,000 rows. For larger datasets, use the API.
</good>

<analysis>
**What makes it better:**
- Direct, actionable steps instead of abstract descriptions
- Specific limit (10,000 rows) instead of vague capabilities
- Simple list format for procedures
- Clear alternative for edge case (API for large datasets)
- No "empowerment" or promotional language
</analysis>
</comparison>

---

### Example 3: Tutorial Introduction

<comparison>
<bad label="AI-like">
## Getting Started with Our Platform

Welcome! In this comprehensive guide, we'll delve into the fundamental
concepts that form the foundation of our platform. By the end of this
tutorial, you'll have gained a thorough understanding of the key features
and will be empowered to leverage the platform's capabilities to create
innovative solutions.

Let's embark on this exciting journey together!
</bad>

<good label="Human-like">
## Getting Started

This guide covers installation, basic configuration, and your first API call.

Prerequisites:

- Node.js 18 or higher
- npm 9 or higher
- Basic JavaScript knowledge

Time to complete: 15 minutes
</good>

<analysis>
**What makes it better:**
- Specific scope (installation, config, first API call)
- Concrete prerequisites with version numbers
- Time estimate sets expectations
- No collaborative phrases ("Let's", "we'll")
- No promotional language ("exciting journey")
</analysis>
</comparison>

</practical_examples>

---

## Common Issues and Solutions

<troubleshooting>

| Issue | Solution | Example Fix |
|-------|----------|-------------|
| Text sounds too formal or flowery | Remove adjectives. Use simple, direct sentences | "Utilize robust methodologies" → "Use proven methods" |
| Overuse of certain words | Run word frequency check. Vary naturally | Search for "crucial", "delve", "leverage" - replace each |
| Too much emphasis (bold, italics) | Use formatting only for UI elements, code, warnings | Remove **bold** from regular text, keep for `code` |
| Vague statements | Add specific numbers, dates, versions, sources | "Recently" → "March 2024", "Many users" → "73%" |
| Promotional tone | Remove marketing language. State facts neutrally | "Revolutionary platform" → "Released in 2023" |
| Sections too long | Break into smaller sections. Use lists | Convert paragraphs to numbered steps or bullet points |
| Overuse of passive voice | Rewrite in active voice | "is processed by" → "processes" |

</troubleshooting>

---

## Validation Process

<validation_steps>

After writing documentation, run these checks:

### 1. Phrase Detection

<check type="phrases">
Search for these terms and review each usage:

**High-risk AI phrases:**
- "delve," "crucial," "vital," "robust," "leverage," "enhance," "facilitate"
- "seamless," "innovative," "cutting-edge," "state-of-the-art"

**Collaborative phrases:**
- "Let's," "we can see," "it's important to note"
</check>

### 2. Pattern Check

<check type="formatting">
- **Em-dashes**: Count (—). Should be < 2 per 100 words
- **Bold text**: Should be < 5% of total text
- **List variety**: Check for three-item lists in succession. Vary list lengths
- **Heading hierarchy**: Verify proper H1 → H2 → H3 structure
</check>

### 3. Structure Review

<check type="structure">
- [ ] No sections titled "Challenges and Future Prospects"
- [ ] No meta-commentary ("This section covered...")
- [ ] No promotional language in technical descriptions
- [ ] No placeholder text ([TODO], [TBD])
- [ ] Consistent terminology throughout
</check>

### 4. Specificity Test

<check type="specificity">
For each claim, verify:

- ✅ Is there a specific number, date, or version?
- ✅ Is there a named source?
- ✅ Are examples concrete and realistic?
- ❌ If not, can you add specifics or remove the claim?

**Example transformations:**
- "Recently released" → "Released March 2024"
- "Many users" → "73% of surveyed users"
- "Fast performance" → "Processes 10K requests/second"
</check>

</validation_steps>

---

## Related Documents

- [Improve Instruction](mdc:commands/improve-instruction.md)
- [Documentation Guidelines](mdc:methodology/documentation-guidelines.md)
- [Create Command](mdc:commands/create-command.md)

---

## Additional Best Practices

<advanced_guidelines>

### Technical Writing Standards

#### ✅ Use Clear and Concise Language

<example>
<bad>
The agent should provide a detailed explanation of the process for initiating
a refund or replacement, ensuring that all necessary steps are communicated
clearly to the customer.
</bad>

<good>
Provide clear instructions on how to initiate a refund or replacement.
</good>

<rule>
Use simple, direct sentences. Avoid complex structures and unnecessary verbosity.
</rule>
</example>

---

#### ✅ Break Down Complex Tasks

<example>
<bad>
If the customer requests a replacement, the customer service agent should
verify the product's eligibility for replacement, then proceed to provide
the customer with the appropriate return authorization form, which the
customer should complete and submit for approval by the customer service agent.
</bad>

<good>
To initiate a replacement:

1. Verify the product meets replacement requirements
2. Provide the customer with a return authorization form
3. Approve the form after the customer completes it
</good>

<rule>
Use step-by-step instructions. Break complex processes into smaller tasks.
</rule>
</example>

---

#### ✅ Include Real Examples

<example>
<bad>
The system provides comprehensive error handling capabilities that enhance
the overall user experience and ensure reliable operation.
</bad>

<good>
Common error scenarios:

- Network timeout: Retry after 5 seconds
- Invalid credentials: Show "Login failed" message
- Server error: Display "Service temporarily unavailable"
</good>

<rule>
Provide specific examples of common scenarios and their solutions.
</rule>
</example>

---

### Testing and Improvement

<best_practices>

#### ✅ Test Documentation with Users

**Process:**
1. Share documentation with different user groups
2. Collect feedback on unclear sections
3. Update documentation based on feedback
4. Verify improvements with follow-up testing

**Rule:** Always test documentation with actual users before finalizing.

**Success metrics:**
- Task completion rate > 90%
- Average time to complete < expected time
- User satisfaction score > 4/5

---

#### ✅ Use Writing Tools

**Recommended tools:**

| Tool | Purpose | Use Case |
|------|---------|----------|
| Grammarly | Grammar and style checking | Catch grammar errors, improve clarity |
| DeepL | High-quality translation | Translate docs to other languages |
| Hemingway Editor | Readability improvement | Simplify complex sentences |
| ProWritingAid | Comprehensive writing analysis | Deep style and consistency checks |

**Rule:** Use AI-powered tools to improve grammar, style, and readability.

</best_practices>

---

### Version Control and Collaboration

<collaboration_guidelines>

#### ✅ Maintain Documentation Versions

<example>
<bad>
# API Documentation v1.0

Last updated: March 2024
</bad>

<good>
# API Documentation

## Version History

- v2.1 (2024-03-15): Added OAuth 2.0 support
- v2.0 (2024-01-10): Migrated to REST API
- v1.5 (2023-11-20): Added rate limiting
</good>

<rule>
Track changes systematically. Include version numbers and dates.
</rule>
</example>

---

#### ✅ Use Collaborative Tools

**Recommended platforms:**

| Platform | Best For | Key Features |
|----------|----------|--------------|
| GitBook | Version-controlled documentation | Git integration, markdown support |
| Notion | Team collaboration | Real-time editing, databases |
| Confluence | Enterprise documentation | Permissions, integrations |
| GitHub Wiki | Developer-focused docs | Code integration, version control |

**Rule:** Choose tools that support team collaboration and feedback.

</collaboration_guidelines>

---

### Accessibility and Standards

<accessibility_guidelines>

#### ✅ Ensure Accessibility

**Requirements:**
- Use alt text for images
- Provide screen reader compatibility
- Use proper heading hierarchy (H1 → H2 → H3)
- Ensure color contrast compliance (WCAG AA minimum)

<example>
<good>
![Screenshot of login form](login-form.png 'Login form with username and password fields')

## Login Process

1. Enter your username in the first field
2. Enter your password in the second field
3. Click the "Sign In" button
</good>

<rule>
Make documentation accessible to users with disabilities.
</rule>
</example>

---

#### ✅ Follow International Standards

**Standards to consider:**

| Standard | Focus | Authority |
|----------|-------|-----------|
| ISO/IEC 26514 | Software user documentation | International Standards Org |
| IEEE 1063 | Software user documentation | IEEE Standards |
| WCAG 2.1 | Web content accessibility | W3C |
| MDN Web Docs | Web documentation standards | Mozilla |

**Rule:** Adhere to established international documentation standards.

</accessibility_guidelines>

---

### Security and Data Protection

<security_guidelines>

#### ✅ Protect Sensitive Information

<example>
<bad>
Example API key: sk-1234567890abcdef
Test password: admin123
Database URL: postgres://user:pass@prod-db.example.com:5432/mydb
</bad>

<good>
Example API key: sk-**_REDACTED_**
Test password: [Use your actual password]
Database URL: postgres://username:password@localhost:5432/database_name
</good>

<rule>
Never include real credentials or sensitive data in examples. Use placeholders or redacted values.
</rule>
</example>

---

#### ✅ Follow Company Policies

**Security checklist:**

- [ ] No confidential information in examples
- [ ] Compliance with data protection policies (GDPR, CCPA)
- [ ] Approval from security team if needed
- [ ] Regular review for policy compliance
- [ ] No internal URLs or IP addresses
- [ ] No customer data or PII

**Rule:** Always follow company data handling and security policies.

</security_guidelines>

</advanced_guidelines>

---

## Advanced Techniques

<advanced_techniques>

### Visual Elements

#### ✅ Use Diagrams and Charts

**When to use:**
- Complex system architecture
- Process flows with multiple decision points
- Data relationships and dependencies
- User journey maps

**Recommended tools:**

| Tool | Type | Best For |
|------|------|----------|
| Mermaid | Code-based diagrams | Version-controlled diagrams in markdown |
| Draw.io | Visual editor | Complex architectural diagrams |
| Lucidchart | Professional tool | Team collaboration on diagrams |
| PlantUML | Code-based UML | Software architecture diagrams |

<example>
<good>
````markdown
```mermaid
graph TD
    A[User Login] --> B{Valid Credentials?}
    B -->|Yes| C[Generate JWT Token]
    B -->|No| D[Show Error Message]
    C --> E[Redirect to Dashboard]
```
````
</good>

<rule>
Use diagrams when text alone would require complex explanations. Keep diagrams simple and focused.
</rule>
</example>

---

#### ✅ Use Tables for Structured Data

<example>
<bad>
The system supports various file formats including CSV, JSON, XML, and PDF.
Each format has different size limits and processing times.
</bad>

<good>
| Format | Max Size | Processing Time | Use Case |
|--------|----------|-----------------|----------|
| CSV    | 100MB    | 2-5 seconds     | Bulk data import |
| JSON   | 50MB     | 1-3 seconds     | API responses |
| XML    | 25MB     | 3-7 seconds     | Legacy integrations |
| PDF    | 10MB     | 5-10 seconds    | Reports |
</good>

<rule>
Use tables when comparing multiple items across several attributes. Add headers that clearly describe each column.
</rule>
</example>

---

### Templates and Consistency

#### ✅ Create Documentation Templates

<template>
```markdown
# [Feature Name]

## Overview

Brief description (1-2 sentences) of what this feature does and why it exists.

## Prerequisites

- Requirement 1 (with version if applicable)
- Requirement 2
- Requirement 3

## Quick Start

Minimal steps to get started (3-5 steps max).

## Detailed Usage

### Basic Configuration

Step-by-step instructions with examples.

### Advanced Options

Optional configurations and customizations.

## Examples

### Example 1: [Common Use Case]
```code
// Real, working code example
```

### Example 2: [Another Use Case]
```code
// Another real example
```

## Troubleshooting

| Issue | Solution | Related Docs |
|-------|----------|--------------|
| Common error 1 | How to fix | [Link](#) |
| Common error 2 | How to fix | [Link](#) |

## API Reference

Detailed technical reference (if applicable).

## Related Documentation

- [Related Feature 1](link)
- [Related Feature 2](link)

**Last Updated**: YYYY-MM-DD
```
</template>

<rule>
Use consistent templates across all documentation. Customize sections based on content type (tutorial, reference, guide).
</rule>

</advanced_techniques>

---

## External References

<references>

### Research Sources
- [Wikipedia: Signs of AI Writing](https://en.wikipedia.org/wiki/Wikipedia:Signs_of_AI_writing) - Comprehensive list of AI writing patterns
- [Does Prompt Formatting Have Any Impact on LLM Performance?](https://arxiv.org/html/2411.10541v1) - Research study on XML vs Markdown vs JSON performance across GPT models

### LLM-Specific Guides
- [Claude: Use XML Tags to Structure Prompts](https://docs.claude.com/en/docs/build-with-claude/prompt-engineering/use-xml-tags) - Official Anthropic guidance on XML tags
- [Anthropic: Prompt Engineering Techniques](https://aws.amazon.com/blogs/machine-learning/prompt-engineering-techniques-and-best-practices-learn-by-doing-with-anthropics-claude-3-on-amazon-bedrock/) - AWS blog on Claude 3 best practices
- [OpenAI: XML vs Markdown Discussion](https://community.openai.com/t/xml-vs-markdown-for-high-performance-tasks/1260014) - Community insights on format performance

### Standards
- [ISO/IEC 26514:2019](https://www.iso.org/standard/71520.html) - Software user documentation standard
- [IEEE 1063](https://standards.ieee.org/standard/1063-2001.html) - Software user documentation standard

### Style Guides
- [Mozilla Developer Network Writing Style Guide](https://developer.mozilla.org/en-US/docs/MDN/Writing_guidelines/Writing_style_guide) - Web documentation standards
- [Google Developer Documentation Style Guide](https://developers.google.com/style) - Technical writing best practices

</references>

---

## Summary

<command_summary>

**Core Principle**: Write documentation that is indistinguishable from quality human writing by being direct, specific, and factual.

**Key Takeaways**:
1. **Avoid AI-telltale phrases** (delve, crucial, leverage, robust)
2. **Use concrete facts** with numbers, dates, and sources
3. **Keep formatting minimal** (limited bold, no excessive em-dashes)
4. **Write naturally** (no collaborative phrases, no promotional tone)
5. **Validate systematically** using the 4-step validation process

**Before finalizing, ask yourself**:
- Would a human expert write this way?
- Are all claims backed by specific facts?
- Have I removed all AI writing patterns?

</command_summary>

---

**Last Updated**: 2025-10-09
