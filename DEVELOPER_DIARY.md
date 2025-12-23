# Developer Diary - Effect Serverless Todo Application

## Session: Initial Setup & Frontend/Infrastructure Implementation
**Date:** 2025-12-23
**Developer:** Kong (with AI assistance)

---

## Overview

This session focused on setting up a complete serverless todo application using Effect-TS, implementing a React frontend, and configuring SST infrastructure. The project follows a monorepo architecture using pnpm workspaces.

---

## What We Built

### 1. **Frontend Application (React + Vite)**

Created a complete React-based frontend in `apps/frontend/`:

#### Configuration Files
- **package.json** - React 18.3.1, Vite 6.0.1, TypeScript 5.6.3
- **tsconfig.json** - Strict TypeScript with project references to shared package
- **vite.config.ts** - Vite configuration with proxy for `/api` routes
- **index.html** - Entry point for the SPA

#### Application Code
- **src/api/client.ts** - Type-safe API client using shared types from `@todo/shared`
  - Custom `ApiError` class for error handling
  - Generic `fetchJson` helper with proper error handling
  - Full CRUD operations: health check, getTodos, getTodo, createTodo, updateTodo, deleteTodo

- **src/App.tsx** - Main React component with complete todo management
  - Health check indicator showing backend status
  - Create new todos with form validation
  - Toggle todo completion status
  - Delete todos
  - Error handling with dismissible error messages
  - Loading states

- **src/main.tsx** - React app entry point with StrictMode
- **src/index.css** - Clean, minimal styling with focus states

**Key Features:**
- Type safety through shared `@todo/shared` package (prevents frontend/backend drift)
- Real-time health monitoring
- Optimistic UI updates
- Error boundaries and error display
- Clean, accessible UI with semantic HTML

---

### 2. **Infrastructure (SST v3)**

Created deployment infrastructure in `infra/`:

#### Configuration
- **package.json** - SST 3.3.40 with dev/deploy/remove scripts
- **sst.config.ts** - Complete AWS infrastructure as code:
  - **Lambda Function** (`Api`):
    - Handler: `apps/backend/src/index.handler`
    - Runtime: Node.js 20
    - Memory: 512 MB
    - Timeout: 30 seconds
    - Function URL enabled (simpler than API Gateway)
    - Environment variables for NODE_ENV and LOG_LEVEL
    - esbuild bundling with AWS SDK externalization
    - Source maps enabled

  - **Static Site** (`Frontend`):
    - Vite build process
    - Environment variable injection (VITE_API_URL)
    - Optional custom domain support for production

  - **Outputs**: API and Frontend URLs

**Deployment Strategy:**
- Development: `sst dev` for local development with hot reload
- Production: `sst deploy` with resource retention
- Region: EU Central 1 (configurable)

---

### 3. **Critical Bug Fixes**

#### Fixed Empty vitest.config.ts
**Problem:** File existed but was 0 bytes, preventing tests from running properly.

**Solution:** Created proper Vitest configuration:
```typescript
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: ["node_modules/", "dist/", "**/*.test.ts"],
    },
  },
});
```

#### Created Root .gitignore
**Problem:** No root .gitignore file, risking committed node_modules, build artifacts, etc.

**Solution:** Comprehensive .gitignore covering:
- Dependencies (node_modules, .pnp)
- Build outputs (dist, build, *.tsbuildinfo)
- Testing (coverage)
- Environment variables (.env files)
- IDE files (.vscode, .idea, swap files)
- OS files (.DS_Store, Thumbs.db)
- SST artifacts (.sst, sst-env.d.ts)
- Logs and temporary files
- Project-specific files (full-codebase.txt, repomix-output.xml)

#### Fixed @effect/schema Dependency Issue
**Problem:** `package.json` requested `@effect/schema@^0.76.5` but latest available was `0.75.5`, causing install failure.

**Solution:** Removed `@effect/schema` as a separate dependency since it's included in the `effect` package. This is the correct approach as Effect Schema is part of the Effect ecosystem and bundled with the main package.

**Files Modified:**
- `apps/backend/package.json` - Removed `@effect/schema` dependency

---

## Architecture Decisions

### 1. **Monorepo Structure**
```
effect-serverless-todo/
├── apps/
│   ├── backend/          # Effect-based Lambda API
│   └── frontend/         # React + Vite SPA
├── packages/
│   └── shared/           # Shared schemas & types
├── infra/                # SST infrastructure
└── pnpm-workspace.yaml   # Workspace configuration
```

**Benefits:**
- Shared types prevent API drift
- Single command to build/test/deploy all packages
- Workspace protocol for local dependencies
- TypeScript project references for incremental builds

### 2. **Type Safety Strategy**

**Shared Package as Single Source of Truth:**
- Effect Schemas defined once in `packages/shared`
- Backend uses schemas for validation and type inference
- Frontend imports types from shared package
- Impossible to have mismatched types between frontend and backend

**Example:**
```typescript
// packages/shared/src/schemas/Todo.ts
export class Todo extends S.Class<Todo>("Todo")({
  id: S.String,
  title: S.String,
  completed: S.Boolean,
  createdAt: S.String,
}) {}

// Backend uses for validation
S.decode(CreateTodoInputSchema)(input)

// Frontend uses for types
import type { Todo } from "@todo/shared";
const [todos, setTodos] = useState<Todo[]>([]);
```

### 3. **Serverless Architecture**

**Lambda Function URL vs API Gateway:**
- Chose Lambda Function URL for simplicity
- No need for REST API features (throttling, API keys, etc.)
- Lower latency (one less service in the chain)
- Easier to reason about for tutorial purposes

**Trade-offs:**
- ✅ Simpler configuration
- ✅ Lower cost (no API Gateway charges)
- ✅ Lower latency
- ❌ No built-in throttling
- ❌ No API key management
- ❌ Limited customization of responses

### 4. **Frontend State Management**

**Chose React useState over external libraries:**
- Simple CRUD operations don't need Redux/Zustand
- Local component state is sufficient
- Can upgrade later if needed

**API Client Design:**
- Simple fetch wrapper with TypeScript generics
- Custom ApiError for typed error handling
- Centralized error handling logic

---

## Testing Strategy

### Current State
- **Backend:** Unit tests for schemas and repository layer
- **Frontend:** No tests yet (focus on core functionality first)

### Test Files
- `packages/shared/src/schemas/Todo.test.ts` - Schema validation tests
- `apps/backend/services/TodoRepository.test.ts` - Repository CRUD tests

### What's Tested
✅ Schema validation (valid/invalid inputs)
✅ Repository operations (CRUD)
✅ Error handling (TodoNotFoundError)
❌ Frontend components (not yet)
❌ Integration tests (not yet)
❌ E2E tests (not yet)

---

## Known Limitations & Future Work

### Current Limitations

1. **In-Memory Storage Only**
   - Using `Ref<Map<string, Todo>>` for state
   - Data lost on Lambda cold start or restart
   - Not suitable for production
   - **Next Step:** Implement DynamoDB repository layer

2. **No Authentication**
   - API is completely open
   - No user isolation
   - **Next Step:** Add Cognito or Auth0

3. **Wide-Open CORS**
   - `Access-Control-Allow-Origin: *`
   - Security risk for production
   - **Next Step:** Restrict to specific origins

4. **No Observability**
   - No structured logging
   - No metrics or tracing
   - **Next Step:** Add CloudWatch Logs, X-Ray tracing

5. **No CI/CD**
   - Empty `.github/workflows/` directory
   - Manual deployment only
   - **Next Step:** GitHub Actions workflow

### Planned Improvements

**High Priority:**
- [ ] Implement DynamoDB repository (`TodoRepositoryDynamoDB.ts`)
- [ ] Add integration tests for Lambda handler
- [ ] Set up CI/CD pipeline
- [ ] Add authentication layer

**Medium Priority:**
- [ ] Frontend component tests (Vitest + Testing Library)
- [ ] E2E tests (Playwright)
- [ ] Error tracking (Sentry)
- [ ] Request ID correlation

**Low Priority:**
- [ ] Standardize Schema imports (`effect/Schema` everywhere)
- [ ] Move `services/` into `src/services/`
- [ ] Add JSDoc comments
- [ ] Performance monitoring

---

## Code Quality Assessment

### Strengths ✅

1. **Excellent Effect Usage**
   - Proper `Effect.gen` with generator syntax
   - Type-safe error handling with `TaggedError`
   - Clean dependency injection via Context & Layers
   - Immutable state with `Ref`

2. **Strong Type Safety**
   - Strict TypeScript mode enabled
   - Schema-driven development
   - Shared types prevent drift
   - No `any` types used

3. **Clean Architecture**
   - Repository pattern
   - Service-oriented design
   - Separation of concerns
   - Clear module boundaries

4. **Good Documentation**
   - JSDoc comments on key functions
   - Inline code comments explaining non-obvious logic
   - Configuration files well-structured

### Areas for Improvement ⚠️

1. **Inconsistent Schema Imports**
   - Some files use `@effect/schema/Schema`
   - Others use `effect/Schema`
   - Should standardize on one approach

2. **Services Directory Location**
   - Currently at `apps/backend/services/`
   - Should be `apps/backend/src/services/`
   - Minor organizational issue

3. **Error Response Format**
   - Some endpoints return `{ error, details }`
   - Others return just `{ error }`
   - Should be consistent

---

## Performance Considerations

### Bundle Size
- Backend: Using esbuild for optimal bundling
- Frontend: Vite for tree-shaking and code splitting
- External AWS SDK to reduce bundle size

### Cold Start Optimization
- Node.js 20.x runtime (faster startup than 18.x)
- 512 MB memory (balance between cost and performance)
- Minimal dependencies in Lambda

### Frontend Performance
- Vite's fast HMR for development
- Production build with minification
- Static site deployment to CloudFront (via SST)

---

## Development Workflow

### Local Development
```bash
# Install dependencies
pnpm install

# Run backend tests
pnpm --filter backend test

# Run frontend dev server
pnpm --filter frontend dev

# Type checking across all packages
pnpm typecheck

# Linting
pnpm lint
```

### SST Development
```bash
# Start SST dev mode (Lambda + LiveLambda)
pnpm --filter infra dev

# Deploy to AWS
pnpm --filter infra deploy

# Remove all resources
pnpm --filter infra remove
```

### Project Structure Commands
```bash
# Build all packages
pnpm build

# Test all packages
pnpm test

# Type check all packages
pnpm typecheck
```

---

## Dependencies Overview

### Backend
- **Runtime:** `effect@^3.11.7`, `@effect/platform@^0.71.3`, `@effect/platform-node@^0.66.3`
- **AWS Integration:** `@effect-aws/lambda@^1.1.0`
- **Build:** `esbuild@^0.24.0`, `typescript@^5.6.3`
- **Testing:** `vitest@^2.1.8`

### Frontend
- **React:** `react@^18.3.1`, `react-dom@^18.3.1`
- **Build:** `vite@^6.0.1`, `@vitejs/plugin-react@^4.3.4`
- **TypeScript:** `typescript@^5.6.3`

### Shared
- **Runtime:** `effect@^3.11.0`
- **Testing:** `vitest@^2.1.8`

### Infrastructure
- **IaC:** `sst@^3.3.40`

---

## Key Learnings

### 1. Effect Schema is Powerful
- Single source of truth for types and validation
- Runtime validation with compile-time types
- Error messages are excellent
- Works seamlessly across frontend/backend

### 2. Lambda Function URLs Are Underrated
- Much simpler than API Gateway for simple APIs
- Lower latency and cost
- Perfect for MVPs and tutorials
- Easy to upgrade to API Gateway later if needed

### 3. Monorepo Benefits
- Shared types prevent bugs
- Single version of dependencies
- Easier refactoring across packages
- TypeScript project references for fast incremental builds

### 4. SST v3 is Developer-Friendly
- Infrastructure as code in TypeScript
- Live Lambda development with `sst dev`
- Automatic environment variable injection
- Great DX compared to raw CDK or Terraform

---

## Next Session Plans

Based on the ChatGPT guide structure, the next sections likely cover:

1. **DynamoDB Integration**
   - Create `TodoRepositoryDynamoDB` implementation
   - Add DynamoDB table to SST config
   - Migration strategy from in-memory to DynamoDB

2. **Testing**
   - Integration tests for Lambda handler
   - Frontend component tests
   - E2E tests with Playwright

3. **Deployment & CI/CD**
   - GitHub Actions workflow
   - Automated testing and deployment
   - Environment management (dev/staging/prod)

4. **Production Hardening**
   - Authentication (Cognito)
   - CORS configuration
   - Error tracking
   - Monitoring and logging

---

## Resources & References

- **Effect Documentation:** https://effect.website
- **SST Documentation:** https://sst.dev
- **Vite Documentation:** https://vitejs.dev
- **React Documentation:** https://react.dev

---

## Commit Message

```
feat: add frontend React app and SST infrastructure

- Implement complete React frontend with Vite
  - Type-safe API client using shared schemas
  - Todo CRUD operations (create, read, update, delete)
  - Health check monitoring
  - Error handling and loading states

- Add SST v3 infrastructure configuration
  - Lambda function with Function URL
  - Static site deployment for frontend
  - Environment-specific configuration

- Fix critical configuration issues
  - Create proper vitest.config.ts (was empty)
  - Add comprehensive .gitignore
  - Remove @effect/schema dependency (included in effect)

- Project now has complete serverless stack:
  - Backend: Effect-based Lambda API
  - Frontend: React SPA with Vite
  - Infrastructure: SST for AWS deployment
  - Shared: Effect schemas for type safety

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
```

---

*End of Session*
