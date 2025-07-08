
import { execFileSync } from 'child_process';

/**
 * A helper function to dynamically import inquirer.
 * This is required because inquirer is a CommonJS module.
 */
async function getInquirer() {
  const { default: inquirer } = await import('inquirer');
  return inquirer;
}

/**
 * Main function to run the script logic.
 */
async function main() {
  // 1. Check if we are in a git repository
  try {
    // Use execFileSync for safety, even with static commands.
    execFileSync('git', ['rev-parse', '--is-inside-work-tree'], { stdio: 'ignore' });
  } catch (e) {
    console.error('❌ This is not a Git repository. Aborting.');
    process.exit(1);
  }

  // 2. Fetch and prune remote branches
  console.log('🔄 Fetching and pruning remote branches...');
  try {
    // Use execFileSync to avoid shell interpretation.
    execFileSync('git', ['fetch', '-p'], { stdio: 'inherit' });
  } catch (e) {
    console.error('❌ Failed to fetch from remote. Please check your connection and configuration.');
    process.exit(1);
  }

  // 3. Find local branches whose remote has been deleted
  // Use execFileSync to safely execute the command.
  const branchesOutput = execFileSync('git', ['branch', '-vv'], { encoding: 'utf8' });
  const protectedBranches = ['main', 'master', 'develop', 'dev'];

  const goneBranches = branchesOutput
    .split('\n')
    .filter(line => line.includes(': gone]'))
    .map(line => line.trim().split(' ')[0])
    .filter(branch => !protectedBranches.includes(branch));

  if (goneBranches.length === 0) {
    console.log('\n✅ Your local branches are clean. Nothing to do!');
    process.exit(0);
  }

  // 4. Use inquirer to ask which branches to delete
  const inquirer = await getInquirer();
  const { branchesToDelete } = await inquirer.prompt([
    {
      type: 'checkbox',
      name: 'branchesToDelete',
      message: 'Select local branches to delete (whose remote is gone):',
      choices: goneBranches,
      loop: false,
    },
  ]);

  if (branchesToDelete.length === 0) {
    console.log('👍 No branches selected. Operation cancelled.');
    process.exit(0);
  }

  console.log(''); // Add a newline for cleaner output

  // 5. Loop through selected branches and attempt to delete them
  for (const branch of branchesToDelete) {
    try {
      // **VULNERABILITY FIXED**: Use execFileSync to safely delete the branch.
      // The branch name is passed as a separate argument and is not interpreted by the shell.
      execFileSync('git', ['branch', '-d', branch]);
      console.log(`✅ Deleted ${branch}`);
    } catch (err) {
      // If safe delete fails, check if it's because of unmerged changes
      if (err.message.includes('not fully merged')) {
        console.warn(`⚠️  '${branch}' has unmerged changes.`);
        
        // Ask the user if they want to force delete
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
            // **VULNERABILITY FIXED**: Use execFileSync for the force delete command.
            execFileSync('git', ['branch', '-D', branch]);
            console.log(`💥 Force deleted ${branch}`);
          } catch (forceErr) {
            console.error(`❌ Failed to force delete '${branch}': ${forceErr.message}`);
          }
        } else {
          console.log(`↪️  Skipped '${branch}'`);
        }
      } else {
        console.error(`❌ Failed to delete '${branch}': ${err.message}`);
      }
    }
  }

  console.log('\n✨ Cleanup complete!');
}

main().catch(err => {
  console.error('\nAn unexpected error occurred:', err);
  process.exit(1);
});
