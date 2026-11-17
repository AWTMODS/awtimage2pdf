const DatabaseService = require('./DatabaseService');

class SessionService {
  constructor() {
    this.userSessions = {};
    this.broadcastSessions = {};
    this.bot = null;
  }

  initUserSession(userId) {
    if (!this.userSessions[userId]) {
      this.userSessions[userId] = {
        userId,
        images: [],
        imageFiles: [],
        state: 'collecting',
        language: 'en',
        settings: {
          compression: 'medium',
          watermark: { enabled: false, text: '', position: 'center' },
          cloudSave: false,
          imageEdit: { rotated: false, enhanced: false }
        },
        createdAt: Date.now(),
        messageIds: [],
        lastMessageId: null,
        originalPdfPath: null,
        originalPdfMessageId: null
      };
      console.log(`✅ New session initialized in memory for user: ${userId}`);
    }

    return this.userSessions[userId];
  }

  async initUserSessionAsync(userId) {
    if (this.userSessions[userId]) {
      return this.userSessions[userId];
    }

    // Try restoring from DB if process restarted or in serverless environment
    try {
      const dbSession = await DatabaseService.getSession(userId);
      if (dbSession) {
        delete dbSession._id;
        if (!dbSession.imageFiles) dbSession.imageFiles = [];
        this.userSessions[userId] = dbSession;
        console.log(`🔄 Session restored from database for user: ${userId}, images: ${dbSession.images ? dbSession.images.length : 0}`);
        return this.userSessions[userId];
      }
    } catch (e) {
      console.error('Error restoring session from DB:', e.message);
    }

    const session = this.initUserSession(userId);
    DatabaseService.saveSession(userId, session).catch(() => {});
    return session;
  }

  getSession(userId) {
    return this.userSessions[userId];
  }

  async syncSession(userId) {
    const session = this.userSessions[userId];
    if (session) {
      await DatabaseService.saveSession(userId, session);
    }
  }

  updateSessionState(userId, state) {
    if (this.userSessions[userId]) {
      this.userSessions[userId].state = state;
      DatabaseService.saveSession(userId, this.userSessions[userId]).catch(() => {});
    }
  }

  updateSessionLanguage(userId, language) {
    if (this.userSessions[userId]) {
      this.userSessions[userId].language = language;
      DatabaseService.saveSession(userId, this.userSessions[userId]).catch(() => {});
    }
  }

  async addMessageToSession(userId, messageId) {
    const session = this.userSessions[userId];
    if (session) {
      if (!session.messageIds) {
        session.messageIds = [];
      }
      session.messageIds.push(messageId);
      session.lastMessageId = messageId;

      if (session.messageIds.length > 20) {
        const messagesToDelete = session.messageIds.slice(0, -15);
        session.messageIds = session.messageIds.slice(-15);
        this.cleanupOldMessages(userId, messagesToDelete).catch(console.error);
      }

      DatabaseService.saveSession(userId, session).catch(() => {});
    }
  }

  async cleanupOldMessages(userId, messageIds) {
    if (!messageIds || messageIds.length === 0 || !this.bot) return;

    for (const messageId of messageIds) {
      try {
        await this.bot.telegram.deleteMessage(userId, messageId);
        console.log(`🗑️ Auto-deleted old message: ${messageId}`);
      } catch (error) {
        if (!error.message || !error.message.includes('message to delete not found')) {
          console.log(`⚠️ Could not delete message ${messageId}`);
        }
      }
    }
  }

  setBotInstance(bot) {
    this.bot = bot;
  }

  cleanupSession(userId) {
    delete this.userSessions[userId];
    DatabaseService.deleteSession(userId).catch(() => {});
  }
}

module.exports = new SessionService();