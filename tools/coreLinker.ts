import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';
import { exec } from 'child_process';
import { isMainRepo } from './checkMainRepo';

const fsExists = promisify(fs.exists);
const fsMkdir = promisify(fs.mkdir);
const fsReaddir = promisify(fs.readdir);
const fsLstat = promisify(fs.lstat);
const fsUnlink = promisify(fs.unlink);
const fsSymlink = promisify(fs.symlink);
const fsRmdir = promisify(fs.rmdir);
const fsWriteFile = promisify(fs.writeFile);
const execPromise = promisify(exec);

/**
 * Configuration for creating symbolic links from documentation core
 */
interface LinkConfig {
  /** Directories to create symbolic links for */
  directories: string[];
  /** Files to create symbolic links for */
  files: string[];
  /** Patterns for automatically finding files (e.g., tsconfig*) */
  patterns: string[];
}

/**
 * Project structure configuration
 */
interface ProjectStructureConfig {
  /** Directories to create in the target project */
  directories: {
    /** Directory name */
    name: string;
    /** Subdirectories to create */
    subdirectories?: string[];
    /** Whether to create a README.md file */
    readme?: boolean;
    /** Content for the README.md file */
    readmeContent?: string;
  }[];
}

/**
 * Default configuration for core linking
 */
const DEFAULT_LINK_CONFIG: LinkConfig = {
  directories: [
    'templates',
    'rules',
    'methodology',
    'commands',
    'tools',
    'navigation'
  ],
  files: [
    'README.md',
    'package.json',
    'package-lock.json',
    'CHANGELOG.md',
    'tsconfig.json',
    'tsconfig.app.json',
    'tsconfig.spec.json',
    'vitest.config.ts'
  ],
  patterns: ['tsconfig*.json']
};

/**
 * Default project structure configuration
 */
const DEFAULT_PROJECT_STRUCTURE: ProjectStructureConfig = {
  directories: [
    {
      name: 'workflows',
      subdirectories: ['tasks', 'proposals', 'decisions', 'archive'],
      readme: true,
      readmeContent: `# Workflows

This directory contains all work item documents organized by type.

## Structure

- \`tasks/\` - Task documentation and implementation plans
- \`proposals/\` - Formal proposals for changes and improvements
- \`decisions/\` - Architecture Decision Records (ADRs)
- \`ideas/\` - Initial ideas and concepts (including explorations)
- \`archive/\` - Archived work items

## Usage

Work items progress through these directories as they move through their lifecycle, typically following this flow:

1. Ideas → Ideas/Explorations → Proposals → Tasks → Archive

## References

- [Work Items Status Registry](../status.md)
- [Task Template](../templates/task-template.md)
- [Proposal Template](../templates/proposal-template.md)
- [Idea Template](../templates/idea-template.md)
- [Exploration Template](../templates/exploration-template.md)
`
    },
    {
      name: 'workflows/ideas',
      subdirectories: ['explorations'],
      readme: true,
      readmeContent: `# Ideas

This directory contains initial ideas and early concepts that may evolve into formal proposals.

## Structure

- \`explorations/\` - Research and exploration documents related to ideas

## Purpose

Ideas serve as the starting point for potential improvements, features, or changes. They capture 
initial thoughts and concepts that can be further researched through explorations and eventually
formalized into proposals.

## References

- [Ideas Backlog](ideas-backlog.md)
- [Idea Template](../../templates/idea-template.md)
- [Exploration Template](../../templates/exploration-template.md)
- [Work Items Status Registry](../../status.md)
`
    },
    {
      name: 'guides',
      readme: true,
      readmeContent: `# Guides

This directory contains practical guides and instructions for various aspects of the project.

## Purpose

These guides provide step-by-step instructions and best practices for common tasks and processes.

## Available Guides

*No guides available yet. Add your guides here.*

## Creating New Guides

When creating a new guide:

1. Use the naming convention \`guide-{topic}.md\`
2. Include clear steps with examples
3. Add the guide to this README.md file
4. Update the documentation map

## References

- [Documentation Map](../navigation/documentation-map.md)
- [Documentation Standards](../navigation/documentation-standards.md)
`
    },
    {
      name: 'reports',
      readme: true,
      readmeContent: `# Reports

This directory contains reports generated from documentation analysis and validation.

## Purpose

Reports provide insights into the documentation structure, coverage, and quality.

## Available Reports

*No reports available yet.*

## Generated Reports

The following reports are automatically generated:

- Link validation reports
- Coverage analysis
- Documentation metrics

## References

- [Validate Documentation](../commands/validate-documentation.md)
- [Documentation Map](../navigation/documentation-map.md)
`
    },
    {
      name: 'architecture',
      readme: true,
      readmeContent: `# Architecture Documentation

This directory contains architectural analysis and documentation.

## Purpose

Architecture documentation provides insights into the system's structure, components, and design decisions.

## Structure

*No architecture documents available yet.*

## Creating Architecture Documents

When documenting architecture:

1. Use the naming convention \`analysis-{topic}.md\`
2. Include diagrams where appropriate
3. Reference related decisions and proposals
4. Update the documentation map

## References

- [Documentation Map](../navigation/documentation-map.md)
- [Documentation Standards](../navigation/documentation-standards.md)
`
    }
  ]
};

/**
 * Creates a symbolic link, checking for existence of files
 */
async function createSymlink(
  sourcePath: string,
  targetPath: string,
  force: boolean = false
): Promise<boolean> {
  // Check if source exists
  if (!(await fsExists(sourcePath))) {
    console.log(`⏭️  Skipping "${sourcePath}" (file doesn't exist in core)`);
    return false;
  }

  // Check if target exists
  if (await fsExists(targetPath)) {
    const stats = await fsLstat(targetPath);

    if (stats.isSymbolicLink()) {
      console.log(`🔄 Updating link: "${targetPath}"`);
      await fsUnlink(targetPath);
    } else {
      if (!force) {
        console.log(
          `⚠️  "${targetPath}" already exists and is not a symbolic link`
        );
        console.log(`   Use --force to replace existing files`);
        return false;
      }
      console.log(`🗑️  Removing existing file: "${targetPath}"`);

      if (stats.isDirectory()) {
        await removeDirectory(targetPath);
      } else {
        await fsUnlink(targetPath);
      }
    }
  }

  // Create directory if needed
  const targetDir = path.dirname(targetPath);
  if (!(await fsExists(targetDir))) {
    await fsMkdir(targetDir, { recursive: true });
  }

  // Create symbolic link
  console.log(`🔗 Creating link: "${sourcePath}" -> "${targetPath}"`);

  try {
    const symlinkType =
      process.platform === 'win32'
        ? fs.statSync(sourcePath).isDirectory()
          ? 'junction'
          : 'file'
        : undefined;

    await fsSymlink(sourcePath, targetPath, symlinkType);
    return true;
  } catch (error: any) {
    console.error(`❌ Error creating link: ${error.message}`);
    return false;
  }
}

/**
 * Recursively removes a directory
 */
async function removeDirectory(dirPath: string): Promise<void> {
  if (!(await fsExists(dirPath))) return;

  const files = await fsReaddir(dirPath);

  for (const file of files) {
    const curPath = path.join(dirPath, file);
    const stats = await fsLstat(curPath);

    if (stats.isDirectory()) {
      await removeDirectory(curPath);
    } else {
      await fsUnlink(curPath);
    }
  }

  await fsRmdir(dirPath);
}

/**
 * Finds files by pattern in a directory
 */
async function findFilesByPattern(
  directory: string,
  pattern: string
): Promise<string[]> {
  if (!(await fsExists(directory))) return [];

  const files = await fsReaddir(directory);
  const regex = new RegExp(`^${pattern.replace('*', '.*')}$`);

  return files
    .filter((file) => regex.test(file))
    .map((file) => path.join(directory, file));
}

/**
 * Creates a project directory structure
 */
async function createProjectStructure(
  targetDir: string,
  config: ProjectStructureConfig = DEFAULT_PROJECT_STRUCTURE
): Promise<void> {
  console.log('\n📂 Creating project directory structure:');

  let createdDirs = 0;
  let createdFiles = 0;

  for (const dir of config.directories) {
    const dirPath = path.join(targetDir, dir.name);

    // Create main directory if it doesn't exist
    if (!(await fsExists(dirPath))) {
      console.log(`📁 Creating directory: ${dirPath}`);
      await fsMkdir(dirPath, { recursive: true });
      createdDirs++;
    }

    // Create README.md if specified
    if (dir.readme) {
      const readmePath = path.join(dirPath, 'README.md');
      if (!(await fsExists(readmePath))) {
        console.log(`📄 Creating README: ${readmePath}`);
        await fsWriteFile(readmePath, dir.readmeContent || `# ${dir.name}\n`);
        createdFiles++;
      }
    }

    // Create subdirectories if specified
    if (dir.subdirectories && dir.subdirectories.length > 0) {
      for (const subdir of dir.subdirectories) {
        const subdirPath = path.join(dirPath, subdir);
        if (!(await fsExists(subdirPath))) {
          console.log(`📁 Creating subdirectory: ${subdirPath}`);
          await fsMkdir(subdirPath, { recursive: true });
          createdDirs++;

          // Create empty README in subdirectory
          const subReadmePath = path.join(subdirPath, 'README.md');
          if (!(await fsExists(subReadmePath))) {
            await fsWriteFile(
              subReadmePath,
              `# ${subdir}\n\nThis directory contains ${subdir} documents.\n`
            );
            createdFiles++;
          }
        }
      }
    }
  }

  console.log(
    `✅ Created ${createdDirs} directories and ${createdFiles} files`
  );
}

/**
 * Creates a .gitignore file in the target directory
 */
async function createGitignore(targetDir: string): Promise<void> {
  const gitignorePath = path.join(targetDir, '.gitignore');

  console.log(`📄 Creating .gitignore: ${gitignorePath}`);

  const gitignoreContent = `# Node modules
node_modules/

# Generated reports
reports/

# Workflows
workflows/

# Logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# IDE files
.idea/
.vscode/
*.swp
*.swo

# OS files
.DS_Store
Thumbs.db
`;

  await fsWriteFile(gitignorePath, gitignoreContent);
}

/**
 * Runs npm install in the target directory
 */
async function runNpmInstall(targetDir: string): Promise<void> {
  console.log(`🔄 Running npm install in ${targetDir}`);

  try {
    const { stdout, stderr } = await execPromise('npm install', {
      cwd: targetDir
    });

    if (stdout) console.log(stdout);
    if (stderr) console.error(stderr);

    console.log('✅ npm install completed successfully');
  } catch (error: any) {
    console.error(`❌ Error running npm install: ${error.message}`);
    if (error.stdout) console.log(error.stdout);
    if (error.stderr) console.error(error.stderr);
  }
}

/**
 * Creates a status.md file if it doesn't exist
 */
async function createStatusFile(targetDir: string): Promise<void> {
  const statusPath = path.join(targetDir, 'status.md');

  if (await fsExists(statusPath)) {
    return;
  }

  console.log(`📄 Creating status registry: ${statusPath}`);

  const statusContent = `# Work Items Status Registry

## Purpose

This registry provides a centralized view of all active work items in the project documentation, including tasks, proposals, explorations, and ideas. It helps team members understand the current state of work and make informed decisions about what to work on next.

## Registry Maintenance Guidelines

1. **Update Frequency**: This registry should be updated:

   - When new work items are created
   - When work items change status
   - When work items are completed or archived
   - During regular weekly documentation reviews

2. **Responsibility**: The Documentation Team is responsible for keeping this registry up-to-date.

3. **Status Tracking**: Each item should include:
   - Current status
   - Last updated date
   - Owner/responsible team
   - Priority level
   - Complexity rating
   - Dependencies (if any)

## Active Tasks

| Task ID | Title | Status | Priority | Complexity | Owner | Dependencies | Last Updated |
| ------- | ----- | ------ | -------- | ---------- | ----- | ------------ | ------------ |

## Active Proposals

| Proposal ID | Title | Status | Priority | Impact | Owner | Dependencies | Last Updated |
| ----------- | ----- | ------ | -------- | ------ | ----- | ------------ | ------------ |

## Active Explorations

| Exploration ID | Title | Status | Focus Area | Owner | Related Items | Last Updated |
| -------------- | ----- | ------ | ---------- | ----- | ------------- | ------------ |

## New Ideas

| Idea ID | Title | Status | Category | Proposed By | Potential Impact | Last Updated |
| ------- | ----- | ------ | -------- | ----------- | ---------------- | ------------ |

## Work Item Metrics

### Status Distribution

- In Progress: 0
- Under Review: 0
- Planned: 0
- Blocked: 0

### Priority Distribution

- High: 0
- Medium: 0
- Low: 0

### Team Distribution

- Documentation Team: 0

## Dependencies Graph

\`\`\`mermaid
graph TD
    %% This graph will be populated as work items are added
    A[Example] --> B[Example 2]
\`\`\`

## Next Actions

1. Items ready for immediate pickup:

   - None currently

2. Blocked items requiring attention:

   - None currently

3. Items needing review:
   - None currently

## References

- [Report Workflows](./commands/report-workflows.md)
- [Documentation Map](./navigation/documentation-map.md)
- [Documentation Guidelines](./methodology/documentation-guidelines.md)
- [Task Template](./templates/task-template.md)

---

**Last Updated**: ${new Date().toISOString().split('T')[0]}
`;

  await fsWriteFile(statusPath, statusContent);
}

/**
 * Creates ideas-backlog.md file if it doesn't exist
 */
async function createIdeasBacklogFile(targetDir: string): Promise<void> {
  const backlogPath = path.join(targetDir, 'workflows/ideas/ideas-backlog.md');

  if (await fsExists(backlogPath)) {
    return;
  }

  console.log(`📄 Creating ideas backlog: ${backlogPath}`);

  const backlogContent = `# Ideas Backlog

## Overview

This document serves as a central registry of all ideas in the project before their transformation into formal proposals. Ideas in this registry can be at different stages of development: from initial concepts to ideas ready for formalization as proposals.

## Idea Statuses

- **New** - initial idea that requires research
- **In analysis** - idea for which research and analysis are being conducted
- **Ready for proposal** - idea that has passed analysis and is ready to be formulated as a proposal
- **Rejected** - idea that was rejected for certain reasons
- **Transformed** - idea that has been transformed into a formal proposal

## Impact/Effort Matrix

For prioritizing ideas, the Impact/Effort matrix is used:

| Effort \\ Impact | Low Impact | High Impact |
| --------------- | ---------- | ----------- |
| **Low Effort**  | Quick Wins | Optimal     |
| **High Effort** | Avoid      | Strategic   |

## Architecture Ideas

| ID      | Name | Status | Priority | Complexity | Quadrant  | Details |
| ------- | ---- | ------ | -------- | ---------- | --------- | ------- |

## Development Workflow Ideas

| ID     | Name | Status | Priority | Complexity | Quadrant | Details |
| ------ | ---- | ------ | -------- | ---------- | -------- | ------- |

## Recently Updated Ideas

| ID | Name | Status | Priority | Complexity | Quadrant | Added Date |
| -- | ---- | ------ | -------- | ---------- | -------- | ---------- |

## Ideas Transformed into Proposals

_No ideas have been transformed into proposals yet._

## Usage Instructions

### Adding a New Idea

1. Create a new file in the format \`idea-YYYY-MM-{topic}.md\` in the \`/docs/workflows/ideas/\` directory based on the [idea template](../../templates/idea-template.md)
2. Fill in all necessary sections of the document
3. Add the idea to the appropriate category in this registry with a unique ID
4. Add the idea to the "Recently Updated Ideas" section

### Updating Idea Status

1. Update the idea document with new information and change the status
2. Update the idea status in this registry
3. Update the entry in the "Recently Updated Ideas" section

### Transforming an Idea into a Proposal

1. Change the idea status to "Transformed"
2. Create a new proposal based on the idea in the format \`proposal-{topic}.md\` in the \`/docs/workflows/proposals/\` directory
3. Add an entry to the "Ideas Transformed into Proposals" section
4. Add a link to the idea in the proposal document

## Related Documents

- [Idea Template](../../templates/idea-template.md)
- [Documentation Map](../../navigation/documentation-map.md)
- [Proposals](../proposals/)
- [Tasks](../tasks/)

---

**Last Updated**: ${new Date().toISOString().split('T')[0]}

## References

- [Create Exploration](../../commands/create-exploration.md)
- [Create Idea](../../commands/create-idea.md)
- [Create Proposal](../../commands/create-proposal.md)
- [Work Items Status Registry](../../status.md)
`;

  // Ensure directory exists
  const dirPath = path.dirname(backlogPath);
  if (!(await fsExists(dirPath))) {
    await fsMkdir(dirPath, { recursive: true });
  }

  await fsWriteFile(backlogPath, backlogContent);
}

/**
 * Prints the help message
 */
function printHelp(): void {
  console.log(`
Documentation Core Manager - Setup and create documentation

Usage: npm run docs:setup -- [options] [target-path]

Options:
  --check-only       Just check if running in main repo and exit
  --create-structure Create project structure without symlinks
  --force            Replace existing files without prompting
  --ignore-check     Skip checking if running in main repository
  --install-deps     Run npm install in the target directory after setup
  --help             Show this help message

Examples:
  npm run docs:setup -- ../my-project/docs     Create symlinks in target directory
  npm run docs:setup -- --create-structure     Create directory structure without symlinks
  npm run docs:setup -- --check-only           Check if running in main repo
  npm run docs:setup -- --install-deps         Create symlinks and run npm install
  npm run docs:setup -- --force --ignore-check Force replace existing files, skip repo check
  `);
}

/**
 * Main function for managing the documentation core
 */
async function docsManager(): Promise<void> {
  const args = process.argv.slice(2);

  // Handle help command
  if (args.includes('--help')) {
    printHelp();
    return;
  }

  // Check if only checking for main repo
  if (args.includes('--check-only')) {
    const mainRepo = await isMainRepo();
    if (mainRepo) {
      console.log('✅ Running in main documentation repository');
      process.exit(0);
    } else {
      console.error(
        '❌ Error: This script should only be run in the main documentation repository'
      );
      console.error('   Current package.json is a symbolic link');
      process.exit(1);
    }
    return;
  }

  // Process arguments
  const options = {
    force: args.includes('--force'),
    setupProject: true,
    installDeps: args.includes('--install-deps'),
    checkMainRepo: !args.includes('--ignore-check'),
    createStructureOnly: args.includes('--create-structure')
  };

  // If --create-structure is used without a target path, use current directory
  let targetPath = args.filter((arg) => !arg.startsWith('--'))[0];

  if (!targetPath && options.createStructureOnly) {
    targetPath = '.';
  } else if (!targetPath) {
    console.error('❌ Error: No target directory specified');
    console.log('Use npm run docs:setup -- --help for usage information');
    process.exit(1);
  }

  // Check if running in main repo
  if (options.checkMainRepo) {
    const mainRepo = await isMainRepo();
    if (!mainRepo) {
      console.error(
        '❌ Error: This script should only be run in the main documentation repository'
      );
      console.error('   Current package.json is a symbolic link');
      process.exit(1);
    }
  }

  // Process the command
  try {
    if (options.createStructureOnly) {
      // Create project structure only
      console.log('📋 Creating project structure only (no symlinks)');
      await createProjectStructure(targetPath);
      await createStatusFile(targetPath);
      await createIdeasBacklogFile(targetPath);
      await createGitignore(targetPath);

      if (options.installDeps) {
        await runNpmInstall(targetPath);
      }
    } else {
      // Create full setup with symlinks
      await linkCore(targetPath, DEFAULT_LINK_CONFIG, {
        force: options.force,
        setupProject: options.setupProject,
        installDeps: options.installDeps,
        checkMainRepo: false // Already checked above
      });
    }
  } catch (error: any) {
    console.error(`❌ Error: ${error.message}`);
    process.exit(1);
  }
}

/**
 * Main function for creating symbolic links
 */
async function linkCore(
  targetDir: string,
  config: LinkConfig = DEFAULT_LINK_CONFIG,
  options: {
    force: boolean;
    setupProject: boolean;
    installDeps: boolean;
    checkMainRepo: boolean;
  } = {
    force: false,
    setupProject: true,
    installDeps: false,
    checkMainRepo: true
  }
): Promise<void> {
  // Check if running in main repo if required
  if (options.checkMainRepo) {
    const mainRepo = await isMainRepo();
    if (!mainRepo) {
      console.error(
        '❌ Error: This script should only be run in the main documentation repository'
      );
      console.error('   Current package.json is a symbolic link');
      process.exit(1);
    }
  }

  console.log('🔍 Setting up symbolic links from documentation core');

  const coreDir = process.cwd();
  const targetPath = path.resolve(targetDir);

  console.log(`📁 Core: ${coreDir}`);
  console.log(`🎯 Target: ${targetPath}`);

  // Create target directory if it doesn't exist
  if (!(await fsExists(targetPath))) {
    console.log(`📂 Creating target directory: ${targetPath}`);
    await fsMkdir(targetPath, { recursive: true });
  }

  // Set up project structure if requested
  if (options.setupProject) {
    await createProjectStructure(targetPath);
    await createStatusFile(targetPath);
    await createIdeasBacklogFile(targetPath);

    // Create .gitignore file
    await createGitignore(targetPath);
  }

  // Create links for directories
  console.log('\n📁 Creating links for directories:');
  let dirCount = 0;
  for (const dir of config.directories) {
    const success = await createSymlink(
      path.join(coreDir, dir),
      path.join(targetPath, dir),
      options.force
    );
    if (success) dirCount++;
  }

  // Create links for files
  console.log('\n📄 Creating links for files:');
  let fileCount = 0;
  for (const file of config.files) {
    const success = await createSymlink(
      path.join(coreDir, file),
      path.join(targetPath, file),
      options.force
    );
    if (success) fileCount++;
  }

  // Automatic pattern search
  console.log('\n🔍 Searching for additional files by patterns:');
  let patternCount = 0;

  for (const pattern of config.patterns) {
    const files = await findFilesByPattern(coreDir, pattern);
    for (const file of files) {
      const fileName = path.basename(file);

      // Check if file hasn't already been added
      if (!config.files.includes(fileName)) {
        const success = await createSymlink(
          file,
          path.join(targetPath, fileName),
          options.force
        );
        if (success) patternCount++;
      }
    }
  }

  // Run npm install if requested
  if (options.installDeps) {
    await runNpmInstall(targetPath);
  }

  // Summary
  console.log('\n✅ Setting up documentation complete!');
  console.log(`📊 Summary:`);
  console.log(`  - Directories linked: ${dirCount}`);
  console.log(`  - Files linked: ${fileCount}`);
  console.log(`  - Pattern files linked: ${patternCount}`);

  console.log(
    '\n💡 For using documentation in your project, add these scripts to package.json:'
  );
  console.log(
    JSON.stringify(
      {
        scripts: {
          'docs:validate': 'cd docs && npm run docs:validate-links',
          'docs:create-task': 'cd docs && npm run docs:create-task'
        }
      },
      null,
      2
    )
  );
}

// Run the script if called directly
if (require.main === module) {
  docsManager().catch((error: any) => {
    console.error(`❌ Error: ${error.message}`);
    process.exit(1);
  });
}

export {
  linkCore,
  createProjectStructure,
  createStatusFile,
  createGitignore,
  runNpmInstall,
  DEFAULT_LINK_CONFIG,
  DEFAULT_PROJECT_STRUCTURE
};
