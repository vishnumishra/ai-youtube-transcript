#!/usr/bin/env node

import {
  YoutubeTranscript,
  JSONFormatter,
  TextFormatter,
  SRTFormatter,
  GenericProxyConfig,
  WebshareProxyConfig,
  FetchedTranscript,
  TranscriptList,
  Transcript
} from '../src/new-index';
import * as fs from 'fs';

// Parse command line arguments
const args = process.argv.slice(2);
const videoIds: string[] = [];
let languages: string[] = ['en'];
let format = 'text';
let outputFile: string | null = null;
let translateTo: string | null = null;
let listTranscripts = false;
let excludeGenerated = false;
let excludeManuallyCreated = false;
let preserveFormatting = false;
let cookiePath: string | null = null;
let httpProxy: string | null = null;
let httpsProxy: string | null = null;
let webshareUsername: string | null = null;
let websharePassword: string | null = null;

// Parse arguments
for (let i = 0; i < args.length; i++) {
  const arg = args[i];
  
  if (arg === '--languages' || arg === '-l') {
    languages = args[++i].split(',');
  } else if (arg === '--format' || arg === '-f') {
    format = args[++i];
  } else if (arg === '--output' || arg === '-o') {
    outputFile = args[++i];
  } else if (arg === '--translate' || arg === '-t') {
    translateTo = args[++i];
  } else if (arg === '--list-transcripts') {
    listTranscripts = true;
  } else if (arg === '--exclude-generated') {
    excludeGenerated = true;
  } else if (arg === '--exclude-manually-created') {
    excludeManuallyCreated = true;
  } else if (arg === '--preserve-formatting') {
    preserveFormatting = true;
  } else if (arg === '--cookies') {
    cookiePath = args[++i];
  } else if (arg === '--http-proxy') {
    httpProxy = args[++i];
  } else if (arg === '--https-proxy') {
    httpsProxy = args[++i];
  } else if (arg === '--webshare-proxy-username') {
    webshareUsername = args[++i];
  } else if (arg === '--webshare-proxy-password') {
    websharePassword = args[++i];
  } else if (arg === '--help' || arg === '-h') {
    printHelp();
    process.exit(0);
  } else if (!arg.startsWith('--')) {
    videoIds.push(arg);
  }
}

// Configure proxy if needed
let proxyConfig = null;
if (webshareUsername && websharePassword) {
  proxyConfig = new WebshareProxyConfig(webshareUsername, websharePassword);
} else if (httpProxy || httpsProxy) {
  proxyConfig = new GenericProxyConfig(httpProxy || undefined, httpsProxy || undefined);
}

// Create YouTube transcript instance
const ytTranscript = new YoutubeTranscript(cookiePath || undefined, proxyConfig);

// Create formatter based on format
let formatter;
switch (format.toLowerCase()) {
  case 'json':
    formatter = new JSONFormatter();
    break;
  case 'srt':
    formatter = new SRTFormatter();
    break;
  case 'text':
  default:
    formatter = new TextFormatter();
    break;
}

// Main function
async function main(): Promise<void> {
  try {
    if (listTranscripts) {
      if (videoIds.length === 0) {
        console.error('Error: Please provide a video ID to list transcripts');
        process.exit(1);
      }
      
      await listAvailableTranscripts(videoIds[0]);
    } else {
      if (videoIds.length === 0) {
        console.error('Error: Please provide at least one video ID');
        process.exit(1);
      }
      
      await fetchTranscripts(videoIds);
    }
  } catch (error) {
    console.error(`Error: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }
}

// List available transcripts
async function listAvailableTranscripts(videoId: string): Promise<void> {
  const transcriptList = await ytTranscript.list(videoId);
  
  console.log(`Available transcripts for video ${videoId}:`);
  console.log('---------------------------------------------');
  
  for (const transcript of transcriptList) {
    console.log(`Language: ${transcript.language} (${transcript.languageCode})`);
    console.log(`Auto-generated: ${transcript.isGenerated ? 'Yes' : 'No'}`);
    console.log(`Translatable: ${transcript.isTranslatable ? 'Yes' : 'No'}`);
    
    if (transcript.isTranslatable && transcript.translationLanguages.length > 0) {
      console.log('Available translations:');
      for (const lang of transcript.translationLanguages) {
        console.log(`  - ${lang.languageName} (${lang.languageCode})`);
      }
    }
    
    console.log('---------------------------------------------');
  }
}

// Fetch transcripts for all video IDs
async function fetchTranscripts(videoIds: string[]): Promise<void> {
  const results: FetchedTranscript[] = [];
  
  for (const videoId of videoIds) {
    try {
      let transcript: Transcript;
      
      // Get the list of available transcripts
      const transcriptList = await ytTranscript.list(videoId);
      
      // Find the appropriate transcript based on options
      if (excludeGenerated) {
        transcript = transcriptList.findManuallyCreatedTranscript(languages);
      } else if (excludeManuallyCreated) {
        transcript = transcriptList.findGeneratedTranscript(languages);
      } else {
        transcript = transcriptList.findTranscript(languages);
      }
      
      // Translate if requested
      if (translateTo) {
        transcript = transcript.translate(translateTo);
      }
      
      // Fetch the transcript data
      const fetchedTranscript = await transcript.fetch(preserveFormatting);
      results.push(fetchedTranscript);
    } catch (error) {
      console.error(`Error fetching transcript for video ${videoId}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  if (results.length === 0) {
    console.error('No transcripts were successfully fetched');
    process.exit(1);
  }
  
  // Format the results
  const formattedOutput = results.length === 1
    ? formatter.formatTranscript(results[0], { indent: 2 })
    : formatter.formatTranscripts(results, { indent: 2 });
  
  // Output the results
  if (outputFile) {
    fs.writeFileSync(outputFile, formattedOutput);
    console.log(`Transcripts written to ${outputFile}`);
  } else {
    console.log(formattedOutput);
  }
}

// Print help information
function printHelp(): void {
  console.log(`
AI YouTube Transcript CLI

Usage:
  ai-youtube-transcript <videoId> [options]
  ai-youtube-transcript --list-transcripts <videoId>

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

Examples:
  ai-youtube-transcript dQw4w9WgXcQ
  ai-youtube-transcript dQw4w9WgXcQ --languages fr,en,es
  ai-youtube-transcript dQw4w9WgXcQ --format json --output transcript.json
  ai-youtube-transcript dQw4w9WgXcQ --translate de
  ai-youtube-transcript --list-transcripts dQw4w9WgXcQ
  `);
}

// Run the main function
main();
