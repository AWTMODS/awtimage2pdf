const fs = require("fs").promises;
const path = require("path");
const axios = require("axios");
const { DOWNLOAD_DIR } = require("../config/constants");

class FileService {
  constructor() {
    this.downloadDir = DOWNLOAD_DIR;
  }

  async ensureDownloadDir() {
    try {
      await fs.access(this.downloadDir);
    } catch {
      await fs.mkdir(this.downloadDir, { recursive: true });
    }
  }

  generateUniqueId() {
    return Date.now() + Math.random().toString(36).substr(2, 9);
  }

  async downloadImage(fileUrl, filePath) {
    try {
      console.log(`📥 Downloading image from: ${fileUrl}`);
      const response = await axios({
        method: 'GET',
        url: fileUrl,
        responseType: 'stream',
      });

      const writer = require('fs').createWriteStream(filePath);
      response.data.pipe(writer);

      return new Promise((resolve, reject) => {
        writer.on('finish', () => {
          console.log(`✅ Image downloaded to: ${filePath}`);
          resolve();
        });
        writer.on('error', reject);
      });
    } catch (error) {
      console.error('Download error:', error);
      throw error;
    }
  }

  async cleanupFiles(filePaths) {
    for (const filePath of filePaths) {
      try {
        await fs.unlink(filePath);
      } catch (error) {
        // Silently ignore deletion errors
      }
    }
  }

  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  async getFileStats(filePaths) {
    let totalSize = 0;
    for (const filePath of filePaths) {
      try {
        const stats = await fs.stat(filePath);
        totalSize += stats.size;
      } catch (error) {
        console.warn('Could not get size for:', filePath);
      }
    }
    return { totalSize, fileCount: filePaths.length };
  }
}

module.exports = FileService;