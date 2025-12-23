# GitHub Actions Documentation

This directory contains the CI/CD pipeline configuration and comprehensive setup guides.

---

## 🚀 Quick Navigation

### **Just Want to Get Started?**
👉 **[../NEXT_STEPS.md](../NEXT_STEPS.md)** - Start here! Complete action plan

---

## 📚 Documentation Files

### 1. **Workflows** (The Actual CI/CD)
- **[workflows/ci.yml](workflows/ci.yml)** - Pull request validation (quality, test, build)
- **[workflows/deploy.yml](workflows/deploy.yml)** - AWS deployment automation

### 2. **Setup Guides** (Choose Your Path)
- **[QUICK_START.md](QUICK_START.md)** ⚡ - 5 minutes to get running (recommended for first-time)
- **[SETUP_CHECKLIST.md](SETUP_CHECKLIST.md)** 📋 - Complete step-by-step (recommended for production)

### 3. **Reference Documentation**
- **[CICD_SETUP.md](CICD_SETUP.md)** 🔧 - Technical deep dive, troubleshooting
- **[WORKFLOW_DIAGRAM.md](WORKFLOW_DIAGRAM.md)** 📊 - Visual diagrams of CI/CD flow

---

## 🎯 Which Guide Should I Read?

### I want to get it working FAST (5 minutes)
→ **[QUICK_START.md](QUICK_START.md)**
- Fastest path to running CI/CD
- Uses AWS access keys (simpler)
- Good for learning and testing

### I want the complete setup (15 minutes)
→ **[SETUP_CHECKLIST.md](SETUP_CHECKLIST.md)**
- Step-by-step with all options
- Covers both OIDC and access keys
- Includes branch protection setup
- Good for production deployments

### I want to understand HOW it works
→ **[CICD_SETUP.md](CICD_SETUP.md)**
- Technical explanations
- Workflow triggers and caching
- Security considerations
- Troubleshooting guide

### I want to see the BIG PICTURE
→ **[WORKFLOW_DIAGRAM.md](WORKFLOW_DIAGRAM.md)**
- Visual flow diagrams
- Component interactions
- AWS resource architecture

---

## 📋 What's in Each File?

### workflows/ci.yml (119 lines)
**Purpose:** Validates pull requests before merging

**Jobs:**
- ✅ Quality (format, lint, typecheck)
- ✅ Test (unit tests + coverage)
- ✅ Build (production builds)

**Runs on:** Pull requests to `main` or `develop`

---

### workflows/deploy.yml (98 lines)
**Purpose:** Deploys application to AWS

**Steps:**
- Authenticates with AWS (OIDC or access keys)
- Deploys infrastructure with SST
- Deploys frontend to S3 + CloudFront
- Deploys backend to Lambda

**Runs on:** Push to `main` or manual trigger

---

### QUICK_START.md (3.5 KB)
**For:** Getting started fast

**Contents:**
- Prerequisites
- 5 simple steps to CI/CD
- Uses access keys (simplest)
- Basic troubleshooting

**Time:** ~5 minutes to complete

---

### SETUP_CHECKLIST.md (13 KB)
**For:** Complete production setup

**Contents:**
- Push to GitHub
- AWS authentication (OIDC + access keys)
- GitHub secrets configuration
- Branch protection rules
- Testing workflows
- Comprehensive troubleshooting

**Time:** ~15-20 minutes to complete

---

### CICD_SETUP.md (12 KB)
**For:** Technical understanding

**Contents:**
- Detailed workflow explanations
- AWS authentication setup (both methods)
- Secrets management
- Workflow triggers
- Environment configuration
- Caching strategy
- Security best practices
- Cost optimization
- Rollback strategies
- Advanced troubleshooting

**Time:** Reference document (read as needed)

---

### WORKFLOW_DIAGRAM.md (30 KB)
**For:** Visual learners

**Contents:**
- Complete development flow diagram
- CI workflow breakdown
- Deploy workflow breakdown
- AWS resource architecture
- Workflow triggers table
- Concurrency behavior
- Caching strategy visualization
- OIDC authentication flow

**Time:** ~5-10 minutes to read

---

## 🔄 Workflow Overview

```
Developer writes code
        ↓
Creates PR to main
        ↓
┌─────────────────────┐
│   CI Workflow       │  ← .github/workflows/ci.yml
│   (3 parallel jobs) │
└─────────────────────┘
        ↓
   ✅ All checks pass
        ↓
  Merge PR to main
        ↓
┌─────────────────────┐
│  Deploy Workflow    │  ← .github/workflows/deploy.yml
│  (AWS deployment)   │
└─────────────────────┘
        ↓
   🚀 Live on AWS!
```

---

## 🆘 Common Questions

### Q: Which authentication method should I use?

**For quick testing/learning:**
- Use **Access Keys** (easier setup)
- Follow [QUICK_START.md](QUICK_START.md)

**For production:**
- Use **OIDC** (more secure)
- Follow [SETUP_CHECKLIST.md](SETUP_CHECKLIST.md) → Section 3A

### Q: How do I test the CI workflow?

1. Create a test branch
2. Make a small change
3. Push and create PR
4. CI runs automatically

See [SETUP_CHECKLIST.md](SETUP_CHECKLIST.md) → Step 5

### Q: How do I deploy to AWS?

**Option 1: Automatic**
- Merge PR to `main` → deploys automatically

**Option 2: Manual**
- Go to Actions tab → Deploy → Run workflow

See [SETUP_CHECKLIST.md](SETUP_CHECKLIST.md) → Step 6

### Q: What if something fails?

See troubleshooting sections in:
- [CICD_SETUP.md](CICD_SETUP.md) - Detailed debugging
- [SETUP_CHECKLIST.md](SETUP_CHECKLIST.md) - Common issues

---

## 📦 Files Structure

```
.github/
├── README.md                   ← You are here!
├── workflows/
│   ├── ci.yml                  ← PR validation
│   └── deploy.yml              ← AWS deployment
├── QUICK_START.md              ← 5-min setup
├── SETUP_CHECKLIST.md          ← Complete guide
├── CICD_SETUP.md               ← Technical docs
└── WORKFLOW_DIAGRAM.md         ← Visual diagrams
```

---

## 🎯 Next Steps

**Haven't set up yet?**
1. Read [../NEXT_STEPS.md](../NEXT_STEPS.md)
2. Follow [QUICK_START.md](QUICK_START.md) OR [SETUP_CHECKLIST.md](SETUP_CHECKLIST.md)
3. Test your CI/CD pipeline!

**Already set up?**
- Check workflow runs in **Actions** tab
- Review logs if anything fails
- Refer to [CICD_SETUP.md](CICD_SETUP.md) for troubleshooting

---

## 📖 Related Documentation

- **Project Root:** [../NEXT_STEPS.md](../NEXT_STEPS.md) - Complete action plan
- **Development:** [../DEVELOPER_DIARY.md](../DEVELOPER_DIARY.md) - Development log
- **SST Config:** [../infra/sst.config.ts](../infra/sst.config.ts) - Infrastructure code
- **Backend:** [../apps/backend/](../apps/backend/) - Effect-TS Lambda
- **Frontend:** [../apps/frontend/](../apps/frontend/) - React app

---

**🚀 Ready to deploy? Start with [QUICK_START.md](QUICK_START.md)!**
