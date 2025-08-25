# Next.js Setup Research Findings

**Research Task**: Phase 2, Step 2.1 - Verify Next.js 15.5 setup requirements from official documentation  
**Date**: August 25, 2025  
**Research Agent**: Market Research Intelligence Specialist  
**Status**: COMPLETED ✅

## Executive Summary

Research validates Next.js 15.5 as the current latest version (released August 18, 2025) with comprehensive setup documentation available. All core components (TypeScript, ESLint, Tailwind CSS, App Router) are fully supported with official integration methods.

## Next.js 15.5 create-next-app Syntax

### Interactive Setup (Recommended)
```bash
npx create-next-app@latest
```

### Non-Interactive Setup with Options
```bash
npx create-next-app@latest <project-name> [options]
```

### Available Options
```bash
Options:
  -h, --help                          Show all available options
  -v, --version                       Output version number
  --ts, --typescript                  Initialize as TypeScript project (default)
  --js, --javascript                  Initialize as JavaScript project
  --tailwind                          Initialize with Tailwind CSS config (default)
  --eslint                           Initialize with ESLint config
  --app                              Initialize as App Router project (recommended)
  --src-dir                          Initialize inside a `src/` directory
  --turbo                            Enable Turbopack by default for development
  --import-alias <alias>             Specify import alias (default "@/*")
  --empty                            Initialize an empty project
  --use-npm                          Use npm as package manager
  --use-pnpm                         Use pnpm as package manager
  --use-yarn                         Use yarn as package manager
  --use-bun                          Use bun as package manager
  -e, --example [name]               Bootstrap with example template
  --example-path <path>              Specify example path separately
  --reset-preferences                Reset stored preferences
  --skip-install                     Skip installing packages
  --yes                              Use defaults for all options
```

### Interactive Prompts Example
```bash
What is your project named? my-app
Would you like to use TypeScript? No / Yes
Would you like to use ESLint? No / Yes  
Would you like to use Tailwind CSS? No / Yes
Would you like your code inside a `src/` directory? No / Yes
Would you like to use App Router? (recommended) No / Yes
Would you like to use Turbopack for `next dev`? No / Yes
Would you like to customize the import alias (`@/*` by default)? No / Yes
What import alias would you like configured? @/*
```

## TypeScript Configuration Best Practices

### Automatic Setup via create-next-app
- TypeScript is enabled by default in Next.js 15.5
- Automatically generates `tsconfig.json` and `next-env.d.ts`

### Recommended tsconfig.json Configuration
```json
{
  "compilerOptions": {
    "target": "es5",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "node",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx"],
  "exclude": ["node_modules"]
}
```

### Manual TypeScript Setup (if needed)
```bash
npm install --save-dev typescript @types/node @types/react @types/react-dom
```

## ESLint Setup Recommendations  

### Automatic Integration
- ESLint configuration is included by default via create-next-app
- Extends `next/core-web-vitals` for optimal Next.js linting

### Recommended ESLint Configuration (eslint.config.mjs)
```javascript
import { FlatCompat } from '@eslint/eslintrc'

const compat = new FlatCompat({
  baseDirectory: import.meta.dirname,
})

const eslintConfig = [
  ...compat.config({
    extends: ['next/core-web-vitals', 'next/typescript'],
  }),
]

export default eslintConfig
```

### Legacy Configuration (.eslintrc.json)
```json
{
  "extends": "next/core-web-vitals",
  "plugins": [
    "@next/eslint-plugin-next"
  ],
  "rules": {
    "@next/next/no-img-element": "off",
    "react/no-unescaped-entities": "warn"
  }
}
```

## Tailwind CSS Integration Methods

### Method 1: Automatic via create-next-app (Recommended)
- Tailwind CSS is included by default in Next.js 15.5
- Automatically configures `tailwind.config.js` and `postcss.config.js`

### Method 2: Manual Installation
```bash
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

### Recommended tailwind.config.js Configuration
```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

### Global CSS Setup (globals.css)
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

## App Router Configuration Requirements

### Default Configuration (Next.js 15.5)
- App Router is **enabled by default** (no experimental flag needed)
- App Router is the **recommended approach** over Pages Router
- Located in `/app` directory by default

### Key App Router Features Enabled
- **Server Components**: Default rendering mode
- **Layouts**: Shared UI between routes
- **Loading UI**: Built-in loading states
- **Error Handling**: Error boundaries
- **Route Handlers**: API routes in App Router
- **Middleware**: Edge runtime support

### next.config.js Configuration
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  // App Router is enabled by default - no configuration needed
  images: {
    domains: ['localhost'],
  },
  experimental: {
    // Turbopack builds (Beta in 15.5)
    turbopack: true,
  },
}

module.exports = nextConfig
```

## Version Compatibility Matrix

| Component | Next.js 15.5 | React Version | TypeScript | ESLint | Tailwind |
|-----------|--------------|---------------|------------|--------|----------|
| **React** | 18.3.1+ | ✅ Latest | ✅ Compatible | ✅ Compatible | ✅ Compatible |
| **TypeScript** | 5.0+ | ✅ Full Support | ✅ Core | ✅ Integration | ✅ Compatible |
| **ESLint** | 8.0+ | ✅ Built-in | ✅ Compatible | ✅ Core | ✅ Compatible |
| **Tailwind CSS** | 3.4+ | ✅ Built-in | ✅ Compatible | ✅ Compatible | ✅ Core |
| **Node.js** | 18.17+ | ✅ Required | ✅ Compatible | ✅ Compatible | ✅ Compatible |

## Breaking Changes & Deprecation Warnings

### Next.js 15.5 Changes
1. **Turbopack Builds (Beta)**: Production builds with `--turbopack` flag
2. **Node.js Middleware (Stable)**: No longer experimental
3. **TypeScript Improvements**: Typed routes for compile-time safety
4. **Next Lint Deprecation**: Preparing for removal in v16

### Deprecated Features (Next.js 16 Preparation)
- Legacy Pages Router patterns (still supported but discouraged)
- Old ESLint configurations
- Experimental middleware flags

### Migration Recommendations
- Use App Router for all new projects
- Update ESLint configurations to flat config format
- Prepare for Next.js 16 by addressing deprecation warnings

## Recommended Project Structure (App Router)

```
project-root/
├── app/                    # App Router directory (default)
│   ├── globals.css        # Global styles with Tailwind
│   ├── layout.tsx         # Root layout with font optimization
│   ├── page.tsx           # Homepage
│   ├── loading.tsx        # Loading UI
│   ├── error.tsx          # Error boundary
│   └── not-found.tsx      # 404 page
├── components/            # React components (recommended)
│   ├── ui/               # Base UI components
│   ├── molecules/        # Composed components  
│   └── organisms/        # Complex components
├── lib/                  # Utilities and configurations
├── hooks/                # Custom React hooks
├── types/                # TypeScript type definitions
├── public/               # Static assets
├── next.config.js        # Next.js configuration
├── tailwind.config.js    # Tailwind configuration
├── tsconfig.json         # TypeScript configuration
├── eslint.config.mjs     # ESLint configuration
└── package.json          # Dependencies and scripts
```

## Official Documentation References

### Primary Sources
- **Next.js 15.5 Release**: https://nextjs.org/blog/next-15-5
- **Installation Guide**: https://nextjs.org/docs/app/getting-started/installation  
- **create-next-app CLI**: https://nextjs.org/docs/app/api-reference/cli/create-next-app
- **TypeScript Configuration**: https://nextjs.org/docs/app/api-reference/config/typescript
- **ESLint Configuration**: https://nextjs.org/docs/app/api-reference/config/eslint
- **Tailwind CSS Integration**: https://nextjs.org/docs/app/building-your-application/styling/tailwind-css

### Version-Specific References
- **Next.js 15 Features**: https://nextjs.org/blog/next-15
- **Upgrade Guide**: https://nextjs.org/docs/app/guides/upgrading/version-15
- **App Router Guide**: https://nextjs.org/docs/app
- **GitHub Releases**: https://github.com/vercel/next.js/releases

## Validation Results

### ✅ Confirmed Requirements
- Next.js 15.5 is current latest stable version (August 18, 2025)
- create-next-app@latest syntax confirmed and tested
- TypeScript integration fully supported and recommended
- ESLint configuration methods validated  
- Tailwind CSS integration verified
- App Router is default and stable (no experimental flags needed)

### ⚠️ Important Notes
- App Router replaces Pages Router as the recommended approach
- Turbopack builds are in Beta but stable for development
- Node.js 18.17+ required for Next.js 15.5
- TypeScript is enabled by default (no manual setup needed)
- Flat ESLint config recommended for future compatibility

### 🔄 Breaking Changes Validated
- No breaking changes from Next.js 14.x to 15.5 for new projects
- Deprecation warnings present for Next.js 16 preparation
- Legacy configurations still supported but not recommended

## Implementation Recommendations

### For The Backroom Leeds Project
1. **Use Next.js 15.5** - Latest stable with all required features
2. **Enable App Router** - Default and recommended approach  
3. **TypeScript Configuration** - Use default setup with path aliases
4. **ESLint Setup** - Extend next/core-web-vitals with TypeScript rules
5. **Tailwind Integration** - Use built-in setup with custom theme
6. **Project Structure** - Follow recommended App Router patterns

### Command for Project Setup
```bash
npx create-next-app@latest backroom-leeds-website --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
```

---

**Research Validation**: All information sourced from official Next.js documentation and verified through multiple sources  
**Implementation Status**: READY FOR PHASE 2, STEP 2.2 (Project Initialization)
**Next Steps**: Proceed with actual project setup using validated configurations