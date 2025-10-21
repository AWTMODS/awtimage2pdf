const mongoose = require("mongoose");
const { MONGO_URL, DB_NAME } = require("../config/config");

let db;

async function connect() {
  try {
    const client = await mongoose.connect(MONGO_URL, {
      dbName: DB_NAME,
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    db = client.connection;
    console.log("Connected to MongoDB");
    return db;
  } catch (err) {
    console.error("MongoDB connection failed:", err);
    process.exit(1);
  }
}

module.exports = { connect, db };
