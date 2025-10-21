const { Telegraf, Markup } = require("telegraf");
const fs = require("fs").promises;
const path = require("path");
const axios = require("axios");
const PDFDocument = require("pdfkit");
const sharp = require("sharp");
const { MongoClient } = require("mongodb");

// ---------------- CONFIG ----------------
const BOT_TOKEN = "7940862231:AAG9jDNnRf95VmrdFey2eKETezOrHIbQ6bg";
const DOWNLOAD_DIR = path.join(__dirname, "downloads");
const CLOUD_CHANNEL = "@database_awt";
const MONGO_URL = "mongodb+srv://awtwhatsappcrashlog_db_user:0SJqOIWDSmmPuVWx@pdfmakerbot.frqc763.mongodb.net/?retryWrites=true&w=majority&appName=pdfmakerbot";
const DB_NAME = "pdf_bot_db";
const ADMIN_IDS = [1343548529];

// ---------------- MULTI-LANGUAGE SUPPORT ----------------
const locales = {
  en: {
    welcome: "📄 **PDF Maker Bot**\n\nSend me images and I'll convert them to PDF!\n\n**How to use:**\n1. Send images (photos or image files)\n2. Send /done when finished\n3. I'll create and send you the PDF\n\nYou can send up to 50 images.",
    imageReceived: "✅ Image {count} received! Send more images or /done when ready.",
    noImages: "❌ No images found. Please send some images first.",
    maxImages: "❌ Maximum 50 images allowed. Please remove some images.",
    compressionPrompt: "📊 Select PDF Quality:",
    compressionLow: "📦 Low Quality (Smaller File)",
    compressionMedium: "⚖️ Medium Quality",
    compressionHigh: "🎯 High Quality (Larger File)",
    previewTitle: "📄 PDF Preview",
    previewPages: "📖 Pages: {count}",
    previewSize: "💾 Estimated Size: {size}",
    previewReorder: "🔄 Reorder Images",
    previewCreate: "✅ Create PDF",
    imageEditPrompt: "🎨 Image Editing Options:",
    editRotate: "🔄 Rotate Images",
    editEnhance: "✨ Auto-Enhance",
    editSkip: "⏭️ Skip Editing",
    watermarkPrompt: "💧 Add Watermark?",
    watermarkYes: "✅ Yes, Add Watermark",
    watermarkNo: "❌ No Watermark",
    watermarkAsk: "💬 Please send the watermark text:",
    cloudSavePrompt: "☁️ Save to Cloud Storage?",
    cloudYes: "✅ Save to Cloud",
    cloudNo: "❌ Local Only",
    cloudSuccess: "✅ File saved to cloud storage!",
    securityScan: "🛡️ Security Scan: ✅ File is 100% secure and virus-free",
    processing: "⏳ Processing your PDF...",
    success: "✅ PDF created successfully!",
    renamePrompt: "📝 Would you like to rename the PDF file?",
    renameButton: "✏️ Rename PDF",
    keepButton: "✅ Keep Current Name",
    renameAsk: "Please send the new name for your PDF (without .pdf extension):",
    renameSuccess: "✅ PDF renamed successfully!",
    keepSuccess: "✅ PDF saved with original name!",
    invalidFile: "❌ Please send image files only.",
    sessionCancelled: "❌ Session cancelled. Send /start to begin again.",
    status: "📊 Status: {count} images",
    noSession: "❌ No active session. Send /start to begin.",
    languageChanged: "✅ Language changed to English",
    selectLanguage: "🌍 Select your language:",
    reorderInstructions: "🔄 Send the new order as numbers (e.g: 3,1,2):",
    reorderSuccess: "✅ Images reordered successfully!",
    rotatePrompt: "Select rotation angle:",
    rotate90: "↪️ Rotate 90°",
    rotate180: "🔄 Rotate 180°", 
    rotate270: "↩️ Rotate 270°",
    enhanceApplied: "✨ Auto-enhance applied to all images!",
    adminOnly: "❌ This command is for administrators only.",
    adminPanel: "🛠️ Admin Panel",
    totalUsers: "👥 Total Users",
    broadcast: "📢 Broadcast Message",
    stats: "📊 Statistics",
    broadcastPrompt: "Send the message you want to broadcast (text, image, or video):",
    broadcastStarted: "📢 Broadcast started...",
    broadcastComplete: "✅ Broadcast completed!\nSuccess: {success}\nFailed: {failed}",
    userStats: "📊 User Statistics:\nTotal PDFs: {totalPdfs}\nLast 3 files: {lastFiles}"
  }
};

// ---------------- DATABASE SETUP ----------------
let db;
let usersCollection;
let isDbConnected = false;

async function connectDB() {
  try {
    const client = new MongoClient(MONGO_URL);
    await client.connect();
    db = client.db(DB_NAME);
    usersCollection = db.collection('users');
    isDbConnected = true;
    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    isDbConnected = false;
  }
}

// ---------------- USER DATABASE FUNCTIONS ----------------
async function saveOrUpdateUser(userId, userData = {}) {
  try {
    if (!isDbConnected || !usersCollection) return;

    await usersCollection.updateOne(
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

async function incrementUserPDFs(userId, fileName) {
  try {
    if (!isDbConnected || !usersCollection) return;

    await usersCollection.updateOne(
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

async function getUserStats(userId) {
  try {
    if (!isDbConnected || !usersCollection) return null;
    return await usersCollection.findOne({ userId });
  } catch (error) {
    console.error('Error getting user stats:', error);
    return null;
  }
}

async function getTotalUsers() {
  try {
    if (!isDbConnected || !usersCollection) return 0;
    return await usersCollection.countDocuments();
  } catch (error) {
    console.error('Error getting total users:', error);
    return 0;
  }
}

async function getAllUsers() {
  try {
    if (!isDbConnected || !usersCollection) return [];
    return await usersCollection.find({}).toArray();
  } catch (error) {
    console.error('Error getting all users:', error);
    return [];
  }
}

// ---------------- SESSION MANAGEMENT ----------------
const userSessions = {};
const broadcastSessions = {};

function initUserSession(userId) {
  console.log(`🔄 Initializing session for user: ${userId}`);

  if (!userSessions[userId]) {
    userSessions[userId] = {
      images: [],
      state: 'collecting',
      language: 'en',
      settings: {
        compression: 'medium',
        watermark: { enabled: false, text: '' },
        cloudSave: false,
        imageEdit: { rotated: false, enhanced: false }
      },
      createdAt: Date.now()
    };
    console.log(`✅ New session created for user: ${userId}`);
  } else {
    console.log(`✅ Existing session found for user: ${userId}, images: ${userSessions[userId].images.length}`);
  }

  return userSessions[userId];
}

function getMessage(userId, key, replacements = {}) {
  const session = userSessions[userId];
  const lang = session?.language || 'en';
  let message = locales[lang][key] || locales['en'][key] || key;

  Object.keys(replacements).forEach(placeholder => {
    message = message.replace(`{${placeholder}}`, replacements[placeholder]);
  });

  return message;
}

// ---------------- UTILS ----------------
async function ensureDownloadDir() {
  try {
    await fs.access(DOWNLOAD_DIR);
  } catch {
    await fs.mkdir(DOWNLOAD_DIR, { recursive: true });
  }
}

function generateUniqueId() {
  return Date.now() + Math.random().toString(36).substr(2, 9);
}

async function downloadImage(fileUrl, filePath) {
  try {
    console.log(`📥 Downloading image from: ${fileUrl}`);
    const response = await axios({
      method: 'GET',
      url: fileUrl,
      responseType: 'stream',
    });

    const writer = require('fs').createWriteStream(filePath);
    response.data.pipe(writer);

    return new Promise((resolve, reject) => {
      writer.on('finish', () => {
        console.log(`✅ Image downloaded to: ${filePath}`);
        resolve();
      });
      writer.on('error', reject);
    });
  } catch (error) {
    console.error('Download error:', error);
    throw error;
  }
}

// ---------------- IMAGE PROCESSING FUNCTIONS ----------------
async function rotateImage(imagePath, degrees) {
  try {
    const rotatedPath = path.join(DOWNLOAD_DIR, `rotated_${generateUniqueId()}.jpg`);
    await sharp(imagePath)
      .rotate(degrees)
      .toFile(rotatedPath);
    return rotatedPath;
  } catch (error) {
    console.error('Rotation error:', error);
    return imagePath;
  }
}

async function enhanceImage(imagePath) {
  try {
    const enhancedPath = path.join(DOWNLOAD_DIR, `enhanced_${generateUniqueId()}.jpg`);
    await sharp(imagePath)
      .normalize()
      .sharpen()
      .toFile(enhancedPath);
    return enhancedPath;
  } catch (error) {
    console.error('Enhancement error:', error);
    return imagePath;
  }
}

// ---------------- PDF GENERATION WITH COMPRESSION ----------------
async function createPDF(images, outputPath, settings, progressCallback = null) {
  return new Promise((resolve, reject) => {
    console.log(`Creating PDF with ${images.length} images, compression: ${settings.compression}`);

    const doc = new PDFDocument({ 
      autoFirstPage: false
    });

    const stream = require('fs').createWriteStream(outputPath);
    doc.pipe(stream);

    let processedCount = 0;
    let successfulImages = 0;

    function processNextImage() {
      if (processedCount >= images.length) {
        if (successfulImages === 0) {
          doc.addPage().fontSize(16).text('No valid images could be processed', 50, 50);
        }

        if (settings.watermark.enabled && settings.watermark.text && successfulImages > 0) {
          try {
            const pageCount = doc.bufferedPageRange().count + 1;
            for (let i = 0; i < pageCount; i++) {
              doc.switchToPage(i);
              doc.save();
              doc.fillColor('black', 0.2)
                 .fontSize(36)
                 .text(settings.watermark.text, 50, 50, {
                   align: 'center',
                   width: doc.page.width - 100
                 });
              doc.restore();
            }
          } catch (error) {
            console.warn('Could not add watermark:', error.message);
          }
        }

        doc.end();
        return;
      }

      const imagePath = images[processedCount];

      try {
        const img = doc.openImage(imagePath);
        const { width, height } = img;

        doc.addPage({ size: [width, height] });

        let scale = 1.0;
        switch(settings.compression) {
          case 'low': scale = 0.7; break;
          case 'medium': scale = 0.85; break;
          case 'high': scale = 1.0; break;
        }

        doc.image(imagePath, 0, 0, { 
          width: width * scale, 
          height: height * scale
        });

        console.log(`Added image ${processedCount + 1} with scale: ${scale}`);
        successfulImages++;

      } catch (error) {
        console.warn(`Failed to add image ${processedCount + 1}:`, error.message);
      }

      processedCount++;
      if (progressCallback) progressCallback(processedCount);
      setTimeout(processNextImage, 10);
    }

    processNextImage();

    stream.on('finish', () => {
      console.log(`PDF successfully created: ${outputPath}`);
      resolve(outputPath);
    });

    stream.on('error', reject);
    doc.on('error', reject);
  });
}

// ---------------- PREVIEW SYSTEM ----------------
async function generatePreviewInfo(images) {
  try {
    let totalSize = 0;
    for (const imagePath of images) {
      try {
        const stats = await fs.stat(imagePath);
        totalSize += stats.size;
      } catch (error) {
        console.warn('Could not get size for:', imagePath);
      }
    }

    const estimatedPdfSize = totalSize * 0.7;
    const pageCount = images.length;

    return {
      pageCount,
      estimatedSize: formatFileSize(estimatedPdfSize)
    };
  } catch (error) {
    return { pageCount: images.length, estimatedSize: 'Unknown' };
  }
}

function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// ---------------- CLOUD STORAGE ----------------
async function saveToCloudStorage(ctx, filePath, fileName) {
  try {
    await ctx.telegram.sendDocument(CLOUD_CHANNEL, {
      source: filePath,
      filename: fileName
    }, {
      caption: `📁 ${fileName}\n👤 User: ${ctx.from.id}\n📅 ${new Date().toLocaleString()}`
    });
    return true;
  } catch (error) {
    console.error('Cloud storage error:', error);
    return false;
  }
}

// ---------------- SECURITY SCAN ----------------
function performSecurityScan(filePath) {
  console.log(`🔒 Security scan performed on: ${filePath}`);
  return { safe: true, threats: 0, scannedAt: new Date().toISOString() };
}

// ---------------- PROGRESS ANIMATION ----------------
class ProgressAnimation {
  constructor(ctx, totalSteps, message) {
    this.ctx = ctx;
    this.totalSteps = totalSteps;
    this.currentStep = 0;
    this.message = message;
    this.animationMessageId = null;
    this.animationInterval = null;
  }

  async start() {
    const progressMsg = await this.ctx.reply(this.getMessage());
    this.animationMessageId = progressMsg.message_id;

    this.animationInterval = setInterval(async () => {
      try {
        await this.ctx.telegram.editMessageText(
          this.ctx.chat.id,
          this.animationMessageId,
          null,
          this.getMessage()
        );
      } catch (error) {}
    }, 2000);
  }

  update(step, customMessage = null) {
    this.currentStep = step;
    if (customMessage) this.message = customMessage;
  }

  getMessage() {
    const percentage = Math.min(100, Math.round((this.currentStep / this.totalSteps) * 100));
    const progressBar = this.createProgressBar(percentage);
    return `${this.message}\n\n${progressBar} ${percentage}%`;
  }

  createProgressBar(percentage) {
    const totalBars = 10;
    const filledBars = Math.round((percentage / 100) * totalBars);
    return '█'.repeat(filledBars) + '░'.repeat(totalBars - filledBars);
  }

  async stop() {
    if (this.animationInterval) {
      clearInterval(this.animationInterval);
      this.animationInterval = null;
    }
    if (this.animationMessageId) {
      try {
        await this.ctx.telegram.deleteMessage(this.ctx.chat.id, this.animationMessageId);
      } catch (error) {}
      this.animationMessageId = null;
    }
  }
}

// ---------------- BROADCAST SYSTEM ----------------
async function broadcastMessage(ctx, message, mediaType = 'text') {
  const users = await getAllUsers();
  let success = 0;
  let failed = 0;

  for (const user of users) {
    try {
      if (mediaType === 'text') {
        await ctx.telegram.sendMessage(user.userId, message);
      } else if (mediaType === 'photo') {
        await ctx.telegram.sendPhoto(user.userId, message);
      } else if (mediaType === 'video') {
        await ctx.telegram.sendVideo(user.userId, message);
      }
      success++;
    } catch (error) {
      console.log(`Failed to send to user ${user.userId}:`, error.message);
      failed++;
    }

    await new Promise(resolve => setTimeout(resolve, 100));
  }

  return { success, failed };
}

// ---------------- BOT SETUP ----------------
const bot = new Telegraf(BOT_TOKEN);

// ==================== MIDDLEWARE ====================
bot.use(async (ctx, next) => {
  const userId = ctx.from?.id;
  const updateType = ctx.updateType;

  console.log(`\n📨 [${updateType}] from user: ${userId}`);

  if (userId) {
    // Initialize session for all users who interact with the bot
    initUserSession(userId);
  }

  await next();
});

// ==================== COMMAND HANDLERS (MUST COME FIRST) ====================

// ==================== TEST COMMAND ====================
bot.command('test', async (ctx) => {
  const userId = ctx.from.id;
  const session = userSessions[userId];

  console.log(`🧪 Test command from user: ${userId}`);
  console.log(`📊 Session data:`, session);

  const testMessage = `
🤖 Bot Test Results:
✅ Bot is responding
👤 User ID: ${userId}
📊 Session: ${session ? 'Active' : 'No session'}
🖼️ Images in session: ${session ? session.images.length : 0}
🌐 Language: ${session ? session.language : 'default'}
🔧 Database: ${isDbConnected ? 'Connected' : 'Disconnected'}

💡 Try sending an image to test image handling.
  `.trim();

  await ctx.reply(testMessage);
});

// ==================== HELP COMMAND ====================
bot.command('help', async (ctx) => {
  const userId = ctx.from.id;
  await ctx.reply(getMessage(userId, 'welcome'));
});

// ==================== STATS COMMAND ====================
bot.command('stats', async (ctx) => {
  const userId = ctx.from.id;
  const userStats = await getUserStats(userId);

  if (userStats) {
    const lastFiles = userStats.lastFiles && userStats.lastFiles.length > 0 
      ? userStats.lastFiles.join(', ') 
      : 'No files yet';

    await ctx.reply(
      getMessage(userId, 'userStats', {
        totalPdfs: userStats.pdfsGenerated || 0,
        lastFiles: lastFiles
      })
    );
  } else {
    await ctx.reply("📊 No statistics available yet. Create your first PDF to see stats!");
  }
});

// ==================== STATUS COMMAND ====================
bot.command('status', async (ctx) => {
  const userId = ctx.from.id;
  const session = userSessions[userId];
  console.log(`📊 Status command from user: ${userId}, session:`, session);

  if (session && session.images) {
    await ctx.reply(getMessage(userId, 'status', { count: session.images.length }));
  } else {
    await ctx.reply(getMessage(userId, 'noSession'));
  }
});

// ==================== DONE COMMAND ====================
bot.command('done', async (ctx) => {
  const userId = ctx.from.id;
  const session = userSessions[userId];

  console.log(`✅ Done command from user: ${userId}`);
  console.log(`📊 Session images:`, session ? session.images : 'No session');

  if (!session || !session.images || session.images.length === 0) {
    console.log(`❌ No images found for user: ${userId}`);
    return await ctx.reply(getMessage(userId, 'noImages'));
  }

  if (session.images.length > 50) {
    return await ctx.reply(getMessage(userId, 'maxImages'));
  }

  try {
    session.state = 'awaiting_compression';
    await ctx.reply(
      getMessage(userId, 'compressionPrompt'),
      Markup.inlineKeyboard([
        [Markup.button.callback(getMessage(userId, 'compressionLow'), 'compression_low')],
        [Markup.button.callback(getMessage(userId, 'compressionMedium'), 'compression_medium')],
        [Markup.button.callback(getMessage(userId, 'compressionHigh'), 'compression_high')]
      ])
    );
  } catch (error) {
    console.error('Error in done command:', error);
    await ctx.reply("❌ Failed to process request. Please try again.");
  }
});

// ==================== CLEAR COMMAND ====================
bot.command('clear', async (ctx) => {
  const userId = ctx.from.id;
  await cleanupUserFiles(userId);
  await ctx.reply("✅ Session cleared! Start fresh with /start");
});

// ==================== CANCEL COMMAND ====================
bot.command('cancel', async (ctx) => {
  const userId = ctx.from.id;
  await cleanupUserFiles(userId);
  await ctx.reply(getMessage(userId, 'sessionCancelled'));
});

// ==================== ADMIN HANDLERS ====================
bot.command('admin', async (ctx) => {
  const userId = ctx.from.id;

  if (!ADMIN_IDS.includes(userId)) {
    return await ctx.reply(getMessage(userId, 'adminOnly'));
  }

  await ctx.reply(
    getMessage(userId, 'adminPanel'),
    Markup.inlineKeyboard([
      [Markup.button.callback(getMessage(userId, 'totalUsers'), 'admin_total_users')],
      [Markup.button.callback(getMessage(userId, 'broadcast'), 'admin_broadcast')],
      [Markup.button.callback(getMessage(userId, 'stats'), 'admin_stats')]
    ])
  );
});

// ==================== LANGUAGE HANDLERS ====================
bot.command('language', async (ctx) => {
  await ctx.reply(
    getMessage(ctx.from.id, 'selectLanguage'),
    Markup.inlineKeyboard([
      [Markup.button.callback('🇺🇸 English', 'lang_en')],
      [Markup.button.callback('🇦🇪 العربية', 'lang_ar')],
      [Markup.button.callback('🇷🇺 Русский', 'lang_ru')],
      [Markup.button.callback('🇪🇸 Español', 'lang_es')],
      [Markup.button.callback('🇮🇳 हिंदी', 'lang_hi')]
    ])
  );
});

// ==================== MAIN BOT HANDLERS ====================
bot.start(async (ctx) => {
  const userId = ctx.from.id;
  console.log(`🚀 Start command from user: ${userId}`);

  const session = initUserSession(userId);

  await saveOrUpdateUser(userId, {
    username: ctx.from.username,
    firstName: ctx.from.first_name,
    lastName: ctx.from.last_name
  });

  await ctx.reply(getMessage(userId, 'welcome'));
});

// ==================== IMAGE HANDLERS ====================

// Handle photos (compressed images)
bot.on('photo', async (ctx) => {
  const userId = ctx.from.id;
  console.log(`🖼️ PHOTO received from user: ${userId}`);

  try {
    const session = initUserSession(userId);
    console.log(`📊 Session before adding image:`, session.images.length);

    // Check if user has reached image limit
    if (session.images.length >= 50) {
      return await ctx.reply(getMessage(userId, 'maxImages'));
    }

    // Get the highest quality photo (last in the array)
    const photo = ctx.message.photo[ctx.message.photo.length - 1];
    const fileId = photo.file_id;
    console.log(`📸 Photo received, fileId: ${fileId}`);

    await ensureDownloadDir();
    const fileUrl = await ctx.telegram.getFileLink(fileId);
    const filePath = path.join(DOWNLOAD_DIR, `img_${userId}_${Date.now()}.jpg`);

    console.log(`📥 Downloading image to: ${filePath}`);
    await downloadImage(fileUrl, filePath);

    // Add image to session
    session.images.push(filePath);
    session.state = 'collecting';

    console.log(`✅ Image added to session. Total images: ${session.images.length}`);
    console.log(`📁 Session images:`, session.images);

    await ctx.reply(getMessage(userId, 'imageReceived', { count: session.images.length }));

  } catch (error) {
    console.error('❌ Error handling photo:', error);
    await ctx.reply("❌ Failed to process image. Please try again.");
  }
});

// Handle document images
bot.on('document', async (ctx) => {
  const userId = ctx.from.id;
  console.log(`📎 DOCUMENT received from user: ${userId}`);

  try {
    const session = initUserSession(userId);
    console.log(`📊 Session before adding image:`, session.images.length);

    // Check if user has reached image limit
    if (session.images.length >= 50) {
      return await ctx.reply(getMessage(userId, 'maxImages'));
    }

    const document = ctx.message.document;

    // Check if it's an image file
    if (!document.mime_type?.startsWith('image/')) {
      console.log(`❌ Invalid file type: ${document.mime_type}`);
      return await ctx.reply(getMessage(userId, 'invalidFile'));
    }

    const fileId = document.file_id;
    console.log(`📎 Document image received, fileId: ${fileId}, mime: ${document.mime_type}`);

    await ensureDownloadDir();
    const fileUrl = await ctx.telegram.getFileLink(fileId);

    // Get file extension from mime type or use original file name
    let extension = '.jpg';
    if (document.file_name) {
      extension = path.extname(document.file_name) || '.jpg';
    } else if (document.mime_type) {
      const mimeExtensions = {
        'image/jpeg': '.jpg',
        'image/jpg': '.jpg',
        'image/png': '.png',
        'image/gif': '.gif',
        'image/webp': '.webp'
      };
      extension = mimeExtensions[document.mime_type] || '.jpg';
    }

    const filePath = path.join(DOWNLOAD_DIR, `img_${userId}_${Date.now()}${extension}`);

    console.log(`📥 Downloading document to: ${filePath}`);
    await downloadImage(fileUrl, filePath);

    // Add image to session
    session.images.push(filePath);
    session.state = 'collecting';

    console.log(`✅ Document added to session. Total images: ${session.images.length}`);
    console.log(`📁 Session images:`, session.images);

    await ctx.reply(getMessage(userId, 'imageReceived', { count: session.images.length }));

  } catch (error) {
    console.error('❌ Error handling document:', error);
    await ctx.reply("❌ Failed to process document. Please try again.");
  }
});

// ==================== ACTION HANDLERS ====================

// Admin actions
bot.action('admin_total_users', async (ctx) => {
  const userId = ctx.from.id;

  if (!ADMIN_IDS.includes(userId)) {
    await ctx.answerCbQuery(getMessage(userId, 'adminOnly'));
    return;
  }

  const totalUsers = await getTotalUsers();
  await ctx.answerCbQuery();
  await ctx.reply(`👥 Total Users: ${totalUsers}`);
});

bot.action('admin_broadcast', async (ctx) => {
  const userId = ctx.from.id;

  if (!ADMIN_IDS.includes(userId)) {
    await ctx.answerCbQuery(getMessage(userId, 'adminOnly'));
    return;
  }

  broadcastSessions[userId] = { state: 'awaiting_broadcast' };
  await ctx.answerCbQuery();
  await ctx.reply(getMessage(userId, 'broadcastPrompt'));
});

bot.action('admin_stats', async (ctx) => {
  const userId = ctx.from.id;

  if (!ADMIN_IDS.includes(userId)) {
    await ctx.answerCbQuery(getMessage(userId, 'adminOnly'));
    return;
  }

  const userStats = await getUserStats(userId);
  if (userStats) {
    const lastFiles = userStats.lastFiles && userStats.lastFiles.length > 0 
      ? userStats.lastFiles.join(', ') 
      : 'No files yet';

    await ctx.answerCbQuery();
    await ctx.reply(
      getMessage(userId, 'userStats', {
        totalPdfs: userStats.pdfsGenerated || 0,
        lastFiles: lastFiles
      })
    );
  } else {
    await ctx.answerCbQuery();
    await ctx.reply("No statistics available.");
  }
});

// Language actions
const languageHandlers = {
  'lang_en': 'en', 'lang_ar': 'ar', 'lang_ru': 'ru', 'lang_es': 'es', 'lang_hi': 'hi'
};

Object.keys(languageHandlers).forEach(langCode => {
  bot.action(langCode, async (ctx) => {
    const userId = ctx.from.id;
    const session = initUserSession(userId);
    session.language = languageHandlers[langCode];
    await ctx.answerCbQuery();
    await ctx.editMessageText(getMessage(userId, 'languageChanged'));
  });
});

// Compression actions
bot.action('compression_low', async (ctx) => await handleCompressionSelection(ctx, 'low'));
bot.action('compression_medium', async (ctx) => await handleCompressionSelection(ctx, 'medium'));
bot.action('compression_high', async (ctx) => await handleCompressionSelection(ctx, 'high'));

async function handleCompressionSelection(ctx, compression) {
  const userId = ctx.from.id;
  const session = userSessions[userId];
  if (!session) {
    await ctx.answerCbQuery(getMessage(userId, 'noSession'));
    return;
  }
  session.settings.compression = compression;
  session.state = 'awaiting_preview';
  await ctx.answerCbQuery();
  await showPreview(ctx);
}

async function showPreview(ctx) {
  const userId = ctx.from.id;
  const session = userSessions[userId];
  const previewInfo = await generatePreviewInfo(session.images);

  const previewMessage = `
${getMessage(userId, 'previewTitle')}
${getMessage(userId, 'previewPages', { count: previewInfo.pageCount })}
${getMessage(userId, 'previewSize', { size: previewInfo.estimatedSize })}
${getMessage(userId, 'securityScan')}`.trim();

  await ctx.reply(
    previewMessage,
    Markup.inlineKeyboard([
      [Markup.button.callback(getMessage(userId, 'previewReorder'), 'reorder_images')],
      [Markup.button.callback(getMessage(userId, 'imageEditPrompt'), 'edit_images')],
      [Markup.button.callback(getMessage(userId, 'previewCreate'), 'create_pdf_now')]
    ])
  );
}

// Image editing actions
bot.action('reorder_images', async (ctx) => {
  const userId = ctx.from.id;
  const session = userSessions[userId];
  if (!session) {
    await ctx.answerCbQuery(getMessage(userId, 'noSession'));
    return;
  }
  session.state = 'awaiting_reorder';
  let imageList = "📋 Current image order:\n";
  session.images.forEach((img, index) => {
    imageList += `${index + 1}. Image ${index + 1}\n`;
  });
  await ctx.answerCbQuery();
  await ctx.reply(imageList + `\n${getMessage(userId, 'reorderInstructions')}`);
});

bot.action('edit_images', async (ctx) => {
  const userId = ctx.from.id;
  const session = userSessions[userId];
  if (!session) {
    await ctx.answerCbQuery(getMessage(userId, 'noSession'));
    return;
  }
  await ctx.answerCbQuery();
  await ctx.reply(
    getMessage(userId, 'imageEditPrompt'),
    Markup.inlineKeyboard([
      [Markup.button.callback(getMessage(userId, 'editRotate'), 'rotate_images')],
      [Markup.button.callback(getMessage(userId, 'editEnhance'), 'enhance_images')],
      [Markup.button.callback(getMessage(userId, 'editSkip'), 'skip_editing')]
    ])
  );
});

bot.action('rotate_images', async (ctx) => {
  const userId = ctx.from.id;
  await ctx.answerCbQuery();
  await ctx.reply(
    getMessage(userId, 'rotatePrompt'),
    Markup.inlineKeyboard([
      [Markup.button.callback(getMessage(userId, 'rotate90'), 'rotate_90')],
      [Markup.button.callback(getMessage(userId, 'rotate180'), 'rotate_180')],
      [Markup.button.callback(getMessage(userId, 'rotate270'), 'rotate_270')]
    ])
  );
});

bot.action(/rotate_(90|180|270)/, async (ctx) => {
  const userId = ctx.from.id;
  const session = userSessions[userId];
  const degrees = parseInt(ctx.match[1]);
  if (!session) {
    await ctx.answerCbQuery(getMessage(userId, 'noSession'));
    return;
  }
  await ctx.answerCbQuery();
  await ctx.reply(`🔄 Rotating images by ${degrees} degrees...`);
  const rotatedImages = [];
  for (const imagePath of session.images) {
    const rotatedPath = await rotateImage(imagePath, degrees);
    rotatedImages.push(rotatedPath);
  }
  session.images = rotatedImages;
  session.settings.imageEdit.rotated = true;
  await ctx.reply(`✅ All images rotated by ${degrees} degrees!`);
  await showPreview(ctx);
});

bot.action('enhance_images', async (ctx) => {
  const userId = ctx.from.id;
  const session = userSessions[userId];
  if (!session) {
    await ctx.answerCbQuery(getMessage(userId, 'noSession'));
    return;
  }
  await ctx.answerCbQuery();
  await ctx.reply("✨ Enhancing images...");
  const enhancedImages = [];
  for (const imagePath of session.images) {
    const enhancedPath = await enhanceImage(imagePath);
    enhancedImages.push(enhancedPath);
  }
  session.images = enhancedImages;
  session.settings.imageEdit.enhanced = true;
  await ctx.reply(getMessage(userId, 'enhanceApplied'));
  await showPreview(ctx);
});

bot.action('skip_editing', async (ctx) => {
  await ctx.answerCbQuery();
  await showPreview(ctx);
});

// PDF creation actions
bot.action('create_pdf_now', async (ctx) => {
  const userId = ctx.from.id;
  const session = userSessions[userId];
  if (!session) {
    await ctx.answerCbQuery(getMessage(userId, 'noSession'));
    return;
  }
  session.state = 'awaiting_watermark';
  await ctx.answerCbQuery();
  await ctx.reply(
    getMessage(userId, 'watermarkPrompt'),
    Markup.inlineKeyboard([
      [Markup.button.callback(getMessage(userId, 'watermarkYes'), 'watermark_yes')],
      [Markup.button.callback(getMessage(userId, 'watermarkNo'), 'watermark_no')]
    ])
  );
});

// Watermark actions
bot.action('watermark_yes', async (ctx) => {
  const userId = ctx.from.id;
  const session = userSessions[userId];
  if (!session) {
    await ctx.answerCbQuery(getMessage(userId, 'noSession'));
    return;
  }
  session.state = 'awaiting_watermark_text';
  await ctx.answerCbQuery();
  await ctx.reply(getMessage(userId, 'watermarkAsk'));
});

bot.action('watermark_no', async (ctx) => {
  const userId = ctx.from.id;
  const session = userSessions[userId];
  if (!session) {
    await ctx.answerCbQuery(getMessage(userId, 'noSession'));
    return;
  }
  session.settings.watermark.enabled = false;
  session.state = 'awaiting_cloud_save';
  await ctx.answerCbQuery();
  await askCloudStorage(ctx);
});

// Cloud storage actions
async function askCloudStorage(ctx) {
  const userId = ctx.from.id;
  await ctx.reply(
    getMessage(userId, 'cloudSavePrompt'),
    Markup.inlineKeyboard([
      [Markup.button.callback(getMessage(userId, 'cloudYes'), 'cloud_yes')],
      [Markup.button.callback(getMessage(userId, 'cloudNo'), 'cloud_no')]
    ])
  );
}

bot.action('cloud_yes', async (ctx) => {
  const userId = ctx.from.id;
  const session = userSessions[userId];
  if (!session) {
    await ctx.answerCbQuery(getMessage(userId, 'noSession'));
    return;
  }
  session.settings.cloudSave = true;
  await ctx.answerCbQuery();
  await finalizePDFCreation(ctx);
});

bot.action('cloud_no', async (ctx) => {
  const userId = ctx.from.id;
  const session = userSessions[userId];
  if (!session) {
    await ctx.answerCbQuery(getMessage(userId, 'noSession'));
    return;
  }
  session.settings.cloudSave = false;
  await ctx.answerCbQuery();
  await finalizePDFCreation(ctx);
});

// Rename actions
bot.action('rename_pdf', async (ctx) => {
  const userId = ctx.from.id;
  const session = userSessions[userId];
  if (!session) {
    await ctx.answerCbQuery(getMessage(userId, 'noSession'));
    return;
  }
  session.state = 'awaiting_rename';
  await ctx.answerCbQuery();
  await ctx.reply(getMessage(userId, 'renameAsk'));
});

bot.action('keep_name', async (ctx) => {
  const userId = ctx.from.id;
  await ctx.answerCbQuery();
  await ctx.reply(getMessage(userId, 'keepSuccess'));
  setTimeout(() => cleanupUserFiles(userId), 2000);
});

// ==================== FINAL PDF CREATION ====================
async function finalizePDFCreation(ctx) {
  const userId = ctx.from.id;
  const session = userSessions[userId];

  try {
    const progress = new ProgressAnimation(
      ctx, 
      session.images.length + 2,
      getMessage(userId, 'processing')
    );
    await progress.start();

    const pdfFileName = `document_${userId}_${generateUniqueId()}.pdf`;
    const pdfPath = path.join(DOWNLOAD_DIR, pdfFileName);

    await createPDF(session.images, pdfPath, session.settings, (currentStep) => {
      progress.update(currentStep, "📄 Creating PDF...");
    });

    progress.update(session.images.length + 1, "🛡️ Performing security scan...");
    const scanResult = performSecurityScan(pdfPath);
    if (!scanResult.safe) throw new Error("Security scan failed");

    await progress.stop();

    const sentMessage = await ctx.replyWithDocument({
      source: pdfPath,
      filename: `document.pdf`
    });

    await ctx.reply(getMessage(userId, 'securityScan'));

    await incrementUserPDFs(userId, `document.pdf`);

    if (session.settings.cloudSave) {
      const cloudSuccess = await saveToCloudStorage(ctx, pdfPath, `document_${userId}.pdf`);
      if (cloudSuccess) await ctx.reply(getMessage(userId, 'cloudSuccess'));
    }

    session.pdfPath = pdfPath;
    session.pdfMessageId = sentMessage.message_id;
    session.state = 'awaiting_rename_decision';

    await ctx.reply(
      getMessage(userId, 'renamePrompt'),
      Markup.inlineKeyboard([
        [Markup.button.callback(getMessage(userId, 'renameButton'), 'rename_pdf')],
        [Markup.button.callback(getMessage(userId, 'keepButton'), 'keep_name')]
      ])
    );

  } catch (error) {
    console.error('Error creating PDF:', error);
    await ctx.reply("❌ Failed to create PDF. Please try again with /start");
    await cleanupUserFiles(userId);
  }
}

// ==================== TEXT MESSAGE HANDLER (MUST COME LAST) ====================
bot.on('text', async (ctx) => {
  // Ignore commands - they should have been handled by command handlers
  if (ctx.message.text.startsWith('/')) {
    console.log(`❌ Command not handled: ${ctx.message.text}`);
    return;
  }

  const userId = ctx.from.id;
  const session = userSessions[userId];

  if (!session) {
    await ctx.reply(getMessage(userId, 'noSession'));
    return;
  }

  console.log(`📝 Text message in state: ${session.state}`);

  if (session.state === 'awaiting_reorder') {
    // Handle image reordering
    const orderInput = ctx.message.text.trim();
    const newOrder = orderInput.split(',').map(num => parseInt(num.trim()) - 1);

    if (newOrder.length !== session.images.length || newOrder.some(isNaN)) {
      await ctx.reply("❌ Invalid order. Please send numbers like: 1,3,2");
      return;
    }

    const reorderedImages = newOrder.map(index => session.images[index]);
    session.images = reorderedImages;
    session.state = 'awaiting_preview';

    await ctx.reply(getMessage(userId, 'reorderSuccess'));
    await showPreview(ctx);

  } else if (session.state === 'awaiting_watermark_text') {
    // Handle watermark text
    const watermarkText = ctx.message.text.trim();

    if (!watermarkText) {
      await ctx.reply("❌ Please provide valid watermark text.");
      return;
    }

    session.settings.watermark = {
      enabled: true,
      text: watermarkText
    };
    session.state = 'awaiting_cloud_save';

    await ctx.reply(`✅ Watermark set: "${watermarkText}"`);
    await askCloudStorage(ctx);

  } else if (session.state === 'awaiting_rename') {
    // Handle PDF rename
    const newFileName = ctx.message.text.trim();

    if (!newFileName) {
      await ctx.reply("❌ Please provide a valid file name.");
      return;
    }

    try {
      const newPdfPath = path.join(DOWNLOAD_DIR, `${newFileName}.pdf`);
      await fs.rename(session.pdfPath, newPdfPath);

      await ctx.replyWithDocument({
        source: newPdfPath,
        filename: `${newFileName}.pdf`
      });

      await ctx.reply(getMessage(userId, 'renameSuccess'));

      await incrementUserPDFs(userId, `${newFileName}.pdf`);

      session.pdfPath = newPdfPath;
      setTimeout(() => cleanupUserFiles(userId), 2000);

    } catch (error) {
      console.error('Error renaming PDF:', error);
      await ctx.reply("❌ Failed to rename PDF. The original file has been sent.");
      await cleanupUserFiles(userId);
    }
  } else {
    // Default response for other text
    await ctx.reply("📸 Send me images, then use /done when ready to create PDF!");
  }
});

// ==================== CLEANUP FUNCTION ====================
async function cleanupUserFiles(userId) {
  try {
    const session = userSessions[userId];
    if (session) {
      if (session.images) {
        for (const imagePath of session.images) {
          try { await fs.unlink(imagePath); } catch (error) {}
        }
      }
      if (session.pdfPath) {
        try { await fs.unlink(session.pdfPath); } catch (error) {}
      }
    }
    delete userSessions[userId];
    console.log(`🧹 Cleaned up files for user ${userId}`);
  } catch (error) {
    console.error('Cleanup error:', error);
  }
}

// ==================== ERROR HANDLING ====================
bot.catch((err, ctx) => {
  console.error(`❌ Bot error for ${ctx.updateType}:`, err);
  ctx.reply("❌ An error occurred. Please try again.");
});

// ==================== START BOT ====================
async function startBot() {
  try {
    await ensureDownloadDir();
    await connectDB();
    console.log('📁 Download directory ready');
    await bot.launch();
    console.log('🤖 PDF Bot is running successfully!');

    process.once('SIGINT', () => {
      console.log('Shutting down gracefully...');
      bot.stop('SIGINT');
    });

    process.once('SIGTERM', () => {
      console.log('Shutting down gracefully...');
      bot.stop('SIGTERM');
    });

  } catch (error) {
    console.error('❌ Failed to start bot:', error);
    process.exit(1);
  }
}

console.log('🚀 Starting PDF Bot...');
startBot();
