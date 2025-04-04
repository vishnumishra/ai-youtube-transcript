// Import from the built files
const { YoutubeTranscript } = require('./dist/youtube-transcript.common.js');
const fs = require('fs');

async function debugYouTubeResponse() {
  try {
    // Create a custom implementation of fetch to capture the response
    const originalFetch = global.fetch;
    
    // Override fetch to capture the response
    global.fetch = async (url, options) => {
      console.log(`Fetching URL: ${url}`);
      const response = await originalFetch(url, options);
      
      // Only capture the YouTube watch page response
      if (url.includes('youtube.com/watch')) {
        const responseText = await response.text();
        
        // Save the response to a file
        fs.writeFileSync('youtube-response.txt', responseText);
        
        // Extract the captions part
        const captionsPart = responseText.split('"captions":')[1];
        if (captionsPart) {
          const captionsJson = captionsPart.split(',"videoDetails')[0];
          fs.writeFileSync('captions-data.json', captionsJson);
          
          try {
            // Parse the captions data
            const parsedCaptions = JSON.parse(captionsJson);
            fs.writeFileSync('parsed-captions.json', JSON.stringify(parsedCaptions, null, 2));
            
            // Check for translationLanguages
            if (parsedCaptions.playerCaptionsTracklistRenderer) {
              const tracks = parsedCaptions.playerCaptionsTracklistRenderer.captionTracks || [];
              
              console.log(`Found ${tracks.length} caption tracks`);
              
              tracks.forEach((track, index) => {
                console.log(`\nTrack ${index + 1}: ${track.name?.simpleText} (${track.languageCode})`);
                console.log(`isTranslatable: ${!!track.isTranslatable}`);
                
                // Check for translationLanguages
                if (track.translationLanguages) {
                  console.log(`translationLanguages: ${track.translationLanguages.length}`);
                } else {
                  console.log('translationLanguages: undefined');
                }
                
                // Check for other translation-related properties
                const keys = Object.keys(track);
                const translationKeys = keys.filter(key => key.toLowerCase().includes('translat'));
                if (translationKeys.length > 0) {
                  console.log(`Translation-related keys: ${translationKeys.join(', ')}`);
                }
              });
            }
          } catch (error) {
            console.error('Error parsing captions JSON:', error.message);
          }
        }
        
        // Create a new response with the same body
        return new Response(responseText, response);
      }
      
      return response;
    };
    
    // Now use the YoutubeTranscript API
    const ytTranscript = new YoutubeTranscript();
    await ytTranscript.list('ez6Tu_Gnmms');
    
    // Restore the original fetch
    global.fetch = originalFetch;
    
  } catch (error) {
    console.error(`Error: ${error.message}`);
  }
}

debugYouTubeResponse();
