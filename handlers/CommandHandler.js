const { Markup } = require("telegraf");
const SessionService = require('../services/SessionService');
const DatabaseService = require('../services/DatabaseService');
const FileService = require('../services/FileService');
const Localization = require('../utils/Localization');
const Helpers = require('../utils/Helpers');
const constants = require('../config/constants');

class CommandHandler {
  constructor(bot) {
    this.bot = bot;
    Helpers.setBotInstance(bot);
    this.registerCommands();
  }

  registerCommands() {
    // Start command
    this.bot.start(async (ctx) => {
      const userId = ctx.from.id;
      console.log(`🚀 Start command from user: ${userId}`);

      const session = SessionService.initUserSession(userId);
      await Helpers.sendMessageWithCleanup(ctx, Localization.getMessage(session.language, 'welcome'));
    });

    // Help command
    this.bot.command('help', async (ctx) => {
      const userId = ctx.from.id;
      const session = SessionService.getSession(userId) || SessionService.initUserSession(userId);
      await Helpers.sendMessageWithCleanup(ctx, Localization.getMessage(session.language, 'welcome'));
    });

    // Stats command
    this.bot.command('stats', async (ctx) => {
      const userId = ctx.from.id;
      const session = SessionService.getSession(userId) || SessionService.initUserSession(userId);
      const userStats = await DatabaseService.getUserStats(userId);

      if (userStats) {
        const lastFiles = userStats.lastFiles && userStats.lastFiles.length > 0 
          ? userStats.lastFiles.join(', ') 
          : 'No files yet';

        await Helpers.sendMessageWithCleanup(ctx,
          Localization.getMessage(session.language, 'userStats', {
            totalPdfs: userStats.pdfsGenerated || 0,
            lastFiles: lastFiles
          })
        );
      } else {
        await Helpers.sendMessageWithCleanup(ctx, "📊 No statistics available yet. Create your first PDF to see stats!");
      }
    });

    // Status command
    this.bot.command('status', async (ctx) => {
      const userId = ctx.from.id;
      const session = SessionService.getSession(userId);
      console.log(`📊 Status command from user: ${userId}, session:`, session);

      if (session && session.images) {
        await Helpers.sendMessageWithCleanup(ctx, Localization.getMessage(session.language, 'status', { count: session.images.length }));
      } else {
        await Helpers.sendMessageWithCleanup(ctx, Localization.getMessage(session?.language || 'en', 'noSession'));
      }
    });

    // Done command
    this.bot.command('done', async (ctx) => {
      const userId = ctx.from.id;
      const session = SessionService.getSession(userId);

      console.log(`✅ Done command from user: ${userId}`);
      console.log(`📊 Session images:`, session ? session.images : 'No session');

      if (!session || !session.images || session.images.length === 0) {
        console.log(`❌ No images found for user: ${userId}`);
        return await Helpers.sendMessageWithCleanup(ctx, Localization.getMessage(session?.language || 'en', 'noImages'));
      }

      if (session.images.length > constants.MAX_IMAGES) {
        return await Helpers.sendMessageWithCleanup(ctx, Localization.getMessage(session.language, 'maxImages'));
      }

      try {
        SessionService.updateSessionState(userId, 'awaiting_compression');
        await Helpers.sendMessageWithCleanup(ctx,
          Localization.getMessage(session.language, 'compressionPrompt'),
          Markup.inlineKeyboard([
            [Markup.button.callback(Localization.getMessage(session.language, 'compressionLow'), 'compression_low')],
            [Markup.button.callback(Localization.getMessage(session.language, 'compressionMedium'), 'compression_medium')],
            [Markup.button.callback(Localization.getMessage(session.language, 'compressionHigh'), 'compression_high')]
          ])
        );
      } catch (error) {
        console.error('Error in done command:', error);
        await Helpers.sendMessageWithCleanup(ctx, "❌ Failed to process request. Please try again.");
      }
    });

    // Language command
    this.bot.command('language', async (ctx) => {
      const userId = ctx.from.id;
      const session = SessionService.getSession(userId) || SessionService.initUserSession(userId);
      
      await Helpers.sendMessageWithCleanup(ctx,
        Localization.getMessage(session.language, 'selectLanguage'),
        Markup.inlineKeyboard([
          [Markup.button.callback('🇺🇸 English', 'lang_en')],
          [Markup.button.callback('🇦🇪 العربية', 'lang_ar')],
          [Markup.button.callback('🇷🇺 Русский', 'lang_ru')],
          [Markup.button.callback('🇪🇸 Español', 'lang_es')],
          [Markup.button.callback('🇮🇳 हिंदी', 'lang_hi')]
        ])
      );
    });

    // Admin command
    this.bot.command('admin', async (ctx) => {
      const userId = ctx.from.id;
      const session = SessionService.getSession(userId) || SessionService.initUserSession(userId);

      if (!constants.ADMIN_IDS.includes(userId)) {
        return await Helpers.sendMessageWithCleanup(ctx, Localization.getMessage(session.language, 'adminOnly'));
      }

      await Helpers.sendMessageWithCleanup(ctx,
        Localization.getMessage(session.language, 'adminPanel'),
        Markup.inlineKeyboard([
          [Markup.button.callback(Localization.getMessage(session.language, 'totalUsers'), 'admin_total_users')],
          [Markup.button.callback(Localization.getMessage(session.language, 'broadcast'), 'admin_broadcast')],
          [Markup.button.callback(Localization.getMessage(session.language, 'stats'), 'admin_stats')]
        ])
      );
    });

    // Clear command
    this.bot.command('clear', async (ctx) => {
      const userId = ctx.from.id;
      await FileService.cleanupUserFiles(userId, SessionService);
      await Helpers.sendMessageWithCleanup(ctx, "✅ Session cleared! Start fresh with /start");
    });

    // Cancel command
    this.bot.command('cancel', async (ctx) => {
      const userId = ctx.from.id;
      const session = SessionService.getSession(userId);
      await FileService.cleanupUserFiles(userId, SessionService);
      await Helpers.sendMessageWithCleanup(ctx, Localization.getMessage(session?.language || 'en', 'sessionCancelled'));
    });

    // Test command
    this.bot.command('test', async (ctx) => {
      const userId = ctx.from.id;
      const session = SessionService.getSession(userId);

      console.log(`🧪 Test command from user: ${userId}`);
      console.log(`📊 Session data:`, session);

      const testMessage = `
🤖 Bot Test Results:
✅ Bot is responding
👤 User ID: ${userId}
📊 Session: ${session ? 'Active' : 'No session'}
🖼️ Images in session: ${session ? session.images.length : 0}
🌐 Language: ${session ? session.language : 'default'}
🔧 Database: ${DatabaseService.isDbConnected ? 'Connected' : 'Disconnected'}
💬 Auto-delete: ${session && session.messageIds ? `Active (${session.messageIds.length} messages)` : 'Inactive'}

💡 Try sending an image to test image handling.
      `.trim();

      await Helpers.sendMessageWithCleanup(ctx, testMessage);
    });
  }
}

module.exports = CommandHandler;