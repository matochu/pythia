#!/usr/bin/env ts-node

import { readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';
import { z } from 'zod';

// Validation schemas
const PromptSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  schema: z.any(),
  generateMessages: z.function()
});

const ToolSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  schema: z.any(),
  execute: z.function()
});

const ResourceSchema = z.object({
  uri: z.string().min(1),
  mimeType: z.string().min(1),
  text: z.string().optional(),
  blob: z.any().optional()
});

interface ValidationResult {
  type: 'tool' | 'prompt' | 'resource';
  name: string;
  valid: boolean;
  errors: string[];
}

class MCPValidator {
  private distPath: string;
  private results: ValidationResult[] = [];

  constructor() {
    this.distPath = join(process.cwd(), 'dist');
  }

  async validateAll(): Promise<void> {
    console.log('🔍 Validating MCP Components...\n');

    await this.validateTools();
    await this.validatePrompts();
    await this.validateResources();

    this.printResults();
  }

  private async validateTools(): Promise<void> {
    console.log('📋 Validating Tools...');

    const toolsPath = join(this.distPath, 'tools', 'mcp');

    try {
      const files = readdirSync(toolsPath).filter((f) => f.endsWith('.js'));

      for (const file of files) {
        const filePath = join(toolsPath, file);
        const result = await this.validateTool(filePath);
        this.results.push(result);
      }
    } catch (error) {
      console.log('❌ Tools directory not found or empty');
    }
  }

  private async validateTool(filePath: string): Promise<ValidationResult> {
    const name = filePath.split('/').pop()?.replace('.js', '') || 'unknown';
    const errors: string[] = [];

    try {
      // Read the file content to check for required properties
      const content = readFileSync(filePath, 'utf8');

      // Check for required properties in the code
      if (!content.includes('name =')) errors.push('Missing name property');
      if (!content.includes('description ='))
        errors.push('Missing description property');
      if (!content.includes('schema =')) errors.push('Missing schema property');
      if (!content.includes('execute(')) errors.push('Missing execute method');
      if (!content.includes('export default'))
        errors.push('Missing default export');

      // Check for MCPTool import
      if (!content.includes('MCPTool')) errors.push('Missing MCPTool import');
    } catch (error) {
      errors.push(`File read error: ${error}`);
    }

    return {
      type: 'tool',
      name,
      valid: errors.length === 0,
      errors
    };
  }

  private async validatePrompts(): Promise<void> {
    console.log('💬 Validating Prompts...');

    const promptsPath = join(this.distPath, 'prompts');

    try {
      const files = readdirSync(promptsPath).filter((f) => f.endsWith('.js'));

      for (const file of files) {
        const filePath = join(promptsPath, file);
        const result = await this.validatePrompt(filePath);
        this.results.push(result);
      }
    } catch (error) {
      console.log('❌ Prompts directory not found or empty');
    }
  }

  private async validatePrompt(filePath: string): Promise<ValidationResult> {
    const name = filePath.split('/').pop()?.replace('.js', '') || 'unknown';
    const errors: string[] = [];

    try {
      // Read the file content to check for required properties
      const content = readFileSync(filePath, 'utf8');

      // Check for required properties in the code
      if (!content.includes('name =')) errors.push('Missing name property');
      if (!content.includes('description ='))
        errors.push('Missing description property');
      if (!content.includes('schema =')) errors.push('Missing schema property');
      if (!content.includes('generateMessages('))
        errors.push('Missing generateMessages method');
      if (!content.includes('export default'))
        errors.push('Missing default export');

      // Check for MCPPrompt import
      if (!content.includes('MCPPrompt'))
        errors.push('Missing MCPPrompt import');
    } catch (error) {
      errors.push(`File read error: ${error}`);
    }

    return {
      type: 'prompt',
      name,
      valid: errors.length === 0,
      errors
    };
  }

  private async validateResources(): Promise<void> {
    console.log('📚 Validating Resources...');

    const resourcesPath = join(this.distPath, 'resources');

    try {
      const files = this.getAllFiles(resourcesPath);

      for (const file of files) {
        const result = await this.validateResource(file);
        this.results.push(result);
      }
    } catch (error) {
      console.log('❌ Resources directory not found or empty');
    }
  }

  private getAllFiles(dirPath: string): string[] {
    const files: string[] = [];

    try {
      const items = readdirSync(dirPath);

      for (const item of items) {
        const fullPath = join(dirPath, item);
        const stat = statSync(fullPath);

        if (stat.isDirectory()) {
          files.push(...this.getAllFiles(fullPath));
        } else if (
          item.endsWith('.md') ||
          item.endsWith('.json') ||
          item.endsWith('.txt')
        ) {
          files.push(fullPath);
        }
      }
    } catch (error) {
      // Directory doesn't exist or can't be read
    }

    return files;
  }

  private async validateResource(filePath: string): Promise<ValidationResult> {
    const name = filePath.split('/').pop() || 'unknown';
    const errors: string[] = [];

    try {
      // Check if file exists and is readable
      const content = readFileSync(filePath, 'utf8');

      if (content.length === 0) {
        errors.push('File is empty');
      }

      // Basic content validation based on file type
      if (filePath.endsWith('.md')) {
        if (!content.includes('#')) {
          errors.push('Markdown file missing headers');
        }
      } else if (filePath.endsWith('.json')) {
        try {
          JSON.parse(content);
        } catch (e) {
          errors.push('Invalid JSON format');
        }
      }
    } catch (error) {
      errors.push(`File read error: ${error}`);
    }

    return {
      type: 'resource',
      name,
      valid: errors.length === 0,
      errors
    };
  }

  private printResults(): void {
    console.log('\n📊 Validation Results:\n');

    const tools = this.results.filter((r) => r.type === 'tool');
    const prompts = this.results.filter((r) => r.type === 'prompt');
    const resources = this.results.filter((r) => r.type === 'resource');

    // Tools
    if (tools.length > 0) {
      console.log('🔧 Tools:');
      tools.forEach((result) => {
        const status = result.valid ? '✅' : '❌';
        console.log(
          `  ${status} ${result.name}.js: ${result.valid ? 'Valid' : 'Invalid'}`
        );
        if (!result.valid) {
          result.errors.forEach((error) => console.log(`    - ${error}`));
        }
      });
      console.log('');
    }

    // Prompts
    if (prompts.length > 0) {
      console.log('💬 Prompts:');
      prompts.forEach((result) => {
        const status = result.valid ? '✅' : '❌';
        console.log(
          `  ${status} ${result.name}.js: ${result.valid ? 'Valid' : 'Invalid'}`
        );
        if (!result.valid) {
          result.errors.forEach((error) => console.log(`    - ${error}`));
        }
      });
      console.log('');
    }

    // Resources
    if (resources.length > 0) {
      console.log('📚 Resources:');
      resources.forEach((result) => {
        const status = result.valid ? '✅' : '❌';
        console.log(
          `  ${status} ${result.name}: ${result.valid ? 'Valid' : 'Invalid'}`
        );
        if (!result.valid) {
          result.errors.forEach((error) => console.log(`    - ${error}`));
        }
      });
      console.log('');
    }

    // Summary
    const totalValid = this.results.filter((r) => r.valid).length;
    const totalInvalid = this.results.filter((r) => !r.valid).length;

    console.log(`📈 Summary:`);
    console.log(`  Total components: ${this.results.length}`);
    console.log(`  Valid: ${totalValid}`);
    console.log(`  Invalid: ${totalInvalid}`);

    if (totalInvalid === 0) {
      console.log('\n🎉 All MCP components validated successfully!');
    } else {
      console.log(`\n⚠️  ${totalInvalid} components have validation errors`);
      process.exit(1);
    }
  }
}

// Run validation
async function main() {
  const validator = new MCPValidator();
  await validator.validateAll();
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}
