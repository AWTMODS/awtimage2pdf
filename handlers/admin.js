const User = require("../database/userModel");
const { Markup } = require("telegraf");
const { ADMIN_IDS } = require("../config/config");

async function adminPanel(ctx) {
  if (!ADMIN_IDS.includes(ctx.from.id)) return;
  ctx.reply(
    "Admin Panel",
    Markup.inlineKeyboard([
      [Markup.button.callback("Total Users", "total_users")],
      [Markup.button.callback("List Users", "list_users")],
    ])
  );
}

async function totalUsers(ctx) {
  if (!ADMIN_IDS.includes(ctx.from.id)) return;
  const users = await User.find({});
  ctx.reply(`Total users: ${users.length}`);
}

async function listUsers(ctx) {
  if (!ADMIN_IDS.includes(ctx.from.id)) return;
  const users = await User.find({});
  const list = users.map((u) => `@${u.username} (ID: ${u.userId})`).join("\n");
  ctx.reply(list || "No users found.");
}

module.exports = { adminPanel, totalUsers, listUsers };
