class ProgressAnimation {
  constructor(ctx, totalSteps, message) {
    this.ctx = ctx;
    this.totalSteps = totalSteps;
    this.currentStep = 0;
    this.message = message;
    this.animationMessageId = null;
    this.animationInterval = null;
    this.isActive = false;
  }

  async start() {
    try {
      const progressMsg = await this.ctx.reply(this.getMessage());
      this.animationMessageId = progressMsg.message_id;
      this.isActive = true;

      this.animationInterval = setInterval(async () => {
        if (!this.isActive) {
          clearInterval(this.animationInterval);
          return;
        }

        try {
          await this.ctx.telegram.editMessageText(
            this.ctx.chat.id, 
            this.animationMessageId, 
            null, 
            this.getMessage()
          );
        } catch (error) {
          // Silently ignore edit errors
        }
      }, 2000);
    } catch (error) {
      console.error('Error starting progress animation:', error);
    }
  }

  update(step, customMessage = null) {
    this.currentStep = step;
    if (customMessage) this.message = customMessage;
  }

  getMessage() {
    const percentage = Math.min(100, Math.round((this.currentStep / this.totalSteps) * 100));
    const progressBar = this.createProgressBar(percentage);
    return `${this.message}\n\n${progressBar} ${percentage}%`;
  }

  createProgressBar(percentage) {
    const totalBars = 10;
    const filledBars = Math.round((percentage / 100) * totalBars);
    return '█'.repeat(filledBars) + '░'.repeat(totalBars - filledBars);
  }

  async stop() {
    this.isActive = false;

    if (this.animationInterval) {
      clearInterval(this.animationInterval);
      this.animationInterval = null;
    }

    if (this.animationMessageId) {
      try {
        await this.ctx.telegram.deleteMessage(this.ctx.chat.id, this.animationMessageId);
      } catch (error) {
        // Silently ignore deletion errors
      }
      this.animationMessageId = null;
    }
  }
}

module.exports = ProgressAnimation;