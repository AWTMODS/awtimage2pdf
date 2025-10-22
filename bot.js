const { Telegraf } = require("telegraf");
const constants = require('./config/constants');
const DatabaseService = require('./services/DatabaseService');
const FileService = require('./services/FileService');
const SessionService = require('./services/SessionService');
const CommandHandler = require('./handlers/CommandHandler');
const ActionHandler = require('./handlers/ActionHandler');
const MessageHandler = require('./handlers/MessageHandler');
const Helpers = require('./utils/Helpers');

class PDFBot {
  constructor() {
    this.bot = new Telegraf(constants.BOT_TOKEN);
    this.setupMiddleware();
    this.setupHandlers();
    Helpers.setBotInstance(this.bot);
    SessionService.setBotInstance(this.bot);
  }

  setupMiddleware() {
    this.bot.use(async (ctx, next) => {
      const userId = ctx.from?.id;
      const updateType = ctx.updateType;

      console.log(`\n📨 [${updateType}] from user: ${userId}`);

      if (userId) {
        SessionService.initUserSession(userId);

        await DatabaseService.saveOrUpdateUser(userId, {
          username: ctx.from.username,
          firstName: ctx.from.first_name,
          lastName: ctx.from.last_name
        });
      }

      await next();
    });
  }

  setupHandlers() {
    // Setup command handlers
    new CommandHandler(this.bot);

    // Setup action handlers
    new ActionHandler(this.bot);

    // Setup message handlers
    new MessageHandler(this.bot);

    // Error handling
    this.bot.catch((err, ctx) => {
      console.error(`❌ Bot error for ${ctx.updateType}:`, err);
      ctx.reply("❌ An error occurred. Please try again.");
    });
  }

  async start() {
    try {
      await FileService.ensureDownloadDir();
      await DatabaseService.connect();
      console.log('📁 Download directory ready');
      
      await this.bot.launch();
      console.log('🤖 PDF Bot is running successfully!');

      // Graceful shutdown
      process.once('SIGINT', () => this.shutdown('SIGINT'));
      process.once('SIGTERM', () => this.shutdown('SIGTERM'));

    } catch (error) {
      console.error('❌ Failed to start bot:', error);
      process.exit(1);
    }
  }

  shutdown(signal) {
    console.log(`\n${signal} received. Shutting down gracefully...`);
    this.bot.stop(signal);
  }
}

// Start the bot
console.log('🚀 Starting PDF Bot...');
const bot = new PDFBot();
bot.start();