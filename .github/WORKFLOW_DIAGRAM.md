# CI/CD Workflow Diagram

This document visualizes how the CI/CD pipeline works.

---

## Complete Development Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                     Developer Workflow                               │
└─────────────────────────────────────────────────────────────────────┘

1. Developer writes code locally
   ↓
2. Creates feature branch
   │
   git checkout -b feature/new-todo-feature
   │
   ↓
3. Makes changes, commits
   │
   git add .
   git commit -m "feat: add todo priority"
   │
   ↓
4. Pushes to GitHub
   │
   git push -u origin feature/new-todo-feature
   │
   ↓
5. Creates Pull Request on GitHub
   │
   └──────────────────────────────────────────────────┐
                                                       │
   ┌───────────────────────────────────────────────────┘
   ↓
┌──────────────────────────────────────────────────────────────┐
│                   CI Workflow Triggers                        │
│                  (.github/workflows/ci.yml)                   │
└──────────────────────────────────────────────────────────────┘
   │
   ├─────────────────┬──────────────────┬─────────────────┐
   │                 │                  │                 │
   ↓                 ↓                  ↓                 ↓
┌──────┐       ┌──────────┐      ┌──────────┐      ┌──────────┐
│ Job 1│       │  Job 2   │      │  Job 3   │      │  (All    │
│Quality│       │  Test    │      │  Build   │      │  run in  │
└──────┘       └──────────┘      └──────────┘      │ parallel)│
   │                 │                  │           └──────────┘
   │                 │                  │
   ↓                 ↓                  ↓
Format          Unit Tests       Build all
Lint            Coverage         packages
Typecheck       Report           Check sizes
   │                 │                  │
   └────────────┬────┴──────────────────┘
                ↓
         ┌─────────────┐
         │ All Passed? │
         └─────────────┘
                │
      ┌─────────┴──────────┐
      │                    │
     Yes                  No
      │                    │
      ↓                    ↓
  ✅ PR Ready        ❌ Fix Issues
      │                    │
      │                    └──► Developer fixes → Push again → CI reruns
      │
      ↓
  Code Review
      │
      ↓
  Merge PR to main
      │
      └──────────────────────────────────────────────────┐
                                                          │
   ┌──────────────────────────────────────────────────────┘
   ↓
┌──────────────────────────────────────────────────────────────┐
│               Deploy Workflow Triggers                        │
│              (.github/workflows/deploy.yml)                   │
└──────────────────────────────────────────────────────────────┘
   │
   ↓
┌──────────────┐
│ Checkout     │
│ Code         │
└──────────────┘
   ↓
┌──────────────┐
│ Install      │
│ Dependencies │
│ (cached)     │
└──────────────┘
   ↓
┌──────────────┐
│ Authenticate │
│ with AWS     │
│ (OIDC or     │
│ Access Keys) │
└──────────────┘
   ↓
┌──────────────┐
│ SST Deploy   │
│ - Backend    │
│ - Frontend   │
│ - Infra      │
└──────────────┘
   ↓
┌──────────────┐
│ Deployment   │
│ Success! ✅  │
└──────────────┘
   ↓
┌──────────────┐
│ Frontend URL:│
│ https://...  │
│              │
│ Backend URL: │
│ https://...  │
└──────────────┘
```

---

## CI Workflow Detailed Breakdown

```
┌─────────────────────────────────────────────────────────────┐
│               CI Workflow (Pull Request)                     │
└─────────────────────────────────────────────────────────────┘

Trigger: Pull request to main or develop
Runner: ubuntu-latest (GitHub-hosted)
Strategy: Parallel execution (3 jobs)

┌──────────────────────────────────────────────────────────────┐
│                      Job 1: Quality                           │
├──────────────────────────────────────────────────────────────┤
│ ⏱️  Duration: ~30-60 seconds                                  │
│                                                               │
│ 1. Checkout code                                              │
│    └─> actions/checkout@v4                                    │
│                                                               │
│ 2. Setup pnpm                                                 │
│    └─> pnpm/action-setup@v2 (version 9)                       │
│                                                               │
│ 3. Setup Node.js + Cache                                      │
│    └─> actions/setup-node@v4 (Node 20)                        │
│    └─> Restore pnpm cache (~200MB)                            │
│                                                               │
│ 4. Install dependencies                                       │
│    └─> pnpm install --frozen-lockfile                         │
│                                                               │
│ 5. Format check                                               │
│    └─> pnpm run format:check                                  │
│    └─> Prettier validates all files                           │
│                                                               │
│ 6. Lint                                                       │
│    └─> pnpm run lint                                          │
│    └─> ESLint checks all packages                             │
│                                                               │
│ 7. Type check                                                 │
│    └─> pnpm run typecheck                                     │
│    └─> TypeScript validates across all packages               │
│                                                               │
│ ✅ Result: Code quality verified                              │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│                      Job 2: Test                              │
├──────────────────────────────────────────────────────────────┤
│ ⏱️  Duration: ~30-45 seconds                                  │
│                                                               │
│ 1-4. Same as Job 1 (checkout, setup, install)                │
│                                                               │
│ 5. Run tests                                                  │
│    └─> pnpm run test                                          │
│    └─> Vitest runs all unit tests                             │
│    └─> Generates coverage report                              │
│                                                               │
│ 6. Upload coverage (optional)                                 │
│    └─> codecov/codecov-action@v4                              │
│    └─> Sends coverage to Codecov (if configured)              │
│                                                               │
│ ✅ Result: All tests passing                                  │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│                      Job 3: Build                             │
├──────────────────────────────────────────────────────────────┤
│ ⏱️  Duration: ~45-60 seconds                                  │
│                                                               │
│ 1-4. Same as Job 1 (checkout, setup, install)                │
│                                                               │
│ 5. Build all packages                                         │
│    └─> pnpm run build                                         │
│    ├─> Backend: esbuild → dist/index.js                       │
│    ├─> Frontend: vite build → dist/                           │
│    └─> Shared: tsc → dist/                                    │
│                                                               │
│ 6. Check bundle size                                          │
│    └─> ls -lh apps/backend/dist/                              │
│    └─> du -sh apps/frontend/dist/                             │
│                                                               │
│ ✅ Result: Production builds succeed                          │
└──────────────────────────────────────────────────────────────┘

All 3 jobs run in parallel
Total time: ~1-2 minutes (limited by slowest job)
```

---

## Deploy Workflow Detailed Breakdown

```
┌─────────────────────────────────────────────────────────────┐
│             Deploy Workflow (Production)                     │
└─────────────────────────────────────────────────────────────┘

Trigger: Push to main OR manual dispatch
Runner: ubuntu-latest (GitHub-hosted)
Permissions: id-token:write, contents:read

┌──────────────────────────────────────────────────────────────┐
│                   Deployment Steps                            │
├──────────────────────────────────────────────────────────────┤
│ ⏱️  Duration: ~3-8 minutes                                    │
│                                                               │
│ 1. Checkout code                                              │
│    └─> actions/checkout@v4                                    │
│                                                               │
│ 2. Setup pnpm                                                 │
│    └─> pnpm/action-setup@v2                                   │
│                                                               │
│ 3. Setup Node.js + Cache                                      │
│    └─> actions/setup-node@v4                                  │
│                                                               │
│ 4. Install dependencies                                       │
│    └─> pnpm install --frozen-lockfile                         │
│                                                               │
│ 5. Configure AWS credentials                                  │
│    └─> aws-actions/configure-aws-credentials@v4               │
│    │                                                          │
│    ├─> Option A: OIDC                                         │
│    │   └─> Assumes role via Web Identity                      │
│    │   └─> Gets temporary credentials (1 hour)                │
│    │                                                          │
│    └─> Option B: Access Keys                                  │
│        └─> Uses long-lived credentials                        │
│                                                               │
│ 6. Deploy to AWS                                              │
│    └─> cd infra && pnpm sst deploy                            │
│    │                                                          │
│    ├─> SST analyzes infrastructure                            │
│    ├─> Creates/updates CloudFormation stack                   │
│    ├─> Bundles Lambda function (esbuild)                      │
│    ├─> Uploads Lambda code to S3                              │
│    ├─> Deploys Lambda function                                │
│    ├─> Creates Function URL                                   │
│    ├─> Builds frontend (Vite)                                 │
│    ├─> Uploads frontend to S3                                 │
│    ├─> Creates/updates CloudFront distribution                │
│    └─> Outputs deployment URLs                                │
│                                                               │
│ 7. Capture outputs                                            │
│    └─> Frontend URL → $GITHUB_OUTPUT                          │
│    └─> API URL → $GITHUB_OUTPUT                               │
│                                                               │
│ 8. Notify success                                             │
│    └─> Echo deployment URLs                                   │
│                                                               │
│ ✅ Result: Application deployed to AWS                        │
└──────────────────────────────────────────────────────────────┘
```

---

## AWS Resources Created by SST

```
┌─────────────────────────────────────────────────────────────┐
│              AWS Infrastructure (SST Deploy)                 │
└─────────────────────────────────────────────────────────────┘

CloudFormation Stack: effect-serverless-todo-production
Region: eu-central-1

┌──────────────────────────────────────────────────────────────┐
│                      Backend (API)                            │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│ ┌─────────────────────┐                                      │
│ │  Lambda Function    │                                      │
│ │  Name: Api          │                                      │
│ │  Runtime: Node 20   │                                      │
│ │  Memory: 512 MB     │                                      │
│ │  Timeout: 30s       │                                      │
│ └─────────────────────┘                                      │
│          │                                                    │
│          ↓                                                    │
│ ┌─────────────────────┐                                      │
│ │  Function URL       │                                      │
│ │  (Public HTTPS)     │                                      │
│ │  https://xxx.lambda-url.eu-central-1.on.aws/              │
│ └─────────────────────┘                                      │
│                                                               │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│                    Frontend (Static Site)                     │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│ ┌─────────────────────┐                                      │
│ │  S3 Bucket          │                                      │
│ │  (Static hosting)   │                                      │
│ │  - index.html       │                                      │
│ │  - assets/          │                                      │
│ └─────────────────────┘                                      │
│          │                                                    │
│          ↓                                                    │
│ ┌─────────────────────┐                                      │
│ │  CloudFront         │                                      │
│ │  (CDN)              │                                      │
│ │  https://xxx.cloudfront.net                               │
│ └─────────────────────┘                                      │
│                                                               │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│                    Supporting Resources                       │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│ • IAM Roles (Lambda execution role)                          │
│ • CloudWatch Log Groups (Lambda logs)                        │
│ • S3 Bucket (SST assets)                                     │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

---

## Workflow Triggers Summary

```
┌─────────────────────────────────────────────────────────────┐
│                   When Workflows Run                         │
└─────────────────────────────────────────────────────────────┘

Event                           CI Workflow    Deploy Workflow
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Open PR to main                      ✅              ❌
Open PR to develop                   ✅              ❌
Push to PR branch                    ✅              ❌
Push to develop directly             ✅              ❌
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Merge PR to main                     ❌              ✅
Push to main directly                ❌              ✅
Manual trigger                       ❌              ✅
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## Concurrency Behavior

```
┌─────────────────────────────────────────────────────────────┐
│            CI Workflow Concurrency                           │
│         (cancel-in-progress: true)                           │
└─────────────────────────────────────────────────────────────┘

Scenario: Push to PR, then push again before CI finishes

Time →
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
0:00    Push commit A
        └─> CI Run #1 starts
0:30    Push commit B (while Run #1 still running)
        ├─> CI Run #1 CANCELED ❌
        └─> CI Run #2 starts
1:30    CI Run #2 completes ✅

Result: Only latest commit is tested (saves CI minutes)


┌─────────────────────────────────────────────────────────────┐
│          Deploy Workflow Concurrency                         │
│         (cancel-in-progress: false)                          │
└─────────────────────────────────────────────────────────────┘

Scenario: Two deployments triggered close together

Time →
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
0:00    Merge PR #1 to main
        └─> Deploy #1 starts
2:00    Merge PR #2 to main (while Deploy #1 still running)
        └─> Deploy #2 QUEUED (waits) ⏸️
5:00    Deploy #1 completes ✅
5:01    Deploy #2 starts (from queue)
8:01    Deploy #2 completes ✅

Result: Deployments run sequentially (prevents conflicts)
```

---

## Caching Strategy

```
┌─────────────────────────────────────────────────────────────┐
│              pnpm Cache Behavior                             │
└─────────────────────────────────────────────────────────────┘

Cache Key: Based on pnpm-lock.yaml hash
Cache Location: ~/.pnpm-store
Cache Size: ~200-500 MB

┌──────────────────┐
│  First CI Run    │
│  (Cache Miss)    │
└──────────────────┘
    │
    ↓
┌───────────────────────────────────┐
│ 1. Restore cache: Not found ❌    │
│ 2. pnpm install: ~2-5 minutes     │
│ 3. Save cache: ~30 seconds        │
└───────────────────────────────────┘
    │
    Total: ~3-5 minutes

┌──────────────────┐
│ Subsequent Runs  │
│  (Cache Hit)     │
└──────────────────┘
    │
    ↓
┌───────────────────────────────────┐
│ 1. Restore cache: Found ✅        │
│    └─> Restores in ~10 seconds   │
│ 2. pnpm install: ~20 seconds      │
│    └─> Only links, no downloads  │
│ 3. Save cache: Skipped (no change)│
└───────────────────────────────────┘
    │
    Total: ~30-45 seconds

Cache Invalidation: When pnpm-lock.yaml changes
└─> New cache is created automatically
```

---

## Security Flow (OIDC)

```
┌─────────────────────────────────────────────────────────────┐
│        OIDC Authentication Flow (Recommended)                │
└─────────────────────────────────────────────────────────────┘

┌──────────────┐
│   GitHub     │
│   Actions    │
└──────────────┘
      │
      │ 1. Workflow needs AWS access
      ↓
┌────────────────────────────────┐
│ Request OIDC token from GitHub │
│ Token includes:                │
│ - Repository: YOUR_ORG/REPO    │
│ - Branch: main                 │
│ - Workflow: deploy.yml         │
└────────────────────────────────┘
      │
      │ 2. Send token to AWS STS
      ↓
┌────────────────────────────────┐
│ AWS STS validates:             │
│ ✓ Token signature valid        │
│ ✓ Token not expired            │
│ ✓ Repository matches policy    │
│ ✓ OIDC provider trusted        │
└────────────────────────────────┘
      │
      │ 3. Assume IAM role
      ↓
┌────────────────────────────────┐
│ AWS returns temporary creds:   │
│ - AccessKeyId (temp)           │
│ - SecretAccessKey (temp)       │
│ - SessionToken                 │
│ - Expiration (1 hour)          │
└────────────────────────────────┘
      │
      │ 4. Use credentials
      ↓
┌────────────────────────────────┐
│ Deploy with SST                │
│ - Create resources             │
│ - Update infrastructure        │
└────────────────────────────────┘

Benefits:
✅ No long-lived secrets in GitHub
✅ Credentials expire after 1 hour
✅ Audit trail in AWS CloudTrail
✅ Fine-grained access control
```

---

This diagram helps you visualize the entire CI/CD pipeline flow!
