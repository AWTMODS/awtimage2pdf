const { REQUIRED_CHANNEL } = require("../config/config");
const { Markup } = require("telegraf");

async function checkMembership(ctx, next) {
  try {
    const userId = ctx.from.id;
    const member = await ctx.telegram.getChatMember(REQUIRED_CHANNEL, userId);
    if (["member", "administrator", "creator"].includes(member.status)) {
      return next();
    } else {
      return ctx.reply(
        `Please join our channel first:`,
        Markup.inlineKeyboard([
          Markup.button.url("Join Channel", `https://t.me/${REQUIRED_CHANNEL.replace("@", "")}`),
          Markup.button.callback("I have joined", "check_membership")
        ])
      );
    }
  } catch (err) {
    console.error(err);
    ctx.reply("Error checking membership. Please try again later.");
  }
}

module.exports = { checkMembership };
