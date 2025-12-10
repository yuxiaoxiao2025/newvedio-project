# 文件操作指南

文件上传处理、验证算法、存储管理和大文件优化策略。

## 文件上传处理流程

### 前端文件选择
```javascript
// frontend/src/components/FileUploader.vue
const handleFileSelect = (event) => {
  const files = Array.from(event.target.files);

  // 前端验证
  const validFiles = files.filter(file => {
    const isValidType = validateFileType(file);
    const isValidSize = validateFileSize(file);
    return isValidType && isValidSize;
  });

  if (validFiles.length !== files.length) {
    showValidationError('部分文件不符合要求');
  }

  selectedFiles.value = validFiles.slice(0, 3); // 最多3个文件
};
```

### 后端文件接收
```javascript
// backend/src/middleware/fileValidation.js
const multer = require('multer');
const path = require('path');

// 存储配置
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const category = req.body.category || 'personal';
    const uploadPath = path.join(process.env.UPLOAD_DIR, category);
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // 使用UUID避免文件名冲突
    const ext = path.extname(file.originalname);
    const filename = `${uuid.v4()}${ext}`;
    cb(null, filename);
  }
});

// 文件过滤器
const fileFilter = (req, file, cb) => {
  const allowedMimes = ['video/mp4', 'video/avi', 'video/msvideo'];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('不支持的文件格式'), false);
  }
};

// Multer配置
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 314572800, // 300MB
    files: 3
  }
});
```

## 文件验证算法

### 前端验证
```javascript
// frontend/src/utils/fileValidator.js
export const fileValidator = {
  validateFileType: (file) => {
    const allowedTypes = ['video/mp4', 'video/avi'];
    const allowedExtensions = ['.mp4', '.avi'];

    const hasValidMimeType = allowedTypes.includes(file.type);
    const hasValidExtension = allowedExtensions.some(
      ext => file.name.toLowerCase().endsWith(ext)
    );

    return hasValidMimeType && hasValidExtension;
  },

  validateFileSize: (file) => {
    const maxSize = 314572800; // 300MB
    return file.size <= maxSize;
  },

  validateFileCount: (files) => {
    return files.length <= 3;
  },

  getFileInfo: (file) => {
    return {
      name: file.name,
      size: file.size,
      type: file.type,
      sizeMB: (file.size / 1024 / 1024).toFixed(2),
      extension: file.name.split('.').pop().toLowerCase()
    };
  }
};
```

### 后端验证
```javascript
// backend/src/utils/fileValidator.js
const fs = require('fs');
const path = require('path');

class FileValidator {
  static validateFileType(file) {
    const allowedMimes = ['video/mp4', 'video/avi', 'video/msvideo'];
    const allowedExtensions = ['.mp4', '.avi'];

    const mimeValid = allowedMimes.includes(file.mimetype);
    const extValid = allowedExtensions.includes(
      path.extname(file.originalname).toLowerCase()
    );

    return mimeValid && extValid;
  }

  static async validateFileContent(filePath) {
    // 验证文件头部标识符
    const buffer = fs.readFileSync(filePath, { start: 0, end: 12 });

    // MP4文件头部标识
    const mp4Signature = Buffer.from('ftyp');
    // AVI文件头部标识
    const aviSignature = Buffer.from('RIFF');

    return buffer.includes(mp4Signature) || buffer.includes(aviSignature);
  }

  static async validateVideoFile(filePath) {
    try {
      // 使用ffprobe验证视频文件
      const { exec } = require('child_process');
      const { promisify } = require('util');
      const execAsync = promisify(exec);

      const command = `ffprobe -v quiet -print_format json -show_streams "${filePath}"`;
      const { stdout } = await execAsync(command);

      const probeData = JSON.parse(stdout);
      const videoStream = probeData.streams.find(s => s.codec_type === 'video');

      return !!videoStream;
    } catch (error) {
      console.error('视频验证失败:', error);
      return false;
    }
  }
}
```

## 存储管理策略

### 目录结构管理
```javascript
// backend/src/utils/storageManager.js
class StorageManager {
  constructor() {
    this.baseDir = process.env.UPLOAD_DIR;
    this.categories = ['personal', 'scenic'];
  }

  ensureDirectories() {
    this.categories.forEach(category => {
      const dir = path.join(this.baseDir, category);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  getStoragePath(category, filename) {
    return path.join(this.baseDir, category, filename);
  }

  getStorageStats() {
    const stats = {};

    this.categories.forEach(category => {
      const dir = path.join(this.baseDir, category);
      if (fs.existsSync(dir)) {
        const files = fs.readdirSync(dir);
        let totalSize = 0;

        files.forEach(file => {
          const filePath = path.join(dir, file);
          const stat = fs.statSync(filePath);
          totalSize += stat.size;
        });

        stats[category] = {
          fileCount: files.length,
          totalSize: totalSize,
          totalSizeMB: (totalSize / 1024 / 1024).toFixed(2)
        };
      }
    });

    return stats;
  }

  cleanupOldFiles(maxAgeDays = 30) {
    const maxAge = maxAgeDays * 24 * 60 * 60 * 1000;
    const now = Date.now();

    this.categories.forEach(category => {
      const dir = path.join(this.baseDir, category);
      if (fs.existsSync(dir)) {
        const files = fs.readdirSync(dir);

        files.forEach(file => {
          const filePath = path.join(dir, file);
          const stat = fs.statSync(filePath);

          if (now - stat.mtime.getTime() > maxAge) {
            fs.unlinkSync(filePath);
            console.log(`清理旧文件: ${filePath}`);
          }
        });
      }
    });
  }
}
```

## 大文件处理优化

### 分片上传实现
```javascript
// backend/src/controllers/chunkedUpload.js
class ChunkedUploadManager {
  constructor() {
    this.chunks = new Map(); // 存储分片信息
    this.chunkSize = 1024 * 1024; // 1MB分片
  }

  async initiateUpload(filename, totalSize, category) {
    const uploadId = uuid.v4();
    const totalChunks = Math.ceil(totalSize / this.chunkSize);

    this.chunks.set(uploadId, {
      filename,
      totalSize,
      category,
      totalChunks,
      receivedChunks: new Set(),
      filePath: path.join(process.env.UPLOAD_DIR, category, `${uploadId}-${filename}`)
    });

    return { uploadId, totalChunks, chunkSize: this.chunkSize };
  }

  async uploadChunk(uploadId, chunkIndex, chunkData) {
    const upload = this.chunks.get(uploadId);
    if (!upload) {
      throw new Error('Upload session not found');
    }

    // 存储分片
    const chunkPath = `${upload.filePath}.part${chunkIndex}`;
    fs.writeFileSync(chunkPath, chunkData);

    upload.receivedChunks.add(chunkIndex);

    return {
      received: upload.receivedChunks.size,
      total: upload.totalChunks,
      progress: (upload.receivedChunks.size / upload.totalChunks) * 100
    };
  }

  async completeUpload(uploadId) {
    const upload = this.chunks.get(uploadId);
    if (!upload) {
      throw new Error('Upload session not found');
    }

    // 合并分片
    const writeStream = fs.createWriteStream(upload.filePath);

    for (let i = 0; i < upload.totalChunks; i++) {
      const chunkPath = `${upload.filePath}.part${i}`;
      const chunkData = fs.readFileSync(chunkPath);
      writeStream.write(chunkData);
      fs.unlinkSync(chunkPath); // 删除分片文件
    }

    writeStream.end();

    // 清理会话信息
    this.chunks.delete(uploadId);

    return {
      success: true,
      filename: upload.filename,
      filePath: upload.filePath,
      size: upload.totalSize
    };
  }
}
```

### 并发上传控制
```javascript
// backend/src/middleware/uploadLimiter.js
const rateLimit = require('express-rate-limit');

const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 10, // 每个IP最多10次上传请求
  message: {
    success: false,
    error: {
      code: 'TOO_MANY_REQUESTS',
      message: '上传请求过于频繁，请稍后再试'
    }
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.ip + ':' + (req.body.category || 'unknown');
  }
});

// 并发上传数限制
class ConcurrentUploadLimiter {
  constructor(maxConcurrent = 3) {
    this.maxConcurrent = maxConcurrent;
    this.currentUploads = 0;
    this.uploadQueue = [];
  }

  async acquireUploadSlot() {
    return new Promise((resolve) => {
      if (this.currentUploads < this.maxConcurrent) {
        this.currentUploads++;
        resolve();
      } else {
        this.uploadQueue.push(resolve);
      }
    });
  }

  releaseUploadSlot() {
    this.currentUploads--;
    if (this.uploadQueue.length > 0) {
      const next = this.uploadQueue.shift();
      this.currentUploads++;
      next();
    }
  }
}
```

## 文件安全处理

### 文名安全处理
```javascript
// backend/src/utils/fileSecurity.js
class FileSecurity {
  static sanitizeFilename(filename) {
    // 移除危险字符
    return filename
      .replace(/[^a-zA-Z0-9.-_]/g, '_')
      .replace(/_{2,}/g, '_')
      .toLowerCase();
  }

  static generateSecureFilename(originalName, uploadId) {
    const ext = path.extname(originalName);
    const sanitizedName = this.sanitizeFilename(
      path.basename(originalName, ext)
    );
    return `${uploadId}_${sanitizedName}${ext}`;
  }

  static validateFilePath(filePath) {
    // 防止路径遍历攻击
    const resolvedPath = path.resolve(filePath);
    const allowedPath = path.resolve(process.env.UPLOAD_DIR);

    return resolvedPath.startsWith(allowedPath);
  }
}
```

### 病毒扫描（可选）
```javascript
// backend/src/utils/virusScanner.js
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

class VirusScanner {
  static async scanFile(filePath) {
    try {
      // 使用ClamAV进行病毒扫描
      const command = `clamscan --no-summary "${filePath}"`;
      const { stdout, stderr } = await execAsync(command);

      if (stdout.includes('FOUND')) {
        throw new Error('文件包含恶意代码');
      }

      return true;
    } catch (error) {
      console.error('病毒扫描失败:', error);
      return false;
    }
  }
}
```