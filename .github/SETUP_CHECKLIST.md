# Setup Checklist - Getting Your CI/CD Pipeline Running

This checklist will guide you through setting up the complete CI/CD pipeline for your Effect Serverless Todo application.

---

## ✅ Step 1: Push Code to GitHub

### 1.1 Create GitHub Repository

**If you don't have a GitHub repository yet:**

1. Go to [github.com](https://github.com)
2. Click the **"+"** icon → **"New repository"**
3. Name it: `effect-serverless-todo`
4. Choose **Public** or **Private**
5. **Do NOT** initialize with README, .gitignore, or license (we already have these)
6. Click **"Create repository"**

### 1.2 Connect Local Repository to GitHub

```bash
# Add GitHub remote (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/effect-serverless-todo.git

# Verify remote was added
git remote -v

# Push your code
git push -u origin main
```

**Expected result:**
- Your code is now on GitHub
- You should see all files in the GitHub web interface
- The `.github/workflows/` directory contains `ci.yml` and `deploy.yml`

---

## ✅ Step 2: Choose AWS Authentication Method

You have **two options** for AWS authentication. Choose based on your needs:

### Option A: OIDC (Recommended for Production) ⭐

**Pros:**
- ✅ More secure (temporary credentials)
- ✅ No credential rotation needed
- ✅ Industry best practice

**Cons:**
- ❌ More initial setup
- ❌ Requires AWS CLI or Console access

**When to choose:** Production deployments, team projects, security-conscious environments

### Option B: Access Keys (Simpler for Getting Started)

**Pros:**
- ✅ Easier setup
- ✅ Works immediately
- ✅ Good for learning/testing

**Cons:**
- ❌ Long-lived credentials
- ❌ Requires manual rotation
- ❌ Less secure

**When to choose:** Personal projects, quick testing, learning

---

## ✅ Step 3A: Setup AWS OIDC Authentication (Option A)

Follow these steps if you chose OIDC:

### 3A.1 Create OIDC Provider in AWS

**Via AWS Console:**

1. Go to [IAM Console](https://console.aws.amazon.com/iam/)
2. Click **"Identity providers"** → **"Add provider"**
3. Select **"OpenID Connect"**
4. Enter provider URL: `https://token.actions.githubusercontent.com`
5. Click **"Get thumbprint"**
6. Add audience: `sts.amazonaws.com`
7. Click **"Add provider"**

**Via AWS CLI:**

```bash
aws iam create-open-id-connect-provider \
  --url https://token.actions.githubusercontent.com \
  --client-id-list sts.amazonaws.com \
  --thumbprint-list 6938fd4d98bab03faadb97b34396831e3780aea1
```

### 3A.2 Create IAM Role for GitHub Actions

**Create trust policy file** (`github-trust-policy.json`):

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
          "token.actions.githubusercontent.com:sub": "repo:YOUR_USERNAME/effect-serverless-todo:*"
        }
      }
    }
  ]
}
```

**Replace:**
- `YOUR_ACCOUNT_ID` with your AWS account ID (find it in AWS Console top-right)
- `YOUR_USERNAME` with your GitHub username

**Create the role:**

```bash
# Create role
aws iam create-role \
  --role-name GitHubActionsDeployRole \
  --assume-role-policy-document file://github-trust-policy.json

# Attach AdministratorAccess policy (SST needs broad permissions)
aws iam attach-role-policy \
  --role-name GitHubActionsDeployRole \
  --policy-arn arn:aws:iam::aws:policy/AdministratorAccess
```

**Get the role ARN:**

```bash
aws iam get-role --role-name GitHubActionsDeployRole --query 'Role.Arn' --output text
```

Copy this ARN - you'll need it for GitHub secrets!

### 3A.3 Add GitHub Secret

1. Go to your GitHub repository
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **"New repository secret"**
4. Name: `AWS_ROLE_ARN`
5. Value: Paste the role ARN from above (e.g., `arn:aws:iam::123456789012:role/GitHubActionsDeployRole`)
6. Click **"Add secret"**

**✅ OIDC Setup Complete!** Skip to Step 4.

---

## ✅ Step 3B: Setup AWS Access Keys Authentication (Option B)

Follow these steps if you chose Access Keys:

### 3B.1 Create IAM User

**Via AWS Console:**

1. Go to [IAM Console](https://console.aws.amazon.com/iam/)
2. Click **"Users"** → **"Create user"**
3. Username: `github-actions-deploy`
4. Click **"Next"**
5. Select **"Attach policies directly"**
6. Search and select **"AdministratorAccess"**
7. Click **"Next"** → **"Create user"**

**Via AWS CLI:**

```bash
# Create user
aws iam create-user --user-name github-actions-deploy

# Attach AdministratorAccess policy
aws iam attach-user-policy \
  --user-name github-actions-deploy \
  --policy-arn arn:aws:iam::aws:policy/AdministratorAccess
```

### 3B.2 Create Access Keys

**Via AWS Console:**

1. Click on the user you just created
2. Go to **"Security credentials"** tab
3. Scroll to **"Access keys"**
4. Click **"Create access key"**
5. Choose **"Application running outside AWS"**
6. Click **"Next"** → **"Create access key"**
7. **Important:** Copy both the **Access Key ID** and **Secret Access Key** immediately!

**Via AWS CLI:**

```bash
aws iam create-access-key --user-name github-actions-deploy
```

Copy the `AccessKeyId` and `SecretAccessKey` from the output.

### 3B.3 Add GitHub Secrets

1. Go to your GitHub repository
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Add **two** secrets:

**Secret 1:**
- Name: `AWS_ACCESS_KEY_ID`
- Value: Your access key ID

**Secret 2:**
- Name: `AWS_SECRET_ACCESS_KEY`
- Value: Your secret access key

### 3B.4 Update Deploy Workflow

Edit `.github/workflows/deploy.yml`:

**Comment out the OIDC authentication:**
```yaml
# - name: Configure AWS credentials
#   uses: aws-actions/configure-aws-credentials@v4
#   with:
#     role-to-assume: ${{ secrets.AWS_ROLE_ARN }}
#     aws-region: eu-central-1
```

**Uncomment the access key authentication:**
```yaml
- name: Configure AWS credentials
  uses: aws-actions/configure-aws-credentials@v4
  with:
    aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
    aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
    aws-region: eu-central-1
```

**Commit and push:**
```bash
git add .github/workflows/deploy.yml
git commit -m "chore: switch to access key authentication for AWS"
git push
```

**✅ Access Keys Setup Complete!**

---

## ✅ Step 4: Enable Branch Protection (Recommended)

Protect your `main` branch to enforce CI checks before merging:

### 4.1 Configure Branch Protection

1. Go to your GitHub repository
2. Click **Settings** → **Branches**
3. Under "Branch protection rules", click **"Add rule"**
4. Branch name pattern: `main`
5. Enable these settings:
   - ✅ **Require a pull request before merging**
     - Optional: Require approvals (if you have teammates)
   - ✅ **Require status checks to pass before merging**
     - Search and add: `quality`, `test`, `build` (these are the CI jobs)
   - ✅ **Require branches to be up to date before merging**
   - ✅ **Do not allow bypassing the above settings** (optional but recommended)
6. Click **"Create"**

**What this does:**
- Forces all changes to go through pull requests
- CI must pass before merging
- Prevents accidental direct pushes to `main`

---

## ✅ Step 5: Test the CI Workflow

Now let's verify the CI pipeline works!

### 5.1 Create a Test Branch

```bash
# Create and switch to a test branch
git checkout -b test/ci-workflow

# Make a small change (add a comment to any file)
echo "// CI test" >> apps/backend/src/index.ts

# Commit the change
git add apps/backend/src/index.ts
git commit -m "test: trigger CI workflow"

# Push the branch
git push -u origin test/ci-workflow
```

### 5.2 Create Pull Request

1. Go to your GitHub repository
2. You'll see a banner **"Compare & pull request"** - click it
3. OR: Click **"Pull requests"** → **"New pull request"**
4. Base: `main`, Compare: `test/ci-workflow`
5. Title: "Test CI workflow"
6. Click **"Create pull request"**

### 5.3 Watch CI Run

1. On the PR page, you'll see checks running at the bottom
2. Click **"Details"** next to any check to see logs
3. Go to **Actions** tab to see all workflow runs
4. You should see 3 jobs running in parallel:
   - ✅ quality (format, lint, typecheck)
   - ✅ test (unit tests)
   - ✅ build (production builds)

**Expected result:**
- All 3 jobs complete successfully (green checkmarks)
- PR shows "All checks have passed"
- Total time: ~1-2 minutes

**If any job fails:**
- Click **"Details"** to see the error
- Fix the issue locally
- Commit and push - CI runs again automatically

### 5.4 Clean Up Test PR

Once CI passes:
```bash
# Switch back to main
git checkout main

# Delete test branch locally
git branch -D test/ci-workflow

# Delete on GitHub (via PR page "Close pull request" + "Delete branch")
```

---

## ✅ Step 6: Test Deployment Workflow (Optional)

**⚠️ Warning:** This will deploy to AWS and may incur costs (though minimal on free tier).

### Option 1: Manual Deployment Trigger (Safer)

1. Go to **Actions** tab in GitHub
2. Click **"Deploy"** workflow in the left sidebar
3. Click **"Run workflow"** dropdown
4. Keep stage as `production`
5. Click **"Run workflow"** button
6. Watch the deployment progress

**Expected result:**
- Workflow completes successfully
- You'll see deployment URLs in the logs
- Frontend and backend are deployed to AWS

### Option 2: Automatic Deployment (Merge to Main)

**Only do this when you're ready to deploy:**

1. Create a feature branch
2. Make changes
3. Create PR
4. Wait for CI to pass
5. Merge PR to `main`
6. Deployment automatically triggers

### 6.1 Access Your Deployed Application

After deployment succeeds:

1. Check the workflow output for URLs
2. Or run locally:
```bash
cd infra
pnpm sst url Frontend
pnpm sst url Api
```

3. Open the frontend URL in your browser
4. Your todo app should be live!

---

## ✅ Step 7: Verify Everything Works

### 7.1 Checklist

- [ ] Code is pushed to GitHub
- [ ] AWS authentication is configured (OIDC or access keys)
- [ ] GitHub secrets are set
- [ ] CI workflow runs on PRs
- [ ] All CI jobs pass (quality, test, build)
- [ ] Branch protection is enabled (optional but recommended)
- [ ] Deployment workflow is configured
- [ ] Application deploys successfully (if tested)
- [ ] Frontend and backend are accessible (if deployed)

### 7.2 Quick Test Commands

**Test CI locally before pushing:**
```bash
# Run all checks that CI will run
pnpm format:check  # Format check
pnpm lint          # Linting
pnpm typecheck     # Type checking
pnpm test          # Tests
pnpm build         # Build
```

**Deploy locally (without CI/CD):**
```bash
cd infra
pnpm sst deploy --stage dev
```

---

## 🎯 Common Issues & Solutions

### Issue: "remote: Permission denied"

**Problem:** Can't push to GitHub

**Solution:**
```bash
# If using HTTPS, configure credentials
git config credential.helper store

# Or switch to SSH
git remote set-url origin git@github.com:YOUR_USERNAME/effect-serverless-todo.git
```

### Issue: CI fails with "command not found"

**Problem:** Missing dependencies in CI

**Solution:** Check `pnpm-lock.yaml` is committed:
```bash
git add pnpm-lock.yaml
git commit -m "chore: add pnpm lockfile"
git push
```

### Issue: Deploy fails with "Unable to locate credentials"

**Problem:** GitHub secrets not configured correctly

**Solution:**
- Double-check secret names are exactly: `AWS_ROLE_ARN` or `AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY`
- Verify no extra spaces in secret values
- Re-create secrets if needed

### Issue: SST deployment fails

**Problem:** Insufficient AWS permissions

**Solution:**
- Ensure IAM role/user has `AdministratorAccess`
- Or grant specific permissions: CloudFormation, Lambda, S3, CloudFront, IAM

### Issue: "Branch protection" prevents push to main

**Problem:** Accidentally pushed directly to main

**Solution:**
- This is actually good! It's working as intended
- Create a branch instead:
```bash
git checkout -b feature/my-changes
git push -u origin feature/my-changes
# Then create a PR
```

---

## 📚 Next Steps After Setup

Once your CI/CD is working:

1. **Add DynamoDB** for persistent storage (currently in-memory)
2. **Implement authentication** (Cognito, Auth0, etc.)
3. **Configure CORS** properly (currently wide-open)
4. **Add monitoring** (CloudWatch, Sentry)
5. **Set up staging environment**
6. **Add E2E tests** (Playwright)
7. **Configure custom domain** (Route53 + ACM)

---

## 🆘 Need Help?

- **CI/CD Setup Details**: See [.github/CICD_SETUP.md](.github/CICD_SETUP.md)
- **Developer Notes**: See [DEVELOPER_DIARY.md](../DEVELOPER_DIARY.md)
- **SST Documentation**: https://sst.dev/docs
- **GitHub Actions Docs**: https://docs.github.com/en/actions
- **AWS OIDC Guide**: https://docs.github.com/en/actions/deployment/security-hardening-your-deployments/configuring-openid-connect-in-amazon-web-services

---

**✨ You're all set! Your Effect Serverless Todo app now has a production-ready CI/CD pipeline!**
