const { getBotInstance } = require('../bot');

let initialized = false;

module.exports = async (req, res) => {
  const pdfBot = getBotInstance();

  if (!initialized) {
    try {
      await pdfBot.init();
      initialized = true;
    } catch (e) {
      console.error('Failed to initialize bot services:', e);
    }
  }

  // Handle GET requests (health check or manual setWebhook trigger)
  if (req.method === 'GET') {
    if (req.query && (req.query.setWebhook === 'true' || req.query.action === 'set')) {
      try {
        const host = req.headers['x-forwarded-host'] || req.headers.host;
        const proto = req.headers['x-forwarded-proto'] || 'https';
        const targetUrl = `${proto}://${host}/api/webhook`;
        
        await pdfBot.bot.telegram.setWebhook(targetUrl);
        return res.status(200).json({
          status: 'ok',
          message: `Telegram webhook set to ${targetUrl}`,
          timestamp: new Date().toISOString()
        });
      } catch (err) {
        return res.status(500).json({
          status: 'error',
          error: err.message
        });
      }
    }

    return res.status(200).json({
      status: 'online',
      bot: 'AWT Image to PDF Bot',
      mode: 'vercel-serverless-webhook',
      tip: 'To set webhook automatically, visit this URL with ?setWebhook=true',
      timestamp: new Date().toISOString()
    });
  }

  // Handle Telegram POST webhook
  if (req.method === 'POST') {
    try {
      await pdfBot.bot.handleUpdate(req.body, res);
    } catch (err) {
      console.error('Error handling Telegram update:', err);
      if (!res.headersSent) {
        res.status(500).send('Error handling update');
      }
    }
    return;
  }

  res.status(405).send('Method Not Allowed');
};
