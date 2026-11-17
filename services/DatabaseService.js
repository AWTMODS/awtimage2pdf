const { MongoClient } = require("mongodb");
const constants = require('../config/constants');

class DatabaseService {
  constructor() {
    this.client = null;
    this.db = null;
    this.usersCollection = null;
    this.sessionsCollection = null;
    this.isDbConnected = false;
    this.connectingPromise = null;
  }

  async connect() {
    if (this.isDbConnected && this.db) {
      return this.db;
    }
    if (this.connectingPromise) {
      return this.connectingPromise;
    }

    this.connectingPromise = (async () => {
      try {
        if (!constants.MONGO_URL) {
          console.warn('⚠️ MONGO_URL not provided. Running in-memory mode.');
          return null;
        }
        this.client = new MongoClient(constants.MONGO_URL);
        await this.client.connect();
        this.db = this.client.db(constants.DB_NAME);
        this.usersCollection = this.db.collection('users');
        this.sessionsCollection = this.db.collection('sessions');
        this.isDbConnected = true;
        console.log('✅ MongoDB connected successfully');
        return this.db;
      } catch (error) {
        console.error('❌ MongoDB connection failed:', error.message || error);
        this.isDbConnected = false;
        return null;
      } finally {
        this.connectingPromise = null;
      }
    })();

    return this.connectingPromise;
  }

  async saveOrUpdateUser(userId, userData = {}) {
    try {
      if (!this.isDbConnected || !this.usersCollection) return;

      await this.usersCollection.updateOne(
        { userId },
        { 
          $set: { 
            lastActive: new Date(),
            ...userData 
          },
          $setOnInsert: {
            firstSeen: new Date(),
            pdfsGenerated: 0,
            lastFiles: []
          }
        },
        { upsert: true }
      );
    } catch (error) {
      console.error('Error saving user:', error.message || error);
    }
  }

  async incrementUserPDFs(userId, fileName) {
    try {
      if (!this.isDbConnected || !this.usersCollection) return;

      await this.usersCollection.updateOne(
        { userId },
        { 
          $inc: { pdfsGenerated: 1 },
          $push: {
            lastFiles: {
              $each: [fileName],
              $slice: -3
            }
          }
        }
      );
    } catch (error) {
      console.error('Error updating user PDF count:', error.message || error);
    }
  }

  async getUserStats(userId) {
    try {
      if (!this.isDbConnected || !this.usersCollection) return null;
      return await this.usersCollection.findOne({ userId });
    } catch (error) {
      console.error('Error getting user stats:', error.message || error);
      return null;
    }
  }

  async getTotalUsers() {
    try {
      if (!this.isDbConnected || !this.usersCollection) return 0;
      return await this.usersCollection.countDocuments();
    } catch (error) {
      console.error('Error getting total users:', error.message || error);
      return 0;
    }
  }

  async getAllUsers() {
    try {
      if (!this.isDbConnected || !this.usersCollection) return [];
      return await this.usersCollection.find({}).toArray();
    } catch (error) {
      console.error('Error getting all users:', error.message || error);
      return [];
    }
  }

  // Session persistence across serverless & restarts
  async saveSession(userId, sessionData) {
    try {
      if (!this.isDbConnected || !this.sessionsCollection) return;
      await this.sessionsCollection.updateOne(
        { userId },
        { 
          $set: { 
            ...sessionData,
            updatedAt: new Date()
          } 
        },
        { upsert: true }
      );
    } catch (error) {
      console.error('Error saving session to DB:', error.message || error);
    }
  }

  async getSession(userId) {
    try {
      if (!this.isDbConnected || !this.sessionsCollection) return null;
      return await this.sessionsCollection.findOne({ userId });
    } catch (error) {
      console.error('Error getting session from DB:', error.message || error);
      return null;
    }
  }

  async deleteSession(userId) {
    try {
      if (!this.isDbConnected || !this.sessionsCollection) return;
      await this.sessionsCollection.deleteOne({ userId });
    } catch (error) {
      console.error('Error deleting session from DB:', error.message || error);
    }
  }
}

module.exports = new DatabaseService();