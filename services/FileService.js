const fs = require("fs").promises;
const path = require("path");
const axios = require("axios");
const constants = require('../config/constants');

class FileService {
  constructor() {
    this.downloadDir = constants.DOWNLOAD_DIR;
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

  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  async cleanupUserImagesOnly(userId, sessionService) {
    try {
      const session = sessionService.getSession(userId);
      if (session && session.images) {
        for (const imagePath of session.images) {
          try { await fs.unlink(imagePath); } catch (error) {}
        }
      }
      console.log(`🧹 Cleaned up images for user ${userId}`);
    } catch (error) {
      console.error('Image cleanup error:', error);
    }
  }

  async cleanupUserFiles(userId, sessionService) {
    try {
      const session = sessionService.getSession(userId);
      if (session) {
        if (session.images) {
          for (const imagePath of session.images) {
            try { await fs.unlink(imagePath); } catch (error) {}
          }
        }
        if (session.originalPdfPath) {
          try { await fs.unlink(session.originalPdfPath); } catch (error) {}
        }
      }
      sessionService.cleanupSession(userId);
      console.log(`🧹 Cleaned up all files for user ${userId}`);
    } catch (error) {
      console.error('Cleanup error:', error);
    }
  }
}

module.exports = new FileService();