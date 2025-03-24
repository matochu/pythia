import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';
import { exec } from 'child_process';
import chalk from 'chalk';

// Promisified functions
const fsExists = promisify(fs.exists);
const fsMkdir = promisify(fs.mkdir);
const fsReaddir = promisify(fs.readdir);
const fsLstat = promisify(fs.lstat);
const fsReadFile = promisify(fs.readFile);
const fsWriteFile = promisify(fs.writeFile);
const fsCopyFile = promisify(fs.copyFile);
const execPromise = promisify(exec);

/**
 * Installation configuration
 */
interface InstallConfig {
  /** Installation method: 'git' or 'symlink' */
  method: 'git' | 'symlink';
  /** Path to existing Pythia core (for symlink method) */
  corePath?: string;
  /** URL of the Pythia core repository (for git method) */
  repoUrl?: string;
  /** Branch to use (for git method) */
  branch?: string;
  /** Whether to force overwrite of existing files */
  force?: boolean;
  /** Whether to skip dependency installation */
  skipDeps?: boolean;
  /** Whether to create a minimal structure without examples */
  minimal?: boolean;
  /** Custom configuration file path */
  configPath?: string;
}

/**
 * Project configuration
 */
interface ProjectConfig {
  /** Project name */
  name: string;
  /** Project description */
  description: string;
  /** Project repository URL */
  repository?: string;
  /** Document root directory (relative to project root) */
  docRoot: string;
}

/**
 * Project workflow types to enable
 */
interface WorkflowsConfig {
  /** Enabled workflow types */
  enabled: string[];
}

/**
 * Project context types to enable
 */
interface ContextsConfig {
  /** Enabled context types */
  enabled: string[];
}

/**
 * Complete project configuration
 */
interface CompleteConfig {
  /** Project configuration */
  project: ProjectConfig;
  /** Workflows configuration */
  workflows: WorkflowsConfig;
  /** Contexts configuration */
  contexts: ContextsConfig;
  /** Installation configuration */
  installation: {
    /** Installation method */
    method: 'git' | 'symlink';
    /** Repository URL (for git method) */
    repoUrl?: string;
    /** Branch (for git method) */
    branch?: string;
    /** Core path (for symlink method) */
    corePath?: string;
  };
  /** Path configuration */
  paths: {
    /** Core directory (relative to docRoot) */
    core: string;
    /** Workflows directory (relative to docRoot) */
    workflows: string;
    /** Contexts directory (relative to docRoot) */
    contexts: string;
  };
  /** Structure configuration */
  structure: {
    /** Whether to create README files */
    createReadmes: boolean;
    /** Whether to include example files */
    includeExamples: boolean;
  };
}

/** Default configuration */
const DEFAULT_CONFIG: CompleteConfig = {
  project: {
    name: 'Pythia Project',
    description: 'A project using Pythia documentation system',
    docRoot: 'docs'
  },
  workflows: {
    enabled: ['tasks', 'proposals', 'decisions', 'ideas']
  },
  contexts: {
    enabled: ['project', 'technical', 'meetings']
  },
  installation: {
    method: 'git',
    repoUrl: 'https://github.com/your-org/pythia-core.git',
    branch: 'main'
  },
  paths: {
    core: 'core',
    workflows: 'workflows',
    contexts: 'contexts'
  },
  structure: {
    createReadmes: true,
    includeExamples: true
  }
};

/**
 * Progress logger with consistent formatting
 */
class ProgressLogger {
  private startTime: number;

  constructor() {
    this.startTime = Date.now();
  }

  /**
   * Log an informational message
   */
  info(message: string): void {
    console.log(chalk.blue('ℹ️ '), message);
  }

  /**
   * Log a success message
   */
  success(message: string): void {
    console.log(chalk.green('✅ '), message);
  }

  /**
   * Log a warning message
   */
  warning(message: string): void {
    console.log(chalk.yellow('⚠️ '), message);
  }

  /**
   * Log an error message
   */
  error(message: string): void {
    console.log(chalk.red('❌ '), message);
  }

  /**
   * Log a task in progress
   */
  task(message: string): void {
    console.log(chalk.cyan('🔄 '), message);
  }

  /**
   * Calculate and log total elapsed time
   */
  finish(): void {
    const elapsed = ((Date.now() - this.startTime) / 1000).toFixed(2);
    console.log(
      chalk.green('\n✨ Installation completed in'),
      chalk.bold(`${elapsed}s`)
    );
  }
}

/**
 * Verify that Git is installed and working
 */
async function verifyGit(): Promise<boolean> {
  try {
    await execPromise('git --version');
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Verify that Node.js and npm are installed
 */
async function verifyNode(): Promise<boolean> {
  try {
    await execPromise('node --version');
    await execPromise('npm --version');
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Create directory if it doesn't exist
 */
async function ensureDirectory(dirPath: string): Promise<void> {
  if (!(await fsExists(dirPath))) {
    await fsMkdir(dirPath, { recursive: true });
  }
}

/**
 * Load configuration from file
 */
async function loadConfig(
  configPath: string
): Promise<Partial<CompleteConfig>> {
  try {
    const configData = await fsReadFile(configPath, 'utf8');
    return JSON.parse(configData);
  } catch (error: any) {
    throw new Error(`Failed to load configuration file: ${error.message}`);
  }
}

/**
 * Merge custom configuration with defaults
 */
function mergeConfig(
  customConfig: Partial<CompleteConfig>,
  installConfig: InstallConfig
): CompleteConfig {
  const mergedConfig = { ...DEFAULT_CONFIG };

  // Merge project config
  if (customConfig.project) {
    mergedConfig.project = { ...mergedConfig.project, ...customConfig.project };
  }

  // Merge workflows config
  if (customConfig.workflows) {
    mergedConfig.workflows = {
      ...mergedConfig.workflows,
      ...customConfig.workflows
    };
  }

  // Merge contexts config
  if (customConfig.contexts) {
    mergedConfig.contexts = {
      ...mergedConfig.contexts,
      ...customConfig.contexts
    };
  }

  // Merge paths config
  if (customConfig.paths) {
    mergedConfig.paths = { ...mergedConfig.paths, ...customConfig.paths };
  }

  // Merge structure config
  if (customConfig.structure) {
    mergedConfig.structure = {
      ...mergedConfig.structure,
      ...customConfig.structure
    };
  }

  // Override with installation config from command line
  mergedConfig.installation = {
    ...mergedConfig.installation,
    method: installConfig.method,
    repoUrl: installConfig.repoUrl || mergedConfig.installation.repoUrl,
    branch: installConfig.branch || mergedConfig.installation.branch,
    corePath: installConfig.corePath || mergedConfig.installation.corePath
  };

  return mergedConfig;
}

/**
 * Install Pythia core using Git submodule
 */
async function installGitSubmodule(
  projectPath: string,
  config: CompleteConfig,
  logger: ProgressLogger
): Promise<boolean> {
  const docRoot = path.join(projectPath, config.project.docRoot);
  const corePath = path.join(docRoot, config.paths.core);

  logger.task(`Installing Pythia core as git submodule in ${corePath}...`);

  try {
    // Check if submodule already exists
    const gitModulesPath = path.join(projectPath, '.gitmodules');
    if (await fsExists(gitModulesPath)) {
      const gitModulesContent = await fsReadFile(gitModulesPath, 'utf8');
      if (gitModulesContent.includes(config.paths.core)) {
        logger.warning(`Submodule ${config.paths.core} already exists.`);
        return true;
      }
    }

    // Add submodule
    await ensureDirectory(path.dirname(corePath));
    const repoUrl =
      config.installation.repoUrl || DEFAULT_CONFIG.installation.repoUrl;
    const branch = config.installation.branch
      ? `--branch ${config.installation.branch}`
      : '';

    const cmd = `cd "${projectPath}" && git submodule add ${branch} ${repoUrl} ${config.project.docRoot}/${config.paths.core}`;
    await execPromise(cmd);

    // Initialize and update submodule
    const updateCmd = `cd "${projectPath}" && git submodule update --init --recursive`;
    await execPromise(updateCmd);

    logger.success(
      `Git submodule installed at ${config.project.docRoot}/${config.paths.core}`
    );
    return true;
  } catch (error: any) {
    logger.error(`Failed to install git submodule: ${error.message}`);
    logger.error(
      `Command failed, please check your Git configuration and try again.`
    );
    return false;
  }
}

/**
 * Install Pythia core using symbolic link
 */
async function installSymlink(
  projectPath: string,
  config: CompleteConfig,
  logger: ProgressLogger
): Promise<boolean> {
  const docRoot = path.join(projectPath, config.project.docRoot);
  const corePath = path.join(docRoot, config.paths.core);
  const sourcePath = config.installation.corePath;

  logger.task(`Creating symbolic link to Pythia core...`);

  if (!sourcePath) {
    logger.error('Source path for symbolic link is not specified.');
    return false;
  }

  // Check if source exists
  if (!(await fsExists(sourcePath))) {
    logger.error(`Source path does not exist: ${sourcePath}`);
    return false;
  }

  try {
    // Ensure parent directory exists
    await ensureDirectory(path.dirname(corePath));

    // Create symbolic link
    if (await fsExists(corePath)) {
      const stats = await fsLstat(corePath);
      if (stats.isSymbolicLink()) {
        logger.warning(
          `Symbolic link already exists at ${corePath}. Removing it...`
        );
        await fs.promises.unlink(corePath);
      } else {
        logger.error(
          `Target path exists and is not a symbolic link: ${corePath}`
        );
        return false;
      }
    }

    // Create the symbolic link
    const type = (await fsLstat(sourcePath)).isDirectory() ? 'dir' : 'file';
    await fs.promises.symlink(sourcePath, corePath, type);

    logger.success(
      `Symbolic link created at ${corePath} pointing to ${sourcePath}`
    );
    return true;
  } catch (error: any) {
    logger.error(`Failed to create symbolic link: ${error.message}`);
    return false;
  }
}

/**
 * Install dependencies for Pythia core
 */
async function installDependencies(
  projectPath: string,
  config: CompleteConfig,
  logger: ProgressLogger
): Promise<boolean> {
  const docRoot = path.join(projectPath, config.project.docRoot);
  const corePath = path.join(docRoot, config.paths.core);
  const toolsPath = path.join(corePath, 'tools');

  logger.task('Installing dependencies...');

  try {
    if (!(await fsExists(toolsPath))) {
      logger.error(`Tools directory not found: ${toolsPath}`);
      return false;
    }

    const cmd = `cd "${toolsPath}" && npm install`;
    await execPromise(cmd);

    logger.success('Dependencies installed successfully');
    return true;
  } catch (error: any) {
    logger.error(`Failed to install dependencies: ${error.message}`);
    return false;
  }
}

/**
 * Create core configuration file
 */
async function createConfigFile(
  projectPath: string,
  config: CompleteConfig,
  logger: ProgressLogger
): Promise<boolean> {
  const docRoot = path.join(projectPath, config.project.docRoot);
  const corePath = path.join(docRoot, config.paths.core);
  const configFilePath = path.join(corePath, 'config.json');

  logger.task('Creating configuration file...');

  try {
    // Create configuration object
    const coreConfig = {
      project: config.project,
      workflows: config.workflows,
      contexts: config.contexts
    };

    // Write configuration file
    await fsWriteFile(
      configFilePath,
      JSON.stringify(coreConfig, null, 2),
      'utf8'
    );

    logger.success(`Configuration file created at ${configFilePath}`);
    return true;
  } catch (error: any) {
    logger.error(`Failed to create configuration file: ${error.message}`);
    return false;
  }
}

/**
 * Create project structure
 */
async function createProjectStructure(
  projectPath: string,
  config: CompleteConfig,
  logger: ProgressLogger
): Promise<boolean> {
  const docRoot = path.join(projectPath, config.project.docRoot);

  logger.task('Creating project structure...');

  try {
    // Create directory structure
    await ensureDirectory(docRoot);

    // Create workflow directories
    for (const workflow of config.workflows.enabled) {
      const workflowPath = path.join(docRoot, config.paths.workflows, workflow);
      await ensureDirectory(workflowPath);

      if (config.structure.createReadmes) {
        const readmePath = path.join(workflowPath, 'README.md');
        const content = `# ${
          workflow.charAt(0).toUpperCase() + workflow.slice(1)
        }\n\nThis directory contains ${workflow} documents for the project.\n\n## Structure\n\nPlace ${workflow} documents directly in this directory.\n\n## References\n\n- [${
          workflow.charAt(0).toUpperCase() + workflow.slice(1)
        } Template](../../${config.paths.core}/templates/${workflow.slice(
          0,
          -1
        )}-template.md)\n`;
        await fsWriteFile(readmePath, content, 'utf8');
      }
    }

    // Create context directories
    for (const context of config.contexts.enabled) {
      const contextPath = path.join(docRoot, config.paths.contexts, context);
      await ensureDirectory(contextPath);

      if (config.structure.createReadmes) {
        const readmePath = path.join(contextPath, 'README.md');
        const content = `# ${
          context.charAt(0).toUpperCase() + context.slice(1)
        } Context\n\nThis directory contains ${context} context documents for the project.\n\n## Structure\n\nPlace ${context} context documents directly in this directory.\n\n## References\n\n- [Context Documents Overview](../../${
          config.paths.core
        }/navigation/context-documents.md)\n`;
        await fsWriteFile(readmePath, content, 'utf8');
      }
    }

    logger.success('Project structure created successfully');
    return true;
  } catch (error: any) {
    logger.error(`Failed to create project structure: ${error.message}`);
    return false;
  }
}

/**
 * Run initialization script
 */
async function runInitScript(
  projectPath: string,
  config: CompleteConfig,
  logger: ProgressLogger
): Promise<boolean> {
  const docRoot = path.join(projectPath, config.project.docRoot);
  const corePath = path.join(docRoot, config.paths.core);
  const toolsPath = path.join(corePath, 'tools');

  logger.task('Running initialization script...');

  try {
    if (!(await fsExists(toolsPath))) {
      logger.error(`Tools directory not found: ${toolsPath}`);
      return false;
    }

    // Check if the init script exists
    const initScriptPath = path.join(toolsPath, 'init-project.js');

    if (!(await fsExists(initScriptPath))) {
      logger.warning(`Initialization script not found: ${initScriptPath}`);
      return false;
    }

    // Run the initialization script
    const relativeDocRoot = path.relative(toolsPath, docRoot);
    const cmd = `cd "${toolsPath}" && node init-project.js ${relativeDocRoot}`;
    await execPromise(cmd);

    logger.success('Initialization script completed successfully');
    return true;
  } catch (error: any) {
    logger.error(`Failed to run initialization script: ${error.message}`);
    return false;
  }
}

/**
 * Verify successful installation
 */
async function verifyInstallation(
  projectPath: string,
  config: CompleteConfig,
  logger: ProgressLogger
): Promise<boolean> {
  const docRoot = path.join(projectPath, config.project.docRoot);
  const corePath = path.join(docRoot, config.paths.core);

  logger.task('Verifying installation...');

  try {
    // Check if core directory exists
    if (!(await fsExists(corePath))) {
      logger.error(`Core directory not found: ${corePath}`);
      return false;
    }

    // Check if tools directory exists
    const toolsPath = path.join(corePath, 'tools');
    if (!(await fsExists(toolsPath))) {
      logger.error(`Tools directory not found: ${toolsPath}`);
      return false;
    }

    // Check if basic workflow directories exist
    const workflowsPath = path.join(docRoot, config.paths.workflows);
    if (!(await fsExists(workflowsPath))) {
      logger.error(`Workflows directory not found: ${workflowsPath}`);
      return false;
    }

    // Check if basic context directories exist
    const contextsPath = path.join(docRoot, config.paths.contexts);
    if (!(await fsExists(contextsPath))) {
      logger.error(`Contexts directory not found: ${contextsPath}`);
      return false;
    }

    logger.success('Installation verified successfully');
    return true;
  } catch (error: any) {
    logger.error(`Failed to verify installation: ${error.message}`);
    return false;
  }
}

/**
 * Install Pythia core
 */
async function installCore(
  targetPath: string,
  installConfig: InstallConfig
): Promise<boolean> {
  const logger = new ProgressLogger();

  // Display banner
  console.log('\n');
  console.log(chalk.bold.blue('🔮 Pythia Core Installation'));
  console.log(chalk.blue('━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
  console.log('\n');

  // Verify requirements
  logger.task('Verifying requirements...');

  if (!(await verifyGit())) {
    logger.error('Git is not installed or not available in PATH.');
    return false;
  }

  if (!(await verifyNode())) {
    logger.error('Node.js and npm are required but not available.');
    return false;
  }

  // Resolve target path
  const projectPath = path.resolve(targetPath);
  logger.info(`Target project path: ${projectPath}`);

  // Load configuration
  let config: CompleteConfig;
  try {
    if (installConfig.configPath) {
      logger.info(`Loading configuration from ${installConfig.configPath}...`);
      const customConfig = await loadConfig(installConfig.configPath);
      config = mergeConfig(customConfig, installConfig);
    } else {
      config = mergeConfig({}, installConfig);
    }

    logger.info(`Installation method: ${config.installation.method}`);
  } catch (error: any) {
    logger.error(`Configuration error: ${error.message}`);
    return false;
  }

  // Create doc root directory
  const docRoot = path.join(projectPath, config.project.docRoot);
  await ensureDirectory(docRoot);

  // Install core
  let success = false;
  if (config.installation.method === 'git') {
    success = await installGitSubmodule(projectPath, config, logger);
  } else if (config.installation.method === 'symlink') {
    success = await installSymlink(projectPath, config, logger);
  } else {
    logger.error(`Invalid installation method: ${config.installation.method}`);
    return false;
  }

  if (!success) {
    return false;
  }

  // Install dependencies
  if (!installConfig.skipDeps) {
    if (!(await installDependencies(projectPath, config, logger))) {
      return false;
    }
  } else {
    logger.info('Skipping dependency installation.');
  }

  // Create configuration file
  if (!(await createConfigFile(projectPath, config, logger))) {
    return false;
  }

  // Create project structure
  if (!(await createProjectStructure(projectPath, config, logger))) {
    return false;
  }

  // Run initialization script
  if (!(await runInitScript(projectPath, config, logger))) {
    logger.warning('Initialization script did not complete successfully.');
    // Continue anyway as this may not be a critical error
  }

  // Verify installation
  if (!(await verifyInstallation(projectPath, config, logger))) {
    logger.warning('Installation verification failed.');
    return false;
  }

  // Installation complete
  logger.finish();

  console.log('\n');
  console.log(chalk.bold.green('🎉 Pythia core installed successfully!'));
  console.log(chalk.green('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
  console.log('\n');
  console.log(chalk.blue(`Next steps:`));
  console.log(
    `  1. Explore the ${chalk.bold(
      `${config.project.docRoot}/${config.paths.core}/CONCEPT.md`
    )} document`
  );
  console.log(`  2. Review the generated project structure`);
  console.log(
    `  3. Check out the ${chalk.bold(
      `${config.project.docRoot}/navigation/documentation-map.md`
    )} (if available)`
  );
  console.log('\n');

  return true;
}

/**
 * Print help message
 */
function printHelp(): void {
  console.log('\n');
  console.log(chalk.bold.blue('🔮 Pythia Core Installer'));
  console.log(chalk.blue('━━━━━━━━━━━━━━━━━━━━━'));
  console.log('\n');
  console.log('Usage: node installCore.js <target-path> [options]');
  console.log('\n');
  console.log('Options:');
  console.log(
    '  --method=<git|symlink>    Installation method (git submodule or symbolic link)'
  );
  console.log(
    '  --core-path=<path>        Path to existing Pythia core (for symlink method)'
  );
  console.log(
    '  --repo-url=<url>          URL of the Pythia core repository (for git method)'
  );
  console.log(
    '  --branch=<branch>         Specific branch to use (for git method)'
  );
  console.log('  --config=<path>           Path to custom configuration file');
  console.log(
    '  --force                   Overwrite existing files without prompting'
  );
  console.log('  --no-deps                 Skip dependency installation');
  console.log(
    '  --minimal                 Create minimal structure without examples'
  );
  console.log('  --help                    Show this help message');
  console.log('\n');
  console.log('Examples:');
  console.log('  node installCore.js my-project --method=git');
  console.log(
    '  node installCore.js my-project --method=symlink --core-path=/path/to/pythia-core'
  );
  console.log(
    '  node installCore.js my-project --method=git --config=custom-config.json'
  );
  console.log('\n');
}

/**
 * Parse command line arguments
 */
function parseArgs(): { targetPath: string; config: InstallConfig } | null {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    printHelp();
    return null;
  }

  const targetPath = args[0];
  const config: InstallConfig = {
    method: 'git' // Default method
  };

  // Parse options
  for (let i = 1; i < args.length; i++) {
    const arg = args[i];

    if (arg.startsWith('--method=')) {
      const method = arg.substring('--method='.length);
      if (method === 'git' || method === 'symlink') {
        config.method = method;
      } else {
        console.error(`Invalid installation method: ${method}`);
        return null;
      }
    } else if (arg.startsWith('--core-path=')) {
      config.corePath = arg.substring('--core-path='.length);
    } else if (arg.startsWith('--repo-url=')) {
      config.repoUrl = arg.substring('--repo-url='.length);
    } else if (arg.startsWith('--branch=')) {
      config.branch = arg.substring('--branch='.length);
    } else if (arg.startsWith('--config=')) {
      config.configPath = arg.substring('--config='.length);
    } else if (arg === '--force') {
      config.force = true;
    } else if (arg === '--no-deps') {
      config.skipDeps = true;
    } else if (arg === '--minimal') {
      config.minimal = true;
    } else {
      console.error(`Unknown option: ${arg}`);
      return null;
    }
  }

  // Validate options
  if (config.method === 'symlink' && !config.corePath) {
    console.error(
      'The --core-path option is required for symlink installation method.'
    );
    return null;
  }

  return { targetPath, config };
}

/**
 * Main function
 */
async function main(): Promise<void> {
  const args = parseArgs();

  if (!args) {
    process.exit(1);
  }

  const { targetPath, config } = args;

  try {
    const success = await installCore(targetPath, config);
    process.exit(success ? 0 : 1);
  } catch (error: any) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
}

// Execute main function
if (require.main === module) {
  main().catch((error) => {
    console.error(`Unhandled error: ${error.message}`);
    process.exit(1);
  });
}

// Export functions for testing and programmatic usage
export {
  installCore,
  verifyGit,
  verifyNode,
  parseArgs,
  loadConfig,
  mergeConfig
};
