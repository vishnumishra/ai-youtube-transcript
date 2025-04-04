// Import from the built files
const { YoutubeTranscript } = require('../dist/youtube-transcript.common.js');

async function runTest() {
  try {
    console.log('Testing YouTube Transcript API...');
    
    const ytTranscript = new YoutubeTranscript();
    const transcript = await ytTranscript.fetch('dQw4w9WgXcQ'); // Rick Astley - Never Gonna Give You Up
    
    console.log(`Transcript fetched successfully!`);
    console.log(`Video ID: ${transcript.videoId}`);
    console.log(`Language: ${transcript.language} (${transcript.languageCode})`);
    console.log(`Auto-generated: ${transcript.isGenerated ? 'Yes' : 'No'}`);
    console.log(`Number of segments: ${transcript.length}`);
    
    // Get the first few segments
    console.log('\nFirst few segments:');
    for (let i = 0; i < Math.min(3, transcript.snippets.length); i++) {
      console.log(`[${i}] ${transcript.snippets[i].text}`);
    }
    
    console.log('\nTest completed successfully!');
  } catch (error) {
    console.error('Error:', error instanceof Error ? error.message : String(error));
  }
}

runTest();
