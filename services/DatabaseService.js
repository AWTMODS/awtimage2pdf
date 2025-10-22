const { MongoClient } = require("mongodb");
const constants = require('../config/constants');

class DatabaseService {
  constructor() {
    this.db = null;
    this.usersCollection = null;
    this.isDbConnected = false;
  }

  async connect() {
    try {
      const client = new MongoClient(constants.MONGO_URL);
      await client.connect();
      this.db = client.db(constants.DB_NAME);
      this.usersCollection = this.db.collection('users');
      this.isDbConnected = true;
      console.log('✅ MongoDB connected successfully');
    } catch (error) {
      console.error('❌ MongoDB connection failed:', error);
      this.isDbConnected = false;
    }
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
      console.error('Error saving user:', error);
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
      console.error('Error updating user PDF count:', error);
    }
  }

  async getUserStats(userId) {
    try {
      if (!this.isDbConnected || !this.usersCollection) return null;
      return await this.usersCollection.findOne({ userId });
    } catch (error) {
      console.error('Error getting user stats:', error);
      return null;
    }
  }

  async getTotalUsers() {
    try {
      if (!this.isDbConnected || !this.usersCollection) return 0;
      return await this.usersCollection.countDocuments();
    } catch (error) {
      console.error('Error getting total users:', error);
      return 0;
    }
  }

  async getAllUsers() {
    try {
      if (!this.isDbConnected || !this.usersCollection) return [];
      return await this.usersCollection.find({}).toArray();
    } catch (error) {
      console.error('Error getting all users:', error);
      return [];
    }
  }
}

module.exports = new DatabaseService();