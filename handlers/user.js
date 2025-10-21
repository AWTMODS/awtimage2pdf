const fs = require("fs");
const path = require("path");
const axios = require("axios");
const User = require("../database/userModel");
const { createPDF } = require("./pdf");
const { Markup } = require("telegraf");
const { DOWNLOAD_DIR } = require("../config/config");

// Track images per user
const userImages = {};
const pendingFileName = {};
const renameFile = {};

async function handleImage(ctx, fileId) {
  const userId = ctx.from.id;
  if (!userImages[userId]) userImages[userId] = [];

  const fileUrl = await ctx.telegram.getFileLink(fileId);
  const filePath = path.join(DOWNLOAD_DIR, `${fileId}.jpg`);

  const res = await axios({ url: fileUrl, method: "GET", responseType: "stream" });
  res.data.pipe(fs.createWriteStream(filePath));
  res.data.on("end", () => userImages[userId].push(filePath));

  ctx.reply("Image received! Send /done to create PDF when ready.");
}

async function handleDone(ctx) {
  const userId = ctx.from.id;
  if (!userImages[userId] || userImages[userId].length === 0)
    return ctx.reply("No images found. Please send images first.");

  pendingFileName[userId] = true;
  ctx.reply("Send the file name for your PDF (without extension).");
}

async function handleFileName(ctx) {
  const userId = ctx.from.id;
  if (!pendingFileName[userId]) return;

  const fileName = ctx.message.text.trim();
  delete pendingFileName[userId];

  const user = await User.findOne({ userId });
  const pdfPath = path.join(DOWNLOAD_DIR, `${fileName}.pdf`);
  await createPDF(userImages[userId], pdfPath, user.settings);

  await ctx.replyWithDocument({ source: pdfPath, filename: `${fileName}.pdf` });
  userImages[userId].forEach((img) => fs.unlinkSync(img));
  delete userImages[userId];
}

module.exports = { handleImage, handleDone, handleFileName };
