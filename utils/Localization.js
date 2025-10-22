const constants = require('../config/constants');

class Localization {
  constructor() {
    this.locales = {
      en: {
        welcome: "📄 **PDF Maker Bot**\n\nSend me images and I'll convert them to PDF!\n\n**How to use:**\n1. Send images (photos or image files)\n2. Send /done when finished\n3. I'll create and send you the PDF\n\nYou can send up to 50 images.",
        imageReceived: "✅ Image {count} received! Send more images or /done when ready.",
        noImages: "❌ No images found. Please send some images first.",
        maxImages: "❌ Maximum 50 images allowed. Please remove some images.",
        compressionPrompt: "📊 Select PDF Quality:",
        compressionLow: "📦 Low Quality (Smaller File)",
        compressionMedium: "⚖️ Medium Quality",
        compressionHigh: "🎯 High Quality (Larger File)",
        previewTitle: "📄 PDF Preview",
        previewPages: "📖 Pages: {count}",
        previewSize: "💾 Estimated Size: {size}",
        previewReorder: "🔄 Reorder Images",
        previewCreate: "✅ Create PDF",
        imageEditPrompt: "🎨 Image Editing Options:",
        editRotate: "🔄 Rotate Images",
        editEnhance: "✨ Auto-Enhance",
        editSkip: "⏭️ Skip Editing",
        watermarkPrompt: "💧 Add Watermark?",
        watermarkYes: "✅ Yes, Add Watermark",
        watermarkNo: "❌ No Watermark",
        watermarkAsk: "💬 Please send the watermark text:",
        cloudSavePrompt: "☁️ Save to Cloud Storage?",
        cloudYes: "✅ Save to Cloud",
        cloudNo: "❌ Local Only",
        cloudSuccess: "✅ File saved to cloud storage!",
        securityScan: "🛡️ Security Scan: ✅ File is 100% secure and virus-free",
        processing: "⏳ Processing your PDF...",
        success: "✅ PDF created successfully!",
        renamePrompt: "📝 Would you like to rename the PDF file?",
        renameButton: "✏️ Rename PDF",
        keepButton: "✅ Keep Current Name",
        renameAsk: "Please send the new name for your PDF (without .pdf extension):",
        renameSuccess: "✅ PDF renamed successfully!",
        keepSuccess: "✅ PDF saved with original name!",
        invalidFile: "❌ Please send image files only.",
        sessionCancelled: "❌ Session cancelled. Send /start to begin again.",
        status: "📊 Status: {count} images",
        noSession: "❌ No active session. Send /start to begin.",
        languageChanged: "✅ Language changed to English",
        selectLanguage: "🌍 Select your language:",
        reorderInstructions: "🔄 Send the new order as numbers (e.g: 3,1,2):",
        reorderSuccess: "✅ Images reordered successfully!",
        rotatePrompt: "Select rotation angle:",
        rotate90: "↪️ Rotate 90°",
        rotate180: "🔄 Rotate 180°", 
        rotate270: "↩️ Rotate 270°",
        enhanceApplied: "✨ Auto-enhance applied to all images!",
        adminOnly: "❌ This command is for administrators only.",
        adminPanel: "🛠️ Admin Panel",
        totalUsers: "👥 Total Users",
        broadcast: "📢 Broadcast Message",
        stats: "📊 Statistics",
        broadcastPrompt: "Send the message you want to broadcast (text, image, or video):",
        broadcastStarted: "📢 Broadcast started...",
        broadcastComplete: "✅ Broadcast completed!\nSuccess: {success}\nFailed: {failed}",
        userStats: "📊 User Statistics:\nTotal PDFs: {totalPdfs}\nLast 3 files: {lastFiles}",
        watermarkPositionPrompt: "📍 Select watermark position:",
        positionLeft: "⬅️ Left",
        positionRight: "➡️ Right",
        positionCenter: "🎯 Center",
        positionTop: "⬆️ Top",
        positionBottom: "⬇️ Bottom", 
        positionTopLeft: "↖️ Top Left",
        positionTopRight: "↗️ Top Right",
        positionBottomLeft: "↙️ Bottom Left",
        positionBottomRight: "↘️ Bottom Right",
        positionSuccess: "✅ Watermark position set to: {position}"
      },
      ar: {
        welcome: "📄 **بوت صنع PDF**\n\nأرسل لي الصور وسأحولها إلى PDF!\n\n**طريقة الاستخدام:**\n1. أرسل الصور (صور أو ملفات صور)\n2. أرسل /done عند الانتهاء\n3. سأقوم بإنشاء وإرسال PDF لك\n\nيمكنك إرسال حتى 50 صورة.",
        imageReceived: "✅ تم استلام الصورة {count}! أرسل المزيد من الصور أو /done عندما تكون جاهزًا.",
        noImages: "❌ لم يتم العثور على صور. يرجى إرسال بعض الصور أولاً.",
        maxImages: "❌ الحد الأقصى المسموح به هو 50 صورة. يرجى إزالة بعض الصور.",
        languageChanged: "✅ تم تغيير اللغة إلى العربية"
      },
      ru: {
        welcome: "📄 **Бот для создания PDF**\n\nПрисылайте мне изображения, и я преобразую их в PDF!\n\n**Как использовать:**\n1. Присылайте изображения (фото или файлы изображений)\n2. Отправьте /done когда закончите\n3. Я создам и отправлю вам PDF\n\nВы можете отправить до 50 изображений.",
        imageReceived: "✅ Изображение {count} получено! Присылайте больше изображений или /done когда готовы.",
        noImages: "❌ Изображения не найдены. Пожалуйста, сначала отправьте несколько изображений.",
        maxImages: "❌ Максимум 50 изображений разрешено. Пожалуйста, удалите некоторые изображения.",
        languageChanged: "✅ Язык изменен на Русский"
      },
      es: {
        welcome: "📄 **Bot Creador de PDF**\n\n¡Envíame imágenes y las convertiré en PDF!\n\n**Cómo usar:**\n1. Envía imágenes (fotos или archivos de imagen)\n2. Envía /done cuando termines\n3. Crearé y te enviaré el PDF\n\nPuedes enviar hasta 50 imágenes.",
        imageReceived: "✅ ¡Imagen {count} recibida! Envía más imágenes o /done cuando estés listo.",
        noImages: "❌ No se encontraron imágenes. Por favor, envía algunas imágenes primero.",
        maxImages: "❌ Se permiten máximo 50 imágenes. Por favor, elimina algunas imágenes.",
        languageChanged: "✅ Idioma cambiado a Español"
      },
      hi: {
        welcome: "📄 **PDF निर्माता बॉट**\n\nमुझे चित्र भेजें और मैं उन्हें PDF में बदल दूंगा!\n\n**कैसे उपयोग करें:**\n1. चित्र भेजें (फोटो या छवि फाइलें)\n2. समाप्त होने पर /done भेजें\n3. मैं PDF बनाकर आपको भेज दूंगा\n\nआप 50 तक चित्र भेज सकते हैं।",
        imageReceived: "✅ चित्र {count} प्राप्त हुआ! अधिक चित्र भेजें या तैयार होने पर /done भेजें।",
        noImages: "❌ कोई चित्र नहीं मिला। कृपया पहले कुछ चित्र भेजें।",
        maxImages: "❌ अधिकतम 50 चित्र की अनुमति है। कृपया कुछ चित्र हटाएं।",
        languageChanged: "✅ भाषा हिंदी में बदल गई"
      }
    };
  }

  getMessage(lang, key, replacements = {}) {
    const message = this.locales[lang]?.[key] || this.locales['en'][key] || key;
    
    return message.replace(/{(\w+)}/g, (match, placeholder) => {
      return replacements[placeholder] !== undefined ? replacements[placeholder] : match;
    });
  }
}

module.exports = new Localization();