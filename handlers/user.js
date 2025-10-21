const fs = require("fs");
const path = require("path");
const axios = require("axios");
const { Markup } = require("telegraf");
const User = require("../database/userModel");
const { createPDF } = require("./pdf");
const { DOWNLOAD_DIR } = require("../config/config");

// Track temporary user data
const userImages = {};
const pendingFileName = {};
const renameRequests = {};

// Handle incoming image or document
async function handleImage(ctx, fileId) {
  const userId = ctx.from.id;
  if (!userImages[userId]) userImages[userId] = [];

  const fileUrl = await ctx.telegram.getFileLink(fileId);
  const filePath = path.join(DOWNLOAD_DIR, `${fileId}.jpg`);

  const res = await axios({ url: fileUrl, method: "GET", responseType: "stream" });
  const writeStream = fs.createWriteStream(filePath);
  res.data.pipe(writeStream);

  writeStream.on("finish", () => {
    userImages[userId].push(filePath);
    ctx.reply("Image received! Send /done to create PDF when ready.");
  });

  writeStream.on("error", (err) => {
    console.error("Image download failed:", err);
    ctx.reply("Failed to download image.");
  });
}

// Handle /done command
async function handleDone(ctx) {
  const userId = ctx.from.id;
  if (!userImages[userId] || userImages[userId].length === 0) {
    return ctx.reply("No images found. Please send images first.");
  }

  pendingFileName[userId] = true;
  ctx.reply("Send the file name for your PDF (without extension).");
}

// Handle filename input
async function handleFileName(ctx) {
  const userId = ctx.from.id;
  if (!pendingFileName[userId]) return;

  const fileName = ctx.message.text.trim();
  delete pendingFileName[userId];

  // Load user settings or defaults
  const user = await User.findOne({ userId }) || { settings: { includeOCR: false, footer: true } };
  const pdfPath = path.join(DOWNLOAD_DIR, `${fileName}.pdf`);

  try {
    await createPDF(userImages[userId], pdfPath, user.settings);

    // Send PDF with rename buttons
    await ctx.replyWithDocument({ source: pdfPath, filename: `${fileName}.pdf` });
    await ctx.reply(
      "Do you want to rename the PDF?",
      Markup.inlineKeyboard([
        [Markup.button.callback("Rename", `rename_${fileName}`)],
        [Markup.button.callback("Keep as is", `keep_${fileName}`)]
      ])
    );

    renameRequests[userId] = pdfPath; // store path for renaming

  } catch (err) {
    console.error("PDF creation error:", err);
    ctx.reply("Failed to create PDF.");
  }
}

// Handle rename button
async function handleRenameButton(ctx) {
  const userId = ctx.from.id;
  const oldName = ctx.match[1];

  if (!renameRequests[userId]) return;
  ctx.reply("Send the new name for your PDF (without extension).");
}

// Handle keep button
async function handleKeepButton(ctx) {
  const userId = ctx.from.id;
  delete renameRequests[userId];
  ctx.reply("PDF saved without renaming.");
}

// Handle new name for renaming
async function handleNewName(ctx) {
  const userId = ctx.from.id;
  if (!renameRequests[userId]) return;

  const newName = ctx.message.text.trim();
  const oldPath = renameRequests[userId];
  const newPath = path.join(DOWNLOAD_DIR, `${newName}.pdf`);

  fs.renameSync(oldPath, newPath);
  await ctx.replyWithDocument({ source: newPath, filename: `${newName}.pdf` });

  // Cleanup
  delete renameRequests[userId];
  if (userImages[userId]) {
    userImages[userId].forEach(img => fs.unlinkSync(img));
    delete userImages[userId];
  }
}

module.exports = {
  handleImage,
  handleDone,
  handleFileName,
  handleRenameButton,
  handleKeepButton,
  handleNewName,
  userImages,
  pendingFileName
};
