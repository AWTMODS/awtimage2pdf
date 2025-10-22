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
}

module.exports = UserSession;