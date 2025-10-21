const { Telegraf } = require("telegraf");
const fs = require("fs");
const { BOT_TOKEN, DOWNLOAD_DIR } = require("./config/config");
const { connect } = require("./database/mongo");
const { handleImage, handleDone, handleFileName } = require("./handlers/user");
const { adminPanel } = require("./handlers/admin");
const { checkMembership } = require("./handlers/membership");

if (!fs.existsSync(DOWNLOAD_DIR)) fs.mkdirSync(DOWNLOAD_DIR);

const bot = new Telegraf(BOT_TOKEN);

connect().then(() => console.log("MongoDB connected"));

bot.use(checkMembership);

bot.start((ctx) => ctx.reply("Welcome to PDF Bot! Send images or docs to start."));

bot.on("photo", async (ctx) => {
  const photo = ctx.message.photo.pop();
  await handleImage(ctx, photo.file_id);
});

bot.on("document", async (ctx) => {
  const doc = ctx.message.document;
  if (doc.mime_type.startsWith("image/")) await handleImage(ctx, doc.file_id);
});

bot.command("done", handleDone);
bot.on("text", handleFileName);

bot.command("admin", adminPanel);

bot.launch().then(() => console.log("Bot running..."));
