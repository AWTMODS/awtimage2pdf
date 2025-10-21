const { Telegraf, Markup } = require("telegraf");
const fs = require("fs");
const { BOT_TOKEN, DOWNLOAD_DIR } = require("./config/config");
const { connect } = require("./database/mongo");
const {
  handleImage,
  handleDone,
  handleFileName,
  handleRenameButton,
  handleKeepButton,
  handleNewName
} = require("./handlers/user");
const { adminPanel } = require("./handlers/admin");
const { checkMembership } = require("./handlers/membership");
const { adminPanel, handleAdminActions } = require("./handlers/admin");
if (!fs.existsSync(DOWNLOAD_DIR)) fs.mkdirSync(DOWNLOAD_DIR);

const bot = new Telegraf(BOT_TOKEN);

// Connect MongoDB
connect().then(() => console.log("MongoDB connected"));

// Membership check middleware
bot.use(checkMembership);

// /start command
bot.start((ctx) =>
  ctx.reply(
    "Welcome to PDF Bot! Send images or documents to start creating PDFs."
  )
);

// Photo handler
bot.on("photo", async (ctx) => {
  const photo = ctx.message.photo.pop();
  await handleImage(ctx, photo.file_id);
});

// Document handler (images only)
bot.on("document", async (ctx) => {
  const doc = ctx.message.document;
  if (doc.mime_type.startsWith("image/")) await handleImage(ctx, doc.file_id);
  else ctx.reply("Only image files are supported.");
});

// /done command to finalize PDF
bot.command("done", handleDone);

// Text handler (filename or new name for rename)
bot.on("text", async (ctx) => {
  const userId = ctx.from.id;

  // If user is renaming
  const renameRequests = require("./handlers/user").renameRequests;
  if (renameRequests[userId]) {
    await handleNewName(ctx);
  } else {
    await handleFileName(ctx);
  }
});

// Admin panel
bot.command("admin", adminPanel);
// Setup inline button handlers
handleAdminActions(bot);

// Inline button actions for rename/keep
bot.action(/rename_(.+)/, handleRenameButton);
bot.action(/keep_(.+)/, handleKeepButton);

// Launch bot
bot.launch().then(() => console.log("Bot running..."));

// Graceful stop
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
