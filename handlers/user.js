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
  const writer = fs.createWriteStream(filePath);
  res.data.pipe(writer);

  writer.on("finish", () => {
    userImages[userId].push(filePath);
    ctx.reply("✅ Image received! Send /done when ready to generate your PDF.");
  });

  writer.on("error", (err) => {
    console.error("Download error:", err);
    ctx.reply("⚠️ Failed to download image. Please try again.");
  });
}

async function handleDone(ctx) {
  const userId = ctx.from.id;
  if (!userImages[userId] || userImages[userId].length === 0)
    return ctx.reply("📂 No images found. Please send some images first.");

  pendingFileName[userId] = true;
  ctx.reply("📝 Send the name you want for your PDF (without extension).");
}

async function handleFileName(ctx) {
  const userId = ctx.from.id;
  if (!pendingFileName[userId]) return;

  const fileName = ctx.message.text.trim();
  delete pendingFileName[userId];

  // ✅ FIX: ensure user exists, or create default
  let user = await User.findOne({ userId });
  if (!user) {
    user = await User.create({
      userId,
      username: ctx.from.username || "unknown",
      isNew: false,
      settings: {
        pageSize: "A4",
        orientation: "portrait",
        compress: true,
        header: true,
        footer: true,
        password: "",
        includeOCR: true,
        language: "en",
      },
    });
  }

  try {
    const pdfPath = path.join(DOWNLOAD_DIR, `${fileName}.pdf`);
    await createPDF(userImages[userId], pdfPath, user.settings);

    await ctx.replyWithDocument({ source: pdfPath, filename: `${fileName}.pdf` });
    await ctx.reply("✅ PDF generated successfully!");

    // Clean up temporary images
    userImages[userId].forEach((img) => fs.unlinkSync(img));
    delete userImages[userId];
  } catch (error) {
    console.error("PDF generation failed:", error);
    ctx.reply("❌ Failed to generate PDF. Please try again later.");
  }
}

module.exports = { handleImage, handleDone, handleFileName };
