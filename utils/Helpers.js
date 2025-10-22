const { Markup } = require("telegraf");
const SessionService = require('../services/SessionService');
const DatabaseService = require('../services/DatabaseService');

class Helpers {
  constructor() {
    this.bot = null;
  }

  setBotInstance(bot) {
    this.bot = bot;
    SessionService.setBotInstance(bot);
  }

  async cleanupPreviousMessages(ctx, userId, keepLast = 1) {
    try {
      const session = SessionService.getSession(userId);
      if (!session || !session.messageIds || session.messageIds.length <= keepLast) {
        return;
      }

      const messagesToDelete = session.messageIds.slice(0, -keepLast);
      session.messageIds = session.messageIds.slice(-keepLast);

      setTimeout(async () => {
        for (const messageId of messagesToDelete) {
          try {
            await ctx.telegram.deleteMessage(ctx.chat.id, messageId);
            console.log(`🗑️ Deleted message: ${messageId}`);
          } catch (error) {
            // Silently ignore deletion errors
          }
        }
      }, 100);

    } catch (error) {
      console.error('Error in cleanupPreviousMessages:', error);
    }
  }

  async sendMessageWithCleanup(ctx, text, extra = {}) {
    try {
      await this.cleanupPreviousMessages(ctx, ctx.from.id, 2);
      const message = await ctx.reply(text, { 
        ...extra,
        parse_mode: 'Markdown'
      });
      await SessionService.addMessageToSession(ctx.from.id, message.message_id);
      return message;
    } catch (error) {
      console.error('Error in sendMessageWithCleanup:', error);
      return await ctx.reply(text, extra);
    }
  }

  async editMessageWithCleanup(ctx, messageId, text, extra = {}) {
    try {
      await ctx.telegram.editMessageText(ctx.chat.id, messageId, null, text, {
        ...extra,
        parse_mode: 'Markdown'
      });
    } catch (error) {
      if (!error.message.includes('message to edit not found') && 
          !error.message.includes('message is not modified')) {
        console.log(`⚠️ Could not edit message ${messageId}:`, error.message);
      }
    }
  }

  async broadcastMessage(ctx, message, mediaType = 'text') {
    const users = await DatabaseService.getAllUsers();
    let success = 0;
    let failed = 0;

    for (const user of users) {
      try {
        if (mediaType === 'text') {
          await ctx.telegram.sendMessage(user.userId, message);
        } else if (mediaType === 'photo') {
          await ctx.telegram.sendPhoto(user.userId, message);
        } else if (mediaType === 'video') {
          await ctx.telegram.sendVideo(user.userId, message);
        }
        success++;
      } catch (error) {
        console.log(`Failed to send to user ${user.userId}:`, error.message);
        failed++;
      }

      await new Promise(resolve => setTimeout(resolve, 100));
    }

    return { success, failed };
  }
}

module.exports = new Helpers();