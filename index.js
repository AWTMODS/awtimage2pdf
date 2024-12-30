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
  }

  await next();
});

// Admin Commands
bot.command("total_users", async (ctx) => {
  if (!ADMIN_IDS.includes(ctx.from.id)) return;

  const users = loadUsers();
  await ctx.reply(`Total users: ${users.length}`);
});

bot.command("broadcast", async (ctx) => {
  if (!ADMIN_IDS.includes(ctx.from.id)) return;

  const message = ctx.message.text.split(" ").slice(1).join(" ");
  if (!message) {
    return ctx.reply("Please provide a message to broadcast. Example: /broadcast Hello Users!");
  }

  const users = loadUsers();
  for (const user of users) {
    try {
      await bot.telegram.sendMessage(user.id, message);
    } catch (err) {
      console.error(`Error sending message to user ${user.id}:`, err.message);
    }
  }

  await ctx.reply("Message broadcasted to all users.");
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
        await ctx.reply("Image received! You can send more images, or type /done to create the PDF.");
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
      await ctx.reply("Processing your images into a PDF...");

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

    await ctx.replyWithDocument({
      source: newFilePath,
      filename: `${newFileName}.pdf`,
      caption: "Your renamed PDF file. by @awt_bots"
    });

    // Send the output to the channel
    await bot.telegram.sendDocument(OUTPUT_CHANNEL, {
      source: newFilePath,
      filename: `${newFileName}.pdf`,
      caption: `Renamed file from user: @${ctx.from.username || "unknown"}`
    });

    delete renameFileRequest[userId];
  }
});

// Send PDF with rename option
const sendPdfWithRenameOption = async (ctx, pdfPath, fileName) => {
  try {
    await ctx.replyWithChatAction("upload_document");
    await ctx.replyWithDocument({
      source: pdfPath,
      filename: fileName,
      caption: "Your PDF file is ready. Converted by @awt_bots."
    });

    // Send the output to the channel
    await bot.telegram.sendDocument(OUTPUT_CHANNEL, {
      source: pdfPath,
      filename: fileName,
      caption: `Original file from user: @${ctx.from.username || "unknown"}`
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
    ctx.reply("Failed to send the PDF. Please try again.");
  }
};

// Convert images to PDF
const convertImagesToPDF = async (imagePaths, outputPath) => {
  const doc = new PDFDocument();

  return new Promise((resolve, reject) => {
    const stream = fs.createWriteStream(outputPath);

    doc.pipe(stream);
    imagePaths.forEach((imagePath) => {
      doc.image(imagePath, { fit: [500, 500], align: "center", valign: "center" });
      doc.addPage();
    });
    doc.end();

    stream.on("finish", resolve);
    stream.on("error", reject);
  });
};

// Error handling
bot.catch((err) => {
  console.error("Bot encountered an error:", err);
});

// Start bot
bot.launch()
  .then(() => console.log("Bot started successfully."))
  .catch((err) => console.error("Error starting bot:", err));

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
