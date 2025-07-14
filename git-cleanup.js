import { execFileSync } from 'child_process';
import fs from 'fs';
import path from 'path';

// --- Helper functions ---

/**
 * A helper function to dynamically import dependencies.
 */
async function getDependencies() {
  const { default: inquirer } = await import('inquirer');
  const { default: chalk } = await import('chalk');
  return { inquirer, chalk };
}

/**
 * Reads protected branches from a config file or returns a default list.
 * @param {object} chalk - The chalk instance for logging.
 * @returns {string[]} An array of protected branch names.
 */
function getProtectedBranches(chalk) {
  const configPath = path.resolve(process.cwd(), '.git-cleanup-config.json');
  const defaults = ['main', 'master', 'develop', 'dev', 'prod', 'production'];

  try {
    if (fs.existsSync(configPath)) {
      const configFile = fs.readFileSync(configPath, 'utf8');
      const config = JSON.parse(configFile);
      if (config.protectedBranches && Array.isArray(config.protectedBranches)) {
        console.log(chalk.gray('✅ Loaded protected branches from .git-cleanup-config.json'));
        return config.protectedBranches;
      }
    }
    console.log(chalk.gray('ℹ️ Using default protected branches. Create .git-cleanup-config.json to override.'));
    return defaults;
  } catch (error) {
    console.error(chalk.red('❌ Error reading or parsing config file:'), error.message);
    console.log(chalk.yellow('⚠️ Falling back to default protected branches.'));
    return defaults;
  }
}

/**
 * Main function to run the script logic.
 */
async function main() {
  const { inquirer, chalk } = await getDependencies();
  const isDryRun = process.argv.includes('--dry-run');

  if (isDryRun) {
    console.log(chalk.yellow.bold('🏃 Running in --dry-run mode. No branches will be deleted.\n'));
  }

  // 1. Check if we are in a git repository
  try {
    execFileSync('git', ['rev-parse', '--is-inside-work-tree'], { stdio: 'ignore' });
  } catch (e) {
    console.error(chalk.red('❌ This is not a Git repository. Aborting.'));
    process.exit(1);
  }

  // 2. Fetch and prune remote branches
  console.log(chalk.blue('🔄 Fetching and pruning remote branches...'));
  try {
    execFileSync('git', ['fetch', '-p'], { stdio: 'inherit' });
  } catch (e) {
    console.error(chalk.red('❌ Failed to fetch from remote. Please check your connection and configuration.'));
    if (e.stderr) {
      console.error(chalk.gray(e.stderr.toString()));
    }
    process.exit(1);
  }

  // 3. Find local branches whose remote has been deleted
  const branchesOutput = execFileSync('git', ['branch', '-vv'], { encoding: 'utf8' });
  const protectedBranches = getProtectedBranches(chalk);

  const goneBranches = branchesOutput
    .split('\n')
    .filter((line) => line.includes(': gone]'))
    .map((line) => line.trim().split(' ')[0])
    .filter((branch) => !protectedBranches.includes(branch));

  if (goneBranches.length === 0) {
    console.log(chalk.green('\n✅ Your local branches are clean. Nothing to do!'));
    process.exit(0);
  }

  // 4. Use inquirer to ask which branches to delete
  const { branchesToDelete } = await inquirer.prompt([
    {
      type: 'checkbox',
      name: 'branchesToDelete',
      message:
        'Select local branches to delete (whose remote is gone):' +
        chalk.cyan('\n  (Press <space> to select, <a> to toggle all, <i> to invert selection)\n'),
      choices: goneBranches,
      loop: false,
    },
  ]);

  if (branchesToDelete.length === 0) {
    console.log(chalk.yellow('👍 No branches selected. Operation cancelled.'));
    process.exit(0);
  }

  console.log(''); // Add a newline for cleaner output

  // 5. Loop through selected branches and attempt to delete them
  for (const branch of branchesToDelete) {
    try {
      if (isDryRun) {
        console.log(chalk.green(`[Dry Run] ✅ Would delete ${branch}`));
      } else {
        execFileSync('git', ['branch', '-d', branch]);
        console.log(chalk.green(`✅ Deleted ${branch}`));
      }
    } catch (err) {
      if (err.message.includes('not fully merged')) {
        console.warn(chalk.yellow(`⚠️  '${branch}' has unmerged changes.`));

        const { forceDelete } = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'forceDelete',
            message: `Do you want to force delete '${branch}'?`,
            default: false,
          },
        ]);

        if (forceDelete) {
          try {
            if (isDryRun) {
              console.log(chalk.magenta(`[Dry Run] 💥 Would force delete ${branch}`));
            } else {
              execFileSync('git', ['branch', '-D', branch]);
              console.log(chalk.magenta(`💥 Force deleted ${branch}`));
            }
          } catch (forceErr) {
            console.error(chalk.red(`❌ Failed to force delete '${branch}'.`));
            if (forceErr.stderr) {
              console.error(chalk.gray(forceErr.stderr.toString()));
            }
          }
        } else {
          console.log(chalk.gray(`↪️  Skipped '${branch}'`));
        }
      } else {
        console.error(chalk.red(`❌ Failed to delete '${branch}'.`));
        if (err.stderr) {
          console.error(chalk.gray(err.stderr.toString()));
        }
      }
    }
  }

  console.log(chalk.bold.inverse('\n✨ Cleanup complete! ✨'));
}

main().catch((err) => {
  // Using chalk in the final catch for consistency
  import('chalk').then(({ default: chalk }) => {
    console.error(chalk.red('\nAn unexpected error occurred:'), err);
  });
  process.exit(1);
});
