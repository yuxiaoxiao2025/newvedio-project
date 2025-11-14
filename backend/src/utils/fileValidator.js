const path = require('path');
const fs = require('fs-extra');
const config = require('../config/upload');

class FileValidator {
  // Validate file extension
  validateExtension(filename) {
    const ext = path.extname(filename).toLowerCase();
    return config.allowedExtensions.includes(ext);
  }

  // Validate MIME type
  validateMimeType(mimetype) {
    return config.allowedMimeTypes.includes(mimetype);
  }

  // Validate file size
  validateSize(size) {
    return size > 0 && size <= config.maxFileSize;
  }

  // Validate file count
  validateFileCount(count) {
    return count >= 1 && count <= config.maxFilesPerSession;
  }

  // Check if all files are the same type
  validateConsistentType(files) {
    if (files.length <= 1) return true;

    const extensions = files.map(file => path.extname(file.name || file.originalname).toLowerCase());
    const uniqueExtensions = new Set(extensions);

    return uniqueExtensions.size === 1;
  }

  // Validate file signature (magic numbers)
  async validateFileSignature(filePath) {
    try {
      const buffer = await fs.readFile(filePath, { start: 0, end: 11 });

      // MP4 file signature detection (simplified)
      if (buffer.length >= 8) {
        // Check for 'ftyp' box at position 4
        if (buffer.toString('ascii', 4, 8) === 'ftyp') {
          return { valid: true, type: 'mp4' };
        }
      }

      // AVI file signature detection (simplified)
      if (buffer.length >= 12) {
        // Check for 'RIFF' at start and 'AVI ' at position 8
        if (buffer.toString('ascii', 0, 4) === 'RIFF' &&
            buffer.toString('ascii', 8, 12) === 'AVI ') {
          return { valid: true, type: 'avi' };
        }
      }

      return { valid: false, error: '文件签名不匹配' };

    } catch (error) {
      return { valid: false, error: '无法读取文件签名' };
    }
  }

  // Comprehensive file validation
  async validateFile(file) {
    const validation = {
      valid: true,
      errors: []
    };

    // Validate extension
    if (!this.validateExtension(file.originalname || file.name)) {
      validation.valid = false;
      validation.errors.push(`不支持的文件扩展名`);
    }

    // Validate MIME type
    if (file.mimetype && !this.validateMimeType(file.mimetype)) {
      validation.valid = false;
      validation.errors.push(`不支持的MIME类型: ${file.mimetype}`);
    }

    // Validate size
    if (!this.validateSize(file.size)) {
      validation.valid = false;
      validation.errors.push(`文件大小无效或超过限制 (${config.maxFileSize / 1024 / 1024}MB)`);
    }

    // Validate file signature if file path is provided
    if (file.path) {
      const signatureValidation = await this.validateFileSignature(file.path);
      if (!signatureValidation.valid) {
        validation.valid = false;
        validation.errors.push(signatureValidation.error || '文件格式验证失败');
      }
    }

    return validation;
  }

  // Validate multiple files
  async validateFiles(files) {
    const results = {
      valid: true,
      files: [],
      summary: {
        total: files.length,
        valid: 0,
        invalid: 0
      }
    };

    // Validate file count
    if (!this.validateFileCount(files.length)) {
      results.valid = false;
      results.globalErrors = [`文件数量无效 (1-${config.maxFilesPerSession}个)`];
      return results;
    }

    // Validate individual files
    for (let i = 0; i < files.length; i++) {
      const fileValidation = await this.validateFile(files[i]);

      results.files.push({
        index: i,
        filename: files[i].originalname || files[i].name,
        ...fileValidation
      });

      if (fileValidation.valid) {
        results.summary.valid++;
      } else {
        results.summary.invalid++;
        results.valid = false;
      }
    }

    // Validate file type consistency
    if (!this.validateConsistentType(files)) {
      results.valid = false;
      results.globalErrors = results.globalErrors || [];
      results.globalErrors.push('所有文件必须是相同类型');
    }

    return results;
  }
}

module.exports = new FileValidator();