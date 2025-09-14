# Command: Validate Documentation

> **IMPORTANT**: This command provides a systematic, production-ready process for validating documentation integrity, link consistency, and coverage completeness. It is designed for use by LLMs and human reviewers to ensure all documentation meets the highest standards of accuracy, completeness, and navigability.

## Quick Reference

- **Purpose**: Validate documentation for links, coverage, and integrity
- **Key Steps**: Preparation → Link Validation → Coverage Check → Fix Issues → Verify
- **Self-Check**: Use the Self-Check Points section before finalizing
- **Methodology**: Integrate validation frameworks for comprehensive checking
- **Safety**: Stop and request clarification if validation requirements are unclear

## Workspace Usage

This command can be used in any project workspace:

```bash
# Reference the command
@validate-documentation.md

# Execute with project context
Execute this command for my project at [project-path]

# Example usage
@validate-documentation.md
Context: My project documentation needs validation
Focus: Check links, coverage, and documentation integrity
Requirements: Fix broken links and update documentation map
```

## Command Checklist

Before proceeding with documentation validation, complete this checklist:

- [ ] Review recent documentation changes
- [ ] Check for any known documentation issues
- [ ] Run link validation script
- [ ] Address broken links
- [ ] Fix missing reciprocal links
- [ ] Run coverage validation script
- [ ] Add missing documents to map
- [ ] Update document references
- [ ] Verify all fixes are applied
- [ ] Re-run validation to confirm fixes
- [ ] Document any remaining issues

## Available Automation Scripts

The project includes two primary documentation automation scripts:

### 1. Link Validator (`linkValidator.ts`)

This script validates bidirectional links between markdown documentation files.

#### What it checks:

- **Broken Links**: Links that point to non-existent files
- **Missing Reciprocal Links**: If document A links to document B, but document B doesn't link back to document A

#### How LLMs can use it:

```bash
# Check links without making changes
npm run docs:validate-links

# Check links and automatically fix missing reciprocal links
npm run docs:fix-links
```

#### Interpreting Results:

- Look for the "Link Validation Results" section in the output
- Focus on fixing broken links first as they will cause the script to exit with a non-zero status code
- Then address missing reciprocal links to improve documentation navigation
- Reports are automatically saved to the `/reports` directory (e.g. `reports/link-report.json`)

#### Common Issues and Solutions:

| Issue                    | How to Fix                                                                                                                |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------- |
| Broken links             | Update the link to point to the correct file path or remove it if the target document is no longer relevant               |
| Missing reciprocal links | Add a link in the target document back to the source document, typically in a "Related Documents" or "References" section |
| Links with typos         | Check for case sensitivity issues or typographical errors in file paths                                                   |

### 2. Coverage Checker (`coverageChecker.ts`)

This script verifies the completeness of documentation references.

#### What it checks:

- **Missing Documents**: Referenced documents that don't exist
- **Coverage Gaps**: Documents that exist but are not included in the documentation map

#### How LLMs can use it:

```bash
# Check document coverage without making changes
npm run docs:check-coverage

# Check coverage and automatically update the documentation map
npm run docs:fix-coverage
```

#### Interpreting Results:

- Look for the "Documentation Coverage Results" section in the output
- Focus on "referenced documents that don't exist" as these are critical issues
- Then address "documents not included in the documentation map" to improve discoverability
- Reports are automatically saved to the `/reports` directory (e.g. `reports/doc-coverage-report.json`)

#### Common Issues and Solutions:

| Issue                    | How to Fix                                                                                          |
| ------------------------ | --------------------------------------------------------------------------------------------------- |
| Missing documents        | Create the missing document or update references to point to existing documents                     |
| Documents not in map     | Run `npm run docs:fix-coverage` to automatically add them, or manually update the documentation map |
| Possibly moved documents | Check the suggested alternatives and update references to point to the new location                 |

## Integration with Documentation Workflow

### When to Run These Tools

- After adding new documentation files
- After moving or renaming existing documents
- Before major documentation releases
- As part of regular documentation maintenance
- When onboarding new team members to ensure they have a complete view of the documentation
- After making changes that should be recorded in the [Changelog](mdc:CHANGELOG.md)

### Automated CI/CD Integration

These scripts can be integrated into CI/CD pipelines:

```yaml
# Example CI/CD step
documentation-validation:
  stage: validate
  script:
    - npm run docs:validate-links
    - npm run docs:check-coverage
  allow_failure: true # Optional: allows the pipeline to continue even if docs have issues
```

### Using Results to Improve Documentation

LLMs can use the output of these tools to:

1. Generate tasks for documentation improvements
2. Create pull requests that fix documentation issues
3. Update documentation metrics and health indicators
4. Generate reports on documentation completeness
5. Suggest structural improvements to the documentation system

### Manual Error Fixing by LLMs

While the `--fix` options can automatically address some issues (adding reciprocal links and updating the documentation map), many documentation problems require manual intervention:

1. **Broken Links**: When the script identifies broken links, LLMs should:

   - Check if the target document exists but has been moved/renamed, and update the link accordingly
   - Verify if the link uses incorrect syntax (especially with `mdc:` prefix or incorrect relative paths)
   - Determine if the referenced document should be created or if the link should be removed
   - Update all instances of the broken link consistently across documentation

2. **Missing Documents**: When documents referenced in the documentation map don't exist, LLMs should:

   - Determine if the document should be created based on its importance and context
   - Check if a document with similar content already exists and update references to point to it
   - Remove references to genuinely obsolete documents from the documentation map

3. **Inconsistent Linking**: When documents use inconsistent linking formats or content descriptions, LLMs should:
   - Standardize link syntax across documents
   - Ensure link text accurately describes the target content
   - Make sure related documents use consistent terminology

LLMs should always check the script output carefully, address issues manually that the automated fixes can't handle, and run the validation again to confirm all issues are resolved.

## Examples

### Basic Example: Standard Documentation Validation

```bash
# Validate documentation for a typical project
@validate-documentation.md
Context: Validate all documentation in my React project
Focus: Check links, coverage, and documentation integrity
```

### Edge Case Example: Complex Link Structure with mdc: Links

```bash
# Validate documentation with mdc: links and complex structure
@validate-documentation.md
Context: Validate documentation with mdc: links and workspace-specific references
# Expected: Scripts should handle mdc: links correctly and report any issues
```

### Acceptance Criteria

- All validation scripts run without errors
- All broken links are identified and fixed
- Documentation coverage meets project standards
- mdc: links are properly validated
- Cross-references are complete and accurate
- Validation reports are generated successfully

## Best Practices for LLMs Working with Documentation

1. **Understand the Document Hierarchy**: Familiarize yourself with the project's documentation structure before making changes.
2. **Preserve Document Intent**: When fixing links, ensure you maintain the original intent of the document.
3. **Context-Aware Linking**: When adding reciprocal links, place them in contextually appropriate sections.
4. **Consistent Formatting**: Maintain consistent formatting when adding new content.
5. **Run Tools Sequentially**: Run the link validator before the coverage checker to ensure better results.

## Extending the Automation Scripts

If you identify potential improvements to these scripts:

1. Consider adding validation for image references
2. Implement link text quality assessment
3. Expand to check for standard document sections
4. Add support for validating code examples
5. Create integrations with other documentation tools

## Troubleshooting

### Common Script Errors

| Error                                      | Possible Solution                                                     |
| ------------------------------------------ | --------------------------------------------------------------------- |
| `Error: ENOENT: no such file or directory` | Check that you're running the scripts from the project root directory |
| TypeScript compilation errors              | Ensure you have the required dependencies installed (`npm install`)   |
| `Cannot find module 'ts-node'`             | Install the dependency with `npm install -D ts-node`                  |
| Report file errors                         | Make sure the directory for the report file exists                    |

For more complex issues, examine the TypeScript source code in the `scripts/documentation` directory.

## Safety & Stop Conditions

- **No Hallucination**: If validation requirements are unclear, STOP and request clarification
- **Stop Conditions**:
  - Missing validation scripts or tools
  - Conflicting validation results
  - Insufficient permissions to access documentation
  - Critical broken links that cannot be resolved
- **Fallback**: Use default validation settings only if explicitly allowed
- **Request Help**: If stuck with complex validation issues, escalate to a human reviewer

## Self-Check Points

Before completing this command, verify:

- [ ] **Validation Scripts**: All validation scripts are working correctly
- [ ] **Link Validation**: All broken links are identified and fixed
- [ ] **Coverage Check**: Documentation coverage meets project standards
- [ ] **Reciprocal Links**: All documents have proper bidirectional links
- [ ] **Documentation Map**: Map is updated and accurate
- [ ] **Error Resolution**: All validation errors are addressed
- [ ] **Automated Fixes**: Script fixes are applied where appropriate
- [ ] **Manual Fixes**: Complex issues are manually resolved
- [ ] **Consistent Formatting**: All documents follow consistent formatting
- [ ] **Cross-References**: All related documents are properly linked

## Quality Rubric

| Dimension           | 1 (Low)         | 3 (Medium)      | 5 (High)                 |
| ------------------- | --------------- | --------------- | ------------------------ |
| **Clarity**         | Unclear process | Mostly clear    | Crystal clear process    |
| **Determinism**     | Ambiguous steps | Some ambiguity  | Fully deterministic      |
| **Testability**     | No validation   | Basic checks    | Comprehensive validation |
| **Safety**          | No safety rules | Basic safety    | Robust safety/fallback   |
| **Completeness**    | Major gaps      | Minor gaps      | Complete coverage        |
| **Maintainability** | Hard to update  | Moderate effort | Easy to maintain         |

## Methodology Integration

- **Methodology Consistency Checker**: Use for systematic validation of documentation quality and consistency
- **Methodology Application Patterns**: Apply consistent validation patterns across all documentation
- **Methodology Effectiveness Framework**: Measure the impact of documentation validation improvements
- **Documentation Guidelines**: Follow established guidelines for documentation structure and cross-referencing

## Integration Guidelines

This command integrates with other Pythia components:

### Related Commands

- **`@update-documentation-map.md`** - To update the documentation map
- **`@report-workflows.md`** - To generate workflow status reports
- **`@archive-tasks.md`** - To archive completed tasks
- **`@create-task.md`** - To create tasks for documentation improvements

### Template Integration

- Uses validation standards for consistent checking
- Follows documentation guidelines for proper structure
- Integrates with automated validation workflow

### Workspace Integration

- **Standard Structure**: Works with any project's documentation structure
- **Automated Scripts**: Uses npm scripts for validation and fixing
- **Cross-References**: Uses `mdc:` links for workspace navigation
- **Command Usage**: Reference with `@validate-documentation.md` in your workspace

## References

- [Guide Llm Documentation Workflow](mdc:guides/guide-llm-documentation-workflow.md)
- [Archive Tasks](mdc:commands/archive-tasks.md)
- [README](mdc:README.md)
- [Documentation Map](mdc:navigation/documentation-map.md)
- [Methodology Consistency Checker](mdc:methodology/methodology-consistency-checker.md)
- [Methodology Application Patterns](mdc:methodology/methodology-application-patterns.md)
- [Methodology Effectiveness Framework](mdc:methodology/methodology-effectiveness-framework.md)
- [Documentation Guidelines](mdc:methodology/documentation-guidelines.md)

## Versioning & Iteration

- **Iterative Improvement**: This command should be reviewed and improved regularly using validation frameworks and methodology integration
- **Version Tracking**: Update the "Last Updated" line with each major change
- **Feedback**: Incorporate reviewer and user feedback in each iteration

---

**Last Updated**: 2025-07-29
