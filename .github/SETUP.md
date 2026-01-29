# CI/CD Setup Guide

This guide provides step-by-step instructions for setting up the CI/CD pipeline for the VS Code extension.

## Prerequisites

- Repository admin access
- Azure DevOps account (for marketplace publishing only)
- GitHub account with repository access

## GitHub Repository Settings

### 1. Environment Configuration

The release workflow uses GitHub Environments to provide manual approval gates for marketplace publishing.

#### Create Marketplace Production Environment

1. Navigate to your repository on GitHub
2. Click **Settings** → **Environments**
3. Click **New environment**
4. Name it: `marketplace-production`
5. Click **Configure environment**

#### Configure Environment Protection Rules

1. Enable **Required reviewers**
   - Add team members who should approve releases
   - Recommend: At least 1-2 reviewers
   - These reviewers will be notified when a release is ready to publish

2. (Optional) Enable **Wait timer**
   - Add a delay before deployment is allowed
   - Useful for giving reviewers time to examine the release

3. (Optional) Set **Deployment branches**
   - Limit which branches can deploy to this environment
   - Recommended: Only allow `main` branch

4. Click **Save protection rules**

### 2. Repository Secrets

#### Required for Marketplace Publishing (Optional)

If you want to enable automated publishing to the VS Code Marketplace, you need to configure a Personal Access Token (PAT).

##### Create Azure DevOps Personal Access Token

1. Go to [Azure DevOps](https://dev.azure.com/)
2. Sign in with your Microsoft account
3. Click on your profile icon → **Personal access tokens**
4. Click **+ New Token**
5. Configure the token:
   - **Name**: `VS Code Marketplace Publishing`
   - **Organization**: Select your organization (or "All accessible organizations")
   - **Expiration**: Choose expiration period (recommend: 90 days or 1 year)
   - **Scopes**: 
     - Click **Show all scopes**
     - Find **Marketplace** section
     - Enable **Marketplace (Manage)** - Full access to publish and manage extensions
6. Click **Create**
7. **IMPORTANT**: Copy the token immediately - you won't be able to see it again!

##### Add Secret to GitHub Repository

1. Navigate to your repository on GitHub
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Configure the secret:
   - **Name**: `VSCE_TOKEN`
   - **Value**: Paste the Azure DevOps PAT you created
5. Click **Add secret**

**Note**: If `VSCE_TOKEN` is not configured, the publish job will skip marketplace publishing but still create the GitHub release with VSIX attachment.

## Workflow Permissions

The workflows use the following GitHub permissions:

### vscode-extension-ci.yml
- `contents: read` - Read repository code
- `pull-requests: write` - Add labels to PRs
- `security-events: write` - Upload CodeQL results

### version-bump.yml
- `contents: write` - Commit version changes and create tags
- `pull-requests: write` - Create/update PRs

### release.yml
- `contents: write` - Create releases and upload assets
- `id-token: write` - Generate OIDC tokens (if needed)

These permissions are configured in the workflow files and don't require manual setup.

## Publisher Setup (For Marketplace Publishing)

To publish extensions to the VS Code Marketplace, you need a publisher account.

### Create a Publisher

1. Visit [Visual Studio Marketplace Publisher Management](https://marketplace.visualstudio.com/manage)
2. Sign in with your Microsoft account
3. Click **Create publisher**
4. Fill in the details:
   - **Name**: Unique identifier (e.g., `bitsInnovate00`)
   - **Display name**: Public name shown to users
   - **Description**: Brief description of your organization
5. Click **Create**

### Verify Publisher in package.json

Ensure the `publisher` field in `package.json` matches your publisher name:

```json
{
  "publisher": "bitsInnovate00"
}
```

## Testing the Setup

### Test PR Validation

1. Create a new branch
2. Make a change to the VS Code extension
3. Create a Pull Request
4. Verify:
   - ✅ Build job runs on multiple platforms
   - ✅ Security scanning completes
   - ✅ PR gets auto-labeled
   - ✅ All checks pass

### Test Version Bump

1. Navigate to **Actions** tab
2. Select **Version Bump and Changelog**
3. Click **Run workflow**
4. Select version type: `patch`
5. Click **Run workflow**
6. Verify:
   - ✅ Workflow completes successfully
   - ✅ New commit is created with version bump
   - ✅ Tag is created (e.g., `v0.0.2`)
   - ✅ CHANGELOG.md is updated

### Test Release

The release workflow should trigger automatically after version bump creates a tag. Verify:

1. Navigate to **Actions** tab
2. Find the **Release VS Code Extension** workflow run
3. Verify:
   - ✅ Build and package job completes
   - ✅ GitHub Release is created
   - ✅ VSIX file is attached to release
   - ✅ Publish job waits for approval (if environment configured)

### Test Marketplace Publishing (If Configured)

1. Approve the deployment in the **marketplace-production** environment
2. Verify:
   - ✅ Extension publishes to marketplace
   - ✅ Extension is visible at: `https://marketplace.visualstudio.com/items?itemName=bitsInnovate00.advanced-coding-assistant`

## Troubleshooting

### Environment Not Found

**Error**: `Environment not found: marketplace-production`

**Solution**: 
1. Create the environment in repository settings
2. Re-run the workflow

### Permission Denied

**Error**: `Resource not accessible by integration`

**Solution**:
1. Check workflow permissions in `.github/workflows/*.yml`
2. Ensure repository settings allow workflows to create PRs and tags
3. Go to **Settings** → **Actions** → **General** → **Workflow permissions**
4. Select **Read and write permissions**
5. Enable **Allow GitHub Actions to create and approve pull requests**

### VSCE Token Invalid

**Error**: `Failed to publish: Unauthorized`

**Solution**:
1. Verify token hasn't expired
2. Create a new token in Azure DevOps
3. Update `VSCE_TOKEN` secret in repository
4. Ensure token has **Marketplace (Manage)** scope

### CodeQL Fails

**Error**: CodeQL analysis fails on CI

**Solution**:
1. Check if JavaScript/TypeScript is properly detected
2. Verify `package.json` is present
3. Review CodeQL logs for specific errors
4. May need to add CodeQL configuration file if using non-standard setup

## Maintenance

### Token Expiration

Azure DevOps PATs expire. Set a calendar reminder to renew tokens before expiration:

1. Create new PAT 1 week before expiration
2. Update `VSCE_TOKEN` in repository secrets
3. Test by triggering a release
4. Delete old PAT after confirming new one works

### Reviewer Changes

Update environment reviewers as team members change:

1. Go to **Settings** → **Environments** → **marketplace-production**
2. Update **Required reviewers** list
3. Save changes

## Security Best Practices

1. **Rotate tokens regularly**: Update PATs every 90 days
2. **Limit token scope**: Only enable necessary permissions
3. **Use environment protection**: Always require approval for production deployments
4. **Review security alerts**: Check CodeQL and npm audit results regularly
5. **Keep dependencies updated**: Run `npm audit fix` periodically

## Additional Resources

- [VS Code Publishing Extensions](https://code.visualstudio.com/api/working-with-extensions/publishing-extension)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Azure DevOps PAT Documentation](https://docs.microsoft.com/en-us/azure/devops/organizations/accounts/use-personal-access-tokens-to-authenticate)
- [GitHub Environments](https://docs.github.com/en/actions/deployment/targeting-different-environments/using-environments-for-deployment)
