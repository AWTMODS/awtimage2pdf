const UserSession = require("../models/UserSession");

class SessionService {
  constructor() {
    this.sessions = new Map();
    this.broadcastSessions = new Map();
  }

  initUserSession(userId) {
    console.log(`🔄 Initializing session for user: ${userId}`);

    if (!this.sessions.has(userId)) {
      this.sessions.set(userId, new UserSession(userId));
      console.log(`✅ New session created for user: ${userId}`);
    } else {
      console.log(`✅ Existing session found for user: ${userId}, images: ${this.sessions.get(userId).images.length}`);
    }

    return this.sessions.get(userId);
  }

  getSession(userId) {
    return this.sessions.get(userId);
  }

  hasSession(userId) {
    return this.sessions.has(userId);
  }

  cleanupSession(userId) {
    const session = this.sessions.get(userId);
    if (session) {
      session.reset();
    }
  }

  deleteSession(userId) {
    this.sessions.delete(userId);
    console.log(`🧹 Session deleted for user: ${userId}`);
  }

  getBroadcastSession(userId) {
    return this.broadcastSessions.get(userId);
  }

  setBroadcastSession(userId, data) {
    this.broadcastSessions.set(userId, data);
  }

  deleteBroadcastSession(userId) {
    this.broadcastSessions.delete(userId);
  }

  getAllSessions() {
    return Array.from(this.sessions.values());
  }
}

module.exports = SessionService;