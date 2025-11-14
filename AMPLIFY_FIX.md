# AWS Amplify Build Fix

## Issue

AWS Amplify build failed with dependency resolution error:

```
npm error ERESOLVE unable to resolve dependency tree
npm error While resolving: spa-patent@0.0.1
npm error Found: apexcharts@3.54.1
```

## Root Cause

Version conflict between `apexcharts` and `vue3-apexcharts` packages. Since charts weren't being used yet (marked as "minimal for now"), these were unnecessary dependencies causing build failures.

## Solution Applied

### 1. Removed ApexCharts Dependencies ✅

**Before:**
```json
"dependencies": {
  "vue": "^3.4.0",
  "vue-router": "^4.2.5",
  "pinia": "^2.1.7",
  "naive-ui": "^2.38.0",
  "axios": "^1.6.0",
  "apexcharts": "^3.45.0",        // ❌ REMOVED
  "vue3-apexcharts": "^1.5.0",    // ❌ REMOVED
  "@fortawesome/fontawesome-free": "^6.5.0"
}
```

**After:**
```json
"dependencies": {
  "vue": "^3.4.0",
  "vue-router": "^4.2.5",
  "pinia": "^2.1.7",
  "naive-ui": "^2.38.0",
  "axios": "^1.6.0",
  "@fortawesome/fontawesome-free": "^6.5.0"
}
```

### 2. Added Node/NPM Version Requirements ✅

```json
"engines": {
  "node": ">=18.0.0",
  "npm": ">=9.0.0"
}
```

### 3. Created `amplify.yml` ✅

Explicit build configuration for AWS Amplify:

```yaml
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - npm install
    build:
      commands:
        - npm run build
  artifacts:
    baseDirectory: dist
    files:
      - '**/*'
  cache:
    paths:
      - node_modules/**/*
```

### 4. Created `.nvmrc` ✅

Ensures consistent Node version:

```
18.19.1
```

## Files Changed

- ✅ `package.json` - Removed ApexCharts, added engine requirements
- ✅ `amplify.yml` - Added build configuration
- ✅ `.nvmrc` - Specified Node version
- ✅ `README.md` - Updated to reflect ApexCharts removal

## Testing Locally

Before pushing, verify the build works:

```bash
cd /home/ubuntu/4aiworks/spa/spa_patent
rm -rf node_modules package-lock.json
npm install
npm run build
```

Should complete without errors.

## Deploy to AWS Amplify

After committing these changes:

```bash
git add .
git commit -m "fix: remove ApexCharts to resolve Amplify build dependency conflict"
git push
```

AWS Amplify will automatically detect the new `amplify.yml` and build successfully.

## When to Re-add ApexCharts

When you actually need charts:

1. Add back to `package.json`:
```json
"apexcharts": "^3.54.1",
"vue3-apexcharts": "^1.5.3"
```

2. Import in components that need charts:
```typescript
import VueApexCharts from 'vue3-apexcharts'
```

3. Use in templates:
```vue
<apexchart type="line" :options="chartOptions" :series="series" />
```

## Current Stack (Working)

- ✅ Vue 3.4.0
- ✅ TypeScript 5.3.0
- ✅ Vite 5.0.0
- ✅ Naive UI 2.38.0
- ✅ Vue Router 4.2.5
- ✅ Pinia 2.1.7
- ✅ Axios 1.6.0
- ✅ Font Awesome 6.5.0

**Total Dependencies: 7** (down from 9)

## Expected Build Result

After these changes, AWS Amplify should:

1. ✅ Clone repository successfully
2. ✅ Install dependencies without conflicts
3. ✅ Build TypeScript successfully
4. ✅ Generate production bundle in `dist/`
5. ✅ Deploy to CloudFront

Build time: ~2-3 minutes

