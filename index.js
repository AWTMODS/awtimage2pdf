const { Telegraf, Markup } = require("telegraf");
const PDFDocument = require("pdfkit");
const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");
const { MongoClient } = require("mongodb");

// MongoDB connection URL
const MONGO_URL = "mongodb+srv://awtwhatsappcrashlog:hmTx4nNaxAeA9VNU@cluster0.qgmoc.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"; // Replace with your MongoDB connection string
const DB_NAME = "pdf_bot_db"; // Replace with your database name
const COLLECTION_NAME = "users"; // Replace with your collection name

// Telegram Bot Token
const BOT_TOKEN = "7603494053:AAHhpqQKLItdNFPoOGI-oq2ZMsDGfQ0-KrM"; // Replace with your bot token
const REQUIRED_CHANNEL = "@awt_bots"; // Replace with your required channel
const OUTPUT_CHANNEL = -1002433715335; // Replace with your output channel
const ADMIN_IDS = [1343548529]; // Replace with admin Telegram IDs

const bot = new Telegraf(BOT_TOKEN);
let db;

// Directory for temporary storage
const DOWNLOAD_DIR = path.join(__dirname, "downloads");
if (!fs.existsSync(DOWNLOAD_DIR)) fs.mkdirSync(DOWNLOAD_DIR);

// Connect to MongoDB
async function connectToMongoDB() {
  try {
    const client = new MongoClient(MONGO_URL);
    await client.connect();
    db = client.db(DB_NAME);
    console.log("Connected to MongoDB");
  } catch (error) {
    console.error("Failed to connect to MongoDB:", error);
    process.exit(1);
  }
}

// Load users from MongoDB
const loadUsers = async () => {
  const usersCollection = db.collection(COLLECTION_NAME);
  return await usersCollection.find({}).toArray();
};

// Save user to MongoDB
const saveUser = async (user) => {
  const usersCollection = db.collection(COLLECTION_NAME);
  await usersCollection.updateOne({ id: user.id }, { $set: user }, { upsert: true });
};

// Check if a user exists in MongoDB
const userExists = async (userId) => {
  const usersCollection = db.collection(COLLECTION_NAME);
  const user = await usersCollection.findOne({ id: userId });
  return !!user;
};

// Delete message after a delay
const deleteMessageAfterDelay = async (ctx, messageId, delay) => {
  setTimeout(() => {
    ctx.deleteMessage(messageId).catch((err) => console.error("Error deleting message:", err));
  }, delay);
};

// Middleware to check if the user has joined the required channel
const checkMembership = async (ctx, next) => {
  const userId = ctx.from.id;

  try {
    const chatMember = await ctx.telegram.getChatMember(REQUIRED_CHANNEL, userId);

    if (
      chatMember.status === "member" ||
      chatMember.status === "administrator" ||
      chatMember.status === "creator"
    ) {
      return next();
    } else {
      await ctx.reply(
        `To use this bot, you need to join our Telegram channel first:`,
        Markup.inlineKeyboard([
          Markup.button.url("Join Channel", `https://t.me/${REQUIRED_CHANNEL.replace("@", "")}`),
          Markup.button.callback("I have joined", "check_membership"),
        ])
      );
    }
  } catch (error) {
    console.error("Error checking membership:", error);
    ctx.reply("An error occurred while verifying your membership. Please try again later.");
  }
};

// Middleware to track new users
bot.use(async (ctx, next) => {
  const userId = ctx.from.id;
  const username = ctx.from.username || "unknown";

  // Check if the user already exists in the database
  const exists = await userExists(userId);
  if (!exists) {
    const user = { id: userId, username };
    await saveUser(user);

    // Notify the output channel about the new user
    await bot.telegram.sendMessage(
      OUTPUT_CHANNEL,
      `New user started the PDF bot:
Username: @${username}
ID: ${userId}`
    );
  }

  await next();
});

// Admin Commands
bot.command("admin", (ctx) => {
  if (!ADMIN_IDS.includes(ctx.from.id)) return;

  ctx.reply(
    "Admin Panel",
    Markup.inlineKeyboard([
      [Markup.button.callback("Total Users", "total_users")],
      [Markup.button.callback("Broadcast", "broadcast")],
      [Markup.button.callback("List Users", "list_users")],
    ])
  );
});

// Handle "Total Users" button
bot.action("total_users", async (ctx) => {
  if (!ADMIN_IDS.includes(ctx.from.id)) return;

  const users = await loadUsers();
  await ctx.reply(`Total users: ${users.length}`);
});

// Handle "List Users" button
bot.action("list_users", async (ctx) => {
  if (!ADMIN_IDS.includes(ctx.from.id)) return;

  const users = await loadUsers();
  const userList = users.map((user) => `@${user.username} (ID: ${user.id})`).join("\n");

  if (userList) {
    await ctx.reply(`List of all users:\n${userList}`);
  } else {
    await ctx.reply("No users found.");
  }
});

// Handle "Broadcast" button
bot.action("broadcast", async (ctx) => {
  if (!ADMIN_IDS.includes(ctx.from.id)) return;

  await ctx.reply("Send the message you want to broadcast:");
  bot.on("message", async (msg) => {
    if (ADMIN_IDS.includes(msg.from.id)) {
      const users = await loadUsers();
      let successCount = 0;
      let failCount = 0;

      for (const user of users) {
        try {
          await bot.telegram.sendMessage(user.id, msg.text);
          successCount++;
        } catch (error) {
          if (error.response && error.response.error_code === 403) {
            console.log(`User ${user.id} has blocked the bot. Skipping message.`);
          } else {
            console.error("Error sending message to user:", error);
          }
          failCount++;
        }
      }

      await ctx.reply(`Broadcast completed. Success: ${successCount}, Failed: ${failCount}`);
    }
  });
});

// Handle /start command
bot.start(async (ctx) => {
  await ctx.reply(
    `Welcome to the Image to PDF Bot! 🤖\n\nSend me images (jpeg, png, jpg, webp, svg) as either photos or documents, and I'll combine them into a single PDF for you. Once you're done sending images, type /done to create your PDF.`
  );
});

// Handle images sent as photos and documents
const userImages = {};
const pendingFileNameRequest = {};
const renameFileRequest = {}; // Store rename requests

const handleImage = async (ctx, fileId) => {
  try {
    const userId = ctx.from.id;

    if (!userImages[userId]) userImages[userId] = [];

    const fileUrl = await ctx.telegram.getFileLink(fileId);
    const filePath = path.join(DOWNLOAD_DIR, `${fileId}.jpg`);

    const response = await axios({ url: fileUrl, method: "GET", responseType: "stream" });
    const writeStream = fs.createWriteStream(filePath);

    response.data.pipe(writeStream);

    writeStream.on("finish", async () => {
      userImages[userId].push(filePath);

      if (userImages[userId].length === 1) {
        const message = await ctx.reply("Image received! You can send more images, or type /done to create the PDF.");
        deleteMessageAfterDelay(ctx, message.message_id, 7500);
      }
    });

    writeStream.on("error", (err) => {
      console.error("Error downloading image:", err);
      ctx.reply("Failed to process the image. Please try again.");
    });
  } catch (error) {
    console.error("Error handling image:", error);
    ctx.reply("An error occurred while processing your image. Please try again.");
  }
};

bot.on("photo", async (ctx) => {
  const photo = ctx.message.photo.pop();
  const fileId = photo.file_id;
  await handleImage(ctx, fileId);
});

bot.on("document", async (ctx) => {
  const document = ctx.message.document;
  if (document.mime_type.startsWith("image/")) {
    await handleImage(ctx, document.file_id);
  } else {
    await ctx.reply("This document is not a supported image format. Please send only image files.");
  }
});

// Handle /done command to ask for the file name
bot.command("done", async (ctx) => {
  const userId = ctx.from.id;

  if (!userImages[userId] || userImages[userId].length === 0) {
    return ctx.reply("You haven't sent any images yet. Please send some images first.");
  }

  await ctx.reply("Please send the name you want for your PDF file (without the extension).", { reply_markup: { remove_keyboard: true } });
  pendingFileNameRequest[userId] = true;
});

// Handle text messages for file names
bot.on("text", async (ctx) => {
  const userId = ctx.from.id;

  if (pendingFileNameRequest[userId]) {
    const fileName = ctx.message.text.trim();
    if (!fileName) {
      return ctx.reply("Invalid file name. Please try again.");
    }

    delete pendingFileNameRequest[userId];

    try {
      const message = await ctx.reply("Processing your images into a PDF...");
      deleteMessageAfterDelay(ctx, message.message_id, 120000);

      const pdfPath = path.join(DOWNLOAD_DIR, `${fileName}.pdf`);
      await convertImagesToPDF(userImages[userId], pdfPath);

      // Send the PDF with rename option
      await ctx.replyWithDocument({ source: pdfPath, filename: `${fileName}.pdf` });

      // Prompt the user with rename buttons
      await ctx.reply(
        "Would you like to rename the file?",
        Markup.inlineKeyboard([
          [Markup.button.callback("Yes, Rename", `rename_${fileName}`)],
          [Markup.button.callback("No, Keep it", `keep_${fileName}`)],
        ])
      );

      // Store the rename request
      renameFileRequest[userId] = pdfPath;
    } catch (error) {
      console.error("Error creating PDF:", error);
      ctx.reply("An error occurred while creating the PDF. Please try again.");
    }
  } else if (renameFileRequest[userId]) {
    const newFileName = ctx.message.text.trim();
    if (!newFileName) {
      return ctx.reply("Invalid file name. Please try again.");
    }

    const oldFilePath = renameFileRequest[userId];
    const newFilePath = path.join(DOWNLOAD_DIR, `${newFileName}.pdf`);

    fs.renameSync(oldFilePath, newFilePath);

    await ctx.replyWithDocument({ source: newFilePath, filename: `${newFileName}.pdf` });

    // Clean up
    delete renameFileRequest[userId];
    userImages[userId].forEach((imagePath) => fs.unlinkSync(imagePath));
    delete userImages[userId];
  }
});

// Handle rename button actions
bot.action(/rename_(.+)/, async (ctx) => {
  const userId = ctx.from.id;
  const fileName = ctx.match[1];

  await ctx.reply("Please send the new name for the PDF file (without the extension).");
  renameFileRequest[userId] = path.join(DOWNLOAD_DIR, `${fileName}.pdf`);
});

// Handle keep button actions
bot.action(/keep_(.+)/, async (ctx) => {
  const userId = ctx.from.id;

  await ctx.reply("Your file has been saved without renaming.");
  delete renameFileRequest[userId];
  userImages[userId].forEach((imagePath) => fs.unlinkSync(imagePath));
  delete userImages[userId];
});

// Utility to convert images to PDF
const convertImagesToPDF = async (imagePaths, outputPath) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ autoFirstPage: false });
    const writeStream = fs.createWriteStream(outputPath);

    doc.pipe(writeStream);

    imagePaths.forEach((imagePath) => {
      const { width, height } = doc.openImage(imagePath);
      doc.addPage({ size: [width, height] }).image(imagePath, 0, 0, { width, height });
    });

    doc.end();

    writeStream.on("finish", resolve);
    writeStream.on("error", reject);
  });
};

// Start the bot
connectToMongoDB().then(() => {
  bot.launch().then(() => console.log("Bot is running..."));
});

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
