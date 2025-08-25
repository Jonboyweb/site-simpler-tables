import fs from 'fs';
import path from 'path';

const PROJECT_ROOT = path.resolve(__dirname, '../../');

describe('Project Structure Validation', () => {
  // Next.js Configuration Test
  test('Next.js 15.5 configuration exists', () => {
    const nextConfigPath = path.join(PROJECT_ROOT, 'next.config.js');
    expect(fs.existsSync(nextConfigPath)).toBe(true);

    const packageJson = JSON.parse(fs.readFileSync(path.join(PROJECT_ROOT, 'package.json'), 'utf8'));
    
    // Verify Next.js version
    expect(packageJson.dependencies.next).toBe('^15.5.0');
  });

  // Package.json Dependency Validation
  test('package.json contains correct dependencies', () => {
    const packageJson = JSON.parse(fs.readFileSync(path.join(PROJECT_ROOT, 'package.json'), 'utf8'));
    
    // Core dependencies
    expect(packageJson.dependencies).toHaveProperty('next');
    expect(packageJson.dependencies).toHaveProperty('react');
    expect(packageJson.dependencies).toHaveProperty('react-dom');

    // Dev dependencies
    expect(packageJson.devDependencies).toHaveProperty('typescript');
    expect(packageJson.devDependencies).toHaveProperty('eslint');
    expect(packageJson.devDependencies).toHaveProperty('@tailwindcss/postcss');
  });

  // TypeScript Configuration Test
  test('TypeScript configuration is valid', () => {
    const tsconfigPath = path.join(PROJECT_ROOT, 'tsconfig.json');
    expect(fs.existsSync(tsconfigPath)).toBe(true);

    const tsconfig = require(tsconfigPath);
    
    // Validate critical TypeScript compiler options
    expect(tsconfig.compilerOptions).toHaveProperty('strict', true);
    expect(tsconfig.compilerOptions).toHaveProperty('jsx', 'preserve');
    expect(tsconfig.compilerOptions.paths).toHaveProperty('@/*', ['./src/*']);
  });

  // App Router Structure Validation
  test('App Router structure is properly set up', () => {
    const appRouterPath = path.join(PROJECT_ROOT, 'src', 'app');
    expect(fs.existsSync(appRouterPath)).toBe(true);

    // Check for key App Router files
    const pageFile = path.join(appRouterPath, 'page.tsx');
    const layoutFile = path.join(appRouterPath, 'layout.tsx');
    
    expect(fs.existsSync(pageFile)).toBe(true);
    expect(fs.existsSync(layoutFile)).toBe(true);
  });

  // ESLint Configuration Test
  test('ESLint configuration is operational', () => {
    const localPackageJson = JSON.parse(fs.readFileSync(path.join(PROJECT_ROOT, 'package.json'), 'utf8'));
    expect(localPackageJson.devDependencies).toHaveProperty('eslint-config-next');
  });

  // Tailwind CSS Configuration Test
  test('Tailwind CSS configuration exists', () => {
    const tailwindConfigPath = path.join(PROJECT_ROOT, 'tailwind.config.js');
    expect(fs.existsSync(tailwindConfigPath)).toBe(true);

    const tailwindConfig = require(tailwindConfigPath);
    
    // Validate basic Tailwind configuration
    expect(tailwindConfig.content).toBeDefined();
    expect(tailwindConfig.theme).toBeDefined();
    expect(tailwindConfig.plugins).toBeDefined();
  });
});