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
    // Backend Lambda function with public URL
    const api = new sst.aws.Function("ApiV4", {  // Changed name to force recreation with new policy
      handler: "../apps/backend/src/index.handler",
      runtime: "nodejs20.x",
      timeout: "30 seconds",
      memory: "1024 MB",
      url: {
        authorization: "none",  // Explicitly set public access
      },
      environment: {
        NODE_ENV: $app.stage,
        LOG_LEVEL: $app.stage === "production" ? "info" : "debug",
      },
      nodejs: {
        install: [
          "effect",
          "@effect/platform",
          "@effect/platform-node",
          "@effect-aws/lambda",
          "@effect/schema"
        ],
        esbuild: {
          external: [
            "@aws-sdk/*",
            "effect",
            "@effect/platform",
            "@effect/platform-node",
            "@effect-aws/lambda",
            "@effect/schema"
          ],
          minify: true,
          sourcemap: false,
          bundle: true,
          platform: "node",
          target: "node20",
          mainFields: ["module", "main"],
          conditions: ["import", "module", "require"],
        },
      },
    });

    // Explicitly add Lambda permission for public function URL access
    // This is the missing piece - SST may not automatically add this for authorization: "none"
    new aws.lambda.Permission("ApiV4PublicAccess", {
      action: "lambda:InvokeFunctionUrl",
      function: api.name,
      principal: "*",
      functionUrlAuthType: "NONE",
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
