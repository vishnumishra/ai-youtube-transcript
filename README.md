# AI YouTube Transcript API

[![npm version](https://badge.fury.io/js/ai-youtube-transcript.svg)](https://badge.fury.io/js/ai-youtube-transcript)

A Node.js library for retrieving and processing YouTube video transcripts. This package uses the unofficial YouTube API to fetch transcripts without requiring an API key or headless browser.

## Table of Contents

- [Features](#features)
- [Installation](#installation)
- [Basic Usage](#basic-usage)
- [Advanced Usage](#advanced-usage)
  - [Listing Available Transcripts](#listing-available-transcripts)
  - [Fetching with Language Preferences](#fetching-with-language-preferences)
  - [Translating Transcripts](#translating-transcripts)
  - [Using Formatters](#using-formatters)
  - [Authentication for Age-Restricted Videos](#authentication-for-age-restricted-videos)
  - [Using Proxies to Handle IP Bans](#using-proxies-to-handle-ip-bans)
- [Common Use Cases](#common-use-cases)
  - [Batch Processing Multiple Videos](#batch-processing-multiple-videos)
  - [Saving Transcripts to Files](#saving-transcripts-to-files)
- [CLI Usage](#cli-usage)
  - [CLI Options](#cli-options)
  - [CLI Examples](#cli-examples)
- [API Reference](#api-reference)
  - [YoutubeTranscript](#youtubetranscript)
  - [Transcript](#transcript)
  - [TranscriptList](#transcriptlist)
  - [FetchedTranscript](#fetchedtranscript)
  - [Formatters](#formatters)
  - [Proxy Support](#proxy-support)
- [Troubleshooting](#troubleshooting)
- [Development](#development)
  - [Setting Up](#setting-up)
  - [Running Tests](#running-tests)
- [Contributing](#contributing)
- [Warning](#warning)
- [License](#license)

## Features

- Fetch transcripts from YouTube videos
- Support for multiple languages with preference ordering
- Distinguish between manually created and auto-generated transcripts
- Translate transcripts to different languages
- Preserve HTML formatting in transcripts
- Format transcripts in various formats (JSON, Text, SRT)
- Support for authentication via cookies for age-restricted videos
- Proxy support for handling IP bans
- Comprehensive CLI tool

## Installation

```bash
npm install ai-youtube-transcript
```

or

```bash
yarn add ai-youtube-transcript
```

## Basic Usage

```javascript
import { YoutubeTranscript } from 'ai-youtube-transcript';

// Create a new instance
const ytTranscript = new YoutubeTranscript();

// Fetch transcript with default options (English)
ytTranscript.fetch('VIDEO_ID_OR_URL')
  .then(transcript => {
    console.log(`Video ID: ${transcript.videoId}`);
    console.log(`Language: ${transcript.language} (${transcript.languageCode})`);
    console.log(`Auto-generated: ${transcript.isGenerated ? 'Yes' : 'No'}`);
    console.log(`Number of segments: ${transcript.length}`);

    // Get the full text
    console.log(transcript.getText());

    // Get raw data
    console.log(transcript.toRawData());
  })
  .catch(error => {
    console.error('Error:', error.message);
  });
```

### Legacy Usage (Backward Compatibility)

```javascript
import { YoutubeTranscript } from 'ai-youtube-transcript';

// Using the static method (legacy approach)
YoutubeTranscript.fetchTranscript('VIDEO_ID_OR_URL')
  .then(console.log)
  .catch(console.error);
```

## Advanced Usage

### Listing Available Transcripts

```javascript
import { YoutubeTranscript } from 'ai-youtube-transcript';

const ytTranscript = new YoutubeTranscript();

// List all available transcripts
ytTranscript.list('VIDEO_ID_OR_URL')
  .then(transcriptList => {
    console.log('Available transcripts:');
    for (const transcript of transcriptList) {
      console.log(`- ${transcript.language} (${transcript.languageCode})`);
      console.log(`  Auto-generated: ${transcript.isGenerated ? 'Yes' : 'No'}`);
      console.log(`  Translatable: ${transcript.isTranslatable ? 'Yes' : 'No'}`);

      if (transcript.isTranslatable) {
        console.log('  Available translations:');
        for (const lang of transcript.translationLanguages) {
          console.log(`  - ${lang.languageName} (${lang.languageCode})`);
        }
      }
    }
  })
  .catch(error => {
    console.error('Error:', error.message);
  });
```

### Fetching with Language Preferences

```javascript
import { YoutubeTranscript } from 'ai-youtube-transcript';

const ytTranscript = new YoutubeTranscript();

// Fetch transcript with language preferences
ytTranscript.fetch('VIDEO_ID_OR_URL', {
  languages: ['fr', 'en', 'es'], // Try French first, then English, then Spanish
  preserveFormatting: true // Keep HTML formatting
})
  .then(transcript => {
    console.log(`Selected language: ${transcript.language} (${transcript.languageCode})`);
    console.log(transcript.getText());
  })
  .catch(error => {
    console.error('Error:', error.message);
  });
```

### Translating Transcripts

```javascript
import { YoutubeTranscript } from 'ai-youtube-transcript';

const ytTranscript = new YoutubeTranscript();

// Get the list of available transcripts
ytTranscript.list('VIDEO_ID_OR_URL')
  .then(async transcriptList => {
    // Find a transcript
    const transcript = transcriptList.findTranscript(['en']);

    // Check if it can be translated
    if (transcript.isTranslatable) {
      // Translate to Spanish
      const translatedTranscript = transcript.translate('es');

      // Fetch the translated transcript
      const fetchedTranslation = await translatedTranscript.fetch();
      console.log(`Translated to Spanish: ${fetchedTranslation.getText()}`);
    }
  })
  .catch(error => {
    console.error('Error:', error.message);
  });
```

### Using Formatters

```javascript
import { YoutubeTranscript, JSONFormatter, TextFormatter, SRTFormatter } from 'ai-youtube-transcript';

const ytTranscript = new YoutubeTranscript();

ytTranscript.fetch('VIDEO_ID_OR_URL')
  .then(transcript => {
    // Format as JSON
    const jsonFormatter = new JSONFormatter();
    const jsonOutput = jsonFormatter.formatTranscript(transcript, { indent: 2 });
    console.log(jsonOutput);

    // Format as plain text
    const textFormatter = new TextFormatter();
    const textOutput = textFormatter.formatTranscript(transcript);
    console.log(textOutput);

    // Format as SRT
    const srtFormatter = new SRTFormatter();
    const srtOutput = srtFormatter.formatTranscript(transcript);
    console.log(srtOutput);
  })
  .catch(error => {
    console.error('Error:', error.message);
  });
```

### Authentication for Age-Restricted Videos

```javascript
import { YoutubeTranscript } from 'ai-youtube-transcript';

// Create an instance with cookie authentication
const ytTranscript = new YoutubeTranscript('/path/to/cookies.txt');

// Now you can access age-restricted videos
ytTranscript.fetch('AGE_RESTRICTED_VIDEO_ID')
  .then(transcript => {
    console.log(transcript.getText());
  })
  .catch(error => {
    console.error('Error:', error.message);
  });
```

### Using Proxies to Handle IP Bans

```javascript
import { YoutubeTranscript, GenericProxyConfig, WebshareProxyConfig } from 'ai-youtube-transcript';

// Using a generic proxy
const genericProxy = new GenericProxyConfig(
  'http://username:password@proxy-host:port',
  'https://username:password@proxy-host:port'
);
const ytTranscript1 = new YoutubeTranscript(null, genericProxy);

// Using Webshare proxy
const webshareProxy = new WebshareProxyConfig('username', 'password');
const ytTranscript2 = new YoutubeTranscript(null, webshareProxy);

// Now use ytTranscript1 or ytTranscript2 as usual
```

## Common Use Cases

### Batch Processing Multiple Videos

```javascript
import { YoutubeTranscript } from 'ai-youtube-transcript';
import fs from 'fs';

async function batchProcessVideos(videoIds) {
  const ytTranscript = new YoutubeTranscript();
  const results = [];

  for (const videoId of videoIds) {
    try {
      console.log(`Processing video ${videoId}...`);
      const transcript = await ytTranscript.fetch(videoId);

      results.push({
        videoId,
        language: transcript.language,
        text: transcript.getText(),
        segments: transcript.length
      });

      console.log(`✅ Successfully processed ${videoId}`);
    } catch (error) {
      console.error(`❌ Error processing ${videoId}: ${error.message}`);
      results.push({
        videoId,
        error: error.message
      });
    }
  }

  return results;
}

// Example usage
const videoIds = [
  'dQw4w9WgXcQ',  // Rick Astley - Never Gonna Give You Up
  'UF8uR6Z6KLc',  // Steve Jobs' 2005 Stanford Commencement Address
  'YbJOTdZBX1g'   // YouTube Rewind 2018
];

batchProcessVideos(videoIds)
  .then(results => {
    console.log(`Processed ${results.length} videos`);
    fs.writeFileSync('results.json', JSON.stringify(results, null, 2));
  });
```

### Saving Transcripts to Files

```javascript
import { YoutubeTranscript, JSONFormatter, TextFormatter, SRTFormatter } from 'ai-youtube-transcript';
import fs from 'fs';
import path from 'path';

async function saveTranscriptInMultipleFormats(videoId, outputDir) {
  const ytTranscript = new YoutubeTranscript();

  try {
    // Create output directory if it doesn't exist
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Fetch the transcript
    const transcript = await ytTranscript.fetch(videoId);

    // Save as JSON
    const jsonFormatter = new JSONFormatter();
    const jsonOutput = jsonFormatter.formatTranscript(transcript, { indent: 2 });
    fs.writeFileSync(
      path.join(outputDir, `${videoId}.json`),
      jsonOutput
    );

    // Save as plain text
    const textFormatter = new TextFormatter();
    const textOutput = textFormatter.formatTranscript(transcript);
    fs.writeFileSync(
      path.join(outputDir, `${videoId}.txt`),
      textOutput
    );

    // Save as SRT
    const srtFormatter = new SRTFormatter();
    const srtOutput = srtFormatter.formatTranscript(transcript);
    fs.writeFileSync(
      path.join(outputDir, `${videoId}.srt`),
      srtOutput
    );

    console.log(`Transcript for ${videoId} saved in multiple formats to ${outputDir}`);
    return true;
  } catch (error) {
    console.error(`Error saving transcript for ${videoId}: ${error.message}`);
    return false;
  }
}

// Example usage
saveTranscriptInMultipleFormats('dQw4w9WgXcQ', './transcripts');
```

## CLI Usage

The package includes a command-line interface for easy transcript retrieval:

```bash
npx ai-youtube-transcript <videoId> [options]
```

### CLI Options

```
Options:
  --languages, -l <langs>       Comma-separated list of language codes in order of preference (default: en)
  --format, -f <format>         Output format: text, json, srt (default: text)
  --output, -o <file>           Write output to a file instead of stdout
  --translate, -t <lang>        Translate transcript to the specified language
  --list-transcripts            List all available transcripts for the video
  --exclude-generated           Only use manually created transcripts
  --exclude-manually-created    Only use automatically generated transcripts
  --preserve-formatting         Preserve HTML formatting in the transcript
  --cookies <path>              Path to cookies.txt file for authentication
  --http-proxy <url>            HTTP proxy URL
  --https-proxy <url>           HTTPS proxy URL
  --webshare-proxy-username <u> Webshare proxy username
  --webshare-proxy-password <p> Webshare proxy password
  --help, -h                    Show this help message
```

### CLI Examples

```bash
# Basic usage
npx ai-youtube-transcript dQw4w9WgXcQ

# Specify languages
npx ai-youtube-transcript dQw4w9WgXcQ --languages fr,en,es

# Output as JSON to a file
npx ai-youtube-transcript dQw4w9WgXcQ --format json --output transcript.json

# Translate to German
npx ai-youtube-transcript dQw4w9WgXcQ --translate de

# List available transcripts
npx ai-youtube-transcript --list-transcripts dQw4w9WgXcQ

# Use with proxy
npx ai-youtube-transcript dQw4w9WgXcQ --webshare-proxy-username "user" --webshare-proxy-password "pass"
```

## API Reference

### YoutubeTranscript

The main class for retrieving transcripts from YouTube videos.

#### Constructor

```javascript
new YoutubeTranscript(cookiePath?: string, proxyConfig?: ProxyConfig)
```

- `cookiePath` (optional): Path to a cookies.txt file for authentication
- `proxyConfig` (optional): Proxy configuration for handling IP bans

#### Methods

- `fetch(videoId: string, config?: TranscriptConfig): Promise<FetchedTranscript>`
  - Fetches a transcript for the specified video
  - `videoId`: YouTube video ID or URL
  - `config`: Configuration options (languages, formatting)

- `list(videoId: string): Promise<TranscriptList>`
  - Lists all available transcripts for the specified video
  - `videoId`: YouTube video ID or URL

- `static fetchTranscript(videoId: string, config?: TranscriptConfig): Promise<TranscriptResponse[]>`
  - Legacy static method for backward compatibility
  - Returns raw transcript data

### Transcript

Represents a transcript with metadata.

#### Properties

- `videoId`: YouTube video ID
- `language`: Language name
- `languageCode`: Language code
- `isGenerated`: Whether the transcript is auto-generated
- `isTranslatable`: Whether the transcript can be translated
- `translationLanguages`: Available translation languages

#### Methods

- `fetch(preserveFormatting?: boolean): Promise<FetchedTranscript>`
  - Fetches the actual transcript data
  - `preserveFormatting`: Whether to preserve HTML formatting

- `translate(languageCode: string): Transcript`
  - Translates the transcript to another language
  - `languageCode`: Target language code

### TranscriptList

Represents a list of available transcripts for a video.

#### Methods

- `findTranscript(languageCodes: string[]): Transcript`
  - Finds a transcript in the specified languages
  - `languageCodes`: List of language codes in order of preference

- `findManuallyCreatedTranscript(languageCodes: string[]): Transcript`
  - Finds a manually created transcript in the specified languages

- `findGeneratedTranscript(languageCodes: string[]): Transcript`
  - Finds an auto-generated transcript in the specified languages

- `getTranscripts(): Transcript[]`
  - Gets all available transcripts

### FetchedTranscript

Represents the actual transcript data with snippets.

#### Properties

- `snippets`: Array of transcript snippets
- `videoId`: YouTube video ID
- `language`: Language name
- `languageCode`: Language code
- `isGenerated`: Whether the transcript is auto-generated
- `length`: Number of snippets

#### Methods

- `toRawData(): TranscriptResponse[]`
  - Converts to raw data format

- `getText(): string`
  - Gets the full transcript text

### Formatters

#### JSONFormatter

```javascript
const formatter = new JSONFormatter();
const output = formatter.formatTranscript(transcript, { indent: 2 });
```

#### TextFormatter

```javascript
const formatter = new TextFormatter();
const output = formatter.formatTranscript(transcript);
```

#### SRTFormatter

```javascript
const formatter = new SRTFormatter();
const output = formatter.formatTranscript(transcript);
```

### Proxy Support

#### GenericProxyConfig

```javascript
const proxyConfig = new GenericProxyConfig(
  'http://username:password@proxy-host:port', // HTTP proxy URL
  'https://username:password@proxy-host:port' // HTTPS proxy URL
);
```

#### WebshareProxyConfig

```javascript
const proxyConfig = new WebshareProxyConfig(
  'username', // Webshare username
  'password'  // Webshare password
);
```

## Troubleshooting

### Common Errors

#### No Transcripts Available

If you get a `YoutubeTranscriptNotAvailableError`, it means the video doesn't have any transcripts available. This can happen if:

- The video owner has disabled transcripts
- The video is too new and transcripts haven't been generated yet
- The video is private or deleted

#### Language Not Available

If you get a `YoutubeTranscriptNotAvailableLanguageError`, it means the requested language is not available for this video. Use the `list` method to see available languages:

```javascript
ytTranscript.list('VIDEO_ID')
  .then(transcriptList => {
    console.log('Available languages:');
    for (const transcript of transcriptList) {
      console.log(`- ${transcript.languageCode} (${transcript.language})`);
    }
  });
```

#### Too Many Requests

If you get a `YoutubeTranscriptTooManyRequestError`, it means YouTube is blocking your requests due to rate limiting. Solutions:

1. Wait and try again later
2. Use a proxy (see [Using Proxies](#using-proxies-to-handle-ip-bans))
3. Use authentication with cookies (see [Authentication](#authentication-for-age-restricted-videos))

#### Invalid Video ID

If you get an error about an invalid video ID, make sure you're using a correct YouTube video ID or URL. The library supports various URL formats:

```javascript
// All of these are valid
ytTranscript.fetch('dQw4w9WgXcQ');
ytTranscript.fetch('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
ytTranscript.fetch('https://youtu.be/dQw4w9WgXcQ');
ytTranscript.fetch('https://www.youtube.com/embed/dQw4w9WgXcQ');
```

### Error Handling

It's recommended to implement proper error handling in your application:

```javascript
ytTranscript.fetch('VIDEO_ID')
  .then(transcript => {
    // Success
    console.log(transcript.getText());
  })
  .catch(error => {
    if (error.name === 'YoutubeTranscriptNotAvailableError') {
      console.error('No transcripts available for this video');
    } else if (error.name === 'YoutubeTranscriptNotAvailableLanguageError') {
      console.error('Requested language not available');
    } else if (error.name === 'YoutubeTranscriptTooManyRequestError') {
      console.error('Rate limited by YouTube, try again later or use a proxy');
    } else {
      console.error('Unexpected error:', error.message);
    }
  });
```

## Development

### Setting Up

1. Clone the repository:

```bash
git clone https://github.com/yourusername/ai-youtube-transcript.git
cd ai-youtube-transcript
```

2. Install dependencies:

```bash
npm install
```

3. Build the project:

```bash
npm run build
```

### Running Tests

The project includes both unit and integration tests:

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage
```

## Contributing

Contributions are welcome! Here's how you can contribute:

1. Fork the repository
2. Create a new branch: `git checkout -b feature/your-feature-name`
3. Make your changes
4. Run tests: `npm test`
5. Commit your changes: `git commit -m 'Add some feature'`
6. Push to the branch: `git push origin feature/your-feature-name`
7. Submit a pull request

Please make sure your code follows the existing style and includes appropriate tests.

## Warning

This package uses an undocumented part of the YouTube API, which is called by the YouTube web client. There is no guarantee that it won't stop working if YouTube changes their API. We will do our best to keep it updated if that happens.

## License

**[MIT](LICENSE)** Licensed
