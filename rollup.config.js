import typescript from 'rollup-plugin-typescript2';

// Base configuration for library builds
const baseConfig = {
  input: 'src/new-index.ts',
  plugins: [typescript()],
  external: ['phin', 'fs'],
};

const buildFormats = [];

// ES Module build
const esConfig = {
  ...baseConfig,
  output: {
    file: 'dist/youtube-transcript.esm.js',
    format: 'esm',
  },
};
buildFormats.push(esConfig);

// CommonJS build
const cjsConfig = {
  ...baseConfig,
  output: {
    compact: true,
    file: 'dist/youtube-transcript.common.js',
    format: 'cjs',
    name: 'YoutubeTranscript',
    exports: 'named',
  },
};
buildFormats.push(cjsConfig);

// CLI build
const cliConfig = {
  input: 'src/cli.ts',
  plugins: [typescript()],
  external: ['fs', 'path'],
  output: {
    banner: '#!/usr/bin/env node',
    file: 'dist/cli.js',
    format: 'cjs',
    exports: 'auto',
  },
};
buildFormats.push(cliConfig);

// Export config
export default buildFormats;
