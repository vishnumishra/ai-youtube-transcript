// Import from the built files
const {
  YoutubeTranscript,
  JSONFormatter,
  TextFormatter,
  SRTFormatter
} = require('../dist/youtube-transcript.common.js');

// Basic usage with instance method
const example1 = async () => {
  try {
    // Create a new instance
    const ytTranscript = new YoutubeTranscript();
    
    // Fetch transcript with default options (English)
    const transcript = await ytTranscript.fetch('dQw4w9WgXcQ'); // Rick Astley - Never Gonna Give You Up
    
    console.log('Transcript fetched successfully:');
    console.log(`Video ID: ${transcript.videoId}`);
    console.log(`Language: ${transcript.language} (${transcript.languageCode})`);
    console.log(`Auto-generated: ${transcript.isGenerated ? 'Yes' : 'No'}`);
    console.log(`Number of segments: ${transcript.length}`);
    
    // Get the full text
    console.log('\nFull transcript text (first 200 chars):');
    console.log(transcript.getText().substring(0, 200) + '...');
    
    // Format the transcript
    const jsonFormatter = new JSONFormatter();
    const textFormatter = new TextFormatter();
    const srtFormatter = new SRTFormatter();
    
    console.log('\nJSON format (sample):');
    const jsonOutput = jsonFormatter.formatTranscript(transcript, { indent: 2 });
    console.log(jsonOutput.substring(0, 200) + '...');
    
    console.log('\nText format (sample):');
    const textOutput = textFormatter.formatTranscript(transcript);
    console.log(textOutput.substring(0, 200) + '...');
    
    console.log('\nSRT format (sample):');
    const srtOutput = srtFormatter.formatTranscript(transcript);
    console.log(srtOutput.substring(0, 200) + '...');
  } catch (error) {
    console.error('Error fetching transcript:', error instanceof Error ? error.message : String(error));
  }
};

// Advanced usage with language preferences
const example2 = async () => {
  try {
    const ytTranscript = new YoutubeTranscript();
    
    // List all available transcripts
    const transcriptList = await ytTranscript.list('dQw4w9WgXcQ'); // Rick Astley - Never Gonna Give You Up
    
    console.log('Available transcripts:');
    for (const transcript of transcriptList) {
      console.log(`- ${transcript.language} (${transcript.languageCode}), Auto-generated: ${transcript.isGenerated ? 'Yes' : 'No'}`);
      
      if (transcript.isTranslatable) {
        console.log('  Available translations:');
        // Show just a few translations to keep output manageable
        const sampleTranslations = transcript.translationLanguages.slice(0, 3);
        for (const lang of sampleTranslations) {
          console.log(`  - ${lang.languageName} (${lang.languageCode})`);
        }
        if (transcript.translationLanguages.length > 3) {
          console.log(`  - ... and ${transcript.translationLanguages.length - 3} more`);
        }
      }
    }
    
    // Find a transcript with language preferences
    const transcript = transcriptList.findTranscript(['fr', 'en', 'es']);
    console.log(`\nSelected transcript: ${transcript.language} (${transcript.languageCode})`);
    
    // Fetch the transcript
    const fetchedTranscript = await transcript.fetch(true); // true to preserve formatting
    console.log(`Fetched ${fetchedTranscript.snippets.length} segments`);
    
    // Translate the transcript if possible
    if (transcript.isTranslatable) {
      try {
        // Find a translation language
        const translationLang = transcript.translationLanguages.length > 0 
          ? transcript.translationLanguages[0].languageCode 
          : 'es';
        
        const translatedTranscript = transcript.translate(translationLang);
        const fetchedTranslation = await translatedTranscript.fetch();
        console.log(`\nTranslated to ${translatedTranscript.language}: ${fetchedTranslation.snippets.length} segments`);
        console.log(fetchedTranslation.getText().substring(0, 200) + '...');
      } catch (error) {
        console.error('Translation error:', error instanceof Error ? error.message : String(error));
      }
    }
  } catch (error) {
    console.error('Error in advanced example:', error instanceof Error ? error.message : String(error));
  }
};

// Legacy static method (for backward compatibility)
const example3 = async () => {
  try {
    const transcriptData = await YoutubeTranscript.fetchTranscript('dQw4w9WgXcQ'); // Rick Astley - Never Gonna Give You Up
    console.log('Legacy method result:', transcriptData.length, 'segments');
  } catch (error) {
    console.error('Error with legacy method:', error instanceof Error ? error.message : String(error));
  }
};

// Run the examples
(async () => {
  console.log('=== EXAMPLE 1: BASIC USAGE ===');
  await example1();
  
  console.log('\n=== EXAMPLE 2: ADVANCED USAGE ===');
  await example2();
  
  console.log('\n=== EXAMPLE 3: LEGACY USAGE ===');
  await example3();
})();
