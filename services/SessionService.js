class SessionService {
  constructor() {
    this.userSessions = {};
    this.broadcastSessions = {};
  }

  initUserSession(userId) {
    console.log(`🔄 Initializing session for user: ${userId}`);

    if (!this.userSessions[userId]) {
      this.userSessions[userId] = {
        images: [],
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
        lastMessageId: null
      };
      console.log(`✅ New session created for user: ${userId}`);
    } else {
      console.log(`✅ Existing session found for user: ${userId}, images: ${this.userSessions[userId].images.length}`);
    }

    return this.userSessions[userId];
  }

  getSession(userId) {
    return this.userSessions[userId];
  }

  updateSessionState(userId, state) {
    if (this.userSessions[userId]) {
      this.userSessions[userId].state = state;
    }
  }

  updateSessionLanguage(userId, language) {
    if (this.userSessions[userId]) {
      this.userSessions[userId].language = language;
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
    }
  }

  async cleanupOldMessages(userId, messageIds) {
    if (!messageIds || messageIds.length === 0) return;

    for (const messageId of messageIds) {
      try {
        await this.bot.telegram.deleteMessage(userId, messageId);
        console.log(`🗑️ Auto-deleted old message: ${messageId}`);
      } catch (error) {
        if (!error.message.includes('message to delete not found')) {
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
  }
}

module.exports = new SessionService();