# Command: Create Proposal Document

This guide provides step-by-step instructions for Large Language Models (LLMs) to create a new proposal document in the project.

## Prerequisites

Before creating a proposal document, ensure you have:

1. Completed thorough analysis of the area you're proposing to change
2. Completed all necessary research and explorations from the idea stage
3. Obtained the current date for proper document timestamping
4. Reviewed existing related architectural analyses and ideas
5. Identified dependencies and potential impacts
6. Considered alternatives to your proposed approach

## Command Checklist

Before proceeding with the proposal creation, complete this checklist:

- [ ] Get current date using `date +%Y-%m-%d`
- [ ] Review and understand the original idea document
- [ ] Check all research and exploration documents are complete
- [ ] Analyze impact on existing architecture
- [ ] List all dependencies and affected components
- [ ] Document alternative approaches considered
- [ ] Create proposal file with correct naming convention
- [ ] Fill in all template sections
- [ ] Update related idea document status
- [ ] Update ideas backlog
- [ ] Add cross-references
- [ ] Update Documentation Map
- [ ] Update Changelog
- [ ] Run documentation validation
- [ ] Fix any validation issues
- [ ] Verify all checklist items in Step 9

## Step 1: Create the Proposal File

Create a new file in the `../workflows/proposals/` directory using the naming convention:
`proposal-{topic}.md`

For example:

- `proposal-state-management-refactoring.md`
- `proposal-api-integration-strategy.md`

## Step 2: Use the Proposal Template

Copy the content from the [Proposal Template](../templates/proposal-template.md) and fill in all sections:

1. **Title**: Concise, descriptive title of the proposal
2. **Summary**: Brief overview of what is being proposed and why
3. **Related Idea**: Link to the original idea that initiated this proposal
4. **Current State**: Description of the current implementation with focus on problems
5. **Proposed Solution**: Detailed description of the proposed changes
6. **Implementation Approach**: Outline of implementation strategy and timeline
7. **Alternatives Considered**: Description of other approaches that were considered
8. **Risks and Mitigation**: Identification of potential risks and mitigation strategies
9. **Success Criteria**: Defined measurable criteria for successful implementation
10. **References**: Links to related documents

## Step 3: Update Related Idea Document

If the proposal is based on an idea document:

1. Update the idea status to "Transformed" in the idea document
2. Update the "Last Update" date in the idea document
3. Add a comment in the idea document linking to the new proposal

## Step 4: Update the Ideas Backlog

Update the ideas backlog in `../workflows/ideas/ideas-backlog.md`:

1. Change the status of the idea to "Transformed"
2. Add the idea to the "Ideas Transformed into Proposals" section with a link to the new proposal
3. Update the "Recently Updated Ideas" section with the current date

## Step 5: Provide Detailed Implementation Guidance

For complex proposals, include:

1. **Code Examples**: Show before/after examples of how the code would change
2. **Architecture Diagrams**: Visual representations of the proposed architecture
3. **Migration Path**: Step-by-step guide for migrating from the current to proposed approach
4. **Performance Considerations**: Impact on performance, load times, memory usage
5. **API Changes**: If your proposal changes APIs, document both old and new interfaces

## Step 6: Add Cross-References

Add references to related documents at the bottom of the proposal file:

```markdown
## References

- [Complete Exploration](complete-exploration.md)
- [Guide Llm Documentation Workflow](../guides/guide-llm-documentation-workflow.md)
- [Original Idea](../ideas/idea-YYYY-MM-topic.md)
- [Exploration](../ideas/explorations/exploration-topic.md)
- [Related Analysis](../architecture/analysis-topic.md)
- [Documentation Map](../navigation/documentation-map.md)
```

Ensure that references are bidirectional - update any related documents to reference this new proposal.

## Step 7: Update Documentation Map

Update `../navigation/documentation-map.md` to include the new proposal:

1. Find the "Proposals" section in the documentation map
2. Add a new entry with a link to the proposal document and brief description
3. Follow the existing format and organization

## Step 8: Update Changelog

Add an entry to `../CHANGELOG.md` about the new proposal document:

1. Under the current date section (or create a new one if needed)
2. Add to the "Added" subsection:
   ```markdown
   - Created proposal for [topic] (`../proposals/proposal-{topic}.md`)
   ```

## Step 9: Verification Checklist

Before finalizing the proposal document, verify:

- [ ] All sections of the template are properly filled in
- [ ] The naming convention is followed
- [ ] The related idea document is updated to "Transformed" status
- [ ] The ideas backlog is updated
- [ ] Cross-references are added to all related documents
- [ ] The documentation map is updated
- [ ] The changelog is updated
- [ ] No placeholder text remains in the document
- [ ] The proposal directly addresses issues identified in the original idea and exploration

## Step 10: Run Documentation Validation

Run the documentation validation tools to ensure the new document is properly integrated:

```bash
npm run docs:validate-links
npm run docs:check-coverage
```

Fix any issues reported by these tools.

## Related Documents

- [Proposal Template](../templates/proposal-template.md)
- [Ideas to Proposals Workflow](../methodology/ideas-to-proposals-workflow.md)
- [Ideas Backlog](../ideas/ideas-backlog.md)
- [Documentation Guidelines](../methodology/documentation-guidelines.md)
- [Documentation Map](../navigation/documentation-map.md)
- [Changelog](../CHANGELOG.md)

---

**Last Updated**: 2025-03-12
