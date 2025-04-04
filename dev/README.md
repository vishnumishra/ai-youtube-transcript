# Development and Debug Files

This directory contains files used for development and debugging purposes. These files are not included in the build bundle and are not required for the package to function.

## Files

- `debug-translations.js`: Script to debug translation functionality by examining available translation languages.
- `debug-youtube-response.js`: Script to capture and analyze the raw YouTube API response.
- `parsed-captions.json`: Sample parsed captions data from YouTube.
- `youtube-response.txt`: Raw HTML response from YouTube containing captions data.

## Usage

These scripts can be used to debug issues with the YouTube transcript API:

```bash
# Debug translation functionality
node dev/debug-translations.js

# Debug YouTube API response
node dev/debug-youtube-response.js
```

## Notes

- These files are for development purposes only and should not be included in the published package.
- The sample response files may become outdated if YouTube changes their API structure.
- If you encounter issues with the package, these scripts can help diagnose problems with the YouTube API response format.
