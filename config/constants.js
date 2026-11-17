const path = require('path');
const os = require('os');

const BOT_TOKEN = process.env.BOT_TOKEN || "7940862231:AAG9jDNnRf95VmrdFey2eKETezOrHIbQ6bg";
const MONGO_URL = process.env.MONGO_URL || "mongodb+srv://awtwhatsappcrashlog_db_user:0SJqOIWDSmmPuVWx@pdfmakerbot.frqc763.mongodb.net/?retryWrites=true&w=majority&appName=pdfmakerbot";
const DB_NAME = process.env.DB_NAME || "pdf_bot_db";
const CLOUD_CHANNEL = process.env.CLOUD_CHANNEL || "@database_awt";

// Download directory: use os.tmpdir() so it works in serverless (e.g. Vercel) and container environments
const DOWNLOAD_DIR = process.env.DOWNLOAD_DIR || path.join(os.tmpdir(), "pdfbot_downloads");

// Admin IDs list: comma-separated in env or default
let adminIds = [1343548529];
if (process.env.ADMIN_IDS) {
  adminIds = process.env.ADMIN_IDS.split(',').map(id => parseInt(id.trim(), 10)).filter(n => !isNaN(n));
}

// Webhook configuration
let webhookUrl = process.env.WEBHOOK_URL || process.env.RENDER_EXTERNAL_URL || process.env.VERCEL_URL || "";
if (webhookUrl && !webhookUrl.startsWith('http://') && !webhookUrl.startsWith('https://')) {
  webhookUrl = `https://${webhookUrl}`;
}

const WEBHOOK_PATH = process.env.WEBHOOK_PATH || "/webhook";
const SECRET_TOKEN = process.env.SECRET_TOKEN || "";
const PORT = parseInt(process.env.PORT, 10) || 3000;
const MAX_IMAGES = parseInt(process.env.MAX_IMAGES, 10) || 50;

module.exports = {
  BOT_TOKEN,
  DOWNLOAD_DIR,
  CLOUD_CHANNEL,
  MONGO_URL,
  DB_NAME,
  ADMIN_IDS: adminIds,
  MAX_IMAGES,
  PORT,
  WEBHOOK_URL: webhookUrl,
  WEBHOOK_PATH,
  SECRET_TOKEN
};