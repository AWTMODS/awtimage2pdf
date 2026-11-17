const { Telegraf } = require("telegraf");
const http = require("http");
const url = require("url");
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
    this.server = null;
    this.isInitialized = false;
  }

  setupMiddleware() {
    this.bot.use(async (ctx, next) => {
      const userId = ctx.from?.id;
      const updateType = ctx.updateType;

      console.log(`\n📨 [${updateType}] from user: ${userId}`);

      if (userId) {
        await SessionService.initUserSessionAsync(userId);

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
    this.commandHandler = new CommandHandler(this.bot);

    // Setup action handlers
    this.actionHandler = new ActionHandler(this.bot);

    // Setup message handlers
    this.messageHandler = new MessageHandler(this.bot, this.actionHandler);

    // Error handling
    this.bot.catch((err, ctx) => {
      console.error(`❌ Bot error for ${ctx.updateType}:`, err);
      try {
        ctx.reply("❌ An error occurred. Please try again.");
      } catch (e) {}
    });
  }

  async init() {
    if (this.isInitialized) return;
    await FileService.ensureDownloadDir();
    await DatabaseService.connect();
    console.log('📁 Download directory ready');
    this.isInitialized = true;
  }

  async start() {
    try {
      await this.init();

      let webhookUrl = constants.WEBHOOK_URL;
      const port = constants.PORT;

      if (webhookUrl) {
        // Normalize webhook URL: if it doesn't have a path, append WEBHOOK_PATH
        const parsedUrl = new URL(webhookUrl);
        let webhookPath = parsedUrl.pathname;
        if (!webhookPath || webhookPath === '/') {
          webhookPath = constants.WEBHOOK_PATH;
          parsedUrl.pathname = webhookPath;
          webhookUrl = parsedUrl.toString();
        }

        console.log(`🌐 Starting bot in WEBHOOK mode (no VPS required)...`);
        console.log(`🔗 Setting Telegram Webhook to: ${webhookUrl}`);

        const webhookOptions = {};
        if (constants.SECRET_TOKEN) {
          webhookOptions.secret_token = constants.SECRET_TOKEN;
        }

        await this.bot.telegram.setWebhook(webhookUrl, webhookOptions);
        console.log('✅ Telegram webhook set successfully');

        const webhookCallback = this.bot.webhookCallback(webhookPath, {
          secretToken: constants.SECRET_TOKEN || undefined
        });

        // Start HTTP server for Webhook and Health check
        this.server = http.createServer((req, res) => {
          const reqParsed = url.parse(req.url, true);

          // Health check endpoints (for Render, Koyeb, UptimeRobot, etc.)
          if (req.method === 'GET' && (reqParsed.pathname === '/' || reqParsed.pathname === '/health')) {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
              status: 'online',
              bot: 'AWT Image to PDF Bot',
              mode: 'webhook',
              webhookUrl: webhookUrl,
              timestamp: new Date().toISOString()
            }));
            return;
          }

          // Handle webhook requests
          webhookCallback(req, res);
        });

        this.server.listen(port, () => {
          console.log(`🚀 Webhook server listening on port ${port}`);
          console.log(`📡 Webhook endpoint path: ${webhookPath}`);
          console.log('🤖 PDF Bot is running successfully without VPS!');
        });

      } else {
        console.log('🔄 No WEBHOOK_URL configured. Launching in POLLING mode...');
        // Drop any previous webhook so polling doesn't conflict
        try {
          await this.bot.telegram.deleteWebhook({ drop_pending_updates: false });
        } catch (e) {}
        await this.bot.launch();
        console.log('🤖 PDF Bot is running successfully in polling mode!');
      }

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
    if (this.server) {
      this.server.close(() => {
        console.log('HTTP server closed.');
      });
    }
    this.bot.stop(signal);
  }
}

// Singleton helper for serverless / imports
let botInstance = null;
function getBotInstance() {
  if (!botInstance) {
    botInstance = new PDFBot();
  }
  return botInstance;
}

// If executed directly from CLI (node bot.js), start it
if (require.main === module) {
  console.log('🚀 Starting PDF Bot...');
  const bot = getBotInstance();
  bot.start();
}

module.exports = { PDFBot, getBotInstance };
