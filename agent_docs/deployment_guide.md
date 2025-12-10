# 部署指南

完整的环境配置和生产部署指南，涵盖从开发环境到生产环境的全流程部署。

## 环境配置详解

### 系统要求

#### 最低配置
- **操作系统**: Windows 10+, macOS 10.15+, Ubuntu 18.04+
- **Node.js**: 16.0.0 (LTS)
- **内存**: 4GB RAM (推荐8GB)
- **存储**: 10GB可用空间
- **网络**: 稳定的互联网连接

#### 推荐配置
- **操作系统**: Ubuntu 20.04 LTS 或 CentOS 8
- **Node.js**: 18.0.0 LTS
- **内存**: 16GB RAM
- **存储**: 50GB SSD
- **网络**: 带宽100Mbps+

### Node.js环境安装

#### 使用nvm安装（推荐）
```bash
# 安装nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# 重新加载shell
source ~/.bashrc

# 安装LTS版本
nvm install --lts
nvm use --lts
nvm alias default node
```

#### Windows安装
```powershell
# 使用Chocolatey
choco install nodejs-lts

# 或下载官方安装包
# https://nodejs.org/en/download/
```

### 依赖管理配置

#### cnpm配置
```bash
# 安装cnpm
npm install -g cnpm --registry=https://registry.npmmirror.com

# 验证安装
cnpm -v

# 配置镜像
cnpm config set registry https://registry.npmmirror.com
```

## 环境变量配置

### 后端环境变量 (.env)
```env
# 服务器配置
PORT=8005
NODE_ENV=production

# 文件上传配置
UPLOAD_DIR=./upload
MAX_FILE_SIZE=314572800
ALLOWED_FILE_TYPES=mp4,avi
MAX_FILES_PER_REQUEST=3

# 安全配置
JWT_SECRET=your-super-secret-jwt-key-here
CORS_ORIGIN=https://yourdomain.com
RATE_LIMIT_WINDOW=900000
RATE_LIMIT_MAX=100

# 日志配置
LOG_LEVEL=info
LOG_DIR=./logs

# 数据库配置（如需要）
DB_HOST=localhost
DB_PORT=5432
DB_NAME=video_upload
DB_USER=your_db_user
DB_PASS=your_db_password
```

### 前端环境变量 (.env.production)
```env
# API配置
VITE_API_BASE_URL=https://api.yourdomain.com
VITE_WS_URL=wss://api.yourdomain.com

# 应用配置
VITE_MAX_FILE_SIZE=314572800
VITE_ALLOWED_FILE_TYPES=mp4,avi
VITE_APP_TITLE=视频上传应用

# 分析和监控
VITE_ENABLE_ANALYTICS=true
VITE_SENTRY_DSN=your-sentry-dsn
```

## 开发环境配置

### 快速启动
```bash
# 1. 克隆项目
git clone <repository-url>
cd newvedio-project

# 2. 安装依赖
cd backend && cnpm install
cd ../frontend && cnpm install

# 3. 配置环境变量
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# 4. 创建必要目录
mkdir -p backend/upload/personal backend/upload/scenic backend/logs

# 5. 启动服务
# 终端1 - 后端
cd backend && npm start

# 终端2 - 前端
cd frontend && npm run dev
```

### 开发工具配置

#### VSCode推荐扩展
```json
{
  "recommendations": [
    "vue.volar",
    "bradlc.vscode-tailwindcss",
    "ms-vscode.vscode-typescript-next",
    "esbenp.prettier-vscode",
    "dbaeumer.vscode-eslint",
    "ms-vscode.vscode-json"
  ]
}
```

#### ESLint配置 (.eslintrc.js)
```javascript
module.exports = {
  env: {
    node: true,
    es2021: true,
  },
  extends: [
    'eslint:recommended',
  ],
  parserOptions: {
    ecmaVersion: 12,
    sourceType: 'module',
  },
  rules: {
    'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
  },
};
```

## 生产部署

### 使用PM2进程管理

#### PM2安装和配置
```bash
# 安装PM2
npm install -g pm2

# 创建PM2配置文件
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [
    {
      name: 'video-upload-backend',
      script: './backend/src/app.js',
      cwd: './backend',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 8005
      },
      error_file: './logs/err.log',
      out_file: './logs/out.log',
      log_file: './logs/combined.log',
      time: true,
      max_memory_restart: '1G',
      node_args: '--max_old_space_size=1024'
    }
  ]
};
EOF
```

#### PM2命令
```bash
# 启动应用
pm2 start ecosystem.config.js

# 监控应用
pm2 monit

# 查看日志
pm2 logs

# 重启应用
pm2 restart video-upload-backend

# 停止应用
pm2 stop video-upload-backend

# 删除应用
pm2 delete video-upload-backend

# 保存PM2配置
pm2 save

# 设置开机自启
pm2 startup
```

### Nginx反向代理配置

#### 安装Nginx
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install nginx

# CentOS/RHEL
sudo yum install nginx

# Windows
# 下载并安装官方版本
```

#### 配置文件 (/etc/nginx/sites-available/video-upload)
```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    # 前端静态文件
    location / {
        root /path/to/frontend/dist;
        try_files $uri $uri/ /index.html;

        # 缓存配置
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # API代理
    location /api/ {
        proxy_pass http://localhost:8005;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # 文件上传大小限制
        client_max_body_size 300M;
    }

    # WebSocket代理
    location /socket.io/ {
        proxy_pass http://localhost:8005;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # 安全头
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
}
```

#### SSL证书配置（Let's Encrypt）
```bash
# 安装Certbot
sudo apt install certbot python3-certbot-nginx

# 获取证书
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# 自动续期
sudo crontab -e
# 添加: 0 12 * * * /usr/bin/certbot renew --quiet
```

### 数据库配置（可选）

#### PostgreSQL安装和配置
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install postgresql postgresql-contrib

# 创建数据库和用户
sudo -u postgres psql
CREATE DATABASE video_upload;
CREATE USER video_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE video_upload TO video_user;
\q
```

#### 连接配置
```javascript
// backend/src/config/database.js
const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASS,
  port: process.env.DB_PORT,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

module.exports = pool;
```

## 健康检查实现

### 后端健康检查端点
```javascript
// backend/src/routes/health.js
const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();

router.get('/health', async (req, res) => {
  try {
    const health = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      version: process.env.npm_package_version || '1.0.0',
      checks: {}
    };

    // 检查上传目录
    const uploadDir = path.join(__dirname, '../upload');
    health.checks.uploadDirectory = {
      status: fs.existsSync(uploadDir) ? 'ok' : 'error',
      path: uploadDir
    };

    // 检查日志目录
    const logDir = path.join(__dirname, '../logs');
    health.checks.logDirectory = {
      status: fs.existsSync(logDir) ? 'ok' : 'error',
      path: logDir
    };

    // 检查磁盘空间
    const stats = fs.statSync(uploadDir);
    health.checks.diskSpace = {
      status: 'ok',
      available: '需要实际实现磁盘空间检查'
    };

    const statusCode = health.checks.uploadDirectory.status === 'ok' ? 200 : 503;
    res.status(statusCode).json(health);

  } catch (error) {
    res.status(503).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

module.exports = router;
```

### 前端健康检查
```javascript
// frontend/src/utils/healthCheck.js
export const healthCheck = {
  checkBackend: async () => {
    try {
      const response = await fetch('/api/health');
      const data = await response.json();
      return {
        status: 'ok',
        data
      };
    } catch (error) {
      return {
        status: 'error',
        error: error.message
      };
    }
  },

  checkWebSocket: () => {
    return new Promise((resolve) => {
      const socket = io(import.meta.env.VITE_WS_URL);
      const timeout = setTimeout(() => {
        socket.disconnect();
        resolve({ status: 'error', error: 'WebSocket连接超时' });
      }, 5000);

      socket.on('connect', () => {
        clearTimeout(timeout);
        socket.disconnect();
        resolve({ status: 'ok' });
      });
    });
  }
};
```

## 监控和日志管理

### 日志轮转配置
```bash
# 安装logrotate
sudo apt install logrotate

# 创建logrotate配置
sudo tee /etc/logrotate.d/video-upload << EOF
/path/to/backend/logs/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 www-data www-data
    postrotate
        pm2 reloadLogs
    endscript
}
EOF
```

### 监控脚本
```bash
#!/bin/bash
# monitoring.sh - 应用监控脚本

# 检查PM2进程状态
check_pm2() {
    if ! pm2 list | grep -q "video-upload-backend.*online"; then
        echo "PM2进程异常，尝试重启..."
        pm2 restart video-upload-backend
    fi
}

# 检查磁盘空间
check_disk_space() {
    USAGE=$(df /path/to/upload | awk 'NR==2 {print $5}' | sed 's/%//')
    if [ $USAGE -gt 80 ]; then
        echo "磁盘空间不足: ${USAGE}%"
        # 发送告警通知
    fi
}

# 检查内存使用
check_memory() {
    MEMORY=$(pm2 jlist | jq '.[0].monit.memory' 2>/dev/null || echo "0")
    MEMORY_MB=$((MEMORY / 1024 / 1024))
    if [ $MEMORY_MB -gt 1024 ]; then
        echo "内存使用过高: ${MEMORY_MB}MB"
        pm2 restart video-upload-backend
    fi
}

# 执行检查
check_pm2
check_disk_space
check_memory

echo "监控检查完成: $(date)"
```

### 告警配置
```javascript
// backend/src/utils/alerting.js
const alerting = {
  sendError: async (error, context) => {
    // 发送错误告警到监控系统
    if (process.env.NODE_ENV === 'production') {
      console.error('生产环境错误:', {
        error: error.message,
        stack: error.stack,
        context,
        timestamp: new Date().toISOString()
      });

      // 可选: 集成Sentry或其他监控服务
      // Sentry.captureException(error, { extra: context });
    }
  },

  sendPerformanceAlert: async (metric, value, threshold) => {
    if (value > threshold) {
      console.warn('性能告警:', {
        metric,
        value,
        threshold,
        timestamp: new Date().toISOString()
      });
    }
  }
};
```

## 备份和恢复

### 数据备份脚本
```bash
#!/bin/bash
# backup.sh - 数据备份脚本

BACKUP_DIR="/backup/video-upload"
DATE=$(date +%Y%m%d_%H%M%S)

# 创建备份目录
mkdir -p $BACKUP_DIR

# 备份上传文件
echo "备份上传文件..."
tar -czf "$BACKUP_DIR/upload_$DATE.tar.gz" -C /path/to/backend upload/

# 备份数据库（如果使用）
# pg_dump -h localhost -U video_user video_upload > "$BACKUP_DIR/db_$DATE.sql"

# 备份配置文件
cp /path/to/backend/.env "$BACKUP_DIR/env_$DATE"

# 清理旧备份（保留30天）
find $BACKUP_DIR -name "*.tar.gz" -mtime +30 -delete
find $BACKUP_DIR -name "*.sql" -mtime +30 -delete

echo "备份完成: $BACKUP_DIR"
```

### 恢复脚本
```bash
#!/bin/bash
# restore.sh - 数据恢复脚本

if [ $# -eq 0 ]; then
    echo "用法: $0 <backup_date>"
    echo "示例: $0 20240110_120000"
    exit 1
fi

BACKUP_DATE=$1
BACKUP_DIR="/backup/video-upload"

# 恢复上传文件
echo "恢复上传文件..."
tar -xzf "$BACKUP_DIR/upload_$BACKUP_DATE.tar.gz" -C /path/to/backend

# 恢复数据库（如果需要）
# psql -h localhost -U video_user video_upload < "$BACKUP_DIR/db_$BACKUP_DATE.sql"

echo "恢复完成"
```

## 部署检查清单

### 部署前检查
- [ ] 服务器配置满足要求
- [ ] Node.js版本兼容
- [ ] 环境变量配置完整
- [ ] SSL证书配置（生产环境）
- [ ] 防火墙规则配置
- [ ] 数据库连接测试（如使用）

### 部署后验证
- [ ] 应用启动成功
- [ ] 健康检查端点正常
- [ ] 文件上传功能测试
- [ ] WebSocket连接测试
- [ ] 日志记录正常
- [ ] 监控告警配置
- [ ] 备份策略实施

### 性能优化
- [ ] 启用Gzip压缩
- [ ] 配置静态文件缓存
- [ ] 数据库连接池优化
- [ ] CDN配置（如需要）
- [ ] 负载均衡配置（多实例）