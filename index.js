const { Telegraf, Markup } = require("telegraf");
const PDFDocument = require("pdfkit");
const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");

// Telegram Bot Token
const BOT_TOKEN = "7940862231:AAG9jDNnRf95VmrdFey2eKETezOrHIbQ6bg"; // Replace with your bot token
const REQUIRED_CHANNEL = "@awt_bots"; // Replace with your required channel
const OUTPUT_CHANNEL = "@awtbotsdb"; // Replace with your output channel
const ADMIN_IDS = [1343548529]; // Replace with admin Telegram IDs

const bot = new Telegraf(BOT_TOKEN);

// Directory for temporary storage
const DOWNLOAD_DIR = path.join(__dirname, "downloads");
const USERS_FILE = path.join(__dirname, "users.json");

if (!fs.existsSync(DOWNLOAD_DIR)) fs.mkdirSync(DOWNLOAD_DIR);
if (!fs.existsSync(USERS_FILE)) fs.writeJsonSync(USERS_FILE, []);

// Load users from file
const loadUsers = () => fs.readJsonSync(USERS_FILE, { throws: false }) || [];
const saveUsers = (users) => fs.writeJsonSync(USERS_FILE, users);

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

bot.use(async (ctx, next) => {
  const users = loadUsers();
  const userId = ctx.from.id;
  const username = ctx.from.username || "unknown";

  if (!users.some((user) => user.id === userId)) {
    users.push({ id: userId, username });
    saveUsers(users);

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
bot.command("total_users", async (ctx) => {
  if (!ADMIN_IDS.includes(ctx.from.id)) return;

  const users = loadUsers();
  await ctx.reply(`Total users: ${users.length}`);
});

bot.command("users", async (ctx) => {
  if (!ADMIN_IDS.includes(ctx.from.id)) return;

  const users = loadUsers();
  const userList = users.map((user) => `@${user.username} (ID: ${user.id})`).join("\n");

  if (userList) {
    await ctx.reply(`List of all users:\n${userList}`);
  } else {
    await ctx.reply("No users found.");
  }
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
const renameFileRequest = {};

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

      // Send the PDF with rename prompt
      await sendPdfWithRenameOption(ctx, pdfPath, `${fileName}.pdf`);

      // Clean up user images
      userImages[userId].forEach((imagePath) => fs.unlinkSync(imagePath));
      delete userImages[userId];
    } catch (error) {
      console.error("Error creating PDF:", error);
      ctx.reply("An error occurred while creating the PDF. Please try again.");
    }
  } else if (renameFileRequest[userId]) {
    const oldFileName = renameFileRequest[userId];
    const newFileName = ctx.message.text.trim();
    if (!newFileName) {
      return ctx.reply("Invalid file name. Please try again.");
    }

    const oldFilePath = path.join(DOWNLOAD_DIR, oldFileName);
    const newFilePath = path.join(DOWNLOAD_DIR, `${newFileName}.pdf`);

    fs.renameSync(oldFilePath, newFilePath);

    const message = await ctx.replyWithDocument({
      source: newFilePath,
      filename: `${newFileName}.pdf`,
      caption: "Your renamed PDF file.",
    });

    deleteMessageAfterDelay(ctx, message.message_id, 120000);

    // Send the output to the channel
    await bot.telegram.sendDocument(OUTPUT_CHANNEL, {
      source: newFilePath,
      filename: `${newFileName}.pdf`,
      caption: `Renamed file from user: @${ctx.from.username || "unknown"}`,
    });

    delete renameFileRequest[userId];
  }
});

// Send PDF with rename option
const sendPdfWithRenameOption = async (ctx, pdfPath, fileName) => {
  try {
    await ctx.replyWithChatAction("upload_document");
    const message = await ctx.replyWithDocument({
      source: pdfPath,
      filename: fileName,
    });

    deleteMessageAfterDelay(ctx, message.message_id, 120000);

    // Send the output to the channel
    await bot.telegram.sendDocument(OUTPUT_CHANNEL, {
      source: pdfPath,
      filename: fileName,
      caption: `Original file from user: @${ctx.from.username || "unknown"}`,
    });

    // Prompt the user with rename buttons
    await ctx.reply(
      "Would you like to rename the file?",
      Markup.inlineKeyboard([
        Markup.button.callback("Yes, Rename", `rename_${fileName}`),
        Markup.button.callback("No, Keep it", `keep_${fileName}`),
      ])
    );
    renameFileRequest[ctx.from.id] = fileName;
  } catch (error) {
    console.error("Error sending PDF:", error);
    ctx.reply("An error occurred while sending the PDF. Please try again.");
  }
};

// Handle rename button actions
bot.action(/rename_(.+)/, async (ctx) => {
  const fileName = ctx.match[1];

  try {
    await ctx.editMessageReplyMarkup(null);
    await ctx.reply(`Send the new name for the PDF (without extension).`);
  } catch (error) {
    console.error("Error handling rename action:", error);
    ctx.reply("An error occurred while processing your request. Please try again.");
  }
});

bot.action(/keep_(.+)/, async (ctx) => {
  try {
    await ctx.editMessageReplyMarkup(null);
    const message = await ctx.reply("Your file has been saved without renaming.");
    deleteMessageAfterDelay(ctx, message.message_id, 120000);
  } catch (error) {
    console.error("Error handling keep action:", error);
    ctx.reply("An error occurred while processing your request. Please try again.");
  }
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
bot.launch().then(() => console.log("Bot is running..."));

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
