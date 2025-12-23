/// <reference path="./.sst/platform/config.d.ts" />

/**
 * SST Infrastructure Configuration
 *
 * This defines:
 * - Lambda function (backend API)
 * - Static site (frontend SPA)
 * - Environment-specific settings
 */
export default $config({
  app(input) {
    return {
      name: "effect-serverless-todo",
      removal: input?.stage === "production" ? "retain" : "remove",
      home: "aws",
      providers: {
        aws: {
          region: "eu-central-1", // Change to your preferred region
        },
      },
    };
  },
  async run() {
    // DynamoDB table for persistent todo storage
    const table = new sst.aws.Dynamo("TodoTable", {
      fields: {
        id: "string",
      },
      primaryIndex: { hashKey: "id" },
    });

    // Backend Lambda function with public URL
    const api = new sst.aws.Function("ApiV4", {  // Changed name to force recreation with new policy
      handler: "../apps/backend/src/index.handler",
      runtime: "nodejs20.x",
      timeout: "30 seconds",
      memory: "1024 MB",
      url: {
        authorization: "none",  // Explicitly set public access
        cors: true,  // Enable CORS with default settings (allows all origins, methods, headers)
      },
      link: [table],
      environment: {
        NODE_ENV: $app.stage,
        LOG_LEVEL: $app.stage === "production" ? "info" : "debug",
        TABLE_NAME: table.name,
      },
      nodejs: {
        esbuild: {
          external: [
            "@aws-sdk/*"
          ],
          minify: false,
          sourcemap: true,
          bundle: true,
          platform: "node",
          target: "node20",
          format: "esm",
          mainFields: ["module", "main"],
        },
      },
    });

    // Explicitly add Lambda permissions for public function URL access
    // Lambda Function URLs require BOTH permissions for public access:
    // 1. lambda:InvokeFunctionUrl - for the function URL itself
    // 2. lambda:InvokeFunction - for the underlying function invocation
    // Without both, the function URL returns 403 Forbidden even with authorization: "none"
    new aws.lambda.Permission("ApiV4UrlPermission", {
      action: "lambda:InvokeFunctionUrl",
      function: api.name,
      principal: "*",
      functionUrlAuthType: "NONE",
    });

    new aws.lambda.Permission("ApiV4InvokePermission", {
      action: "lambda:InvokeFunction",
      function: api.name,
      principal: "*",
    });

    // Frontend static site
    const frontend = new sst.aws.StaticSite("Frontend", {
      path: "../apps/frontend",
      build: {
        command: "pnpm run build",
        output: "dist",
      },
      environment: {
        VITE_API_URL: api.url,
      },
      // Uncomment to add custom domain
      // domain: $app.stage === "production" ? "todo.yourdomain.com" : undefined,
    });

    // Outputs
    return {
      api: api.url,
      frontend: frontend.url,
    };
  },
});
