# Changelog

All notable changes to the Pythia documentation system will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [2025-08-09]

### Added

- New command: `commands/manage-task.md` — lightweight workflow to manage tasks (gates, [H] convention)
- New command: `commands/create-context.md` — minimal context creation with placement/template/links/validation
- Human-only checkbox convention `[H]` documented in `templates/task-template.md` and related commands
- AI review outputs to Memory Bank (JSON + Markdown) documented in `commands/analyze-ai-solutions.md`

### Changed

- Unified task status model and gates in `commands/update-status.md` and `templates/task-template.md`
- Enhanced `templates/task-template.md` with Repository/Branch/PR/LLM Model fields; testing & coverage gates; reference to `Manage Task`
- Moved Memory Bank and analysis artifacts to `.pythia/memory-bank/` across documentation:
  - `commands/create-task.md`
  - `templates/task-template.md`
  - `commands/analyze-ai-solutions.md`
  - `methodology/context-documentation.md`
  - `commands/memory-bank-management.md`
- `commands/create-task.md`: added Context-First intake and branch `[H]` guidance
- `tools/validateDocumentQuality.ts`: tasks now require `Implementation Plan` section

### Migration Notes

- If your project used `.memory-bank/`, move its contents to `.pythia/memory-bank/`
- Update any custom scripts or CI steps referencing `.memory-bank/` to the new path

## [2025-07-30]

### Added

- Enhanced context documentation methodology with task integration
- Added LLM self-check guidelines to response-start rules
- Integrated context documents with task creation workflow

### Changed

- Updated create-task command to include context document integration
- Enhanced task template with context analysis sections
- Improved task management workflow with context-driven approach
- Updated context documentation methodology with validation standards
- Made Pythia completely generic by removing all project-specific references

### Removed

- Cleaned up project-specific examples in workspace integration guide

## [2025-03-24]

### Added

- Created new command documentation files:
  - `commands/create-command.md`
  - `commands/setup.md`
  - `commands/update-command.md`
- Added new methodology document for context documentation (`methodology/context-documentation.md`)
- Added guide for installing Pythia (`guides/installing-pythia.md`)
- Added command template (`templates/command-template.md`)
- Added configuration file (`config.json`)
- Added new tool for core installation (`tools/installCore.ts`)
- Created concept documentation (`CONCEPT.md`)

### Changed

- Enhanced core linker tool functionality (`tools/coreLinker.ts`)
- Updated README.md with new project information

### Removed

- Removed architecture README.md (will be replaced with new structure)

## [2025-03-22]

### Added

- Created command documentation for generating PR descriptions (`./commands/gen-pr-description.md`)

### Changed

- Updated task template with improved formatting and additional fields (`./templates/task-template.md`)
- Enhanced create-task command documentation (`./commands/create-task.md`)

## [2025-03-14]

### Changed

- Added new tasks and ideas to the status report
- Updated metrics and visualizations in the workflows report

## [2025-03-13]

### Added

- Created new command for generating workflows reports
- Added more comprehensive reporting capabilities for work items
- Added decision tracking to workflows reporting

### Changed

- Renamed workflows status tracking files to better reflect their purpose
- Improved workflow reporting with better metrics and visualization
- Enhanced dependencies tracking in workflow reports
- Updated all cross-references to renamed files

### Fixed

- Fixed inconsistent references in documentation map
- Corrected file paths in tool configuration files
- Unified terminology for workflow status tracking

## [2025-03-12]

### Added

- Implemented ideas management system with templates and workflow documentation
- Added exploration document system for idea research
- Created new commands for idea and exploration document generation
- Enhanced documentation automation with improved test coverage and map update features
- Added Templates Guide for structured document creation
- Added "Decision Criteria Checklist" to exploration completion process
- Created guide on using LLM for effective documentation workflow

### Changed

- Improved validation and archiving scripts with better edge case handling
- Reorganized documentation structure for better navigation
- Enhanced documentation workflow integration between proposals and ideas
- Translated documentation from Ukrainian to English where needed

### Fixed

- Fixed various broken links and references throughout documentation
- Updated documentation map to ensure complete coverage
- Fixed bidirectional links between related documents

### Removed

- Removed duplicate and obsolete documentation after restructuring
- Removed example entries from ideas backlog

## [2025-03-11]

### Added

- Created task archiving system with the following components:
  - Added task archiving rules
  - Created command documentation for task archiving
  - Implemented task archiving TypeScript script
  - Added "Archived Tasks" section to the Documentation Map
  - Updated task template with archiving information
- Added instructions for manual error fixing by LLMs
- Moved documentation changelog to a standardized format
- Created command documentation for task creation
- Created command documentation for proposal creation
- Created command documentation for updating Summary Documents Registry
- Created command documentation for updating Changelog
- Added tests for documentation validation scripts
- Added npm script for testing documentation validation tools

### Changed

- Updated task template to include archiving information and guidelines
- Updated Documentation Map to reference task archiving documents and include an Archived Tasks section
- Fixed incorrect links in various documents
- Removed links to non-existent files
- Modified scripts in `package.json` to store documentation reports in `/reports` directory
- Updated documentation guidelines with reference to the new location of changelog
- Updated README.md with improved directory structure and references to validation tools
- Renamed documentation files to follow command naming convention
- Improved linkValidator.ts script to avoid adding duplicate references and to handle formatting better
- Modified documentation scripts to ignore specific files that contain example references
- Improved reference format in documentation files by removing redundant "See also:" prefix
- Enhanced linkValidator.ts to extract document titles from headings for better link text
- Enhanced `linkValidator.ts` script to use Title Case for reciprocal links
- Applied Title Case formatting to links in all documentation files

### Removed

- Removed outdated changelog file (replaced with standardized format)

## [2025-03-10]

### Added

- Created central navigation document for project documentation
- Created documentation standards and guidelines

### Changed

- Added progress tracking and updated implementation status in documentation structure

## [2025-03-09]

### Added

- Created analysis of current API integration approaches

## [2025-03-08]

### Added

- Created template for task documentation
- Created template for technical debt assessment
- Created documentation guidelines

## Quarterly Summary - Q1 2025

### Major Accomplishments

- Established standardized documentation structure
- Created task and technical debt templates
- Implemented documentation navigation system
- Created initial architecture analysis documents
- Established technical debt tracking system
- Implemented documentation automation tools for link validation and coverage checking
- Created LLM guide for documentation automation
- Added npm scripts for documentation validation
- Improved documentation integrity with automated validation

## References

---

**Last Updated**: 2025-03-24
