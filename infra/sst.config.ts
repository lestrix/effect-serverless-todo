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
    // Backend Lambda function
    const api = new sst.aws.Function("Api", {
      handler: "../apps/backend/src/index.handler",
      runtime: "nodejs20.x",
      timeout: "30 seconds",
      memory: "512 MB",
      url: true, // Enable Lambda function URL (simpler than API Gateway for this tutorial)
      environment: {
        NODE_ENV: $app.stage,
        LOG_LEVEL: $app.stage === "production" ? "info" : "debug",
      },
      nodejs: {
        esbuild: {
          external: ["@aws-sdk/*"],
          minify: true,
          sourcemap: true,
        },
      },
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
      domain:
        $app.stage === "production"
          ? {
              // Uncomment and configure if you have a domain
              // name: "todo.yourdomain.com",
              // dns: sst.cloudflare.dns(),
            }
          : undefined,
    });

    // Outputs
    return {
      api: api.url,
      frontend: frontend.url,
    };
  },
});
