# Command: Create Exploration Document

This guide provides step-by-step instructions for Large Language Models (LLMs) to create a new exploration (research) document based on an idea in the project.

## Prerequisites

Before creating an exploration document, ensure you have:

1. Obtained the current date for proper document timestamping (use `date +%Y-%m-%d` if needed)
2. Identified the idea document that requires research
3. Understood the key research questions that need to be answered
4. Reviewed any related existing documentation
5. Determined the methodology for conducting the research

## Command Checklist

Before proceeding with the exploration creation, complete this checklist:

- [ ] Get current date using `date +%Y-%m-%d`
- [ ] Review and understand the original idea document
- [ ] List all key research questions to be answered
- [ ] Plan research methodology and approach
- [ ] Create exploration file with correct naming convention
- [ ] Fill in all template sections
- [ ] Update related idea document status
- [ ] Update ideas backlog
- [ ] Add cross-references
- [ ] Update Documentation Map
- [ ] Update Changelog
- [ ] Run documentation validation
- [ ] Fix any validation issues
- [ ] Verify all sections are properly completed

## Step 1: Create the Exploration File

Create a new file in the `../workflows/explorations/` directory using the naming convention:
`exploration-{topic}.md`

For example:

- `exploration-indexeddb-performance.md`
- `exploration-offline-sync-strategies.md`

## Step 2: Use the Exploration Template

Copy the content from the [Exploration Template](../templates/exploration-template.md) and fill in all sections:

1. **Title**: Concise, descriptive title of the research topic
2. **Executive Summary**:

   - Overall status of the exploration
   - Key findings with completion indicators (✅ for completed, ⏳ for in progress)

3. **General Information**:

   - Creation Date (current date)
   - Last Update (current date)
   - Author(s)
   - Status (typically "in progress" for new explorations)

4. **Brief Description**: Concise 2-3 sentence description of the research
5. **Related Idea**: Link to the idea document that initiated this research
6. **Research Objective**: Clear description of what the research aims to discover
7. **Methodology**: Description of the approach, tools, and methods used
8. **Key Questions**: List of specific questions with status indicators (✅/⏳)
9. **Analysis of Existing Solutions**:

   - Summary table of evaluated solutions with relevance scores
   - Detailed analysis of each solution (features, limitations)
   - Conclusion on why existing solutions are or aren't adequate

10. **Research Results**: Detailed findings for each key question, including completion status
11. **Current System Analysis**: Analysis of existing systems or approaches (if applicable)
12. **Proposed Solution**: Detailed description of the proposed solution based on research findings
13. **General Conclusions**: Summary of the overall findings
14. **Recommendations**: Actionable recommendations based on the research
15. **Next Steps**: List of actions to be taken using checkboxes `- [ ]`
16. **Additional Materials**: Relevant tests, code examples, and external resources
17. **Related Documents**: Links to related documentation

## Step 3: Update the Idea Document

Update the related idea document:

1. Change the status of the idea to "in analysis" in its status section
2. Update the "Last Update" date
3. Add a link to the exploration document in the "Related Documents" section
4. Update any "Required Research" checkboxes that have been addressed

## Step 4: Update the Ideas Backlog

Update the ideas backlog in `../workflows/ideas/ideas-backlog.md`:

1. Change the status of the idea to "In analysis"
2. Add the idea to the "Recently Updated Ideas" section with the current date

## Step 5: Add Cross-References

Ensure that your exploration document references related documents:

```markdown
## Related Documents

- [Original Idea](../ideas/idea-2025-04-topic.md)
- [Related Analysis](../architecture/analysis-related-area.md)
- [Related Document](../path/to/document.md)
```

## Step 6: Update Changelog

Add an entry to `../CHANGELOG.md` about the new exploration document:

1. Under the current date section (or create a new one if needed)
2. Add to the "Added" subsection:
   ```markdown
   - Created exploration document for [topic] (`../workflows/explorations/exploration-{topic}.md`)
   ```

## Step 7: Verification Checklist

Before finalizing the exploration document, verify:

- [ ] All sections of the template are properly filled in
- [ ] Executive Summary clearly outlines key findings with status indicators
- [ ] Key questions have status indicators (✅/⏳)
- [ ] The naming convention is followed
- [ ] The related idea document is updated
- [ ] The ideas backlog is updated
- [ ] Cross-references are added
- [ ] No placeholder text remains in the document
- [ ] Dates and status are correctly set

## Example Implementation

Here's a simplified example of filling in an exploration document:

```markdown
# Exploration: IndexedDB Performance on TV Platforms

## Executive Summary

**Status**: in progress

This exploration analyzes the performance characteristics of IndexedDB across various TV platforms to determine its suitability as a primary caching solution for the application. Key findings include:

1. **Performance Impact**: ✅ IndexedDB operations have minimal impact on UI rendering (2-5ms per operation)
2. **Storage Limits**: ✅ All tested TV platforms support at least 50MB of IndexedDB storage
3. **Compatibility Issues**: ⏳ Some older WebOS platforms show inconsistent behavior
4. **Optimization Strategies**: ✅ Batch operations significantly improve performance
5. **Recovery Mechanisms**: ⏳ Still investigating best approaches for handling corruption

## General Information

**Creation Date**: 2025-04-15
**Last Update**: 2025-04-15
**Author(s)**: Research Team
**Status**: in progress

## Brief Description

This exploration analyzes the performance characteristics of IndexedDB across various TV platforms
to determine its suitability as a primary caching solution for the application.

## Related Idea

[Caching Component System](../workflows/ideas/idea-2025-03-caching-system.md)

## Research Objective

To evaluate IndexedDB performance on TV platforms and determine whether it meets
the requirements for efficient data caching with minimal impact on UI responsiveness.

## Methodology

The research utilizes:

1. Performance benchmarks on 5 different TV platforms
2. Comparative analysis with other storage options (localStorage, SessionStorage)
3. Load testing with varying data volumes (1MB to 100MB)
4. UI responsiveness measurements during storage operations
   ...
```

## Related Documents

- [Exploration Template](../templates/exploration-template.md)
- [Ideas Backlog](../ideas/ideas-backlog.md)
- [Ideas to Proposals Workflow](../methodology/ideas-to-proposals-workflow.md)
- [Create Idea Command](./create-idea.md)
- [Documentation Map](../navigation/documentation-map.md)
- [Changelog](../CHANGELOG.md)

---

**Last Updated**: 2025-03-12

## References

- [Guide Llm Documentation Workflow](../guides/guide-llm-documentation-workflow.md)
