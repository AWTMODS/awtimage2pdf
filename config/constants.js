const path = require('path');

module.exports = {
  BOT_TOKEN: process.env.BOT_TOKEN || "7940862231:AAG9jDNnRf95VmrdFey2eKETezOrHIbQ6bg",
  DOWNLOAD_DIR: path.join(__dirname, "..", "downloads"),
  CLOUD_CHANNEL: "@database_awt",
  MONGO_URL: process.env.MONGO_URL || "mongodb+srv://awtwhatsappcrashlog_db_user:0SJqOIWDSmmPuVWx@pdfmakerbot.frqc763.mongodb.net/?retryWrites=true&w=majority&appName=pdfmakerbot",
  DB_NAME: "pdf_bot_db",
  ADMIN_IDS: [1343548529],
  MAX_IMAGES: 50
};