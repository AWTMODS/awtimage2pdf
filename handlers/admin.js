const { Markup } = require("telegraf");
const User = require("../database/userModel");

// Replace with your Telegram ID(s)
const ADMIN_IDS = [1343548529];

async function adminPanel(ctx) {
  if (!ADMIN_IDS.includes(ctx.from.id)) return;

  await ctx.reply(
    "Admin Panel",
    Markup.inlineKeyboard([
      [Markup.button.callback("Total Users", "total_users")],
      [Markup.button.callback("List Users", "list_users")],
      [Markup.button.callback("Broadcast", "broadcast")]
    ])
  );
}

// Handle inline buttons
async function handleAdminActions(bot) {
  // Total users
  bot.action("total_users", async (ctx) => {
    if (!ADMIN_IDS.includes(ctx.from.id)) return;

    const count = await User.countDocuments();
    await ctx.reply(`Total users: ${count}`);
  });

  // List all users
  bot.action("list_users", async (ctx) => {
    if (!ADMIN_IDS.includes(ctx.from.id)) return;

    const users = await User.find({});
    const list = users
      .map((u) => `@${u.username || "unknown"} (ID: ${u.userId})`)
      .join("\n");

    await ctx.reply(list || "No users found.");
  });

  // Broadcast message
  bot.action("broadcast", async (ctx) => {
    if (!ADMIN_IDS.includes(ctx.from.id)) return;

    await ctx.reply("Send the message you want to broadcast to all users.");

    // Listen for next message from admin
    bot.on("message", async (msgCtx) => {
      if (!ADMIN_IDS.includes(msgCtx.from.id)) return;

      const message = msgCtx.message.text;
      const users = await User.find({});
      let success = 0,
        failed = 0;

      for (const user of users) {
        try {
          await bot.telegram.sendMessage(user.userId, message);
          success++;
        } catch (err) {
          failed++;
        }
      }

      await msgCtx.reply(
        `Broadcast completed.\nSuccess: ${success}\nFailed: ${failed}`
      );
    });
  });
}

module.exports = { adminPanel, handleAdminActions, ADMIN_IDS };
