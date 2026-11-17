const { Telegraf } = require("telegraf");
const constants = require("../config/constants");

const bot = new Telegraf(constants.BOT_TOKEN);

async function main() {
  const args = process.argv.slice(2);
  const actionOrUrl = args[0];

  if (!actionOrUrl || actionOrUrl === 'set') {
    const targetUrl = args[1] || constants.WEBHOOK_URL;
    if (!targetUrl) {
      console.error('❌ Error: No webhook URL provided.');
      console.log('Usage: node scripts/setWebhook.js <WEBHOOK_URL>');
      console.log('   or: WEBHOOK_URL=https://... node scripts/setWebhook.js');
      process.exit(1);
    }

    try {
      console.log(`📡 Setting webhook to: ${targetUrl}...`);
      const options = {};
      if (constants.SECRET_TOKEN) {
        options.secret_token = constants.SECRET_TOKEN;
      }
      await bot.telegram.setWebhook(targetUrl, options);
      console.log('✅ Webhook set successfully!');
      const info = await bot.telegram.getWebhookInfo();
      console.log('📋 Webhook Info:', JSON.stringify(info, null, 2));
    } catch (err) {
      console.error('❌ Failed to set webhook:', err.message);
      process.exit(1);
    }
  } else if (actionOrUrl === 'delete' || actionOrUrl === 'remove') {
    try {
      console.log('🗑️ Deleting webhook...');
      await bot.telegram.deleteWebhook({ drop_pending_updates: false });
      console.log('✅ Webhook deleted! Bot is now ready for polling mode.');
    } catch (err) {
      console.error('❌ Failed to delete webhook:', err.message);
      process.exit(1);
    }
  } else if (actionOrUrl === 'info') {
    try {
      const info = await bot.telegram.getWebhookInfo();
      console.log('📋 Current Webhook Info:');
      console.log(JSON.stringify(info, null, 2));
    } catch (err) {
      console.error('❌ Failed to get webhook info:', err.message);
      process.exit(1);
    }
  } else if (actionOrUrl.startsWith('http://') || actionOrUrl.startsWith('https://')) {
    try {
      console.log(`📡 Setting webhook to: ${actionOrUrl}...`);
      const options = {};
      if (constants.SECRET_TOKEN) {
        options.secret_token = constants.SECRET_TOKEN;
      }
      await bot.telegram.setWebhook(actionOrUrl, options);
      console.log('✅ Webhook set successfully!');
      const info = await bot.telegram.getWebhookInfo();
      console.log('📋 Webhook Info:', JSON.stringify(info, null, 2));
    } catch (err) {
      console.error('❌ Failed to set webhook:', err.message);
      process.exit(1);
    }
  } else {
    console.log('Commands:');
    console.log('  node scripts/setWebhook.js <URL>    - Set webhook to specified URL');
    console.log('  node scripts/setWebhook.js info     - View current webhook info');
    console.log('  node scripts/setWebhook.js delete   - Delete webhook (switch to polling)');
  }
}

main();
