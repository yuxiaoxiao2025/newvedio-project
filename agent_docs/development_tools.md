# 开发工具指南

开发环境配置、调试工具使用、代码质量检查和自动化工作流设置。

## 开发环境配置

### VSCode配置
```json
// .vscode/settings.json
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "emmet.includeLanguages": {
    "vue": "html"
  },
  "files.associations": {
    "*.vue": "vue"
  },
  "eslint.workingDirectories": ["frontend", "backend"],
  "typescript.preferences.importModuleSpecifier": "relative"
}
```

```json
// .vscode/extensions.json
{
  "recommendations": [
    "vue.volar",
    "bradlc.vscode-tailwindcss",
    "esbenp.prettier-vscode",
    "dbaeumer.vscode-eslint",
    "ms-vscode.vscode-json",
    "formulahendry.auto-rename-tag",
    "christian-kohler.path-intellisense",
    "ms-vscode.vscode-typescript-next"
  ]
}
```

### 代码格式化配置

#### Prettier配置 (.prettierrc)
```json
{
  "semi": false,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 80,
  "bracketSpacing": true,
  "arrowParens": "avoid"
}
```

#### ESLint配置 (.eslintrc.js)
```javascript
module.exports = {
  root: true,
  env: {
    node: true,
    browser: true,
    es2021: true
  },
  extends: [
    'eslint:recommended',
    '@vue/eslint-config-prettier'
  ],
  parserOptions: {
    ecmaVersion: 2021,
    sourceType: 'module'
  },
  rules: {
    'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    'prefer-const': 'error',
    'no-var': 'error'
  }
};
```

## Git Hooks配置

### Husky设置
```bash
# 安装Husky
npm install --save-dev husky

# 初始化
npx husky install

# 添加pre-commit hook
npx husky add .husky/pre-commit "npm run lint && npm run test"

# 添加commit-msg hook
npx husky add .husky/commit-msg "npx commitlint --edit $1"
```

### lint-staged配置
```json
// package.json
{
  "lint-staged": {
    "*.{js,vue}": [
      "eslint --fix",
      "prettier --write"
    ],
    "*.{css,scss,vue}": [
      "prettier --write"
    ],
    "*.{json,md}": [
      "prettier --write"
    ]
  }
}
```

### Commitlint配置
```javascript
// commitlint.config.js
module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat',     // 新功能
        'fix',      // 修复bug
        'docs',     // 文档更新
        'style',    // 代码格式化
        'refactor', // 重构
        'test',     // 测试
        'chore',    // 构建过程或辅助工具的变动
        'perf',     // 性能优化
        'ci',       // CI配置文件或脚本的变动
        'build',    // 构建系统或外部依赖的变动
        'revert'    // 回滚
      ]
    ],
    'subject-max-length': [2, 'always', 50],
    'body-max-line-length': [2, 'always', 72]
  }
};
```

## 调试工具配置

### VSCode调试配置 (.vscode/launch.json)
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug Backend",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/backend/src/app.js",
      "cwd": "${workspaceFolder}/backend",
      "env": {
        "NODE_ENV": "development"
      },
      "console": "integratedTerminal",
      "restart": true,
      "runtimeExecutable": "nodemon"
    },
    {
      "name": "Debug Frontend",
      "type": "chrome",
      "request": "launch",
      "url": "http://localhost:3005",
      "webRoot": "${workspaceFolder}/frontend/src",
      "sourceMapPathOverrides": {
        "webpack:///src/*": "${webRoot}/*"
      }
    }
  ]
}
```

### Chrome DevTools调试
```javascript
// frontend/src/utils/debug.js
if (process.env.NODE_ENV === 'development') {
  // 全局调试工具
  window.__VUE_DEVTOOLS_GLOBAL_HOOK__.Vue = {
    config: {
      devtools: true
    }
  };

  // 性能监控
  const observer = new PerformanceObserver((list) => {
    list.getEntries().forEach((entry) => {
      console.log('Performance:', entry.name, entry.duration);
    });
  });

  observer.observe({ entryTypes: ['measure', 'navigation'] });
}
```

## 自动化工作流

### GitHub Actions配置
```yaml
# .github/workflows/ci.yml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
          cache-dependency-path: backend/package-lock.json

      - run: cd backend && npm ci
      - run: cd backend && npm run lint
      - run: cd backend && npm test

  test-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
          cache-dependency-path: frontend/package-lock.json

      - run: cd frontend && npm ci
      - run: cd frontend && npm run lint
      - run: cd frontend && npm run test
      - run: cd frontend && npm run build

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'

      - run: |
          cd backend && npm ci
          cd frontend && npm ci
          npm run build &
          cd backend && npm start &
          sleep 30

      - name: Run E2E tests
        run: npm run test:e2e
```

### 开发脚本
```json
// package.json (根目录)
{
  "scripts": {
    "dev": "concurrently \"npm run dev:backend\" \"npm run dev:frontend\"",
    "dev:backend": "cd backend && npm run dev",
    "dev:frontend": "cd frontend && npm run dev",
    "build": "cd frontend && npm run build",
    "test": "npm run test:backend && npm run test:frontend",
    "test:backend": "cd backend && npm test",
    "test:frontend": "cd frontend && npm test",
    "test:e2e": "cd frontend && npm run test:e2e",
    "lint": "npm run lint:backend && npm run lint:frontend",
    "lint:backend": "cd backend && npm run lint",
    "lint:frontend": "cd frontend && npm run lint",
    "lint:fix": "npm run lint:backend --fix && npm run lint:frontend --fix",
    "clean": "rm -rf backend/node_modules frontend/node_modules",
    "setup": "npm install && cd backend && npm install && cd ../frontend && npm install"
  }
}
```

## 代码质量检查

### SonarQube配置
```javascript
// sonar-project.properties
sonar.projectKey=video-upload-app
sonar.projectName=Video Upload Application
sonar.projectVersion=1.0.0

# 源代码路径
sonar.sources=frontend/src,backend/src
sonar.tests=frontend/tests,backend/tests
sonar.test.inclusions=**/*.test.js,**/*.spec.js

# 排除文件
sonar.exclusions=**/node_modules/**,**/dist/**,**/build/**

# 代码覆盖率
sonar.javascript.lcov.reportPaths=frontend/coverage/lcov.info,backend/coverage/lcov.info

# 质量门禁
sonar.qualitygate.wait=true
```

### 依赖安全检查
```bash
# 安装npm audit
npm install -g audit-ci

# 安全检查脚本
#!/bin/bash
# security-check.sh

echo "🔍 检查依赖安全漏洞..."

# 检查后端依赖
cd backend
echo "检查后端依赖..."
npm audit --audit-level=high

# 检查前端依赖
cd ../frontend
echo "检查前端依赖..."
npm audit --audit-level=high

# 生成安全报告
npm audit --json > security-report.json

echo "✅ 安全检查完成"
```

## 性能监控工具

### Lighthouse CI
```yaml
# .github/workflows/lighthouse.yml
name: Lighthouse CI

on:
  push:
    branches: [main]

jobs:
  lighthouse:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'

      - run: |
          cd frontend && npm ci
          npm run build

      - name: Run Lighthouse
        uses: treosh/lighthouse-ci-action@v9
        with:
          configPath: './lighthouserc.json'
          uploadArtifacts: true

      - name: Upload results
        uses: actions/upload-artifact@v3
        with:
          name: lighthouse-report
          path: '.lighthouseci'
```

### Bundle分析
```javascript
// frontend/analyze-bundle.js
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
const { execSync } = require('child_process');

const analyzeBundle = () => {
  console.log('📊 分析打包文件...');

  // 使用webpack-bundle-analyzer
  execSync('npm run build -- --analyze', { stdio: 'inherit' });

  console.log('✅ Bundle分析完成');
};

if (require.main === module) {
  analyzeBundle();
}

module.exports = { analyzeBundle };
```

## 数据库工具（如使用）

### 数据库迁移
```javascript
// backend/scripts/migrate.js
const { Pool } = require('pg');

async function migrate() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL
  });

  try {
    // 创建上传记录表
    await pool.query(`
      CREATE TABLE IF NOT EXISTS uploads (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        filename VARCHAR(255) NOT NULL,
        original_name VARCHAR(255) NOT NULL,
        file_size BIGINT NOT NULL,
        category VARCHAR(50) NOT NULL,
        file_path VARCHAR(500) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('✅ 数据库迁移完成');
  } catch (error) {
    console.error('❌ 数据库迁移失败:', error);
  } finally {
    await pool.end();
  }
}

migrate();
```

## 开发监控仪表板

### 开发环境监控
```javascript
// backend/src/utils/devMonitor.js
class DevMonitor {
  constructor() {
    this.metrics = {
      requests: 0,
      uploads: 0,
      errors: 0,
      startTime: Date.now()
    };
  }

  logRequest(req, res, next) {
    this.metrics.requests++;
    console.log(`📥 ${req.method} ${req.path} - ${this.metrics.requests}`);
    next();
  }

  logUpload() {
    this.metrics.uploads++;
    console.log(`📤 上传次数: ${this.metrics.uploads}`);
  }

  logError(error) {
    this.metrics.errors++;
    console.error(`❌ 错误次数: ${this.metrics.errors}`, error.message);
  }

  getStats() {
    const uptime = Math.floor((Date.now() - this.metrics.startTime) / 1000);

    return {
      uptime: `${uptime}s`,
      requests: this.metrics.requests,
      uploads: this.metrics.uploads,
      errors: this.metrics.errors,
      errorRate: ((this.metrics.errors / this.metrics.requests) * 100).toFixed(2) + '%'
    };
  }

  startMonitoring() {
    setInterval(() => {
      console.log('📊 开发环境统计:', this.getStats());
    }, 30000); // 每30秒输出一次统计信息
  }
}
```