# Command: Sync Document with Confluence

> **IMPORTANT**: This command facilitates synchronization between local documentation and Confluence pages. It preserves local references and maintains metadata about synchronization status without modifying the Confluence page structure.

## Purpose

This command provides a structured process for synchronizing Markdown documentation with Confluence pages. It ensures that content can be maintained in both the code repository and Confluence while tracking synchronization status and allowing bidirectional updates.

## Important Synchronization Rules

1. **Metadata Handling**:

   - Local metadata comments (enclosed in HTML comments) are NOT synchronized to Confluence
   - References to local repository files are NOT synchronized
   - Confluence sync metadata section should always remain in the local file only

2. **Page Title**:

   - The page title in Confluence is taken from the first H1 header (`# Title`) in the Markdown file
   - The local file name is NOT used as the page title
   - Example: If your file contains `# Performance Optimization Strategy`, this will be the page title in Confluence, regardless of the file name

3. **Content Processing**:
   - All local repository references (e.g., `[Link](../other-doc.md)`) are excluded from Confluence sync
   - Internal metadata sections are automatically removed during sync
   - Only the actual content is transferred to Confluence

## Prerequisites

Before synchronizing a document with Confluence, ensure you have:

1. The target document exists in the local repository
2. You have proper access to the MCP Confluence API
3. The document follows standard formatting guidelines
4. You know the target Confluence space and location (or have an existing page ID)
5. You have obtained the current date and time for proper sync timestamping
6. You have reviewed the [Confluence Structure Analysis](../architecture/confluence-structure.md) for guidance on appropriate placement

## Command Checklist

- [ ] Get current date and time using `date "+%Y-%m-%d %H:%M"`
- [ ] Identify the local document to synchronize
- [ ] Determine if this is an initial sync or update
- [ ] Verify the document format is Confluence-compatible
- [ ] Set up synchronization metadata in the local document
- [ ] Search for existing Confluence page or create a new one
- [ ] Perform the synchronization operation (push, pull, or bidirectional)
- [ ] Update the document's synchronization metadata
- [ ] Validate the synchronization was successful
- [ ] Update any references to track the synchronization

## Quick Reference

### Synchronization Process

1. **Document Preparation** - Clean and format the document
2. **Metadata Setup** - Add sync metadata to local file
3. **Confluence Search** - Find existing page or create new one
4. **Content Sync** - Push/pull content between systems
5. **Validation** - Verify sync was successful

### Key Synchronization Rules

- **Page Title**: Uses first H1 header (`# Title`) as Confluence page title
- **Local References**: Excluded from Confluence sync (e.g., `[Link](../doc.md)`)
- **Metadata**: Local metadata comments are NOT synced to Confluence
- **Content Only**: Only actual content is transferred, not file structure

### Common Sync Commands

```bash
# Get current timestamp
date "+%Y-%m-%d %H:%M"

# Check document format
head -5 .pythia/workflows/proposals/proposal-example.md

# Validate document structure
grep -n "^#" .pythia/workflows/proposals/proposal-example.md

# Check for local references
grep -r "\.\./" .pythia/workflows/proposals/proposal-example.md
```

### Document Preparation Checklist

- ✅ First line is single H1 header (`# Document Title`)
- ✅ Document filename matches content
- ✅ Clean metadata section present
- ✅ Local references reviewed and handled
- ✅ Content structure verified (H2, H3, tables, code blocks)
- ✅ Repository-specific content removed

## Step 1: Prepare for Synchronization

Begin by gathering necessary information:

```bash
# Get the current date and time for proper timestamping
date "+%Y-%m-%d %H:%M"

# Identify the document to synchronize
ls -la ../workflows/proposals/proposal-performance-optimization-strategy.md
```

## Step 1.5: Document Preparation Checklist

Before initiating synchronization, ensure your document is properly prepared to avoid manual corrections:

### Document Preparation Checklist

- [ ] **Correct Document Title Format**:

  - First line MUST be a single H1 header (e.g., `# Document Title`)
  - Title in H1 will become the Confluence page title
  - Document filename should match content (e.g., `proposal-webgl-pixijs-rendering.md` for WebGL rendering proposal)

- [ ] **Clean Metadata**:

  - Add metadata section if not present (see Step 2)
  - For existing documents, verify metadata is complete and accurate
  - Update timestamp when making changes

- [ ] **Reference Handling**:

  - Review all local references (e.g., `[Link](../other-doc.md)`)
  - Decide which references should be maintained in Confluence (may need manual conversion)
  - Consider creating Confluence links for important cross-references

- [ ] **Content Structure**:

  - Verify document has appropriate heading structure (H2, H3, etc.)
  - Ensure complex elements (tables, code blocks) are correctly formatted
  - Check image references and ensure images are available

- [ ] **Special Content Removal**:
  - Remove any repository-specific content that shouldn't go to Confluence
  - Remove any temporary notes or TODOs not intended for publication
  - Consider removing or adapting highly technical content if audience requires it

### Running Pre-Sync Validation

To validate document readiness, run:

```bash
# Quick validation of document format
grep "^# " your-document.md | wc -l  # Should output 1 for single H1 title

# Check for potential reference issues
grep -o "\[.*\](.*\.md)" your-document.md  # Lists all .md file references

# Verify metadata section existence
grep -A 7 "Confluence Sync Metadata:" your-document.md
```

After completing this checklist, your document will be properly prepared for synchronization, reducing the need for manual corrections later.

## Step 2: Add Synchronization Metadata

If this is the first synchronization, add metadata comments to the document. This metadata will be preserved locally but not sent to Confluence:

```markdown
<!--
Confluence Sync Metadata:
Page ID: [Will be set after first sync]
Space Key: DT1
Parent Page: Frontend/Technical Proposals
Last Synced: YYYY-MM-DD HH:MM
Sync Direction: [local-to-confluence|confluence-to-local|bidirectional]
Sync Status: [initial|in-sync|local-ahead|confluence-ahead|conflict]
-->
```

## Step 3: Configure Confluence Destination

Determine where the document should reside in Confluence:

1. For new pages: Identify parent page and hierarchy
2. For existing pages: Obtain the Page ID from Confluence

Before creating a new page, consult the [Confluence Structure Analysis](../architecture/confluence-structure.md) to understand the organization of the DT1 space:

- **DT1 Space Organization**: The space has a hierarchical structure with both flat content and nested hierarchies.
- **Multi-level Structure**: Review the documented structure to find appropriate locations for your content.
- **Functional Page Groups**: Place your content in an appropriate functional group (Process Guidelines, Reference Documentation, Knowledge Artifacts, etc.).
- **Content Analysis**: Check the detailed content analysis for specific sections like Frontend, DEVELOPMENT, etc.

For example, based on the analysis, technical proposal documents related to Frontend should be placed in the Frontend section:

```
Development Team (Home Page)
├── DEVELOPMENT
│   ├── Frontend
│   │   ├── Launcher Technical Improvement Roadmap
│   │   └── [Your Technical Proposal] <-- Target location
```

```bash
# For existing page, search by title using MCP Confluence API
mcp_mcp_atlassian_confluence_search --query "Performance Optimization Strategy" --limit 5

# To find the parent page (Frontend section), use:
mcp_mcp_atlassian_confluence_search --query "Frontend" --limit 3

# Or search by space for better orientation:
mcp_mcp_atlassian_confluence_search --query "space=DT1 AND title=Frontend" --limit 3
```

## Step 4: Perform Synchronization

Use the `@markdown-confluence/cli` tool for synchronization. The tool is configured via `.markdown-confluence.json` and environment variables.

> **⚠️ IMPORTANT**: By default, the tool synchronizes **ALL** files specified in the `.markdown-confluence.json` configuration. If you need to synchronize only one file, **BE SURE** to modify the configuration before running (see the section "For Synchronizing a Single File" below).

### Configuration Setup

1. Create or update `.markdown-confluence.json`:

```json
{
  "confluenceBaseUrl": "https://your-domain.atlassian.net",
  "confluenceParentId": "PARENT_PAGE_ID",
  "confluenceSpaceKey": "YOUR_SPACE",
  "atlassianUserName": "your.email@domain.com",
  "folderToPublish": "path/to/.pythia"
}
```

2. Create local configuration file `.markdown-confluence.local.json` for authentication (DO NOT commit this file to repository):

```json
{
  "auth": {
    "username": "your.username",
    "email": "your.email@domain.com",
    "token": "YOUR_ATLASSIAN_API_TOKEN"
  }
}
```

> **NOTE**: For Titanos project, the authentication token is available in the local configuration file. Ensure you have this file properly configured before attempting synchronization.

3. Run the synchronization:

```bash
npx @markdown-confluence/cli --dry-run --debug --verbose
```

### Important Notes About Parent ID

- The `confluenceParentId` in configuration should be the ID of the parent page where you want to create your documents
- When a document already exists in Confluence (has metadata with Page ID), the `confluenceParentId` is ignored
- The `confluenceParentId` is only used for new pages that don't exist in Confluence yet
- You can change the parent of existing pages by updating their metadata directly in the markdown file

### Content Processing

Before synchronization, the content is automatically processed to:

- Remove all metadata comments
- Remove local repository references
- Extract the title from the first H1 header
- Clean up any repository-specific content

### For Initial Sync (Create New Page)

If the page doesn't exist in Confluence, it will be created under the page specified in `confluenceParentId`:

```bash
# Make sure confluenceParentId is set correctly in .markdown-confluence.json
npx @markdown-confluence/cli
```

### For Updating Existing Page

If the page already exists in Confluence (has Page ID in metadata):

```bash
# Parent ID from config is ignored, using existing page location
npx @markdown-confluence/cli
```

### For Moving a Page

To move a page to a different parent in Confluence:

1. First, update the page metadata in the markdown file:

```markdown
<!--
Confluence Sync Metadata:
Page ID: 123456789
Parent Page: New Parent Page Title
-->
```

2. Then run the sync:

```bash
npx @markdown-confluence/cli
```

### For Synchronizing a Single File

To synchronize only a specific file instead of all files in the configuration:

1. Temporarily modify the `.markdown-confluence.json` configuration:

```json
{
  "files": [
    {
      "path": "workflows/proposals/specific-file-to-sync.md",
      "labels": ["proposal", "documentation"]
    }
  ]
}
```

2. Run the synchronization for just this file:

```bash
npx @markdown-confluence/cli
```

3. After successful synchronization, restore the original configuration if needed.

### Recommended Approach: Safe Synchronization through Temporary Files

For maximum safety and to prevent unintended modifications to original documents, follow this workflow:

1. Create a temporary working directory:

```bash
# Create a temporary directory
mkdir -p /tmp/confluence-sync-tmp
```

2. Copy the target document to the temporary directory:

```bash
# Copy document to temp directory
cp .pythia/workflows/proposals/your-document.md /tmp/confluence-sync-tmp/
```

3. Prepare the temporary copy for synchronization:

```bash
# Go to temp directory
cd /tmp/confluence-sync-tmp

# Manually edit the file to:
# - Ensure proper H1 title format
# - Remove references to local repository files
# - Remove any content not intended for Confluence
# - Ensure metadata is present and correct
nano your-document.md
```

4. Create a temporary configuration file specifically for this synchronization:

```bash
# Create minimal config file for single document sync
cat > .markdown-confluence.json << EOF
{
  "confluenceBaseUrl": "https://your-domain.atlassian.net",
  "confluenceParentId": "PARENT_PAGE_ID",
  "confluenceSpaceKey": "YOUR_SPACE",
  "atlassianUserName": "your.email@domain.com",
  "folderToPublish": ".",
  "files": [
    {
      "path": "path/to/your-document.md",
      "labels": ["proposal", "documentation"]
    }
  ],
  "convertedImageLocation": "converted-images",
  "uploadImages": true,
  "removeHeader": true
}
EOF

# Copy the authentication configuration
cp /path/to/original/.markdown-confluence.local.json .
```

5. Run synchronization from the temporary directory:

```bash
# Run sync only for this document
npx @markdown-confluence/cli --debug --verbose
```

6. Extract the updated metadata (including Page ID) after successful synchronization:

```bash
# Extract metadata section including the Page ID assigned by Confluence
grep -A 10 "Confluence Sync Metadata:" your-document.md > /tmp/extracted-metadata.txt
```

7. Update the original file's metadata:

```bash
# Go back to original directory
cd /path/to/original/.pythia

# Either:
# 1. Manually update the metadata in the original file with the extracted information
# OR
# 2. Use this command to replace the metadata section
sed -i '/<!--.*Confluence Sync Metadata:/,/-->/ {
  r /tmp/extracted-metadata.txt
  d
}' workflows/proposals/your-document.md
```

8. Move metadata to the end of the file (if desired):

```bash
# Extract metadata
grep -A 10 "Confluence Sync Metadata:" workflows/proposals/your-document.md > /tmp/extracted-metadata.txt

# Remove current metadata
sed -i '/<!--.*Confluence Sync Metadata:/,/-->/ d' workflows/proposals/your-document.md

# Append to end of file
cat /tmp/extracted-metadata.txt >> workflows/proposals/your-document.md
```

9. Clean up temporary files:

```bash
# Remove temporary directory
rm -rf /tmp/confluence-sync-tmp
rm /tmp/extracted-metadata.txt
```

This approach ensures that:

- Your original document remains unmodified during synchronization
- You have complete control over what is synchronized to Confluence
- Metadata is handled separately from the synchronization process
- The risk of unintended synchronization of multiple files is eliminated

## Step 5: Update Synchronization Metadata

After synchronization, update the metadata in the local document:

```markdown
<!--
Confluence Sync Metadata:
Page ID: 123456789
Space Key: DT1
Parent Page: Frontend/Technical Proposals
Last Synced: 2025-03-19 12:34
Sync Direction: local-to-confluence
Sync Status: in-sync
-->
```

## Step 6: Verify Synchronization

Verify that the synchronization was successful:

```bash
# Check the page in Confluence
mcp_mcp_atlassian_confluence_get_page --page_id "$PAGE_ID"

# Compare with local content (manual verification)
```

### Detailed Content Verification

When working with large documents, it's critical to verify that all content was correctly transferred:

1. **Visual Content Inspection**:

   - Manually visit the Confluence page in your browser
   - Verify that all major sections appear correctly
   - Check formatting of complex elements (tables, code blocks, images)
   - Scroll through the entire document to ensure nothing is truncated

2. **Check for Content Truncation**:

   - Large documents may be truncated due to API limitations
   - Compare the total number of sections between local and Confluence versions
   - Verify that all the major headings from the local document appear in Confluence

3. **Formatting Conversion Verification**:
   - Tables should maintain their structure
   - Code blocks should maintain proper formatting
   - Headers should maintain proper hierarchy
   - Lists and nested lists should maintain correct indentation

If content appears to be truncated or improperly formatted:

```bash
# For large documents, consider splitting or chunking the content
# You can create child pages for major sections
mcp_mcp_atlassian_confluence_create_page --space_key "DT1" --title "Performance Optimization - Implementation Details" --content "$SECTION_CONTENT" --parent_id "$MAIN_PAGE_ID"
```

## Step 7: Handling API Limitations and Large Documents

When working with very large documents, you may encounter API limitations with Confluence. Here's how to handle these situations:

### Content Size Limitations

If your document is too large to sync in a single request:

1. **Check for Truncation**:
   After synchronizing, verify that all content was successfully transferred
2. **Split Content Strategy**:
   If content is truncated, consider splitting it into multiple pages

```bash
# Example of creating a parent page with overview content
mcp_mcp_atlassian_confluence_create_page --space_key "DT1" --title "Performance Optimization Strategy" --content "$OVERVIEW_CONTENT" --parent_id "$PARENT_ID"

# Example of creating a child page for detailed implementation
mcp_mcp_atlassian_confluence_create_page --space_key "DT1" --title "Performance Optimization - Implementation Details" --content "$IMPLEMENTATION_CONTENT" --parent_id "$MAIN_PAGE_ID"
```

### Extracting Sections for Partial Sync

For very large documents, you may need to extract and sync sections separately:

```bash
# Extract just the Executive Summary and Management Vision sections for a high-level page
grep -A50 "^## Executive Summary" ../workflows/proposals/proposal-performance-optimization-strategy.md > executive_summary.md
grep -A100 "^## Management Vision" ../workflows/proposals/proposal-performance-optimization-strategy.md >> executive_summary.md

# Create a high-level overview page
mcp_mcp_atlassian_confluence_create_page --space_key "DT1" --title "Performance Optimization Strategy - Overview" --content "$(<executive_summary.md)" --parent_id "$PARENT_ID"

# Extract the Technical Implementation details for a separate page
grep -A500 "^## Proposed Solution" ../workflows/proposals/proposal-performance-optimization-strategy.md > technical_details.md

# Create a technical details child page
mcp_mcp_atlassian_confluence_create_page --space_key "DT1" --title "Performance Optimization - Technical Details" --content "$(<technical_details.md)" --parent_id "$MAIN_PAGE_ID"
```

### Maintaining Metadata for Multiple Pages

When splitting a document across multiple Confluence pages, maintain extended metadata:

```markdown
<!--
Confluence Sync Metadata:
Page ID: 123456789
Space Key: DT1
Parent Page: Frontend/Technical Proposals
Last Synced: 2025-03-19 12:34
Sync Direction: local-to-confluence
Sync Status: in-sync
Additional Pages:
  - Technical Details: 987654321
  - Implementation Approach: 456789123
-->
```

This extended metadata ensures you can properly maintain all pages when the source document changes.

## Examples

### Initial Synchronization of a Proposal Document

```bash
# Get the current date and time
date "+%Y-%m-%d %H:%M"
# Output: 2025-03-19 12:34

# Add sync metadata to the document
# Edit the file to add metadata comments

# Find parent page ID for "Frontend/Technical Proposals"
mcp_mcp_atlassian_confluence_search --query "Frontend Technical Proposals" --limit 1
# Output: Found page with ID 87654321

# Create new page in Confluence
mcp_mcp_atlassian_confluence_create_page --space_key "DT1" --title "Performance Optimization Strategy" --content "$MARKDOWN_CONTENT" --parent_id "87654321"
# Output: Created page with ID 98765432

# Update local metadata with the new page ID and sync date
# Edit the file to update metadata comments
```

### Updating a Previously Synchronized Document

```bash
# Get current date and time
date "+%Y-%m-%d %H:%M"
# Output: 2025-03-20 15:22

# Get page ID from local metadata
# PAGE_ID=98765432 (extracted from file metadata)

# Update the page in Confluence with latest local content
mcp_mcp_atlassian_confluence_update_page --page_id "$PAGE_ID" --title "Performance Optimization Strategy" --content "$UPDATED_CONTENT"
# Output: Updated page successfully

# Update the sync metadata with new date and time
# Edit the file to update Last Synced date to 2025-03-20 15:22
```

### Pulling Changes from Confluence

```bash
# Get current date and time
date "+%Y-%m-%d %H:%M"
# Output: 2025-03-21 09:45

# Get page ID from local metadata
# PAGE_ID=98765432 (extracted from file metadata)

# Get the current content from Confluence
mcp_mcp_atlassian_confluence_get_page --page_id "$PAGE_ID"
# Output: Content received from Confluence

# Update local file with Confluence content (manual step)
# Be careful to preserve local metadata and internal links

# Update the sync metadata
# Edit the file to update:
# - Last Synced date to 2025-03-21 09:45
# - Sync Direction to confluence-to-local
# - Sync Status to in-sync
```

## Special Considerations for Document Adaptation

### Handling Local References

Local references should be preserved in the local version but adapted for Confluence:

1. Internal repository links should be removed or replaced with appropriate Confluence links
2. Local images may need to be uploaded separately to Confluence
3. Code blocks and formatting may require adjustment for proper Confluence rendering

### Managing Conflict Resolution

When both local and Confluence versions have changes:

1. Compare the differences (can be done manually or with diff tools)
2. Decide which changes to preserve from each version
3. Create a merged version that incorporates both sets of changes
4. Update both local and Confluence versions with the merged content
5. Set the sync status to "in-sync" after resolution

## Common Issues and Solutions

1. **Formatting Differences**:

   - Issue: Markdown formatting not rendering correctly in Confluence
   - Solution: Adjust formatting for compatibility, especially for tables, code blocks, and complex formatting

2. **Missing Images**:

   - Issue: Images referenced in Markdown not appearing in Confluence
   - Solution: Upload images separately to Confluence and update references

3. **Link Preservation**:

   - Issue: Local repository links becoming broken in Confluence
   - Solution: Modify links for Confluence compatibility or remove repository-specific links

4. **Merge Conflicts**:

   - Issue: Both versions have been modified independently
   - Solution: Use diff tools to identify changes and manually merge them

5. **API Limitations**:
   - Issue: Confluence API has limitations on content size or formatting
   - Solution: Break large documents into smaller sections or simplify complex formatting

## Using Confluence Structure Analysis

The [Confluence Structure Analysis](../architecture/confluence-structure.md) document provides valuable insights for synchronization decisions:

### Strategic Document Placement

Consult the structure analysis to determine the optimal placement for your document:

1. **Assess the Document Type**:

   - Is it a technical proposal? → Place in appropriate technical section
   - Is it process documentation? → Place in workflow/process section
   - Is it reference material? → Place in relevant reference section

2. **Follow Existing Patterns**:

   - Review the existing structure for similar documents
   - Follow the nesting pattern that matches your document type
   - Maintain consistent naming patterns with similar content

3. **Consider the Audience**:
   - Technical documents should go in technical sections (e.g., DEVELOPMENT)
   - Process documents should go in workflow sections

### Understanding Page Relationships

The analysis provides insights about:

1. **Parent-Child Relationships**:

   - Some sections (like Frontend) have specific parent pages
   - Follow these relationships when creating new content

2. **Related Content**:

   - Link your document to related content mentioned in the analysis
   - Consider cross-referencing with existing pages

3. **Navigation Patterns**:
   - Understand how users navigate the space
   - Place content where users would naturally look for it

### Example Decision Process

For a performance optimization proposal:

1. Identify it as a technical proposal related to frontend development
2. Consult the analysis to locate the Frontend section under DEVELOPMENT
3. Note that Frontend currently has a "Launcher Technical Improvement Roadmap" document
4. Place your performance optimization proposal alongside this document
5. Update your metadata to reflect this structure

## Related Documents

- [Confluence Guidelines](../rules/confluence-guidelines.md)
- [Documentation Standards](../methodology/documentation-standards.md)
- [Update Status](update-status.md)
- [Confluence Structure Analysis](../architecture/confluence-structure.md)

---

**Created**: 2025-03-19
