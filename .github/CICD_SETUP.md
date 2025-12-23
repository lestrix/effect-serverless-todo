# CI/CD Setup Guide

This document explains the GitHub Actions CI/CD pipeline for the Effect Serverless Todo application.

## Overview

We have two main workflows:

1. **CI Workflow** ([ci.yml](.github/workflows/ci.yml)) - Validates pull requests
2. **Deploy Workflow** ([deploy.yml](.github/workflows/deploy.yml)) - Deploys to AWS

---

## CI Workflow (Pull Request Validation)

**File:** `.github/workflows/ci.yml`

### When It Runs

- ✅ On pull requests to `main` or `develop` branches
- ✅ On direct pushes to `develop` branch

### What It Does

The CI workflow runs **3 parallel jobs**:

#### Job 1: Code Quality
- ✅ Format checking with Prettier
- ✅ Linting with ESLint
- ✅ TypeScript type checking across all packages

#### Job 2: Tests
- ✅ Runs all unit tests with Vitest
- ✅ Uploads coverage to Codecov (optional)

#### Job 3: Build
- ✅ Builds all packages (backend, frontend, shared)
- ✅ Reports bundle sizes

### Caching Strategy

The workflow uses GitHub Actions cache for `pnpm`:
- **First run:** ~2-5 minutes (downloads all dependencies)
- **Subsequent runs:** ~30 seconds (restores from cache)
- Cache invalidates when `pnpm-lock.yaml` changes

### Concurrency Control

```yaml
concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true
```

**What this does:** If you push new commits to a PR, it cancels the old CI run and starts a new one. Saves CI minutes!

---

## Deploy Workflow (Production Deployment)

**File:** `.github/workflows/deploy.yml`

### When It Runs

- ✅ On push to `main` branch (automatic deployment)
- ✅ Manual trigger via GitHub UI (`workflow_dispatch`)

### What It Does

1. Checks out code
2. Installs dependencies with pnpm
3. Authenticates with AWS (using OIDC or access keys)
4. Deploys infrastructure and application with SST
5. Outputs deployment URL

### AWS Authentication Options

#### Option 1: OIDC (Recommended) ⭐

**Benefits:**
- ✅ No long-lived credentials stored in GitHub
- ✅ Temporary credentials (valid for ~1 hour)
- ✅ More secure
- ✅ No rotation needed

**Setup Required:**

1. Create an OIDC provider in AWS:
```bash
aws iam create-open-id-connect-provider \
  --url https://token.actions.githubusercontent.com \
  --client-id-list sts.amazonaws.com \
  --thumbprint-list 6938fd4d98bab03faadb97b34396831e3780aea1
```

2. Create an IAM role with trust policy:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Federated": "arn:aws:iam::YOUR_ACCOUNT_ID:oidc-provider/token.actions.githubusercontent.com"
      },
      "Action": "sts:AssumeRoleWithWebIdentity",
      "Condition": {
        "StringEquals": {
          "token.actions.githubusercontent.com:aud": "sts.amazonaws.com"
        },
        "StringLike": {
          "token.actions.githubusercontent.com:sub": "repo:YOUR_ORG/YOUR_REPO:*"
        }
      }
    }
  ]
}
```

3. Attach permissions policy (AdministratorAccess for SST):
```bash
aws iam attach-role-policy \
  --role-name GitHubActionsRole \
  --policy-arn arn:aws:iam::aws:policy/AdministratorAccess
```

4. Add the role ARN to GitHub secrets:
   - Go to: **Settings → Secrets and variables → Actions**
   - Create secret: `AWS_ROLE_ARN`
   - Value: `arn:aws:iam::YOUR_ACCOUNT_ID:role/GitHubActionsRole`

#### Option 2: Access Keys (Simpler)

**Benefits:**
- ✅ Easier to set up
- ✅ No AWS OIDC provider needed

**Drawbacks:**
- ❌ Long-lived credentials
- ❌ Need manual rotation
- ❌ Less secure

**Setup:**

1. Create an IAM user with programmatic access
2. Attach `AdministratorAccess` policy (or more restrictive policy)
3. Add credentials to GitHub secrets:
   - `AWS_ACCESS_KEY_ID`
   - `AWS_SECRET_ACCESS_KEY`

4. Uncomment the alternative authentication step in `deploy.yml`:
```yaml
- name: Configure AWS credentials
  uses: aws-actions/configure-aws-credentials@v4
  with:
    aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
    aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
    aws-region: eu-central-1
```

### Deployment Stages

The deploy workflow supports multiple stages:

- **`production`** (default) - Deployed on push to `main`
- **`staging`** - Can be triggered manually

To deploy to staging:
1. Go to **Actions** tab in GitHub
2. Click **Deploy** workflow
3. Click **Run workflow**
4. Select `staging` from dropdown

### Concurrency Control

```yaml
concurrency:
  group: deploy-${{ github.ref }}
  cancel-in-progress: false
```

**What this does:** Only one deployment can run at a time. If a deployment is in progress, new deployments wait. This prevents deployment conflicts.

---

## Setting Up GitHub Secrets

### Required Secrets

#### For OIDC Authentication:
- `AWS_ROLE_ARN` - ARN of the IAM role for GitHub Actions

#### For Access Key Authentication:
- `AWS_ACCESS_KEY_ID` - AWS access key
- `AWS_SECRET_ACCESS_KEY` - AWS secret key

### How to Add Secrets

1. Go to your GitHub repository
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add each secret with its value

---

## Workflow Triggers Explained

### CI Workflow Triggers

```yaml
on:
  pull_request:
    branches: [main, develop]
  push:
    branches: [develop]
```

**Scenarios:**
- Open PR to `main` → CI runs ✅
- Push commit to PR → CI runs ✅
- Push to `develop` directly → CI runs ✅
- Push to `main` directly → CI does NOT run ❌ (deploy runs instead)

### Deploy Workflow Triggers

```yaml
on:
  push:
    branches: [main]
  workflow_dispatch:
```

**Scenarios:**
- Merge PR to `main` → Deploy runs ✅
- Push to `main` directly → Deploy runs ✅
- Manual trigger → Deploy runs ✅
- Push to other branches → Deploy does NOT run ❌

---

## Environments

GitHub Environments provide:
- Protection rules (require reviews before deployment)
- Secrets scoped to specific environments
- Deployment history and rollback

### Setting Up Environments

1. Go to **Settings** → **Environments**
2. Create environments: `production`, `staging`
3. Configure protection rules:
   - **Production:** Require manual approval
   - **Staging:** No restrictions

### Using Environments in Workflow

The deploy workflow uses environments:
```yaml
environment:
  name: ${{ github.event.inputs.stage || 'production' }}
  url: ${{ steps.deploy.outputs.url }}
```

This provides:
- Deployment approval gates (if configured)
- Deployment URLs in GitHub UI
- Deployment history

---

## Debugging Failed Workflows

### Check Logs

1. Go to **Actions** tab
2. Click the failed workflow run
3. Click the failed job
4. Expand failed steps to see detailed logs

### Common Issues

#### 1. Format Check Fails
```bash
# Run locally to fix
pnpm format
```

#### 2. Type Check Fails
```bash
# Run locally to debug
pnpm typecheck
```

#### 3. Tests Fail
```bash
# Run locally with verbose output
pnpm test
```

#### 4. Build Fails
```bash
# Run locally
pnpm build
```

#### 5. Deployment Fails - AWS Credentials
- Check that `AWS_ROLE_ARN` secret is set correctly
- Verify OIDC provider exists in AWS
- Check IAM role trust policy allows GitHub Actions

#### 6. Deployment Fails - Permissions
- Ensure IAM role/user has sufficient permissions
- SST typically needs `AdministratorAccess` (or specific permissions for CloudFormation, Lambda, S3, CloudFront, etc.)

---

## Best Practices

### 1. Always Run CI Locally First
Before pushing, run these commands:
```bash
pnpm format      # Format code
pnpm lint        # Check for errors
pnpm typecheck   # Type check
pnpm test        # Run tests
pnpm build       # Build packages
```

### 2. Use Meaningful Commit Messages
Good CI/CD relies on clear commit history:
```bash
✅ "feat: add user authentication"
✅ "fix: resolve todo deletion bug"
✅ "chore: upgrade dependencies"
❌ "fix stuff"
❌ "wip"
```

### 3. Keep PRs Small
- Smaller PRs = faster CI runs
- Easier to review
- Less likely to fail

### 4. Monitor CI Performance
- Check workflow run times in **Actions** tab
- If CI takes >5 minutes, consider:
  - Splitting jobs
  - Improving caching
  - Reducing test suite

### 5. Protect Main Branch
In GitHub settings:
1. Go to **Settings** → **Branches**
2. Add rule for `main` branch
3. Enable:
   - ✅ Require pull request reviews
   - ✅ Require status checks (CI) to pass
   - ✅ Require branches to be up to date

---

## Cost Optimization

### GitHub Actions Minutes

Free tier includes:
- **Public repos:** Unlimited minutes
- **Private repos:** 2,000 minutes/month

### Reducing CI Minutes

1. **Use caching** (already implemented)
2. **Cancel in-progress runs** (already implemented)
3. **Run jobs in parallel** (already implemented)
4. **Skip CI on docs-only changes:**
```yaml
on:
  pull_request:
    paths-ignore:
      - '**.md'
      - 'docs/**'
```

### AWS Costs

Deployments with SST incur AWS costs:
- Lambda invocations
- S3 storage
- CloudFront bandwidth
- CloudFormation (free)

**Tip:** Use `sst remove` to delete resources when not needed:
```bash
pnpm --filter infra remove --stage dev
```

---

## Rollback Strategy

If a deployment fails or introduces bugs:

### 1. Revert the Commit
```bash
git revert <commit-hash>
git push origin main
```
This triggers a new deployment with the reverted code.

### 2. Manual Rollback
```bash
# Checkout previous good commit
git checkout <previous-commit>

# Deploy manually
cd infra
pnpm sst deploy --stage production
```

### 3. Use GitHub Deployments UI
1. Go to **Code** → **Deployments**
2. Find previous successful deployment
3. Click **Redeploy**

---

## Monitoring and Notifications

### Slack Notifications (Optional)

Add this step to workflows:
```yaml
- name: Slack notification
  if: failure()
  uses: slackapi/slack-github-action@v1
  with:
    webhook-url: ${{ secrets.SLACK_WEBHOOK }}
    payload: |
      {
        "text": "❌ Deployment failed: ${{ github.repository }}"
      }
```

### Email Notifications

GitHub sends email notifications by default:
- Configure in **Settings** → **Notifications**
- Can enable/disable per repository

---

## Security Considerations

### 1. Never Commit Secrets
- ❌ No `.env` files with credentials
- ❌ No hardcoded API keys
- ✅ Use GitHub Secrets

### 2. Use OIDC Over Access Keys
- More secure
- No credential rotation needed
- Temporary credentials

### 3. Scope Permissions
Don't use `AdministratorAccess` if possible. Use specific permissions:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "cloudformation:*",
        "s3:*",
        "lambda:*",
        "iam:*",
        "cloudfront:*"
      ],
      "Resource": "*"
    }
  ]
}
```

### 4. Enable Branch Protection
- Require PR reviews
- Require CI to pass
- Prevent force pushes

---

## Troubleshooting SST Deployments

### Issue: "Unable to find credentials"
**Solution:** Check AWS authentication step in workflow

### Issue: "Stack already exists"
**Solution:** SST maintains state. If corrupted:
```bash
# Remove state and redeploy
pnpm sst remove
pnpm sst deploy
```

### Issue: "Exceeded Lambda deployment package size"
**Solution:** Check bundle size, ensure AWS SDK is external:
```typescript
// sst.config.ts
nodejs: {
  esbuild: {
    external: ["@aws-sdk/*"],
  }
}
```

---

## Next Steps

After setting up CI/CD:

1. **Test the CI workflow**
   - Create a test PR
   - Verify all jobs pass
   - Check execution time

2. **Test the deploy workflow**
   - Merge to `main` or trigger manually
   - Verify deployment succeeds
   - Check application works

3. **Configure GitHub branch protection**
   - Require CI to pass before merge
   - Require reviews (if team)

4. **Set up monitoring**
   - CloudWatch for Lambda
   - Error tracking (Sentry, etc.)
   - Uptime monitoring

5. **Add more checks** (optional)
   - Security scanning (Snyk, Dependabot)
   - License checking
   - Bundle size limits
   - Performance budgets

---

## Additional Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [SST Deployment Guide](https://sst.dev/docs/deployment)
- [AWS OIDC Setup Guide](https://docs.github.com/en/actions/deployment/security-hardening-your-deployments/configuring-openid-connect-in-amazon-web-services)
- [pnpm Action](https://github.com/pnpm/action-setup)

---

*This CI/CD pipeline was set up following best practices for serverless applications with Effect-TS and SST v3.*
