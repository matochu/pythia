# Summary Documents Registry

## Purpose

This registry serves as a central reference for all documents that summarize or aggregate information from other sources in the project documentation. It enables easier maintenance by providing a single place to identify documents that may need updates when source documents change.

## Registry Maintenance Guidelines

1. **Update Frequency**: This registry should be updated whenever:

   - A new summary or aggregator document is created
   - An existing document's update frequency or dependencies change
   - Source document relationships change

2. **Responsibility**: The document owner listed in the registry is responsible for ensuring the summary document is kept up-to-date.

3. **Version Management**: The "Last Updated" field should be updated whenever the document is synchronized with its source documents.

## Document Types

- **Navigation**: Documents that provide navigation or index functionality across the documentation
- **Summary**: Documents that summarize information from one or more sources
- **Aggregator**: Documents that collect and organize information from multiple sources
- **Strategy**: Documents that outline strategic direction based on multiple input sources
- **Executive**: High-level overviews intended for non-technical or executive audiences

## Registry

| Document                                             | Type       | Source Documents                      | Owner              | Update Process   | Update Frequency              | Last Updated |
| ---------------------------------------------------- | ---------- | ------------------------------------- | ------------------ | ---------------- | ----------------------------- | ------------ |
| [Documentation Map](./documentation-map.md)          | Navigation | All documentation files               | Documentation Team | Manual           | When new documents are added  | 2025-03-11   |
| [Work Items Status Registry](../workflows/status.md) | Aggregator | Tasks, proposals, explorations        | Documentation Team | Manual           | When work items change status | 2025-03-13   |
| [Changelog](../CHANGELOG.md)                         | Historical | All significant documentation changes | Documentation Team | As changes occur | 2025-03-11                    |

## Pending Documents

These documents have been identified as valuable additions to the documentation system and are planned for creation:

| Document                       | Type       | Source Documents                        | Owner              | Status      | Expected Completion |
| ------------------------------ | ---------- | --------------------------------------- | ------------------ | ----------- | ------------------- |
| Active Work Items Registry     | Aggregator | Tasks, proposals, explorations          | Documentation Team | In Progress | 2025-03-14          |
| Executive Architecture Summary | Executive  | All architecture documents              | Architecture Team  | Planned     | 2025-04-01          |
| UI Component Guide             | Summary    | Component implementation, patterns      | UI Team            | Planned     | 2025-04-15          |
| Developer Onboarding Guide     | Summary    | Architecture, workflows, best practices | Onboarding Team    | Planned     | 2025-05-01          |
| Terminology Dictionary         | Reference  | All project documentation               | Documentation Team | Planned     | 2025-04-10          |
| Visual Architecture Map        | Navigation | Architecture documents                  | Architecture Team  | Planned     | 2025-05-15          |

## Automation Status

Currently, all summary document updates are performed manually. The following automation initiatives are being considered:

1. **Automated Link Checking**: Script to verify that all links in summary documents are valid
2. **Content Synchronization**: Script to flag when source documents have been updated after the summary document
3. **Update Notifications**: System to notify document owners when source documents change
4. **Version Tracking**: System to track document versions and synchronization status

---

**Last Updated**: 2025-03-11

## References

- [README](../README.md)
- [Update Summary Registry](../commands/update-summary-registry.md)

- [CHANGELOG](../CHANGELOG.md)
