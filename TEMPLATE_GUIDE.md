# Effect Serverless Template Guide

This project can serve as a template for building serverless applications with Effect-TS, SST, and React.

## Template Architecture

### What's Reusable (Framework Code)
- ✅ Monorepo structure (pnpm workspaces)
- ✅ SST infrastructure pattern (Lambda + DynamoDB + Static Site)
- ✅ Effect-based backend architecture
- ✅ Error handling system with tagged errors
- ✅ Type-safe API client pattern
- ✅ Build tooling (TypeScript, ESBuild, Vite, Vitest)
- ✅ CI/CD workflows

### What's Domain-Specific (Replace for Your App)
- ❌ Todo entity schema (`packages/shared/src/schemas/Todo.ts`)
- ❌ Todo repository (`apps/backend/services/TodoRepository.ts`)
- ❌ Todo UI components (`apps/frontend/src/App.tsx`)
- ❌ Package names (`@todo/*`)
- ❌ App name and resource identifiers

## Three Ways to Use This Template

### Option 1: Manual Setup (Quickest)

1. **Use as GitHub Template**
   ```bash
   # Click "Use this template" on GitHub
   # Or clone and remove git history
   git clone <this-repo> my-new-app
   cd my-new-app
   rm -rf .git
   git init
   ```

2. **Find and Replace**

   Replace these values across all files:

   | Find | Replace With | Files Affected |
   |------|--------------|----------------|
   | `effect-serverless-todo` | `your-app-name` | package.json, sst.config.ts |
   | `@todo` | `@yourscope` | All package.json files |
   | `TodoTable` | `YourEntityTable` | sst.config.ts, backend code |
   | `eu-central-1` | `your-region` | sst.config.ts |
   | `Todo` | `YourEntity` | Shared schemas, backend, frontend |

3. **Update Entity Schema**

   Edit `packages/shared/src/schemas/YourEntity.ts`:
   ```typescript
   import * as S from "@effect/schema/Schema";

   export const YourEntity = S.Struct({
     id: S.String,
     // Add your fields here
     name: S.String,
     createdAt: S.String,
   });

   export type YourEntity = S.Schema.Type<typeof YourEntity>;
   ```

4. **Install and Deploy**
   ```bash
   pnpm install
   cd infra
   pnpm sst deploy
   ```

### Option 2: CLI Generator (Future)

We plan to create a CLI tool:

```bash
npx create-effect-app my-app
```

This will interactively prompt for:
- App name
- Package scope
- AWS region
- Primary entity name
- And generate a customized project

**Status:** 🚧 Not yet implemented

### Option 3: Scripted Setup (Recommended)

Run the interactive setup script:

```bash
pnpm install
pnpm setup-template
```

This will:
1. Prompt for your app configuration
2. Update all package.json files
3. Rename entity files
4. Update imports
5. Generate initial boilerplate

**Status:** 🚧 Not yet implemented (see implementation below)

## Template Features

### 🏗️ Infrastructure (SST)
- Lambda Function with Function URL (no API Gateway needed)
- DynamoDB single-table design
- CloudFront + S3 static site hosting
- Environment-based configuration
- Resource linking

### 🎯 Backend (Effect-TS)
- Effect-based HTTP router
- Dependency injection with Context/Layer
- Tagged error handling
- Type-safe request/response
- DynamoDB repository pattern

### ⚛️ Frontend (React + Vite)
- Type-safe API client using shared types
- Modern React with hooks
- Vite for fast development
- Environment variable injection

### 📦 Shared Package
- Effect Schema for validation
- Shared TypeScript types
- Prevents frontend/backend drift

### 🧪 Testing
- Vitest for unit tests
- Schema validation tests
- Repository pattern tests

### 🚀 CI/CD
- GitHub Actions workflows
- Automated deployment to AWS
- Quality checks (lint, typecheck, test, build)

## Development Workflow

### Local Development

```bash
# Terminal 1: Backend development
cd infra
pnpm sst dev

# Terminal 2: Frontend development
cd apps/frontend
pnpm dev
```

### Adding a New Entity

1. **Create Schema** (`packages/shared/src/schemas/Product.ts`)
   ```typescript
   import * as S from "@effect/schema/Schema";

   export const Product = S.Struct({
     id: S.String,
     name: S.String.pipe(S.minLength(1), S.maxLength(100)),
     price: S.Number.pipe(S.positive()),
     createdAt: S.String,
   });

   export type Product = S.Schema.Type<typeof Product>;

   export const CreateProductInput = S.Struct({
     name: S.String.pipe(S.minLength(1)),
     price: S.Number.pipe(S.positive()),
   });

   export type CreateProductInput = S.Schema.Type<typeof CreateProductInput>;
   ```

2. **Create Repository** (`apps/backend/services/ProductRepository.ts`)
   ```typescript
   import { Context, Effect, Layer } from "effect";
   import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
   import { DynamoDBDocumentClient, PutCommand, GetCommand, ScanCommand } from "@aws-sdk/lib-dynamodb";
   import type { Product, CreateProductInput } from "@yourscope/shared";

   export class ProductRepository extends Context.Tag("ProductRepository")<
     ProductRepository,
     {
       create: (input: CreateProductInput) => Effect.Effect<Product>;
       getById: (id: string) => Effect.Effect<Product>;
       getAll: Effect.Effect<Product[]>;
     }
   >() {}

   export const ProductRepositoryLive = Layer.succeed(
     ProductRepository,
     ProductRepository.of({
       create: (input) => Effect.gen(function* () {
         const id = generateId();
         const product: Product = {
           id,
           ...input,
           createdAt: new Date().toISOString(),
         };

         const client = new DynamoDBClient({});
         const dynamodb = DynamoDBDocumentClient.from(client);

         yield* Effect.tryPromise({
           try: () => dynamodb.send(new PutCommand({
             TableName: process.env.TABLE_NAME!,
             Item: product,
           })),
           catch: (error) => new DatabaseError({ message: String(error) }),
         });

         return product;
       }),
       // ... other methods
     })
   );
   ```

3. **Add Routes** (`apps/backend/src/router.ts`)
   ```typescript
   Http.router.post(
     "/products",
     Effect.gen(function* () {
       const request = yield* Http.request.ServerRequest;
       const repo = yield* ProductRepository;

       const input = yield* parseBody(CreateProductInput)(request);
       const product = yield* repo.create(input);

       return jsonResponse(product, 201);
     }).pipe(handleErrors)
   )
   ```

4. **Update Frontend API Client** (`apps/frontend/src/api/client.ts`)
   ```typescript
   export const api = {
     // ... existing methods

     getProducts: () => fetchJson<Product[]>(`${API_BASE}/products`),

     createProduct: (input: CreateProductInput) =>
       fetchJson<Product>(`${API_BASE}/products`, {
         method: "POST",
         body: JSON.stringify(input),
       }),
   };
   ```

### Adding a New Infrastructure Resource

Edit `infra/sst.config.ts`:

```typescript
// Add S3 bucket
const bucket = new sst.aws.Bucket("Uploads");

// Link to Lambda
const api = new sst.aws.Function("ApiV4", {
  // ...
  link: [table, bucket],
  environment: {
    // ...
    BUCKET_NAME: bucket.name,
  },
});
```

## Project Structure Explained

```
.
├── apps/
│   ├── backend/          # Lambda function code
│   │   ├── src/
│   │   │   ├── index.ts        # Lambda handler (current implementation)
│   │   │   ├── router.ts       # Effect-based HTTP router (Effect version)
│   │   │   └── errors.ts       # Tagged errors
│   │   └── services/
│   │       └── *Repository.ts  # Service layer with DI
│   │
│   └── frontend/         # React SPA
│       ├── src/
│       │   ├── App.tsx         # Main component
│       │   └── api/client.ts   # Type-safe API client
│       └── vite.config.ts
│
├── packages/
│   └── shared/           # Shared types & schemas
│       └── src/schemas/  # Effect Schema definitions
│
├── infra/
│   └── sst.config.ts     # Infrastructure as code
│
└── .github/workflows/    # CI/CD pipelines
```

## Customization Points

### 1. AWS Region
`infra/sst.config.ts`:
```typescript
providers: {
  aws: {
    region: "your-preferred-region",
  },
}
```

### 2. Package Scope
All `package.json` files:
```json
{
  "name": "@yourscope/backend"
}
```

### 3. DynamoDB Schema
`infra/sst.config.ts`:
```typescript
const table = new sst.aws.Dynamo("YourTable", {
  fields: {
    id: "string",
    // Add GSIs, LSIs as needed
  },
  primaryIndex: { hashKey: "id" },
  // Add secondary indexes:
  // globalIndexes: {
  //   EmailIndex: { hashKey: "email" }
  // }
});
```

### 4. Lambda Configuration
`infra/sst.config.ts`:
```typescript
const api = new sst.aws.Function("Api", {
  memory: "2048 MB",     // Adjust based on needs
  timeout: "60 seconds",  // Max 15 minutes
  // ...
});
```

### 5. Frontend Build
`apps/frontend/vite.config.ts`:
```typescript
export default defineConfig({
  // Customize Vite configuration
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
});
```

## Advanced Patterns

### Multi-Table Architecture

Instead of single table, create multiple:

```typescript
const usersTable = new sst.aws.Dynamo("Users", { /* ... */ });
const productsTable = new sst.aws.Dynamo("Products", { /* ... */ });

const api = new sst.aws.Function("Api", {
  link: [usersTable, productsTable],
  environment: {
    USERS_TABLE: usersTable.name,
    PRODUCTS_TABLE: productsTable.name,
  },
});
```

### Authentication

Add Cognito:

```typescript
const auth = new sst.aws.CognitoUserPool("Auth");

const api = new sst.aws.Function("Api", {
  url: {
    authorization: {
      cognito: { userPoolId: auth.id }
    }
  },
});
```

### API Gateway (instead of Function URL)

For more control:

```typescript
const api = new sst.aws.ApiGatewayV2("Api", {
  routes: {
    "GET /todos": "apps/backend/src/index.handler",
    "POST /todos": "apps/backend/src/index.handler",
  },
});
```

## Best Practices

1. **Keep shared package minimal** - Only types and schemas
2. **Use Effect.gen for readability** - Easier than pipe for complex logic
3. **Tag all errors** - Makes error handling composable
4. **Validate at boundaries** - Use Schema.decode for all inputs
5. **Link resources** - Use SST's `link` instead of manual environment variables
6. **Test schemas** - Validation logic deserves tests
7. **Use layers for DI** - Easier testing and composition

## Deployment

### First Deployment

```bash
# Configure AWS credentials
export AWS_ACCESS_KEY_ID=xxx
export AWS_SECRET_ACCESS_KEY=xxx

# Deploy
cd infra
pnpm sst deploy --stage production
```

### CI/CD Deployment

Already configured in `.github/workflows/deploy.yml`:
- Triggers on push to main
- Manual trigger with stage selection
- Requires GitHub secrets:
  - `AWS_ACCESS_KEY_ID`
  - `AWS_SECRET_ACCESS_KEY`

## Troubleshooting

### Common Issues

1. **DynamoDB Access Denied**
   - Ensure Lambda has DynamoDB permissions
   - SST handles this automatically with `link`

2. **Frontend Can't Reach API**
   - Check CORS configuration in `sst.config.ts`
   - Verify `VITE_API_URL` is set correctly

3. **Build Failures**
   - Check TypeScript project references
   - Ensure shared package is built first

4. **Cold Start Performance**
   - Increase Lambda memory (scales CPU too)
   - Consider provisioned concurrency for production

## Next Steps

1. **Clone/Fork this repository**
2. **Follow Option 1 (Manual Setup) or Option 3 (Scripted)**
3. **Customize your domain entity**
4. **Deploy to AWS**
5. **Build your application!**

## Resources

- [SST Documentation](https://sst.dev/)
- [Effect Documentation](https://effect.website/)
- [Effect Schema](https://effect.website/docs/schema/introduction)
- [AWS Lambda Function URLs](https://docs.aws.amazon.com/lambda/latest/dg/lambda-urls.html)
- [DynamoDB Best Practices](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/best-practices.html)

## Contributing

If you create improvements to this template:
1. Fork the repository
2. Create examples in `examples/` directory
3. Submit a PR with documentation

## License

MIT - Use this template for any purpose!
