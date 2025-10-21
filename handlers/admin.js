const { Markup } = require("telegraf");
const User = require("../database/userModel");

const ADMIN_IDS = [1343548529];

async function adminPanel(ctx) {
  if (!ADMIN_IDS.includes(ctx.from.id)) return;

  await ctx.reply(
    "Admin Panel",
    Markup.inlineKeyboard([
      [Markup.button.callback("Total Users", "total_users")],
      [Markup.button.callback("List Users", "list_users")],
      [Markup.button.callback("Broadcast", "broadcast")],
    ])
  );
}

// Button handlers
async function handleAdminActions(ctx) {
  if (!ADMIN_IDS.includes(ctx.from.id)) return;

  const users = await User.find({});

  switch (ctx.callbackQuery.data) {
    case "total_users":
      await ctx.reply(`Total users: ${users.length}`);
      break;

    case "list_users":
      const userList = users.map(u => `@${u.username} (ID: ${u.userId})`).join("\n") || "No users yet.";
      await ctx.reply(userList);
      break;

    case "broadcast":
      await ctx.reply("Send the message to broadcast:");
      // Listen for next admin message
      ctx.telegram.once("message", async (msg) => {
        if (!ADMIN_IDS.includes(msg.from.id)) return;
        let success = 0, fail = 0;
        for (const user of users) {
          try {
            await ctx.telegram.sendMessage(user.userId, msg.text);
            success++;
          } catch {
            fail++;
          }
        }
        await ctx.reply(`Broadcast completed. Success: ${success}, Failed: ${fail}`);
      });
      break;
  }

  await ctx.answerCbQuery(); // Close the inline button loader
}

module.exports = { adminPanel, handleAdminActions };
