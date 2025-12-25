# Effect Serverless Todo - Template & Learning Project

A production-ready serverless full-stack application template using **Effect-TS**, **SST v3**, **React**, and **DynamoDB**.

## 🎯 Two Ways to Use This Project

### 1. **As a Template** - Start Your Own Project
Clone this and customize it for your needs. Perfect for bootstrapping serverless apps quickly.

👉 **[See Template Guide →](./TEMPLATE_GUIDE.md)**

### 2. **As a Learning Resource** - Study the Architecture
Explore a real-world Effect-TS + SST implementation with comprehensive documentation.

👉 **[See Developer Diary →](./DEVELOPER_DIARY.md)**

---

## ⚡ Quick Start

### Option A: Use as Template (Automated)

```bash
# 1. Clone this repository
git clone <this-repo> my-new-app
cd my-new-app

# 2. Install dependencies
pnpm install

# 3. Run interactive setup (not yet implemented - use manual setup below)
# pnpm setup-template

# 4. Deploy
cd infra
pnpm sst deploy
```

### Option B: Manual Setup

1. **Fork/Clone** this repository
2. **Find and Replace** across all files:
   - `effect-serverless-todo` → `your-app-name`
   - `@todo` → `@yourscope`
   - `Todo` → `YourEntity`
   - `eu-central-1` → `your-aws-region`

3. **Customize** your entity schema in `packages/shared/src/schemas/`
4. **Install** `pnpm install`
5. **Deploy** `cd infra && pnpm sst deploy`

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────┐
│          Production Architecture             │
├─────────────────────────────────────────────┤
│                                              │
│  CloudFront CDN                              │
│       │                                      │
│       ├──▶ S3 Static Site (React SPA)       │
│       │                                      │
│       └──▶ Lambda Function URL              │
│                  │                           │
│                  ├──▶ DynamoDB              │
│                  │                           │
│                  └──▶ CloudWatch Logs       │
│                                              │
└─────────────────────────────────────────────┘
```

### Tech Stack

**Backend:**
- ⚡ Effect-TS 3.x - Functional TypeScript framework
- 🚀 AWS Lambda (Node.js 20) - Serverless compute
- 📦 DynamoDB - NoSQL database
- 🔧 SST v3 - Infrastructure as Code

**Frontend:**
- ⚛️ React 18 - UI library
- ⚡ Vite 6 - Build tool
- 🎨 TypeScript 5.6 - Type safety

**Shared:**
- 📐 Effect Schema - Runtime validation
- 🏢 pnpm Workspaces - Monorepo management

---

## 📁 Project Structure

```
effect-serverless-todo/
├── apps/
│   ├── backend/              # Lambda function
│   │   ├── src/
│   │   │   ├── index.ts      # Handler (current: simple DynamoDB)
│   │   │   ├── router.ts     # Effect-based router (Effect version)
│   │   │   └── errors.ts     # Tagged errors
│   │   └── services/
│   │       └── TodoRepository.ts  # Service layer with DI
│   │
│   └── frontend/             # React SPA
│       ├── src/
│       │   ├── App.tsx       # Main UI component
│       │   └── api/client.ts # Type-safe API client
│       └── vite.config.ts
│
├── packages/
│   └── shared/               # Shared types & validation
│       └── src/schemas/
│           └── Todo.ts       # Effect Schema definitions
│
├── infra/
│   └── sst.config.ts         # AWS infrastructure definition
│
├── scripts/
│   └── setup-template.ts     # Interactive template customization
│
└── .github/workflows/        # CI/CD pipelines
    ├── ci.yml               # Quality checks
    └── deploy.yml           # AWS deployment
```

---

## 🎓 What Makes This Special?

### 1. **Effect-TS Throughout**
- Type-safe error handling with tagged errors
- Dependency injection with Context/Layer
- Composable effects for business logic
- Runtime validation with Effect Schema

### 2. **Production-Ready Infrastructure**
- Lambda Function URLs (simpler than API Gateway)
- DynamoDB for persistent storage
- CloudFront CDN for global distribution
- GitHub Actions CI/CD
- Comprehensive logging

### 3. **Type Safety End-to-End**
- Shared types prevent frontend/backend drift
- Effect Schema validates at runtime
- No `any` types in production code

### 4. **Monorepo Best Practices**
- pnpm workspaces for efficient dependency management
- TypeScript project references for incremental builds
- Shared package for common code

### 5. **Well-Documented Journey**
- 28 deployments documented
- Every error and solution explained
- Perfect for learning serverless + Effect

---

## 🚀 Features

### Backend (Lambda)
- ✅ Full CRUD API for todos
- ✅ DynamoDB persistence
- ✅ Effect-based error handling
- ✅ Request validation with Effect Schema
- ✅ Dependency injection pattern
- ✅ Comprehensive logging
- ✅ CORS configured
- ✅ Health check endpoint

### Frontend (React)
- ✅ Create, read, update, delete todos
- ✅ Type-safe API client
- ✅ Error handling and display
- ✅ Loading states
- ✅ Health status indicator
- ✅ Responsive design

### Infrastructure (SST)
- ✅ Single command deployment
- ✅ Environment-based configuration
- ✅ Resource linking
- ✅ Automatic HTTPS
- ✅ CloudWatch logging
- ✅ IAM permissions managed

---

## 📚 Documentation

| Document | Description |
|----------|-------------|
| [TEMPLATE_GUIDE.md](./TEMPLATE_GUIDE.md) | How to use this as a template for your project |
| [DEVELOPER_DIARY.md](./DEVELOPER_DIARY.md) | Complete development journey with 28 deployments |
| [QUICK_START.md](./QUICK_START.md) | Quick reference for common tasks |
| [CICD_SETUP.md](./CICD_SETUP.md) | GitHub Actions setup guide |

---

## 🛠️ Development

### Prerequisites
- Node.js 20+
- pnpm 9+
- AWS Account
- AWS CLI configured

### Local Development

```bash
# Install dependencies
pnpm install

# Terminal 1: Backend (SST dev mode)
cd infra
pnpm sst dev

# Terminal 2: Frontend (Vite dev server)
cd apps/frontend
pnpm dev
```

### Available Commands

```bash
# Root level
pnpm install          # Install all dependencies
pnpm typecheck        # Type check all packages
pnpm lint             # Lint all packages
pnpm test             # Run all tests
pnpm build            # Build all packages

# Backend
cd apps/backend
pnpm test             # Run backend tests
pnpm typecheck        # Type check backend

# Frontend
cd apps/frontend
pnpm dev              # Start dev server
pnpm build            # Build for production

# Infrastructure
cd infra
pnpm sst dev          # Local development mode
pnpm sst deploy       # Deploy to AWS
pnpm sst remove       # Remove from AWS
```

---

## 🚢 Deployment

### First Time Setup

1. **Configure AWS Credentials**
   ```bash
   export AWS_ACCESS_KEY_ID=your_key
   export AWS_SECRET_ACCESS_KEY=your_secret
   ```

2. **Deploy**
   ```bash
   cd infra
   pnpm sst deploy --stage production
   ```

3. **Get URLs**
   - Frontend: Printed in deployment output
   - API: Printed in deployment output

### CI/CD Deployment

Push to `main` branch triggers automatic deployment via GitHub Actions.

Required secrets:
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`

---

## 🎯 Use Cases

### Perfect For:
- ✅ Learning Effect-TS in a real project
- ✅ Starting a new serverless full-stack app
- ✅ Understanding SST v3 architecture
- ✅ Building CRUD APIs quickly
- ✅ Monorepo setup reference

### Template-Friendly For:
- Internal tools and dashboards
- MVP prototypes
- SaaS backends
- Mobile app APIs
- Microservices

---

## 📖 Learning Resources

This project demonstrates:

1. **Effect-TS Patterns**
   - Effect.gen for readable async code
   - Tagged errors for type-safe error handling
   - Context/Layer for dependency injection
   - Effect Schema for runtime validation

2. **SST v3 Features**
   - Lambda Function URLs
   - Resource linking
   - Environment variable injection
   - DynamoDB integration

3. **Monorepo Architecture**
   - pnpm workspaces
   - TypeScript project references
   - Shared package pattern

4. **Serverless Best Practices**
   - Persistent storage (DynamoDB vs in-memory)
   - Lambda scaling considerations
   - CORS configuration
   - Error logging

5. **Real-World Debugging**
   - See [DEVELOPER_DIARY.md](./DEVELOPER_DIARY.md) for 28 deployments worth of lessons!

---

## 🐛 Troubleshooting

### Common Issues

**"Cannot find module @todo/shared"**
- Run `pnpm install` from root directory
- Shared package must be in workspace

**"403 Forbidden" from API**
- Check Lambda permissions in `sst.config.ts`
- Ensure both `InvokeFunctionUrl` and `InvokeFunction` permissions exist

**"Frontend shows old data"**
- Hard refresh browser (Ctrl+Shift+R)
- Check CloudFront cache invalidation

**"DynamoDB table not found"**
- Ensure SST deployment completed successfully
- Check `TABLE_NAME` environment variable

See [DEVELOPER_DIARY.md](./DEVELOPER_DIARY.md) for detailed troubleshooting of 20+ deployment issues.

---

## 🤝 Contributing

### Improvements Welcome:
- Additional entity examples
- More deployment targets (Vercel, Netlify)
- Authentication patterns
- Testing examples
- Performance optimizations

### How to Contribute:
1. Fork the repository
2. Create a feature branch
3. Add examples or improvements
4. Submit a PR with documentation

---

## 📄 License

MIT License - use this template for any purpose!

---

## 🙏 Acknowledgments

- **Effect-TS Team** - Amazing functional TypeScript framework
- **SST Team** - Best serverless framework
- **AWS** - Lambda + DynamoDB infrastructure

---

## 🔗 Links

- [Effect Website](https://effect.website/)
- [SST Documentation](https://sst.dev/)
- [Effect Schema](https://effect.website/docs/schema/introduction)
- [AWS Lambda Function URLs](https://docs.aws.amazon.com/lambda/latest/dg/lambda-urls.html)

---

## 💬 Questions?

- Check [TEMPLATE_GUIDE.md](./TEMPLATE_GUIDE.md) for usage instructions
- Read [DEVELOPER_DIARY.md](./DEVELOPER_DIARY.md) for implementation details
- Open an issue for bugs or questions

---

**Built with ❤️ using Effect-TS and SST**

**Status:** ✅ Production-ready template for serverless full-stack applications
