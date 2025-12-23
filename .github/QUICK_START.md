# Quick Start Guide - 5 Minutes to CI/CD

**Goal:** Get your CI/CD pipeline running in 5 simple steps.

---

## Prerequisites

- [ ] AWS Account (free tier is fine)
- [ ] GitHub Account
- [ ] Code already committed locally

---

## Step 1: Push to GitHub (2 minutes)

```bash
# Go to github.com and create a new repository named: effect-serverless-todo

# Add the remote (replace YOUR_USERNAME)
git remote add origin https://github.com/YOUR_USERNAME/effect-serverless-todo.git

# Push your code
git push -u origin main
```

**✅ Verify:** Your code appears on GitHub

---

## Step 2: Create AWS Access Keys (2 minutes)

**Fastest way to get started:**

1. Go to [IAM Console](https://console.aws.amazon.com/iam/)
2. Click **Users** → **Create user**
3. Name: `github-actions`
4. Click **Next** → Attach **AdministratorAccess** → **Create user**
5. Click on the user → **Security credentials** → **Create access key**
6. Choose **"Application running outside AWS"** → **Create**
7. **Copy both keys immediately!**

---

## Step 3: Add Secrets to GitHub (1 minute)

1. Go to your GitHub repo → **Settings** → **Secrets and variables** → **Actions**
2. Click **New repository secret** (do this twice):

**Secret 1:**
- Name: `AWS_ACCESS_KEY_ID`
- Value: (paste access key ID)

**Secret 2:**
- Name: `AWS_SECRET_ACCESS_KEY`
- Value: (paste secret access key)

---

## Step 4: Update Deploy Workflow (30 seconds)

Edit `.github/workflows/deploy.yml` - find this section (around line 53):

**Comment out OIDC (add #):**
```yaml
      # - name: Configure AWS credentials
      #   uses: aws-actions/configure-aws-credentials@v4
      #   with:
      #     role-to-assume: ${{ secrets.AWS_ROLE_ARN }}
      #     aws-region: eu-central-1
```

**Uncomment access keys (remove #):**
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
git commit -m "chore: configure AWS access keys"
git push
```

---

## Step 5: Test It! (30 seconds)

**Create a test PR:**
```bash
git checkout -b test/ci
echo "// test" >> apps/backend/src/index.ts
git add .
git commit -m "test: CI workflow"
git push -u origin test/ci
```

**On GitHub:**
1. Go to your repo → **Pull requests** → **New pull request**
2. Create PR from `test/ci` to `main`
3. Watch the checks run! ✨

**Expected:** 3 green checkmarks (quality, test, build)

---

## 🎉 You're Done!

**What you have now:**
- ✅ Automated testing on every PR
- ✅ Automated deployment when merging to main
- ✅ Production-ready CI/CD pipeline

**Test deployment:**
```bash
# Go to Actions tab → Deploy → Run workflow
# OR merge your PR to trigger auto-deployment
```

---

## Next Steps

**For detailed setup:**
- See [SETUP_CHECKLIST.md](SETUP_CHECKLIST.md) - Full step-by-step guide
- See [CICD_SETUP.md](CICD_SETUP.md) - Technical details

**For production:**
- Switch to OIDC authentication (more secure)
- Enable branch protection
- Add staging environment
- Configure monitoring

---

## Troubleshooting

**CI fails?**
```bash
# Run locally to debug
pnpm lint
pnpm test
pnpm build
```

**Deploy fails?**
- Check AWS secrets are set correctly
- Verify IAM user has AdministratorAccess
- Check workflow logs in Actions tab

**Need help?** See [SETUP_CHECKLIST.md](SETUP_CHECKLIST.md) for detailed troubleshooting

---

**Total setup time: ~5 minutes** ⏱️
