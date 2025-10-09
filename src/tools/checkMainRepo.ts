import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';

const fsLstat = promisify(fs.lstat);
const fsExists = promisify(fs.exists);

/**
 * Checks if the current directory is the main documentation repository
 * by verifying that package.json is not a symbolic link
 */
async function isMainRepo(): Promise<boolean> {
  const packageJsonPath = path.join(process.cwd(), 'package.json');

  if (!(await fsExists(packageJsonPath))) {
    console.error('❌ Error: package.json not found');
    return false;
  }

  const stats = await fsLstat(packageJsonPath);
  return !stats.isSymbolicLink();
}

/**
 * Main function to check if script is running in main repo
 */
async function main(): Promise<void> {
  if (await isMainRepo()) {
    console.log('✅ Running in main documentation repository');
    process.exit(0);
  } else {
    console.error(
      '❌ Error: This script should only be run in the main documentation repository'
    );
    console.error('   Current package.json is a symbolic link');
    process.exit(1);
  }
}

// Allow this to be imported or run directly
if (require.main === module) {
  main().catch((error) => {
    console.error(`❌ Error: ${error.message}`);
    process.exit(1);
  });
}

export { isMainRepo };
