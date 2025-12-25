#!/usr/bin/env tsx
/**
 * Interactive Template Setup Script
 *
 * This script helps you customize the Effect Serverless Template for your project.
 * It will prompt for configuration and update all relevant files.
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import * as readline from 'readline/promises';

interface TemplateConfig {
  appName: string;
  packageScope: string;
  awsRegion: string;
  entityName: string;
  tableName: string;
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

async function prompt(question: string, defaultValue?: string): Promise<string> {
  const suffix = defaultValue ? ` (${defaultValue})` : '';
  const answer = await rl.question(`${question}${suffix}: `);
  return answer.trim() || defaultValue || '';
}

async function confirm(question: string): Promise<boolean> {
  const answer = await rl.question(`${question} (y/n): `);
  return answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes';
}

function replaceInFile(filePath: string, replacements: Map<string, string>): void {
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  File not found: ${filePath}`);
    return;
  }

  let content = fs.readFileSync(filePath, 'utf-8');
  let changed = false;

  for (const [find, replace] of replacements) {
    if (content.includes(find)) {
      content = content.replace(new RegExp(find, 'g'), replace);
      changed = true;
    }
  }

  if (changed) {
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`✅ Updated: ${filePath}`);
  }
}

function pascalCase(str: string): string {
  return str
    .replace(/[-_](\w)/g, (_, c) => c.toUpperCase())
    .replace(/^\w/, c => c.toUpperCase());
}

function camelCase(str: string): string {
  const pascal = pascalCase(str);
  return pascal.charAt(0).toLowerCase() + pascal.slice(1);
}

function pluralize(str: string): string {
  if (str.endsWith('s')) return str;
  if (str.endsWith('y')) return str.slice(0, -1) + 'ies';
  return str + 's';
}

async function main() {
  console.log('\n🚀 Effect Serverless Template Setup\n');
  console.log('This script will help you customize the template for your project.\n');

  // Gather configuration
  const config: TemplateConfig = {
    appName: await prompt('App name (kebab-case)', 'my-app'),
    packageScope: await prompt('Package scope (e.g., @myorg)', '@myapp'),
    awsRegion: await prompt('AWS region', 'eu-central-1'),
    entityName: await prompt('Primary entity name (singular, PascalCase)', 'Item'),
    tableName: await prompt('DynamoDB table name', 'MainTable'),
  };

  // Derive related names
  const entityNameLower = config.entityName.toLowerCase();
  const entityNamePlural = pluralize(config.entityName);
  const entityNamePluralLower = entityNamePlural.toLowerCase();
  const entityNameCamel = camelCase(config.entityName);

  console.log('\n📋 Configuration Summary:');
  console.log(`   App Name: ${config.appName}`);
  console.log(`   Package Scope: ${config.packageScope}`);
  console.log(`   AWS Region: ${config.awsRegion}`);
  console.log(`   Entity: ${config.entityName} (${entityNamePlural})`);
  console.log(`   Table: ${config.tableName}`);

  const proceed = await confirm('\n✨ Apply these changes?');
  if (!proceed) {
    console.log('❌ Aborted.');
    rl.close();
    return;
  }

  console.log('\n🔄 Updating files...\n');

  // Create replacement map
  const replacements = new Map<string, string>([
    ['effect-serverless-todo', config.appName],
    ['@todo', config.packageScope],
    ['eu-central-1', config.awsRegion],
    ['TodoTable', config.tableName],
    ['Todo', config.entityName],
    ['todo', entityNameLower],
    ['Todos', entityNamePlural],
    ['todos', entityNamePluralLower],
  ]);

  // Files to update
  const filesToUpdate = [
    // Root
    'package.json',
    'README.md',

    // Infrastructure
    'infra/package.json',
    'infra/sst.config.ts',

    // Backend
    'apps/backend/package.json',
    'apps/backend/src/index.ts',
    'apps/backend/src/router.ts',
    'apps/backend/src/errors.ts',
    'apps/backend/services/TodoRepository.ts',

    // Frontend
    'apps/frontend/package.json',
    'apps/frontend/index.html',
    'apps/frontend/src/App.tsx',
    'apps/frontend/src/api/client.ts',

    // Shared
    'packages/shared/package.json',
    'packages/shared/src/index.ts',
    'packages/shared/src/schemas/Todo.ts',
  ];

  // Apply replacements
  for (const file of filesToUpdate) {
    const fullPath = path.join(process.cwd(), file);
    replaceInFile(fullPath, replacements);
  }

  // Rename schema file
  const oldSchemaPath = path.join(process.cwd(), 'packages/shared/src/schemas/Todo.ts');
  const newSchemaPath = path.join(process.cwd(), `packages/shared/src/schemas/${config.entityName}.ts`);

  if (fs.existsSync(oldSchemaPath) && oldSchemaPath !== newSchemaPath) {
    fs.renameSync(oldSchemaPath, newSchemaPath);
    console.log(`✅ Renamed: Todo.ts → ${config.entityName}.ts`);
  }

  // Rename test file if it exists
  const oldTestPath = path.join(process.cwd(), 'packages/shared/src/schemas/Todo.test.ts');
  const newTestPath = path.join(process.cwd(), `packages/shared/src/schemas/${config.entityName}.test.ts`);

  if (fs.existsSync(oldTestPath) && oldTestPath !== newTestPath) {
    fs.renameSync(oldTestPath, newTestPath);
    console.log(`✅ Renamed: Todo.test.ts → ${config.entityName}.test.ts`);
  }

  // Rename repository file
  const oldRepoPath = path.join(process.cwd(), 'apps/backend/services/TodoRepository.ts');
  const newRepoPath = path.join(process.cwd(), `apps/backend/services/${config.entityName}Repository.ts`);

  if (fs.existsSync(oldRepoPath) && oldRepoPath !== newRepoPath) {
    fs.renameSync(oldRepoPath, newRepoPath);
    console.log(`✅ Renamed: TodoRepository.ts → ${config.entityName}Repository.ts`);
  }

  console.log('\n✨ Template setup complete!\n');
  console.log('Next steps:');
  console.log('  1. Review the changes');
  console.log('  2. Run: pnpm install');
  console.log('  3. Update entity schema in packages/shared/src/schemas/' + config.entityName + '.ts');
  console.log('  4. Update repository logic in apps/backend/services/' + config.entityName + 'Repository.ts');
  console.log('  5. Update frontend UI in apps/frontend/src/App.tsx');
  console.log('  6. Deploy: cd infra && pnpm sst deploy\n');

  rl.close();
}

main().catch((error) => {
  console.error('❌ Error:', error);
  process.exit(1);
});
