const { LOCALES, LANGUAGES } = require("../config/constants");

class Localization {
  constructor(sessionService) {
    this.sessionService = sessionService;
    this.locales = LOCALES;
    this.languages = LANGUAGES;
  }

  getMessage(userId, key, replacements = {}) {
    const session = this.sessionService.getSession(userId);
    const lang = session?.language || 'en';
    let message = this.locales[lang][key] || this.locales['en'][key] || key;

    // Handle RTL languages (Arabic)
    if (lang === 'ar' && typeof message === 'string') {
      message = this._applyRTLStyling(message);
    }

    Object.keys(replacements).forEach(placeholder => {
      message = message.replace(`{${placeholder}}`, replacements[placeholder]);
    });

    return message;
  }

  _applyRTLStyling(text) {
    return `\u202B${text}\u202C`;
  }

  setLanguage(userId, language) {
    const session = this.sessionService.getSession(userId);
    if (session) {
      session.language = language;
    }
  }

  getAvailableLanguages() {
    return Object.keys(this.languages);
  }

  getLanguageInfo(languageCode) {
    return this.languages[languageCode];
  }

  getWelcomeMessage(userId) {
    const session = this.sessionService.getSession(userId);
    const currentLang = session?.language || 'en';
    const currentLanguageInfo = this.languages[currentLang];
    
    let welcomeMessage = this.getMessage(userId, 'welcome');
    
    welcomeMessage += `\n\n🌐 **Current Language**: ${currentLanguageInfo.flag} ${currentLanguageInfo.name}`;
    welcomeMessage += `\n💡 **Tip**: Use /language to change language`;
    
    return welcomeMessage;
  }
}

module.exports = Localization;