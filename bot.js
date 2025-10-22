const { Telegraf } = require("telegraf");
const { BOT_TOKEN } = require("./config/constants");

// Import services
const DatabaseService = require("./services/DatabaseService");
const FileService = require("./services/FileService");
const PDFService = require("./services/PDFService");
const ImageService = require("./services/ImageService");
const SessionService = require("./services/SessionService");
const Localization = require("./utils/Localization");

// Import handlers
const CommandHandler = require("./handlers/CommandHandler");
const ActionHandler = require("./handlers/ActionHandler");
const MessageHandler = require("./handlers/MessageHandler");

class PDFBot {
  constructor() {
    this.bot = new Telegraf(BOT_TOKEN);
    this.databaseService = new DatabaseService();
    this.fileService = new FileService();
    this.pdfService = new PDFService(this.fileService);
    this.imageService = new ImageService(this.fileService);
    this.sessionService = new SessionService();
    this.localization = new Localization(this.sessionService);

    this.commandHandler = null;
    this.actionHandler = null;
    this.messageHandler = null;
  }

  async initialize() {
    try {
      // Initialize services
      await this.databaseService.connect();
      await this.fileService.ensureDownloadDir();

      // Initialize handlers
      this.commandHandler = new CommandHandler(
        this.bot, 
        this.sessionService, 
        this.localization, 
        this.databaseService
      );

      this.actionHandler = new ActionHandler(
        this.bot,
        this.sessionService,
        this.localization,
        this.databaseService,
        this.pdfService,
        this.fileService,
        this.imageService
      );

      this.messageHandler = new MessageHandler(
        this.bot,
        this.sessionService,
        this.localization,
        this.databaseService,
        this.fileService,
        this.pdfService
      );

      // Register middleware
      this.registerMiddleware();

      console.log('🤖 PDF Bot initialized successfully!');
    } catch (error) {
      console.error('❌ Failed to initialize bot:', error);
      throw error;
    }
  }

  registerMiddleware() {
    this.bot.use(async (ctx, next) => {
      const userId = ctx.from?.id;
      const updateType = ctx.updateType;

      console.log(`\n📨 [${updateType}] from user: ${userId}`);

      if (userId) {
        this.sessionService.initUserSession(userId);

        await this.databaseService.saveOrUpdateUser(userId, {
          username: ctx.from.username,
          firstName: ctx.from.first_name,
          lastName: ctx.from.last_name
        });
      }

      await next();
    });

    // Error handling
    this.bot.catch((err, ctx) => {
      console.error(`❌ Bot error for ${ctx.updateType}:`, err);
      ctx.reply("❌ An error occurred. Please try again.");
    });
  }

  async start() {
    try {
      await this.initialize();
      await this.bot.launch();
      console.log('🚀 PDF Bot is running successfully!');

      // Graceful shutdown
      process.once('SIGINT', () => this.shutdown('SIGINT'));
      process.once('SIGTERM', () => this.shutdown('SIGTERM'));
    } catch (error) {
      console.error('❌ Failed to start bot:', error);
      process.exit(1);
    }
  }

  async shutdown(signal) {
    console.log(`\n🛑 Received ${signal}, shutting down gracefully...`);
    await this.bot.stop(signal);
    process.exit(0);
  }
}

// Start the bot
const bot = new PDFBot();
bot.start().catch(console.error);

``