class UserSession {
  constructor(userId) {
    this.userId = userId;
    this.images = [];
    this.state = 'collecting';
    this.language = 'en';
    this.settings = {
      compression: 'medium',
      watermark: { enabled: false, text: '', position: 'center' },
      cloudSave: false,
      imageEdit: { rotated: false, enhanced: false }
    };
    this.createdAt = Date.now();
    this.messageIds = [];
    this.lastMessageId = null;
    this.originalPdfPath = null;
    this.originalPdfMessageId = null;
  }

  addImage(imagePath) {
    this.images.push(imagePath);
  }

  addMessageId(messageId) {
    this.messageIds.push(messageId);
    this.lastMessageId = messageId;
    
    // Auto-cleanup old messages
    if (this.messageIds.length > 20) {
      const messagesToDelete = this.messageIds.slice(0, -15);
      this.messageIds = this.messageIds.slice(-15);
      return messagesToDelete;
    }
    return [];
  }

  setWatermark(text, position = 'center') {
    this.settings.watermark = {
      enabled: true,
      text,
      position
    };
  }

  disableWatermark() {
    this.settings.watermark.enabled = false;
  }

  clearImages() {
    this.images = [];
  }

  reset() {
    this.images = [];
    this.state = 'collecting';
    this.settings = {
      compression: 'medium',
      watermark: { enabled: false, text: '', position: 'center' },
      cloudSave: false,
      imageEdit: { rotated: false, enhanced: false }
    };
    this.originalPdfPath = null;
    this.originalPdfMessageId = null;
  }
}

module.exports = UserSession;