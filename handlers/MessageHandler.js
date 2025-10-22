const SessionService = require('../services/SessionService');
const DatabaseService = require('../services/DatabaseService');
const FileService = require('../services/FileService');
const PDFService = require('../services/PDFService');
const Localization = require('../utils/Localization');
const Helpers = require('../utils/Helpers');
const constants = require('../config/constants');

class MessageHandler {
  constructor(bot) {
    this.bot = bot;
    this.registerMessageHandlers();
  }

  registerMessageHandlers() {
    // Handle photos
    this.bot.on('photo', async (ctx) => {
      await this.handleImage(ctx, 'photo');
    });

    // Handle document images
    this.bot.on('document', async (ctx) => {
      await this.handleImage(ctx, 'document');
    });

    // Handle text messages
    this.bot.on('text', async (ctx) => {
      await this.handleText(ctx);
    });
  }

  async handleImage(ctx, type) {
    const userId = ctx.from.id;
    console.log(`🖼️ ${type.toUpperCase()} received from user: ${userId}`);

    try {
      const session = SessionService.initUserSession(userId);
      console.log(`📊 Session before adding image:`, session.images.length);

      if (session.images.length >= constants.MAX_IMAGES) {
        return await Helpers.sendMessageWithCleanup(ctx, Localization.getMessage(session.language, 'maxImages'));
      }

      let fileId, mimeType, fileName;

      if (type === 'photo') {
        const photo = ctx.message.photo[ctx.message.photo.length - 1];
        fileId = photo.file_id;
        mimeType = 'image/jpeg';
        fileName = `img_${userId}_${Date.now()}.jpg`;
      } else {
        const document = ctx.message.document;
        
        if (!document.mime_type?.startsWith('image/')) {
          console.log(`❌ Invalid file type: ${document.mime_type}`);
          return await Helpers.sendMessageWithCleanup(ctx, Localization.getMessage(session.language, 'invalidFile'));
        }

        fileId = document.file_id;
        mimeType = document.mime_type;
        
        if (document.file_name) {
          fileName = `img_${userId}_${Date.now()}_${document.file_name}`;
        } else {
          const mimeExtensions = {
            'image/jpeg': '.jpg',
            'image/jpg': '.jpg',
            'image/png': '.png',
            'image/gif': '.gif',
            'image/webp': '.webp'
          };
          const extension = mimeExtensions[document.mime_type] || '.jpg';
          fileName = `img_${userId}_${Date.now()}${extension}`;
        }
      }

      console.log(`📸 ${type} received, fileId: ${fileId}`);

      await FileService.ensureDownloadDir();
      const fileUrl = await ctx.telegram.getFileLink(fileId);
      const filePath = require('path').join(FileService.downloadDir, fileName);

      console.log(`📥 Downloading ${type} to: ${filePath}`);
      await FileService.downloadImage(fileUrl, filePath);

      session.images.push(filePath);
      SessionService.updateSessionState(userId, 'collecting');

      console.log(`✅ ${type} added to session. Total images: ${session.images.length}`);

      await Helpers.sendMessageWithCleanup(ctx, Localization.getMessage(session.language, 'imageReceived', { count: session.images.length }));

    } catch (error) {
      console.error(`❌ Error handling ${type}:`, error);
      await Helpers.sendMessageWithCleanup(ctx, "❌ Failed to process image. Please try again.");
    }
  }

  async handleText(ctx) {
    if (ctx.message.text.startsWith('/')) {
      console.log(`❌ Command not handled: ${ctx.message.text}`);
      return;
    }

    const userId = ctx.from.id;
    const session = SessionService.getSession(userId);

    if (!session) {
      await Helpers.sendMessageWithCleanup(ctx, Localization.getMessage('en', 'noSession'));
      return;
    }

    console.log(`📝 Text message in state: ${session.state}`);

    if (session.state === 'awaiting_reorder') {
      const orderInput = ctx.message.text.trim();
      const newOrder = orderInput.split(',').map(num => parseInt(num.trim()) - 1);

      if (newOrder.length !== session.images.length || newOrder.some(isNaN)) {
        await Helpers.sendMessageWithCleanup(ctx, "❌ Invalid order. Please send numbers like: 1,3,2");
        return;
      }

      const reorderedImages = newOrder.map(index => session.images[index]);
      session.images = reorderedImages;
      SessionService.updateSessionState(userId, 'awaiting_preview');

      await Helpers.sendMessageWithCleanup(ctx, Localization.getMessage(session.language, 'reorderSuccess'));
      
      const ActionHandler = require('./ActionHandler');
      const actionHandler = new ActionHandler(this.bot);
      await actionHandler.showPreview(ctx);

    } else if (session.state === 'awaiting_watermark_text') {
      const watermarkText = ctx.message.text.trim();

      if (!watermarkText) {
        await Helpers.sendMessageWithCleanup(ctx, "❌ Please provide valid watermark text.");
        return;
      }

      session.settings.watermark = {
        enabled: true,
        text: watermarkText,
        position: 'center'
      };
      SessionService.updateSessionState(userId, 'awaiting_watermark_position');

      await Helpers.sendMessageWithCleanup(ctx,
        Localization.getMessage(session.language, 'watermarkPositionPrompt'),
        require('telegraf').Markup.inlineKeyboard([
          [
            require('telegraf').Markup.button.callback(Localization.getMessage(session.language, 'positionTopLeft'), 'watermark_position_topleft'),
            require('telegraf').Markup.button.callback(Localization.getMessage(session.language, 'positionTop'), 'watermark_position_top'),
            require('telegraf').Markup.button.callback(Localization.getMessage(session.language, 'positionTopRight'), 'watermark_position_topright')
          ],
          [
            require('telegraf').Markup.button.callback(Localization.getMessage(session.language, 'positionLeft'), 'watermark_position_left'),
            require('telegraf').Markup.button.callback(Localization.getMessage(session.language, 'positionCenter'), 'watermark_position_center'),
            require('telegraf').Markup.button.callback(Localization.getMessage(session.language, 'positionRight'), 'watermark_position_right')
          ],
          [
            require('telegraf').Markup.button.callback(Localization.getMessage(session.language, 'positionBottomLeft'), 'watermark_position_bottomleft'),
            require('telegraf').Markup.button.callback(Localization.getMessage(session.language, 'positionBottom'), 'watermark_position_bottom'),
            require('telegraf').Markup.button.callback(Localization.getMessage(session.language, 'positionBottomRight'), 'watermark_position_bottomright')
          ]
        ])
      );

    } else if (session.state === 'awaiting_rename') {
      const newFileName = ctx.message.text.trim();

      if (!newFileName) {
        await Helpers.sendMessageWithCleanup(ctx, "❌ Please provide a valid file name.");
        return;
      }

      try {
        const newPdfPath = require('path').join(FileService.downloadDir, `${newFileName}.pdf`);

        await PDFService.createPDF(session.images, newPdfPath, session.settings);

        const sentMessage = await ctx.replyWithDocument({
          source: newPdfPath,
          filename: `${newFileName}.pdf`
        });

        await SessionService.addMessageToSession(userId, sentMessage.message_id);

        await Helpers.sendMessageWithCleanup(ctx, Localization.getMessage(session.language, 'renameSuccess'));

        await DatabaseService.incrementUserPDFs(userId, `${newFileName}.pdf`);

        setTimeout(async () => {
          try {
            if (session.originalPdfPath) await require('fs').promises.unlink(session.originalPdfPath);
            await require('fs').promises.unlink(newPdfPath);
            console.log(`🧹 Cleaned up PDF files for user ${userId}`);
          } catch (error) {
            console.error('Error cleaning up PDF files:', error);
          }
        }, 5000);

        await FileService.cleanupUserImagesOnly(userId, SessionService);

      } catch (error) {
        console.error('Error creating renamed PDF:', error);
        await Helpers.sendMessageWithCleanup(ctx, "❌ Failed to create renamed PDF. The original file has been sent.");
        await FileService.cleanupUserImagesOnly(userId, SessionService);
      }
    } else {
      await Helpers.sendMessageWithCleanup(ctx, "📸 Send me images, then use /done when ready to create PDF!");
    }
  }
}

module.exports = MessageHandler;