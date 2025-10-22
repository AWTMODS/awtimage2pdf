const { MongoClient } = require("mongodb");
const { MONGO_URL, DB_NAME } = require("../config/constants");

class DatabaseService {
  constructor() {
    this.client = null;
    this.db = null;
    this.usersCollection = null;
    this.isConnected = false;
  }

  async connect() {
    try {
      this.client = new MongoClient(MONGO_URL);
      await this.client.connect();
      this.db = this.client.db(DB_NAME);
      this.usersCollection = this.db.collection('users');
      this.isConnected = true;
      console.log('✅ MongoDB connected successfully');
    } catch (error) {
      console.error('❌ MongoDB connection failed:', error);
      this.isConnected = false;
    }
  }

  async saveOrUpdateUser(userId, userData = {}) {
    if (!this.isConnected) return;

    try {
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
            lastFiles: [],
            language: 'en'
          }
        },
        { upsert: true }
      );
    } catch (error) {
      console.error('Error saving user:', error);
    }
  }

  async incrementUserPDFs(userId, fileName) {
    if (!this.isConnected) return;

    try {
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
    if (!this.isConnected) return null;
    
    try {
      return await this.usersCollection.findOne({ userId });
    } catch (error) {
      console.error('Error getting user stats:', error);
      return null;
    }
  }

  async getTotalUsers() {
    if (!this.isConnected) return 0;
    
    try {
      return await this.usersCollection.countDocuments();
    } catch (error) {
      console.error('Error getting total users:', error);
      return 0;
    }
  }

  async getAllUsers() {
    if (!this.isConnected) return [];
    
    try {
      return await this.usersCollection.find({}).toArray();
    } catch (error) {
      console.error('Error getting all users:', error);
      return [];
    }
  }
}

module.exports = DatabaseService;