module.exports = {
  BOT_TOKEN: process.env.BOT_TOKEN || "7940862231:AAG9jDNnRf95VmrdFey2eKETezOrHIbQ6bg",
  DOWNLOAD_DIR: "downloads",
  CLOUD_CHANNEL: "@database_awt",
  MONGO_URL: process.env.MONGO_URL || "mongodb+srv://awtwhatsappcrashlog_db_user:0SJqOIWDSmmPuVWx@pdfmakerbot.frqc763.mongodb.net/?retryWrites=true&w=majority&appName=pdfmakerbot",
  DB_NAME: "pdf_bot_db",
  ADMIN_IDS: [1343548529],
  
  LOCALES: {
    en: {
      // English - Existing translations
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

    hi: {
      // Hindi
      welcome: "📄 **PDF मेकर बॉट**\n\nमुझे छवियां भेजें और मैं उन्हें PDF में बदल दूंगा!\n\n**कैसे उपयोग करें:**\n1. छवियां भेजें (फोटो या छवि फ़ाइलें)\n2. समाप्त होने पर /done भेजें\n3. मैं PDF बनाकर आपको भेज दूंगा\n\nआप 50 तक छवियां भेज सकते हैं।",
      imageReceived: "✅ छवि {count} प्राप्त हुई! अधिक छवियां भेजें या तैयार होने पर /done भेजें।",
      noImages: "❌ कोई छवि नहीं मिली। कृपया पहले कुछ छवियां भेजें।",
      maxImages: "❌ अधिकतम 50 छवियों की अनुमति है। कृपया कुछ छवियां हटाएं।",
      compressionPrompt: "📊 PDF गुणवत्ता चुनें:",
      compressionLow: "📦 कम गुणवत्ता (छोटी फ़ाइल)",
      compressionMedium: "⚖️ मध्यम गुणवत्ता",
      compressionHigh: "🎯 उच्च गुणवत्ता (बड़ी फ़ाइल)",
      previewTitle: "📄 PDF पूर्वावलोकन",
      previewPages: "📖 पृष्ठ: {count}",
      previewSize: "💾 अनुमानित आकार: {size}",
      previewReorder: "🔄 छवियों को पुन: व्यवस्थित करें",
      previewCreate: "✅ PDF बनाएं",
      imageEditPrompt: "🎨 छवि संपादन विकल्प:",
      editRotate: "🔄 छवियों को घुमाएं",
      editEnhance: "✨ स्वत: संवर्द्धन",
      editSkip: "⏭️ संपादन छोड़ें",
      watermarkPrompt: "💧 वॉटरमार्क जोड़ें?",
      watermarkYes: "✅ हां, वॉटरमार्क जोड़ें",
      watermarkNo: "❌ कोई वॉटरमार्क नहीं",
      watermarkAsk: "💬 कृपया वॉटरमार्क टेक्स्ट भेजें:",
      cloudSavePrompt: "☁️ क्लाउड स्टोरेज में सहेजें?",
      cloudYes: "✅ क्लाउड में सहेजें",
      cloudNo: "❌ केवल स्थानीय",
      cloudSuccess: "✅ फ़ाइल क्लाउड स्टोरेज में सहेजी गई!",
      securityScan: "🛡️ सुरक्षा स्कैन: ✅ फ़ाइल 100% सुरक्षित और वायरस-मुक्त है",
      processing: "⏳ आपका PDF संसाधित किया जा रहा है...",
      success: "✅ PDF सफलतापूर्वक बनाया गया!",
      renamePrompt: "📝 क्या आप PDF फ़ाइल का नाम बदलना चाहते हैं?",
      renameButton: "✏️ PDF का नाम बदलें",
      keepButton: "✅ वर्तमान नाम रखें",
      renameAsk: "कृपया अपने PDF के लिए नया नाम भेजें (.pdf एक्सटेंशन के बिना):",
      renameSuccess: "✅ PDF का नाम सफलतापूर्वक बदला गया!",
      keepSuccess: "✅ PDF मूल नाम से सहेजा गया!",
      invalidFile: "❌ कृपया केवल छवि फ़ाइलें भेजें।",
      sessionCancelled: "❌ सत्र रद्द किया गया। फिर से शुरू करने के लिए /start भेजें।",
      status: "📊 स्थिति: {count} छवियां",
      noSession: "❌ कोई सक्रिय सत्र नहीं। शुरू करने के लिए /start भेजें।",
      languageChanged: "✅ भाषा हिंदी में बदली गई",
      selectLanguage: "🌍 अपनी भाषा चुनें:",
      reorderInstructions: "🔄 नया क्रम संख्याओं के रूप में भेजें (उदाहरण: 3,1,2):",
      reorderSuccess: "✅ छवियों को सफलतापूर्वक पुन: व्यवस्थित किया गया!",
      rotatePrompt: "घूर्णन कोण चुनें:",
      rotate90: "↪️ 90° घुमाएं",
      rotate180: "🔄 180° घुमाएं", 
      rotate270: "↩️ 270° घुमाएं",
      enhanceApplied: "✨ सभी छवियों पर स्वत: संवर्द्धन लागू किया गया!",
      adminOnly: "❌ यह कमांड केवल प्रशासकों के लिए है।",
      adminPanel: "🛠️ प्रशासन पैनल",
      totalUsers: "👥 कुल उपयोगकर्ता",
      broadcast: "📢 प्रसारण संदेश",
      stats: "📊 आंकड़े",
      broadcastPrompt: "वह संदेश भेजें जिसे आप प्रसारित करना चाहते हैं (टेक्स्ट, छवि, या वीडियो):",
      broadcastStarted: "📢 प्रसारण शुरू...",
      broadcastComplete: "✅ प्रसारण पूरा हुआ!\nसफल: {success}\nविफल: {failed}",
      userStats: "📊 उपयोगकर्ता आंकड़े:\nकुल PDF: {totalPdfs}\nअंतिम 3 फ़ाइलें: {lastFiles}",
      watermarkPositionPrompt: "📍 वॉटरमार्क स्थिति चुनें:",
      positionLeft: "⬅️ बाएं",
      positionRight: "➡️ दाएं",
      positionCenter: "🎯 केंद्र",
      positionTop: "⬆️ ऊपर",
      positionBottom: "⬇️ नीचे", 
      positionTopLeft: "↖️ ऊपर बाएं",
      positionTopRight: "↗️ ऊपर दाएं",
      positionBottomLeft: "↙️ नीचे बाएं",
      positionBottomRight: "↘️ नीचे दाएं",
      positionSuccess: "✅ वॉटरमार्क स्थिति सेट की गई: {position}"
    },

    es: {
      // Spanish
      welcome: "📄 **Bot Creador de PDF**\n\n¡Envíame imágenes y las convertiré en PDF!\n\n**Cómo usar:**\n1. Envía imágenes (fotos o archivos de imagen)\n2. Envía /done cuando termines\n3. Crearé y te enviaré el PDF\n\nPuedes enviar hasta 50 imágenes.",
      imageReceived: "✅ ¡Imagen {count} recibida! Envía más imágenes o /done cuando estés listo.",
      noImages: "❌ No se encontraron imágenes. Por favor, envía algunas imágenes primero.",
      maxImages: "❌ Se permiten máximo 50 imágenes. Por favor, elimina algunas imágenes.",
      compressionPrompt: "📊 Selecciona la calidad del PDF:",
      compressionLow: "📦 Calidad baja (Archivo más pequeño)",
      compressionMedium: "⚖️ Calidad media",
      compressionHigh: "🎯 Calidad alta (Archivo más grande)",
      previewTitle: "📄 Vista previa del PDF",
      previewPages: "📖 Páginas: {count}",
      previewSize: "💾 Tamaño estimado: {size}",
      previewReorder: "🔄 Reordenar imágenes",
      previewCreate: "✅ Crear PDF",
      imageEditPrompt: "🎨 Opciones de edición de imagen:",
      editRotate: "🔄 Rotar imágenes",
      editEnhance: "✨ Mejora automática",
      editSkip: "⏭️ Omitir edición",
      watermarkPrompt: "💧 ¿Agregar marca de agua?",
      watermarkYes: "✅ Sí, agregar marca de agua",
      watermarkNo: "❌ Sin marca de agua",
      watermarkAsk: "💬 Por favor, envía el texto de la marca de agua:",
      cloudSavePrompt: "☁️ ¿Guardar en almacenamiento en la nube?",
      cloudYes: "✅ Guardar en la nube",
      cloudNo: "❌ Solo local",
      cloudSuccess: "✅ ¡Archivo guardado en almacenamiento en la nube!",
      securityScan: "🛡️ Escaneo de seguridad: ✅ El archivo es 100% seguro y libre de virus",
      processing: "⏳ Procesando tu PDF...",
      success: "✅ ¡PDF creado exitosamente!",
      renamePrompt: "📝 ¿Te gustaría renombrar el archivo PDF?",
      renameButton: "✏️ Renombrar PDF",
      keepButton: "✅ Mantener nombre actual",
      renameAsk: "Por favor, envía el nuevo nombre para tu PDF (sin extensión .pdf):",
      renameSuccess: "✅ ¡PDF renombrado exitosamente!",
      keepSuccess: "✅ ¡PDF guardado con nombre original!",
      invalidFile: "❌ Por favor, envía solo archivos de imagen.",
      sessionCancelled: "❌ Sesión cancelada. Envía /start para comenzar de nuevo.",
      status: "📊 Estado: {count} imágenes",
      noSession: "❌ No hay sesión activa. Envía /start para comenzar.",
      languageChanged: "✅ Idioma cambiado a español",
      selectLanguage: "🌍 Selecciona tu idioma:",
      reorderInstructions: "🔄 Envía el nuevo orden como números (ej: 3,1,2):",
      reorderSuccess: "✅ ¡Imágenes reordenadas exitosamente!",
      rotatePrompt: "Selecciona el ángulo de rotación:",
      rotate90: "↪️ Rotar 90°",
      rotate180: "🔄 Rotar 180°", 
      rotate270: "↩️ Rotar 270°",
      enhanceApplied: "¡✨ Mejora automática aplicada a todas las imágenes!",
      adminOnly: "❌ Este comando es solo para administradores.",
      adminPanel: "🛠️ Panel de administración",
      totalUsers: "👥 Usuarios totales",
      broadcast: "📢 Mensaje de difusión",
      stats: "📊 Estadísticas",
      broadcastPrompt: "Envía el mensaje que quieres difundir (texto, imagen o video):",
      broadcastStarted: "📢 Difusión iniciada...",
      broadcastComplete: "✅ ¡Difusión completada!\nÉxitos: {success}\nFallidos: {failed}",
      userStats: "📊 Estadísticas de usuario:\nPDFs totales: {totalPdfs}\nÚltimos 3 archivos: {lastFiles}",
      watermarkPositionPrompt: "📍 Selecciona la posición de la marca de agua:",
      positionLeft: "⬅️ Izquierda",
      positionRight: "➡️ Derecha",
      positionCenter: "🎯 Centro",
      positionTop: "⬆️ Superior",
      positionBottom: "⬇️ Inferior", 
      positionTopLeft: "↖️ Superior izquierda",
      positionTopRight: "↗️ Superior derecha",
      positionBottomLeft: "↙️ Inferior izquierda",
      positionBottomRight: "↘️ Inferior derecha",
      positionSuccess: "✅ Posición de marca de agua establecida en: {position}"
    },

    ru: {
      // Russian
      welcome: "📄 **Бот для создания PDF**\n\nПрисылайте мне изображения, и я преобразую их в PDF!\n\n**Как использовать:**\n1. Присылайте изображения (фотографии или файлы изображений)\n2. Отправьте /done когда закончите\n3. Я создам и отправлю вам PDF\n\nВы можете отправить до 50 изображений.",
      imageReceived: "✅ Изображение {count} получено! Присылайте больше изображений или /done когда готовы.",
      noImages: "❌ Изображения не найдены. Пожалуйста, сначала отправьте несколько изображений.",
      maxImages: "❌ Максимум 50 изображений разрешено. Пожалуйста, удалите некоторые изображения.",
      compressionPrompt: "📊 Выберите качество PDF:",
      compressionLow: "📦 Низкое качество (Меньший файл)",
      compressionMedium: "⚖️ Среднее качество",
      compressionHigh: "🎯 Высокое качество (Больший файл)",
      previewTitle: "📄 Предпросмотр PDF",
      previewPages: "📖 Страниц: {count}",
      previewSize: "💾 Примерный размер: {size}",
      previewReorder: "🔄 Изменить порядок изображений",
      previewCreate: "✅ Создать PDF",
      imageEditPrompt: "🎨 Опции редактирования изображений:",
      editRotate: "🔄 Повернуть изображения",
      editEnhance: "✨ Автоулучшение",
      editSkip: "⏭️ Пропустить редактирование",
      watermarkPrompt: "💧 Добавить водяной знак?",
      watermarkYes: "✅ Да, добавить водяной знак",
      watermarkNo: "❌ Без водяного знака",
      watermarkAsk: "💬 Пожалуйста, отправьте текст водяного знака:",
      cloudSavePrompt: "☁️ Сохранить в облачное хранилище?",
      cloudYes: "✅ Сохранить в облако",
      cloudNo: "❌ Только локально",
      cloudSuccess: "✅ Файл сохранен в облачное хранилище!",
      securityScan: "🛡️ Проверка безопасности: ✅ Файл на 100% безопасен и без вирусов",
      processing: "⏳ Обрабатываю ваш PDF...",
      success: "✅ PDF успешно создан!",
      renamePrompt: "📝 Хотите переименовать PDF файл?",
      renameButton: "✏️ Переименовать PDF",
      keepButton: "✅ Оставить текущее имя",
      renameAsk: "Пожалуйста, отправьте новое имя для вашего PDF (без расширения .pdf):",
      renameSuccess: "✅ PDF успешно переименован!",
      keepSuccess: "✅ PDF сохранен с исходным именем!",
      invalidFile: "❌ Пожалуйста, отправляйте только файлы изображений.",
      sessionCancelled: "❌ Сессия отменена. Отправьте /start чтобы начать заново.",
      status: "📊 Статус: {count} изображений",
      noSession: "❌ Нет активной сессии. Отправьте /start чтобы начать.",
      languageChanged: "✅ Язык изменен на русский",
      selectLanguage: "🌍 Выберите ваш язык:",
      reorderInstructions: "🔄 Отправьте новый порядок в виде чисел (например: 3,1,2):",
      reorderSuccess: "✅ Изображения успешно переупорядочены!",
      rotatePrompt: "Выберите угол поворота:",
      rotate90: "↪️ Повернуть на 90°",
      rotate180: "🔄 Повернуть на 180°", 
      rotate270: "↩️ Повернуть на 270°",
      enhanceApplied: "✨ Автоулучшение применено ко всем изображениям!",
      adminOnly: "❌ Эта команда только для администраторов.",
      adminPanel: "🛠️ Панель администратора",
      totalUsers: "👥 Всего пользователей",
      broadcast: "📢 Рассылка сообщений",
      stats: "📊 Статистика",
      broadcastPrompt: "Отправьте сообщение для рассылки (текст, изображение или видео):",
      broadcastStarted: "📢 Рассылка начата...",
      broadcastComplete: "✅ Рассылка завершена!\nУспешно: {success}\nНеудачно: {failed}",
      userStats: "📊 Статистика пользователя:\nВсего PDF: {totalPdfs}\nПоследние 3 файла: {lastFiles}",
      watermarkPositionPrompt: "📍 Выберите положение водяного знака:",
      positionLeft: "⬅️ Слева",
      positionRight: "➡️ Справа",
      positionCenter: "🎯 Центр",
      positionTop: "⬆️ Сверху",
      positionBottom: "⬇️ Снизу", 
      positionTopLeft: "↖️ Сверху слева",
      positionTopRight: "↗️ Сверху справа",
      positionBottomLeft: "↙️ Снизу слева",
      positionBottomRight: "↘️ Снизу справа",
      positionSuccess: "✅ Положение водяного знака установлено: {position}"
    },

    ar: {
      // Arabic
      welcome: "📄 **بوت صنع PDF**\n\nأرسل لي الصور وسأحولها إلى PDF!\n\n**كيفية الاستخدام:**\n1. أرسل الصور (الصور أو ملفات الصور)\n2. أرسل /done عند الانتهاء\n3. سأقوم بإنشاء وإرسال ملف PDF إليك\n\nيمكنك إرسال ما يصل إلى 50 صورة.",
      imageReceived: "✅ تم استلام الصورة {count}! أرسل المزيد من الصور أو /done عندما تكون جاهزًا.",
      noImages: "❌ لم يتم العثور على صور. يرجى إرسال بعض الصور أولاً.",
      maxImages: "❌ الحد الأقصى المسموح به هو 50 صورة. يرجى إزالة بعض الصور.",
      compressionPrompt: "📊 اختر جودة PDF:",
      compressionLow: "📦 جودة منخفضة (ملف أصغر)",
      compressionMedium: "⚖️ جودة متوسطة",
      compressionHigh: "🎯 جودة عالية (ملف أكبر)",
      previewTitle: "📄 معاينة PDF",
      previewPages: "📖 الصفحات: {count}",
      previewSize: "💾 الحجم المقدر: {size}",
      previewReorder: "🔄 إعادة ترتيب الصور",
      previewCreate: "✅ إنشاء PDF",
      imageEditPrompt: "🎨 خيارات تحرير الصور:",
      editRotate: "🔄 تدوير الصور",
      editEnhance: "✨ التحسين التلقائي",
      editSkip: "⏭️ تخطي التحرير",
      watermarkPrompt: "💧 إضافة علامة مائية؟",
      watermarkYes: "✅ نعم، أضف علامة مائية",
      watermarkNo: "❌ لا توجد علامة مائية",
      watermarkAsk: "💬 يرجى إرسال نص العلامة المائية:",
      cloudSavePrompt: "☁️ حفظ في التخزين السحابي؟",
      cloudYes: "✅ حفظ في السحابة",
      cloudNo: "❌ محلي فقط",
      cloudSuccess: "✅ تم حفظ الملف في التخزين السحابي!",
      securityScan: "🛡️ فحص الأمان: ✅ الملف آمن 100% وخالي من الفيروسات",
      processing: "⏳ جاري معالجة ملف PDF الخاص بك...",
      success: "✅ تم إنشاء PDF بنجاح!",
      renamePrompt: "📝 هل ترغب في إعادة تسمية ملف PDF؟",
      renameButton: "✏️ إعادة تسمية PDF",
      keepButton: "✅ الاحتفاظ بالاسم الحالي",
      renameAsk: "يرجى إرسال الاسم الجديد لملف PDF الخاص بك (بدون امتداد .pdf):",
      renameSuccess: "✅ تمت إعادة تسمية PDF بنجاح!",
      keepSuccess: "✅ تم حفظ PDF بالاسم الأصلي!",
      invalidFile: "❌ يرجى إرسال ملفات الصور فقط.",
      sessionCancelled: "❌ تم إلغاء الجلسة. أرسل /start للبدء مرة أخرى.",
      status: "📊 الحالة: {count} صورة",
      noSession: "❌ لا توجد جلسة نشطة. أرسل /start للبدء.",
      languageChanged: "✅ تم تغيير اللغة إلى العربية",
      selectLanguage: "🌍 اختر لغتك:",
      reorderInstructions: "🔄 أرسل الترتيب الجديد كأرقام (مثال: 3,1,2):",
      reorderSuccess: "✅ تم إعادة ترتيب الصور بنجاح!",
      rotatePrompt: "اختر زاوية الدوران:",
      rotate90: "↪️ تدوير 90°",
      rotate180: "🔄 تدوير 180°", 
      rotate270: "↩️ تدوير 270°",
      enhanceApplied: "✨ تم تطبيق التحسين التلقائي على جميع الصور!",
      adminOnly: "❌ هذا الأمر للمسؤولين فقط.",
      adminPanel: "🛠️ لوحة المسؤول",
      totalUsers: "👥 إجمالي المستخدمين",
      broadcast: "📢 رسالة بث",
      stats: "📊 الإحصائيات",
      broadcastPrompt: "أرسل الرسالة التي تريد بثها (نص، صورة، أو فيديو):",
      broadcastStarted: "📢 بدأ البث...",
      broadcastComplete: "✅ اكتمل البث!\nنجح: {success}\nفشل: {failed}",
      userStats: "📊 إحصائيات المستخدم:\nإجمالي ملفات PDF: {totalPdfs}\nآخر 3 ملفات: {lastFiles}",
      watermarkPositionPrompt: "📍 اختر موضع العلامة المائية:",
      positionLeft: "⬅️ يسار",
      positionRight: "➡️ يمين",
      positionCenter: "🎯 مركز",
      positionTop: "⬆️ أعلى",
      positionBottom: "⬇️ أسفل", 
      positionTopLeft: "↖️ أعلى يسار",
      positionTopRight: "↗️ أعلى يمين",
      positionBottomLeft: "↙️ أسفل يسار",
      positionBottomRight: "↘️ أسفل يمين",
      positionSuccess: "✅ تم تعيين موضع العلامة المائية إلى: {position}"
    }
  },

  // Language configuration
  LANGUAGES: {
    en: { name: "English", flag: "🇺🇸", code: "en" },
    hi: { name: "हिंदी", flag: "🇮🇳", code: "hi" },
    es: { name: "Español", flag: "🇪🇸", code: "es" },
    ru: { name: "Русский", flag: "🇷🇺", code: "ru" },
    ar: { name: "العربية", flag: "🇸🇦", code: "ar" }
  }
};