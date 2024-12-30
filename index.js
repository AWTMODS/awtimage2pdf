const { Telegraf, Markup } = require("telegraf");
const PDFDocument = require("pdfkit");
const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");

// Telegram Bot Token
const BOT_TOKEN = "7940862231:AAG9jDNnRf95VmrdFey2eKETezOrHIbQ6bg"; // Replace with your bot token
const REQUIRED_CHANNEL = "@awt_bots"; // Replace with your required channel

const bot = new Telegraf(BOT_TOKEN);

// Directory for temporary storage
const DOWNLOAD_DIR = path.join(__dirname, "downloads");
if (!fs.existsSync(DOWNLOAD_DIR)) fs.mkdirSync(DOWNLOAD_DIR);

// Function to convert images to PDF
const convertImagesToPDF = async (imagePaths, outputPath) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument();
    const writeStream = fs.createWriteStream(outputPath);

    doc.pipe(writeStream);

    // Add each image to the PDF
    imagePaths.forEach((imagePath) => {
      doc.addPage().image(imagePath, {
        fit: [500, 700],
        align: "center",
        valign: "center",
      });
    });

    doc.end();

    writeStream.on("finish", () => resolve());
    writeStream.on("error", (err) => reject(err));
  });
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

bot.use(checkMembership);

// Handle "I have joined" button
bot.action("check_membership", async (ctx) => {
  const userId = ctx.from.id;

  try {
    const chatMember = await ctx.telegram.getChatMember(REQUIRED_CHANNEL, userId);

    if (
      chatMember.status === "member" ||
      chatMember.status === "administrator" ||
      chatMember.status === "creator"
    ) {
      await ctx.editMessageText("Thank you for joining! You can now use the bot by sending /start.");
    } else {
      await ctx.answerCbQuery(
        "It seems you haven't joined the channel yet. Please join and try again.",
        { show_alert: true }
      );
    }
  } catch (error) {
    console.error("Error verifying membership:", error);
    ctx.reply("An error occurred while verifying your membership. Please try again later.");
  }
});

// Handle /start command
bot.start(async (ctx) => {
  await ctx.reply(
    `Welcome to the Image to PDF Bot! 🤖\n\nSend me images, and I'll combine them into a single PDF for you. Once you're done sending images, type /done to create your PDF.`
  );
});

// Handle images sent to the bot
const userImages = {}; // Stores user sessions for collecting multiple images
const pendingFileNameRequest = {}; // Tracks users waiting for a file name

bot.on("photo", async (ctx) => {
  try {
    const userId = ctx.from.id;

    // Initialize user's session if not already done
    if (!userImages[userId]) userImages[userId] = [];

    // Get the highest resolution of the image
    const photo = ctx.message.photo.pop(); // Get the largest size photo
    const fileId = photo.file_id;
    const fileUrl = await ctx.telegram.getFileLink(fileId);
    const filePath = path.join(DOWNLOAD_DIR, `${fileId}.jpg`);

    // Download the image
    const response = await axios({
      url: fileUrl,
      method: "GET",
      responseType: "stream",
    });
    const writeStream = fs.createWriteStream(filePath);
    response.data.pipe(writeStream);

    writeStream.on("finish", () => {
      // Add the image to the user's session
      userImages[userId].push(filePath);

      // Send a single "Image received" message when the first image is processed
      if (userImages[userId].length === 1) {
        ctx.reply("Image received! You can send more images, or type /done to create the PDF.");
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
});

// Handle /done command to ask for the file name
bot.command("done", async (ctx) => {
  const userId = ctx.from.id;

  if (!userImages[userId] || userImages[userId].length === 0) {
    await ctx.reply("You haven't sent any images yet. Please send some images first.");
    return;
  }

  // Prompt user for the file name
  await ctx.reply("Please send the name you want for your PDF file (without the extension).");
  pendingFileNameRequest[userId] = true;
});

// Handle text messages to get the file name
bot.on("text", async (ctx) => {
  const userId = ctx.from.id;

  if (!pendingFileNameRequest[userId]) return; // Ignore if not awaiting file name

  const fileName = ctx.message.text.trim();
  if (!fileName) {
    await ctx.reply("Invalid file name. Please try again.");
    return;
  }

  delete pendingFileNameRequest[userId]; // Remove the pending request

  try {
    const pdfFilename = `${fileName}.pdf`;
    const pdfPath = path.join(DOWNLOAD_DIR, pdfFilename);

    // Notify the user
    const processingMessage = await ctx.reply("Creating your PDF... Please wait.");

    // Convert images to PDF
    await convertImagesToPDF(userImages[userId], pdfPath);

    // Send the PDF back to the user
    await ctx.replyWithDocument(
      { source: pdfPath, filename: pdfFilename },
      { caption: "PDF created by @awt_bots" }
    );

    // Cleanup
    userImages[userId].forEach((imagePath) => fs.unlinkSync(imagePath));
    fs.unlinkSync(pdfPath);
    delete userImages[userId]; // Clear the session for the user

    // Edit processing message to notify completion
    await ctx.telegram.editMessageText(
      ctx.chat.id,
      processingMessage.message_id,
      undefined,
      "Your PDF has been created and sent successfully!"
    );
  } catch (error) {
    console.error("Error creating PDF:", error);
    ctx.reply("An error occurred while creating the PDF. Please try again.");
  }
});

// Start the bot
bot.launch().then(() => {
  console.log("Bot is running...");
});

// Graceful stop
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
