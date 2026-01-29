# CI/CD Workflows for VS Code Extension

This directory contains GitHub Actions workflows for automating the build, test, release, and publishing of the Advanced Coding Assistant VS Code extension.

## Workflows Overview

### 1. VS Code Extension CI (`vscode-extension-ci.yml`)

**Trigger:** Push or Pull Request to `main` or `develop` branches (when extension files change)

**Purpose:** Validates code quality, runs tests, and performs security scanning

**Jobs:**

- **build**: 
  - Runs on multiple OS (Ubuntu, Windows, macOS) and Node.js versions (18.x, 20.x)
  - Checks code formatting with Prettier
  - Runs ESLint for code quality
  - Compiles TypeScript
  - Runs test suite
  - Creates production package
  
- **package**:
  - Creates VSIX package on main branch pushes
  - Uploads VSIX as artifact for download
  
- **security**:
  - Runs CodeQL security analysis
  - Performs npm audit for dependency vulnerabilities
  - Uploads audit results as artifacts
  
- **pr-labels**:
  - Automatically labels PRs based on changed files
  - Uses `.github/labeler.yml` configuration

**Required Secrets:** None

### 2. Version Bump and Changelog (`version-bump.yml`)

**Trigger:** Manual workflow dispatch

**Purpose:** Automates version bumping and changelog updates

**Inputs:**
- `version-type`: Choose between `patch`, `minor`, or `major`
- `changelog-entry`: Optional custom changelog entry (auto-generates from commits if not provided)

**Process:**
1. Bumps version in `package.json`
2. Updates `CHANGELOG.md` with new version section
3. Commits changes with conventional commit message
4. Creates and pushes a git tag (e.g., `v1.0.0`)
5. Triggers release workflow automatically

**Usage:**
```bash
# Navigate to Actions tab in GitHub
# Select "Version Bump and Changelog"
# Click "Run workflow"
# Choose version bump type (patch/minor/major)
# Optionally add custom changelog entry
# Click "Run workflow" button
```

**Required Secrets:** None (uses `GITHUB_TOKEN`)

### 3. Release VS Code Extension (`release.yml`)

**Trigger:** 
- Automatic: When a version tag is pushed (e.g., `v1.0.0`)
- Manual: Workflow dispatch with tag input

**Purpose:** Builds, packages, and publishes the extension

**Jobs:**

- **build-and-package**:
  - Checks out code at the specified tag
  - Installs dependencies
  - Runs linter and tests
  - Creates VSIX package
  - Uploads VSIX as artifact
  
- **create-release**:
  - Downloads VSIX artifact
  - Extracts release notes from CHANGELOG.md
  - Creates GitHub Release with VSIX attachment
  
- **publish-marketplace**:
  - **Requires manual approval** (uses environment protection)
  - Downloads VSIX artifact
  - Publishes to VS Code Marketplace (if `VSCE_TOKEN` is configured)

**Usage:**

Automatic (recommended):
```bash
# Use version-bump workflow to create a tag
# This workflow will trigger automatically
```

Manual:
```bash
# Navigate to Actions tab in GitHub
# Select "Release VS Code Extension"
# Click "Run workflow"
# Enter tag name (e.g., v1.0.0)
# Click "Run workflow" button
```

**Required Secrets:**
- `VSCE_TOKEN` (optional): Personal Access Token for VS Code Marketplace
  - Only needed if you want to publish to marketplace
  - Create at: https://dev.azure.com/
  - Required scopes: `Marketplace (Manage)`

## Labeler Configuration

The PR labeler automatically adds labels based on changed files:

| Label | Triggered by |
|-------|-------------|
| `vscode-extension` | Changes to `advanced-coding-assistant-vscode/**` |
| `dependencies` | Changes to `package.json` or `package-lock.json` |
| `documentation` | Changes to Markdown files |
| `github-actions` | Changes to `.github/**` |
| `tests` | Changes to test files |

Configuration: `.github/labeler.yml`

## Security Scanning

### CodeQL
- Analyzes TypeScript/JavaScript code for security vulnerabilities
- Runs on every PR and push to main/develop
- Uses `security-and-quality` query suite
- Results visible in Security tab

### Dependency Scanning
- Runs `npm audit` on every CI build
- Checks for known vulnerabilities in dependencies
- Audit level set to `moderate`
- Results uploaded as artifacts for review

## Environments

### marketplace-production
- **Purpose**: Manual approval gate for marketplace publishing
- **Required Reviewers**: Configure in repository settings
- **URL**: Points to marketplace extension page

**To configure:**
1. Go to repository Settings → Environments
2. Create environment named `marketplace-production`
3. Enable "Required reviewers"
4. Add team members who can approve releases

## Release Process

### Complete Release Workflow

1. **Development**
   - Make changes to extension code
   - Create PR to `develop` or `main`
   - CI workflow validates changes
   - Review and merge PR

2. **Version Bump**
   - Run "Version Bump and Changelog" workflow
   - Select version type (patch/minor/major)
   - Workflow commits version bump and creates tag

3. **Automatic Release**
   - Tag push triggers "Release VS Code Extension" workflow
   - VSIX is built and tested
   - GitHub Release is created automatically
   - VSIX is attached to release

4. **Manual Approval for Publishing**
   - Designated reviewers receive notification
   - Review release notes and VSIX
   - Approve deployment to marketplace
   - Extension is published (if VSCE_TOKEN configured)

### Versioning Strategy

Follow [Semantic Versioning](https://semver.org/):

- **PATCH** (0.0.X): Bug fixes, minor improvements
- **MINOR** (0.X.0): New features, backwards compatible
- **MAJOR** (X.0.0): Breaking changes

### Conventional Commits

Use conventional commit messages for better changelog generation:

```
feat: add new feature
fix: resolve bug
docs: update documentation
chore: maintenance task
test: add tests
refactor: code refactoring
style: code style changes
perf: performance improvements
```

## Artifacts

All workflows store artifacts for later review:

| Artifact | Retention | Description |
|----------|-----------|-------------|
| `vscode-extension` | 90 days | VSIX from CI builds |
| `vscode-extension-release` | 90 days | VSIX from release builds |
| `npm-audit-results` | 90 days | Dependency audit JSON |

## Troubleshooting

### Build Failures

**Formatting issues:**
```bash
npm run format
```

**Linting errors:**
```bash
npm run lint -- --fix
```

**Test failures:**
```bash
npm test
```

### Release Issues

**Tag already exists:**
```bash
git tag -d v1.0.0
git push origin :refs/tags/v1.0.0
```

**Marketplace publishing fails:**
- Verify `VSCE_TOKEN` is configured correctly
- Check token hasn't expired
- Ensure publisher name matches in `package.json`

### Security Scanning

**CodeQL alerts:**
- Review in Security → Code scanning alerts
- Address issues in code
- Re-run workflow to verify fixes

**npm audit failures:**
- Review audit-results.json artifact
- Update vulnerable dependencies: `npm audit fix`
- For breaking changes: `npm audit fix --force` (use with caution)

## Best Practices

1. **Always use version-bump workflow** instead of manual version changes
2. **Review changelog** before approving marketplace publication
3. **Test VSIX locally** before publishing to marketplace
4. **Keep dependencies updated** to minimize security vulnerabilities
5. **Use conventional commits** for automatic changelog generation
6. **Configure environment protection** for production deployments

## Additional Resources

- [VS Code Extension Publishing](https://code.visualstudio.com/api/working-with-extensions/publishing-extension)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Semantic Versioning](https://semver.org/)
- [Conventional Commits](https://www.conventionalcommits.org/)
