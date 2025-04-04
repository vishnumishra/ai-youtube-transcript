// Import from the built files
const { YoutubeTranscript } = require('./dist/youtube-transcript.common.js');

async function debugTranslations() {
  try {
    const ytTranscript = new YoutubeTranscript();
    
    // Get the list of available transcripts
    const transcriptList = await ytTranscript.list('ez6Tu_Gnmms');
    
    // Find the English transcript
    const enTranscript = transcriptList.findTranscript(['en']);
    
    console.log(`Found transcript in ${enTranscript.language} (${enTranscript.languageCode})`);
    console.log(`Is translatable: ${enTranscript.isTranslatable}`);
    console.log(`Available translation languages (${enTranscript.translationLanguages.length}):`);
    
    // Print all available translation languages
    enTranscript.translationLanguages.forEach(lang => {
      console.log(`- ${lang.languageName} (${lang.languageCode})`);
    });
    
    // Check if Hindi is in the translation languages
    const hasHindi = enTranscript.translationLanguages.some(lang => lang.languageCode === 'hi');
    console.log(`\nCan translate to Hindi: ${hasHindi}`);
    
    // Try to translate to Hindi
    if (hasHindi) {
      try {
        const translatedTranscript = enTranscript.translate('hi');
        console.log(`Successfully created translated transcript object for Hindi`);
      } catch (error) {
        console.error(`Error translating to Hindi: ${error.message}`);
      }
    }
  } catch (error) {
    console.error(`Error: ${error.message}`);
  }
}

debugTranslations();
