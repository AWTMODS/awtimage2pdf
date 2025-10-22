const { Markup } = require("telegraf");
const SessionService = require('../services/SessionService');
const DatabaseService = require('../services/DatabaseService');
const PDFService = require('../services/PDFService');
const ImageService = require('../services/ImageService');
const Localization = require('../utils/Localization');
const Helpers = require('../utils/Helpers');
const ProgressAnimation = require('../utils/ProgressAnimation');
const FileService = require('../services/FileService');
const constants = require('../config/constants');

class ActionHandler {
  constructor(bot) {
    this.bot = bot;
    this.registerActions();
  }

  registerActions() {
    // Language actions
    const languageHandlers = {
      'lang_en': 'en', 'lang_ar': 'ar', 'lang_ru': 'ru', 'lang_es': 'es', 'lang_hi': 'hi'
    };

    Object.keys(languageHandlers).forEach(langCode => {
      this.bot.action(langCode, async (ctx) => {
        const userId = ctx.from.id;
        const session = SessionService.initUserSession(userId);
        const newLanguage = languageHandlers[langCode];
        
        SessionService.updateSessionLanguage(userId, newLanguage);
        await ctx.answerCbQuery();
        await Helpers.sendMessageWithCleanup(ctx, Localization.getMessage(newLanguage, 'languageChanged'));
      });
    });

    // Compression actions
    this.bot.action('compression_low', async (ctx) => this.handleCompressionSelection(ctx, 'low'));
    this.bot.action('compression_medium', async (ctx) => this.handleCompressionSelection(ctx, 'medium'));
    this.bot.action('compression_high', async (ctx) => this.handleCompressionSelection(ctx, 'high'));

    // Admin actions
    this.bot.action('admin_total_users', async (ctx) => this.handleAdminTotalUsers(ctx));
    this.bot.action('admin_broadcast', async (ctx) => this.handleAdminBroadcast(ctx));
    this.bot.action('admin_stats', async (ctx) => this.handleAdminStats(ctx));

    // Image editing actions
    this.bot.action('reorder_images', async (ctx) => this.handleReorderImages(ctx));
    this.bot.action('edit_images', async (ctx) => this.handleEditImages(ctx));
    this.bot.action('rotate_images', async (ctx) => this.handleRotateImages(ctx));
    this.bot.action('enhance_images', async (ctx) => this.handleEnhanceImages(ctx));
    this.bot.action('skip_editing', async (ctx) => this.handleSkipEditing(ctx));

    // Rotation actions
    this.bot.action(/rotate_(90|180|270)/, async (ctx) => this.handleRotation(ctx));

    // PDF creation actions
    this.bot.action('create_pdf_now', async (ctx) => this.handleCreatePDF(ctx));

    // Watermark actions
    this.bot.action('watermark_yes', async (ctx) => this.handleWatermarkYes(ctx));
    this.bot.action('watermark_no', async (ctx) => this.handleWatermarkNo(ctx));

    // Cloud storage actions
    this.bot.action('cloud_yes', async (ctx) => this.handleCloudYes(ctx));
    this.bot.action('cloud_no', async (ctx) => this.handleCloudNo(ctx));

    // Rename actions
    this.bot.action('rename_pdf', async (ctx) => this.handleRenamePDF(ctx));
    this.bot.action('keep_name', async (ctx) => this.handleKeepName(ctx));

    // Watermark position actions
    const watermarkPositionHandlers = {
      'watermark_position_center': 'center',
      'watermark_position_top': 'top',
      'watermark_position_bottom': 'bottom',
      'watermark_position_left': 'left',
      'watermark_position_right': 'right',
      'watermark_position_topleft': 'topleft',
      'watermark_position_topright': 'topright',
      'watermark_position_bottomleft': 'bottomleft',
      'watermark_position_bottomright': 'bottomright'
    };

    Object.keys(watermarkPositionHandlers).forEach(positionCode => {
      this.bot.action(positionCode, async (ctx) => this.handleWatermarkPosition(ctx, watermarkPositionHandlers[positionCode]));
    });
  }

  async handleCompressionSelection(ctx, compression) {
    const userId = ctx.from.id;
    const session = SessionService.getSession(userId);
    if (!session) {
      await ctx.answerCbQuery(Localization.getMessage('en', 'noSession'));
      return;
    }
    session.settings.compression = compression;
    SessionService.updateSessionState(userId, 'awaiting_preview');
    await ctx.answerCbQuery();
    await this.showPreview(ctx);
  }

  async handleAdminTotalUsers(ctx) {
    const userId = ctx.from.id;
    const session = SessionService.getSession(userId);

    if (!constants.ADMIN_IDS.includes(userId)) {
      await ctx.answerCbQuery(Localization.getMessage(session?.language || 'en', 'adminOnly'));
      return;
    }

    const totalUsers = await DatabaseService.getTotalUsers();
    await ctx.answerCbQuery();
    await Helpers.sendMessageWithCleanup(ctx, `👥 Total Users: ${totalUsers}`);
  }

  async handleAdminBroadcast(ctx) {
    const userId = ctx.from.id;
    const session = SessionService.getSession(userId);

    if (!constants.ADMIN_IDS.includes(userId)) {
      await ctx.answerCbQuery(Localization.getMessage(session?.language || 'en', 'adminOnly'));
      return;
    }

    SessionService.broadcastSessions[userId] = { state: 'awaiting_broadcast' };
    await ctx.answerCbQuery();
    await Helpers.sendMessageWithCleanup(ctx, Localization.getMessage(session.language, 'broadcastPrompt'));
  }

  async handleAdminStats(ctx) {
    const userId = ctx.from.id;
    const session = SessionService.getSession(userId);

    if (!constants.ADMIN_IDS.includes(userId)) {
      await ctx.answerCbQuery(Localization.getMessage(session?.language || 'en', 'adminOnly'));
      return;
    }

    const userStats = await DatabaseService.getUserStats(userId);
    if (userStats) {
      const lastFiles = userStats.lastFiles && userStats.lastFiles.length > 0 
        ? userStats.lastFiles.join(', ') 
        : 'No files yet';

      await ctx.answerCbQuery();
      await Helpers.sendMessageWithCleanup(ctx,
        Localization.getMessage(session.language, 'userStats', {
          totalPdfs: userStats.pdfsGenerated || 0,
          lastFiles: lastFiles
        })
      );
    } else {
      await ctx.answerCbQuery();
      await Helpers.sendMessageWithCleanup(ctx, "No statistics available.");
    }
  }

  async showPreview(ctx) {
    const userId = ctx.from.id;
    const session = SessionService.getSession(userId);
    const previewInfo = await ImageService.generatePreviewInfo(session.images);

    const previewMessage = `
${Localization.getMessage(session.language, 'previewTitle')}
${Localization.getMessage(session.language, 'previewPages', { count: previewInfo.pageCount })}
${Localization.getMessage(session.language, 'previewSize', { size: previewInfo.estimatedSize })}
${Localization.getMessage(session.language, 'securityScan')}`.trim();

    await Helpers.sendMessageWithCleanup(ctx,
      previewMessage,
      Markup.inlineKeyboard([
        [Markup.button.callback(Localization.getMessage(session.language, 'previewReorder'), 'reorder_images')],
        [Markup.button.callback(Localization.getMessage(session.language, 'imageEditPrompt'), 'edit_images')],
        [Markup.button.callback(Localization.getMessage(session.language, 'previewCreate'), 'create_pdf_now')]
      ])
    );
  }

  async handleReorderImages(ctx) {
    const userId = ctx.from.id;
    const session = SessionService.getSession(userId);
    if (!session) {
      await ctx.answerCbQuery(Localization.getMessage('en', 'noSession'));
      return;
    }
    SessionService.updateSessionState(userId, 'awaiting_reorder');
    let imageList = "📋 Current image order:\n";
    session.images.forEach((img, index) => {
      imageList += `${index + 1}. Image ${index + 1}\n`;
    });
    await ctx.answerCbQuery();
    await Helpers.sendMessageWithCleanup(ctx, imageList + `\n${Localization.getMessage(session.language, 'reorderInstructions')}`);
  }

  async handleEditImages(ctx) {
    const userId = ctx.from.id;
    const session = SessionService.getSession(userId);
    if (!session) {
      await ctx.answerCbQuery(Localization.getMessage('en', 'noSession'));
      return;
    }
    await ctx.answerCbQuery();
    await Helpers.sendMessageWithCleanup(ctx,
      Localization.getMessage(session.language, 'imageEditPrompt'),
      Markup.inlineKeyboard([
        [Markup.button.callback(Localization.getMessage(session.language, 'editRotate'), 'rotate_images')],
        [Markup.button.callback(Localization.getMessage(session.language, 'editEnhance'), 'enhance_images')],
        [Markup.button.callback(Localization.getMessage(session.language, 'editSkip'), 'skip_editing')]
      ])
    );
  }

  async handleRotateImages(ctx) {
    const userId = ctx.from.id;
    const session = SessionService.getSession(userId);
    await ctx.answerCbQuery();
    await Helpers.sendMessageWithCleanup(ctx,
      Localization.getMessage(session.language, 'rotatePrompt'),
      Markup.inlineKeyboard([
        [Markup.button.callback(Localization.getMessage(session.language, 'rotate90'), 'rotate_90')],
        [Markup.button.callback(Localization.getMessage(session.language, 'rotate180'), 'rotate_180')],
        [Markup.button.callback(Localization.getMessage(session.language, 'rotate270'), 'rotate_270')]
      ])
    );
  }

  async handleRotation(ctx) {
    const userId = ctx.from.id;
    const session = SessionService.getSession(userId);
    const degrees = parseInt(ctx.match[1]);
    if (!session) {
      await ctx.answerCbQuery(Localization.getMessage('en', 'noSession'));
      return;
    }
    await ctx.answerCbQuery();
    await Helpers.sendMessageWithCleanup(ctx, `🔄 Rotating images by ${degrees} degrees...`);
    const rotatedImages = [];
    for (const imagePath of session.images) {
      const rotatedPath = await ImageService.rotateImage(imagePath, degrees);
      rotatedImages.push(rotatedPath);
    }
    session.images = rotatedImages;
    session.settings.imageEdit.rotated = true;
    await Helpers.sendMessageWithCleanup(ctx, `✅ All images rotated by ${degrees} degrees!`);
    await this.showPreview(ctx);
  }

  async handleEnhanceImages(ctx) {
    const userId = ctx.from.id;
    const session = SessionService.getSession(userId);
    if (!session) {
      await ctx.answerCbQuery(Localization.getMessage('en', 'noSession'));
      return;
    }
    await ctx.answerCbQuery();
    await Helpers.sendMessageWithCleanup(ctx, "✨ Enhancing images...");
    const enhancedImages = [];
    for (const imagePath of session.images) {
      const enhancedPath = await ImageService.enhanceImage(imagePath);
      enhancedImages.push(enhancedPath);
    }
    session.images = enhancedImages;
    session.settings.imageEdit.enhanced = true;
    await Helpers.sendMessageWithCleanup(ctx, Localization.getMessage(session.language, 'enhanceApplied'));
    await this.showPreview(ctx);
  }

  async handleSkipEditing(ctx) {
    await ctx.answerCbQuery();
    const userId = ctx.from.id;
    const session = SessionService.getSession(userId);
    await this.showPreview(ctx);
  }

  async handleCreatePDF(ctx) {
    const userId = ctx.from.id;
    const session = SessionService.getSession(userId);
    if (!session) {
      await ctx.answerCbQuery(Localization.getMessage('en', 'noSession'));
      return;
    }
    SessionService.updateSessionState(userId, 'awaiting_watermark');
    await ctx.answerCbQuery();
    await Helpers.sendMessageWithCleanup(ctx,
      Localization.getMessage(session.language, 'watermarkPrompt'),
      Markup.inlineKeyboard([
        [Markup.button.callback(Localization.getMessage(session.language, 'watermarkYes'), 'watermark_yes')],
        [Markup.button.callback(Localization.getMessage(session.language, 'watermarkNo'), 'watermark_no')]
      ])
    );
  }

  async handleWatermarkYes(ctx) {
    const userId = ctx.from.id;
    const session = SessionService.getSession(userId);
    if (!session) {
      await ctx.answerCbQuery(Localization.getMessage('en', 'noSession'));
      return;
    }
    SessionService.updateSessionState(userId, 'awaiting_watermark_text');
    await ctx.answerCbQuery();
    await Helpers.sendMessageWithCleanup(ctx, Localization.getMessage(session.language, 'watermarkAsk'));
  }

  async handleWatermarkNo(ctx) {
    const userId = ctx.from.id;
    const session = SessionService.getSession(userId);
    if (!session) {
      await ctx.answerCbQuery(Localization.getMessage('en', 'noSession'));
      return;
    }
    session.settings.watermark.enabled = false;
    SessionService.updateSessionState(userId, 'awaiting_cloud_save');
    await ctx.answerCbQuery();
    await this.askCloudStorage(ctx);
  }

  async askCloudStorage(ctx) {
    const userId = ctx.from.id;
    const session = SessionService.getSession(userId);
    await Helpers.sendMessageWithCleanup(ctx,
      Localization.getMessage(session.language, 'cloudSavePrompt'),
      Markup.inlineKeyboard([
        [Markup.button.callback(Localization.getMessage(session.language, 'cloudYes'), 'cloud_yes')],
        [Markup.button.callback(Localization.getMessage(session.language, 'cloudNo'), 'cloud_no')]
      ])
    );
  }

  async handleCloudYes(ctx) {
    const userId = ctx.from.id;
    const session = SessionService.getSession(userId);
    if (!session) {
      await ctx.answerCbQuery(Localization.getMessage('en', 'noSession'));
      return;
    }
    session.settings.cloudSave = true;
    await ctx.answerCbQuery();
    await this.finalizePDFCreation(ctx);
  }

  async handleCloudNo(ctx) {
    const userId = ctx.from.id;
    const session = SessionService.getSession(userId);
    if (!session) {
      await ctx.answerCbQuery(Localization.getMessage('en', 'noSession'));
      return;
    }
    session.settings.cloudSave = false;
    await ctx.answerCbQuery();
    await this.finalizePDFCreation(ctx);
  }

  async handleWatermarkPosition(ctx, position) {
    const userId = ctx.from.id;
    const session = SessionService.getSession(userId);

    if (!session) {
      await ctx.answerCbQuery(Localization.getMessage('en', 'noSession'));
      return;
    }

    session.settings.watermark.position = position;
    SessionService.updateSessionState(userId, 'awaiting_cloud_save');

    await ctx.answerCbQuery();

    const positionNames = {
      'center': 'Center',
      'top': 'Top',
      'bottom': 'Bottom',
      'left': 'Left',
      'right': 'Right',
      'topleft': 'Top Left',
      'topright': 'Top Right',
      'bottomleft': 'Bottom Left',
      'bottomright': 'Bottom Right'
    };

    await Helpers.sendMessageWithCleanup(ctx, 
      Localization.getMessage(session.language, 'positionSuccess', { position: positionNames[position] }) + 
      `\n💧 Watermark: "${session.settings.watermark.text}"`
    );

    await this.askCloudStorage(ctx);
  }

  async finalizePDFCreation(ctx) {
    const userId = ctx.from.id;
    const session = SessionService.getSession(userId);
    let progress = null;

    try {
      progress = new ProgressAnimation(
        ctx, 
        session.images.length + 2,
        Localization.getMessage(session.language, 'processing')
      );
      await progress.start();

      const pdfFileName = `document_${userId}_${FileService.generateUniqueId()}.pdf`;
      const pdfPath = require('path').join(FileService.downloadDir, pdfFileName);

      await PDFService.createPDF(session.images, pdfPath, session.settings, (currentStep) => {
        if (progress && progress.isActive) {
          progress.update(currentStep, Localization.getMessage(session.language, 'processing'));
        }
      });

      if (progress && progress.isActive) {
        progress.update(session.images.length + 1, "🛡️ Performing security scan...");
      }

      const scanResult = PDFService.performSecurityScan(pdfPath);
      if (!scanResult.safe) throw new Error("Security scan failed");

      if (progress) {
        await progress.stop();
      }

      const sentMessage = await ctx.replyWithDocument({
        source: pdfPath,
        filename: `document.pdf`
      });

      await SessionService.addMessageToSession(userId, sentMessage.message_id);

      let statusMessage = Localization.getMessage(session.language, 'securityScan');
      if (session.settings.watermark.enabled) {
        statusMessage += `\n💧 Watermark: "${session.settings.watermark.text}"`;
      }

      await Helpers.sendMessageWithCleanup(ctx, statusMessage);

      await DatabaseService.incrementUserPDFs(userId, `document.pdf`);

      if (session.settings.cloudSave) {
        const cloudSuccess = await PDFService.saveToCloudStorage(ctx, pdfPath, `document_${userId}.pdf`);
        if (cloudSuccess) await Helpers.sendMessageWithCleanup(ctx, Localization.getMessage(session.language, 'cloudSuccess'));
      }

      session.originalPdfPath = pdfPath;
      session.originalPdfMessageId = sentMessage.message_id;
      SessionService.updateSessionState(userId, 'awaiting_rename_decision');

      await Helpers.sendMessageWithCleanup(ctx,
        Localization.getMessage(session.language, 'renamePrompt'),
        Markup.inlineKeyboard([
          [Markup.button.callback(Localization.getMessage(session.language, 'renameButton'), 'rename_pdf')],
          [Markup.button.callback(Localization.getMessage(session.language, 'keepButton'), 'keep_name')]
        ])
      );

    } catch (error) {
      console.error('Error creating PDF:', error);

      if (progress) {
        await progress.stop();
      }

      await Helpers.sendMessageWithCleanup(ctx, "❌ Failed to create PDF. Please try again with /start");
      await FileService.cleanupUserFiles(userId, SessionService);
    }
  }

  async handleRenamePDF(ctx) {
    const userId = ctx.from.id;
    const session = SessionService.getSession(userId);
    if (!session) {
      await ctx.answerCbQuery(Localization.getMessage('en', 'noSession'));
      return;
    }
    SessionService.updateSessionState(userId, 'awaiting_rename');
    await ctx.answerCbQuery();
    await Helpers.sendMessageWithCleanup(ctx, Localization.getMessage(session.language, 'renameAsk'));
  }

  async handleKeepName(ctx) {
    const userId = ctx.from.id;
    const session = SessionService.getSession(userId);
    if (!session) {
      await ctx.answerCbQuery(Localization.getMessage('en', 'noSession'));
      return;
    }

    await ctx.answerCbQuery();
    await Helpers.sendMessageWithCleanup(ctx, Localization.getMessage(session.language, 'keepSuccess'));
    await FileService.cleanupUserImagesOnly(userId, SessionService);
  }
}

module.exports = ActionHandler;