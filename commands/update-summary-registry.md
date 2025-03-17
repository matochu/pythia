# Command: Update Summary Documents Registry

This guide provides step-by-step instructions for Large Language Models (LLMs) to update the Summary Documents Registry in the project.

## Prerequisites

Before updating the Summary Documents Registry, ensure you have:

1. Identified any new or modified summary documents in the project
2. Obtained the current date for proper document timestamping
3. Reviewed the existing Summary Documents Registry (`../navigation/summary-documents-registry.md`)
4. Understood the purpose and scope of any new summary documents

## Command Checklist

Before proceeding with registry update, complete this checklist:

- [ ] Review current registry structure
- [ ] Identify new summary documents
- [ ] Check for updated documents
- [ ] Verify document categorization
- [ ] Update registry table entries
- [ ] Update pending documents section
- [ ] Update automation status
- [ ] Update Last Updated date
- [ ] Update Changelog
- [ ] Run documentation validation
- [ ] Fix any validation issues
- [ ] Verify all entries are accurate

## Step 1: Review the Existing Registry

First, review the current state of the Summary Documents Registry:

1. Open `../navigation/summary-documents-registry.md`
2. Understand the current organization and categories of summary documents
3. Note any patterns in how documents are categorized and described
4. Check for any pending documents that may have been completed

## Step 2: Identify Changes Needed

Identify what updates are needed:

1. **New Documents**: Summary documents that need to be added to the registry
2. **Updated Documents**: Existing entries that need updated information
3. **Status Changes**: Pending documents that have been completed or status changes
4. **Removal**: Documents that should be removed or archived
5. **Reorganization**: Changes to the structure or categorization

## Step 3: Update the Registry Table

For each document that needs to be added or updated:

1. Determine the appropriate category in the registry table
2. Add a new row or update an existing row with the following information:
   - **Document**: Name and link to the document
   - **Type**: The type of summary document (Navigation, Summary, Aggregator, Strategy, Executive)
   - **Source Documents**: The sources used to create the summary
   - **Owner**: Team or individual responsible for maintaining the document
   - **Update Process**: How the document is updated (Manual, Semi-Automated, Automated)
   - **Update Frequency**: How often the document should be updated
   - **Last Updated**: The date when the document was last updated

For example:

```markdown
| [Component Analysis](../architecture/component-analysis.md) | Aggregator | Component implementations | UI Team | Manual | When patterns change | 2025-03-15 |
```

## Step 4: Update Pending Documents Section

If applicable, update the "Pending Documents" section:

1. Add any newly identified needed summary documents
2. Update status of in-progress documents
3. Remove documents that have been completed and added to the main registry
4. Update expected completion dates if necessary

## Step 5: Update Automation Status

If there are changes to how summary documents are created or maintained:

1. Update the "Automation Status" section
2. Add new automation initiatives or update status of existing ones
3. Note any improvements in the automation process

## Step 6: Update Last Updated Date

At the bottom of the document, update the "Last Updated" date to the current date:

```markdown
**Last Updated**: 2025-03-15
```

## Step 7: Update Changelog

Add an entry to `../CHANGELOG.md` about the registry update:

1. Under the current date section (or create a new one if needed)
2. Add to the "Changed" subsection:
   ```markdown
   - Updated Summary Documents Registry with [specific changes] (`../navigation/summary-documents-registry.md`)
   ```

## Step 8: Verification Checklist

Before finalizing the registry update, verify:

- [ ] All links are correct and working
- [ ] Source document references are accurate
- [ ] Owner information is current
- [ ] Update frequency is appropriate for each document
- [ ] Last updated dates are accurate
- [ ] Pending documents section is current
- [ ] Automation status reflects the current state
- [ ] Document formatting is consistent with the rest of the registry
- [ ] Last updated date at the bottom is current
- [ ] Changelog has been updated

## Step 9: Run Documentation Validation

Run the documentation validation tools to ensure the registry update is properly integrated:

```bash
npm run docs:validate-links
npm run docs:check-coverage
```

Fix any issues reported by these tools.

## Related Documents

- [Documentation Map](../navigation/documentation-map.md)
- [Summary Documents Registry](../navigation/summary-documents-registry.md)
- [Changelog](../CHANGELOG.md)
- [Documentation Guidelines](../methodology/documentation-guidelines.md)

---

**Last Updated**: 2025-03-11

## References

- [Guide Llm Documentation Workflow](../guides/guide-llm-documentation-workflow.md)
