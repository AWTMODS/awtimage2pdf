const sharp = require("sharp");
const path = require("path");
const FileService = require('./FileService');

class ImageService {
  async rotateImage(imagePath, degrees) {
    try {
      const rotatedPath = path.join(FileService.downloadDir, `rotated_${FileService.generateUniqueId()}.jpg`);
      await sharp(imagePath)
        .rotate(degrees)
        .toFile(rotatedPath);
      return rotatedPath;
    } catch (error) {
      console.error('Rotation error:', error);
      return imagePath;
    }
  }

  async enhanceImage(imagePath) {
    try {
      const enhancedPath = path.join(FileService.downloadDir, `enhanced_${FileService.generateUniqueId()}.jpg`);
      await sharp(imagePath)
        .normalize()
        .sharpen()
        .toFile(enhancedPath);
      return enhancedPath;
    } catch (error) {
      console.error('Enhancement error:', error);
      return imagePath;
    }
  }

  async generatePreviewInfo(images) {
    try {
      let totalSize = 0;
      const fs = require("fs").promises;
      
      for (const imagePath of images) {
        try {
          const stats = await fs.stat(imagePath);
          totalSize += stats.size;
        } catch (error) {
          console.warn('Could not get size for:', imagePath);
        }
      }

      const estimatedPdfSize = totalSize * 0.7;
      const pageCount = images.length;

      return {
        pageCount,
        estimatedSize: FileService.formatFileSize(estimatedPdfSize)
      };
    } catch (error) {
      return { pageCount: images.length, estimatedSize: 'Unknown' };
    }
  }
}

module.exports = new ImageService();