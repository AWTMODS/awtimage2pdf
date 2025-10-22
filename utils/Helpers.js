class Helpers {
  static async cleanupOldMessages(bot, userId, messageIds) {
    if (!messageIds || messageIds.length === 0) return;

    for (const messageId of messageIds) {
      try {
        await bot.telegram.deleteMessage(userId, messageId);
        console.log(`🗑️ Auto-deleted old message: ${messageId}`);
      } catch (error) {
        if (!error.message.includes('message to delete not found')) {
          console.log(`⚠️ Could not delete message ${messageId}`);
        }
      }
    }
  }

  static async cleanupPreviousMessages(ctx, session, keepLast = 1) {
    try {
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

  static async sendMessageWithCleanup(ctx, sessionService, text, extra = {}) {
    const userId = ctx.from.id;
    const session = sessionService.getSession(userId);

    try {
      await this.cleanupPreviousMessages(ctx, session, 2);
      const message = await ctx.reply(text, { 
        ...extra,
        parse_mode: 'Markdown'
      });
      
      const messagesToDelete = session.addMessageId(message.message_id);
      if (messagesToDelete.length > 0) {
        this.cleanupOldMessages(ctx.telegram, userId, messagesToDelete);
      }
      
      return message;
    } catch (error) {
      console.error('Error in sendMessageWithCleanup:', error);
      return await ctx.reply(text, extra);
    }
  }

  static async editMessageWithCleanup(ctx, messageId, text, extra = {}) {
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
}

module.exports = Helpers;