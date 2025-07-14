# oh-my-git 🧹

`omg-cleanup` (published as `oh-my-git` on npm) is a simple and powerful interactive command-line tool to help you keep your local Git repository tidy. It finds local branches whose upstream (remote) branch has been deleted and guides you through deleting them, one by one.

## ⚠️ Disclaimer

**Use this tool at your own risk.** It is designed to delete local branches, which is a destructive action. Always ensure you have a backup or that your work is pushed to a remote repository before running deletion commands. **The tool cannot protect you from yourself.**

## ✨ Features

* **Finds Stale Branches:** Automatically identifies local branches whose remote tracking branch has been deleted (the ones that show `[gone]` in `git branch -vv`).
* **Always Interactive:** Presents you with a clear checklist of stale branches to delete. You are always in control.
* **Fetches First:** Runs `git fetch --prune` at the start to ensure your remote tracking information is up-to-date.
* **Safe by Default:** First attempts a safe delete (`git branch -d`). If a branch has unmerged changes, it will ask for confirmation before offering to force delete it (`git branch -D`).
* **Protects Core Branches:** Automatically prevents common branches like `main`, `master`, `develop`, etc. from being deleted. You can customize this list (see below).
* **Dry Run Mode:** Use the `--dry-run` flag to preview which branches would be deleted, without actually deleting anything.
* **Custom Protected Branches:** You can create a `.git-cleanup-config.json` file in your repo root to specify additional protected branches:

```json
{
  "protectedBranches": ["main", "master", "develop", "release", "my-important-branch"]
}
```

## ⚙️ Installation

You can install `oh-my-git` (the package name) either locally within a project or globally on your system.

### Local Installation (Recommended)

Installing it as a development dependency ensures that everyone on your team uses the same version.

**Using npm:**
```bash
npm install --save-dev oh-my-git
```

**Using yarn:**
```bash
yarn add --dev oh-my-git
```

### Global Installation

A global installation allows you to run `omg-cleanup` from any repository on your machine.

**Using npm:**
```bash
npm install --global oh-my-git
```

**Using yarn:**
```bash
yarn global add oh-my-git
```

## 🚀 Setup & Usage

### 1. Configure `package.json` (Optional)

Add a script to your `package.json` to easily run `omg-cleanup`. Since the tool is fully interactive, you only need one simple command.

Open your `package.json` and add a new script to the `scripts` object:

```json
{
  "name": "my-awesome-project",
  "version": "1.0.0",
  "scripts": {
    "omg:cleanup": "omg-cleanup"
  }
}
```

### 2. Run the Tool

Now you can execute the script from your terminal. The tool will guide you through the rest of the process.

**Using npm:**
```bash
npm run omg:cleanup
```

**Using yarn:**
```bash
yarn omg:cleanup
```

### Global Usage

If you installed the tool globally, you can run it directly in any Git repository:
```bash
omg-cleanup
```

#### Optional: Dry Run

To see what would be deleted without actually deleting anything, use:
```bash
omg-cleanup --dry-run
```

The tool will then start its interactive session.

## 🤝 Contributing

This is an open-source project, and contributions are highly welcome! If you have ideas for improvements or find a bug, please don't hesitate to get involved.

Feel free to:

* **Open an Issue:** To report a bug, suggest a feature, or ask a question.
* **Submit a Pull Request:** If you want to contribute code, please open an issue first to discuss the proposed changes. This helps us coordinate our efforts.

<!-- Please read our `CONTRIBUTING.md` file for more details on our code of conduct and the process for submitting pull requests. -->

## 📜 License

This project is licensed under the **MIT License**. See the `LICENSE` file for details.
