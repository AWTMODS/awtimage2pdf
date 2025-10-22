const sharp = require("sharp");
const path = require("path");
const { DOWNLOAD_DIR } = require("../config/constants");

class ImageService {
  constructor(fileService) {
    this.fileService = fileService;
  }

  async rotateImage(imagePath, degrees) {
    try {
      const rotatedPath = path.join(DOWNLOAD_DIR, `rotated_${this.fileService.generateUniqueId()}.jpg`);
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
      const enhancedPath = path.join(DOWNLOAD_DIR, `enhanced_${this.fileService.generateUniqueId()}.jpg`);
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

  async processAllImages(images, operation, ...args) {
    const processedImages = [];
    for (const imagePath of images) {
      const processedPath = await this[operation](imagePath, ...args);
      processedImages.push(processedPath);
    }
    return processedImages;
  }

  async getImageDimensions(imagePath) {
    try {
      const metadata = await sharp(imagePath).metadata();
      return { width: metadata.width, height: metadata.height };
    } catch (error) {
      console.error('Error getting image dimensions:', error);
      return { width: 800, height: 600 };
    }
  }
}

module.exports = ImageService;