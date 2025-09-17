/**
 * Task Archiving Script
 *
 * This script automates the process of archiving completed tasks in the project.
 * It identifies completed tasks, verifies they meet archiving criteria, and moves them
 * to the archive directory with appropriate modifications.
 *
 * Usage:
 * ts-node scripts/documentation/archiveTasks.ts [--force] [--dry-run] [--check-age]
 *
 * Options:
 *   --force: Archive tasks regardless of the completion date or success criteria
 *   --dry-run: Show what would be archived without making changes
 *   --check-age: Only archive tasks that have been completed for at least ARCHIVE_AGE_DAYS
 *
 * @todo Potential Third-Party Library Improvements:
 *
 * 1. Date Handling with date-fns
 *    - Install: npm install date-fns
 *    - Benefits:
 *      - More robust date parsing and formatting
 *      - Simplified date comparison and duration calculations
 *      - Timezone-aware operations
 *      - Relative time calculations (e.g., "completed 7 days ago")
 *    - Example usage for age checking:
 *      ```typescript
 *      import { parseISO, differenceInDays, format } from 'date-fns';
 *
 *      // Extract completion date from task content
 *      const completionDateMatch = taskContent.match(/Completed on: (\d{4}-\d{2}-\d{2})/);
 *      if (completionDateMatch) {
 *        const completionDate = parseISO(completionDateMatch[1]);
 *        const daysSinceCompletion = differenceInDays(new Date(), completionDate);
 *
 *        if (daysSinceCompletion >= ARCHIVE_AGE_DAYS) {
 *          console.log(`Task completed ${daysSinceCompletion} days ago, eligible for archiving`);
 *          // Archive task
 *        }
 *      }
 *      ```
 *
 * 2. File Operations with fs-extra
 *    - Install: npm install fs-extra @types/fs-extra
 *    - Benefits:
 *      - Promise-based API for simpler async code
 *      - Additional utility methods for file operations
 *      - Methods like ensureDir, move, copy that handle edge cases
 *      - Directory copying with filtering
 *    - Example usage for archiving:
 *      ```typescript
 *      import * as fse from 'fs-extra';
 *
 *      // Ensure archive directory exists
 *      await fse.ensureDir(ARCHIVE_DIR);
 *
 *      // Move file to archive with proper path handling
 *      const archivePath = path.join(ARCHIVE_DIR, path.basename(taskFile));
 *      await fse.move(taskFile, archivePath, { overwrite: true });
 *
 *      // Update document content
 *      const content = await fse.readFile(archivePath, 'utf8');
 *      const updatedContent = addArchiveHeader(content);
 *      await fse.writeFile(archivePath, updatedContent);
 *      ```
 */

import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Configuration
const ARCHIVE_AGE_DAYS = 7; // Number of days a task must be completed before archiving if using --check-age
const TASKS_DIR = 'workflows/tasks';
const ARCHIVE_DIR = 'workflows/archive/tasks';
const DOCUMENTATION_MAP = 'navigation/documentation-map.md';

// Command line arguments
const FORCE_ARCHIVE = process.argv.includes('--force');
const DRY_RUN = process.argv.includes('--dry-run');
const CHECK_AGE = process.argv.includes('--check-age');

/**
 * Find all tasks marked as "Completed" in the tasks directory
 */
async function findCompletedTasks(): Promise<string[]> {
  try {
    console.log(`Searching for completed tasks in ${TASKS_DIR}`);

    // First, list all markdown files in the tasks directory
    const { stdout: allFiles } = await execAsync(
      `find ${TASKS_DIR} -type f -name "*.md"`
    );
    const files = allFiles.split('\n').filter(Boolean);
    console.log(`Found ${files.length} total task files:`);
    files.forEach((file) => console.log(`- ${file}`));

    // Now check each file manually for the status
    const completedTasks: string[] = [];
    for (const file of files) {
      try {
        const content = fs.readFileSync(file, 'utf8');
        if (content.includes('**Status**: Completed')) {
          console.log(`Found completed task: ${file}`);
          completedTasks.push(file);
        } else {
          console.log(`Task not completed: ${file}`);
          // Log what status it actually has
          const statusMatch = content.match(/\*\*Status\*\*:\s*(.*?)$/m);
          if (statusMatch) {
            console.log(`  Status is: ${statusMatch[1].trim()}`);
          } else {
            console.log(`  No status found`);
          }
        }
      } catch (error) {
        console.error(`Error reading file ${file}:`, error);
      }
    }

    return completedTasks;
  } catch (error) {
    console.error('Error finding completed tasks:', error);
    return [];
  }
}

/**
 * Check if all success criteria are marked as completed in the task
 */
function allSuccessCriteriaCompleted(taskContent: string): boolean {
  // Extract the Success Criteria section
  const successCriteriaMatch = taskContent.match(
    /## Success Criteria\s+([\s\S]*?)(?=\n##|$)/
  );
  if (!successCriteriaMatch) return false;

  const successCriteriaSection = successCriteriaMatch[1];

  // Check if all criteria have a checkmark
  const criteriaLines = successCriteriaSection
    .split('\n')
    .filter((line) => line.trim().startsWith('-'));
  if (criteriaLines.length === 0) return false;

  return criteriaLines.every((line) => line.includes('✅'));
}

/**
 * Check if the task has a no-archive tag
 */
function hasNoArchiveTag(taskContent: string): boolean {
  return (
    taskContent.includes('no-archive') || taskContent.includes('NO_ARCHIVE')
  );
}

/**
 * Get the last modified date of a file
 */
async function getLastModifiedDate(filePath: string): Promise<Date> {
  try {
    const { stdout } = await execAsync(`stat -f "%m" "${filePath}"`);
    return new Date(parseInt(stdout.trim()) * 1000);
  } catch (error) {
    console.error(`Error getting last modified date for ${filePath}:`, error);
    return new Date(); // Return current date as fallback
  }
}

/**
 * Archive a task by copying it to the archive directory and modifying it
 */
async function archiveTask(taskPath: string): Promise<void> {
  if (DRY_RUN) {
    console.log(`[DRY RUN] Would archive task: ${taskPath}`);
    return;
  }

  const taskFilename = path.basename(taskPath);
  const archivePath = path.join(ARCHIVE_DIR, taskFilename);

  console.log(`Archiving task: ${taskPath} to ${archivePath}`);

  // Ensure archive directory exists
  if (!fs.existsSync(ARCHIVE_DIR)) {
    fs.mkdirSync(ARCHIVE_DIR, { recursive: true });
  }

  // Copy to archive
  fs.copyFileSync(taskPath, archivePath);

  // Modify archived file
  let content = fs.readFileSync(archivePath, 'utf8');

  // Add ARCHIVED prefix to title
  content = content.replace(/^# /, '# ARCHIVED: ');

  // Add Archive Date
  const today = new Date().toISOString().split('T')[0];
  content = content.replace(
    /(\*\*Date Created\*\*:.+)/,
    `$1\n**Archive Date**: ${today}  `
  );

  // Add Archive Note section before References
  const archiveNote = `\n## Archive Note\n\nThis task was archived on ${today} after successful completion of all objectives.\nAll references to this task have been updated to point to this archived version.\n\n`;

  if (content.includes('## References')) {
    content = content.replace(/## References/, `${archiveNote}## References`);
  } else {
    content += `\n${archiveNote}`;
  }

  // Write changes
  fs.writeFileSync(archivePath, content);

  console.log(`Task ${taskFilename} archived to ${archivePath}`);
}

/**
 * Update all references to the task in other documents
 */
async function updateReferences(taskPath: string): Promise<void> {
  const taskFilename = path.basename(taskPath);
  console.log(`Checking references to ${taskFilename}`);

  try {
    // Find all references to this task in the documentation
    const { stdout: grepOutput } = await execAsync(
      `grep -r "\\[.*\\](.*${taskFilename})" . --include="*.md"`
    );

    const references = grepOutput.split('\n').filter(Boolean);

    for (const reference of references) {
      const [filePath, ...rest] = reference.split(':');
      const line = rest.join(':');

      // Skip if this is the archived file itself
      if (filePath === path.join(ARCHIVE_DIR, taskFilename)) continue;

      // Read file content
      const content = fs.readFileSync(filePath, 'utf8');

      // Update reference
      const taskBasename = taskFilename.replace('.md', '');
      const relativePathToTasks = path.relative(
        path.dirname(filePath),
        TASKS_DIR
      );
      const relativePathToArchive = path.relative(
        path.dirname(filePath),
        ARCHIVE_DIR
      );

      // Pattern to match the link to the task
      const oldPattern = new RegExp(
        `\\[([^\\]]*)\\](\\(${relativePathToTasks.replace(
          /\//g,
          '\\/'
        )}\/${taskFilename.replace('.', '\\.')}\\))`,
        'g'
      );
      const newPattern = `[$1 (Archived)](${relativePathToArchive}/${taskFilename})`;

      const newContent = content.replace(oldPattern, newPattern);

      // Only write if changes were made
      if (newContent !== content) {
        fs.writeFileSync(filePath, newContent);
        console.log(`Updated references in ${filePath}`);
      }
    }
  } catch (error) {
    // If grep fails because no references were found, that's okay
    if (!String(error).includes('exit code: 1')) {
      console.error(`Error updating references for ${taskPath}:`, error);
    }
  }
}

/**
 * Update the Documentation Map to move the task from active to archived
 */
async function updateDocumentationMap(taskPath: string): Promise<void> {
  if (DRY_RUN) {
    console.log(`[DRY RUN] Would update Documentation Map for: ${taskPath}`);
    return;
  }

  const taskFilename = path.basename(taskPath);

  if (!fs.existsSync(DOCUMENTATION_MAP)) {
    console.warn(`Documentation Map not found at ${DOCUMENTATION_MAP}`);
    return;
  }

  let content = fs.readFileSync(DOCUMENTATION_MAP, 'utf8');

  // Check if Archived Tasks section exists, create if not
  if (!content.includes('## Archived Tasks')) {
    // Add Archived Tasks section before References section
    const newSection =
      '## Archived Tasks\n\n| Document | Description |\n| -------- | ----------- |\n\n';
    if (content.includes('## References')) {
      content = content.replace('## References', `${newSection}## References`);
    } else if (content.includes('## Maintenance')) {
      content = content.replace(
        '## Maintenance',
        `${newSection}## Maintenance`
      );
    } else {
      content += `\n${newSection}`;
    }

    fs.writeFileSync(DOCUMENTATION_MAP, content);
    content = fs.readFileSync(DOCUMENTATION_MAP, 'utf8');
  }

  // Find task entry in Tasks section
  const taskBasename = taskFilename.replace('.md', '');

  // More robust pattern to find the task in the Tasks section table
  // This pattern works better with multiline entries and various formatting
  const taskPattern = new RegExp(
    `(\\| \\[[^\\]]*${escapeRegExp(
      taskBasename
    )}[^\\]]*\\]\\([^)]*\\) \\| [^|]* \\|(?:\\n)?)`,
    'g'
  );

  const taskMatch = content.match(taskPattern);

  if (taskMatch && taskMatch.length > 0) {
    // Get the full line
    const fullTaskLine = taskMatch[0];

    // Extract the task name and description
    const linkMatch = fullTaskLine.match(/\| \[(.*?)\]\((.*?)\) \| (.*?) \|/);

    if (linkMatch) {
      const [_, linkText, linkPath, description] = linkMatch;

      // Create the updated entry for archive with correct formatting
      const relativePathToArchive = path.relative(
        path.dirname(DOCUMENTATION_MAP),
        ARCHIVE_DIR
      );

      // Format the archived entry to match the table structure
      const archivedEntry = `| [${linkText} (Archived)](${relativePathToArchive}/${taskFilename}) | ${description} (Archived) |`;

      // Remove from Tasks section - make sure to handle the line break correctly
      content = content.replace(fullTaskLine, '');

      // Ensure the Tasks table still looks good - remove any double newlines that might have been created
      content = content.replace(/\n\n+/g, '\n\n');

      // Find the Archived Tasks section - this is a more precise pattern
      const archivedSectionPattern =
        /## Archived Tasks\s+\|\s+Document\s+\|\s+Description\s+\|\s+\|\s+[-]+\s+\|\s+[-]+\s+\|([\s\S]*?)(?=\n##|$)/;

      const archivedSectionMatch = content.match(archivedSectionPattern);

      if (archivedSectionMatch) {
        // Insert the new archived entry at the start of the table (after the header)
        const archivedHeader = archivedSectionMatch[0]
          .split('\n')
          .slice(0, 3)
          .join('\n');
        const archivedContent = archivedSectionMatch[0]
          .split('\n')
          .slice(3)
          .join('\n');

        const newArchivedSection = `${archivedHeader}\n${archivedEntry}\n${archivedContent}`;
        content = content.replace(archivedSectionMatch[0], newArchivedSection);

        // Write the updated content back to the file
        fs.writeFileSync(DOCUMENTATION_MAP, content);
        console.log(
          `Updated Documentation Map: moved ${taskFilename} to Archived Tasks section`
        );
      } else {
        console.warn(
          `Couldn't find Archived Tasks section in Documentation Map`
        );
      }
    } else {
      console.warn(
        `Couldn't parse task link in Documentation Map for: ${taskFilename}`
      );
    }
  } else {
    console.warn(
      `Couldn't find task ${taskFilename} in Tasks section of Documentation Map`
    );
  }
}

/**
 * Escape special characters in a string for use in a regular expression
 */
function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Remove the original task file
 */
async function removeOriginalTask(taskPath: string): Promise<void> {
  if (DRY_RUN) {
    console.log(`[DRY RUN] Would remove original task file: ${taskPath}`);
    return;
  }

  fs.unlinkSync(taskPath);
  console.log(`Removed original task file: ${taskPath}`);
}

/**
 * Run the validation scripts after archiving
 */
async function runValidation(): Promise<void> {
  if (DRY_RUN) {
    console.log(`[DRY RUN] Would run validation scripts`);
    return;
  }

  try {
    console.log('Running documentation validation...');

    // Check if the validation script exists in package.json
    try {
      await execAsync('npm run docs:validate-links');
      console.log('Validation completed');
    } catch (error) {
      console.warn(
        'Failed to run validation script. You may need to check for broken links manually.'
      );
    }
  } catch (error) {
    console.error('Error running validation:', error);
  }
}

/**
 * Log the summary of archiving operations
 */
function logSummary(archivedTasks: string[], skippedTasks: string[]): void {
  console.log('\n===== Task Archiving Summary =====');

  if (DRY_RUN) {
    console.log('[DRY RUN] No changes were made');
  }

  console.log(
    `Total completed tasks found: ${archivedTasks.length + skippedTasks.length}`
  );
  console.log(`Tasks archived: ${archivedTasks.length}`);
  console.log(`Tasks skipped: ${skippedTasks.length}`);

  if (archivedTasks.length > 0) {
    console.log('\nArchived Tasks:');
    archivedTasks.forEach((task) => console.log(`- ${path.basename(task)}`));
  }

  if (skippedTasks.length > 0) {
    console.log('\nSkipped Tasks:');
    skippedTasks.forEach((task) => console.log(`- ${path.basename(task)}`));
  }

  console.log('=================================');
}

/**
 * Main function
 */
async function main() {
  try {
    // Find all completed tasks
    const completedTasks = await findCompletedTasks();
    console.log(`Found ${completedTasks.length} completed task(s)`);

    const archivedTasks: string[] = [];
    const skippedTasks: string[] = [];

    // Process each completed task
    for (const taskPath of completedTasks) {
      console.log(`\nProcessing ${taskPath}...`);

      // Read task content
      const taskContent = fs.readFileSync(taskPath, 'utf8');

      // Check if task has a no-archive tag
      if (hasNoArchiveTag(taskContent)) {
        console.log(`Skipping task with no-archive tag: ${taskPath}`);
        skippedTasks.push(taskPath);
        continue;
      }

      // Check if task has been completed for the minimum required days - only if CHECK_AGE flag is set
      if (CHECK_AGE && !FORCE_ARCHIVE) {
        const lastModified = await getLastModifiedDate(taskPath);
        const daysSinceModified = Math.floor(
          (Date.now() - lastModified.getTime()) / (1000 * 60 * 60 * 24)
        );

        if (daysSinceModified < ARCHIVE_AGE_DAYS) {
          console.log(
            `Skipping task completed only ${daysSinceModified} days ago (minimum ${ARCHIVE_AGE_DAYS} days required): ${taskPath}`
          );
          skippedTasks.push(taskPath);
          continue;
        }
      }

      // Archive the task
      await archiveTask(taskPath);

      // Update references to the task
      await updateReferences(taskPath);

      // Update Documentation Map
      await updateDocumentationMap(taskPath);

      // Remove original task file
      await removeOriginalTask(taskPath);

      archivedTasks.push(taskPath);
      console.log(`Successfully archived ${taskPath}`);
    }

    // Run validation if any tasks were archived
    if (archivedTasks.length > 0 && !DRY_RUN) {
      await runValidation();
    }

    // Log summary
    logSummary(archivedTasks, skippedTasks);
  } catch (error) {
    console.error('Error during task archiving:', error);
    process.exit(1);
  }
}

// Run the script
main();
