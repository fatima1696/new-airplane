import {Config} from '@remotion/cli/config';

// Three.js needs an OpenGL backend in headless Chromium.
//  - on your own computer (has a GPU): 'angle'
//  - on GitHub Actions / any CPU-only machine (CI=true): 'swangle' (software, slower but works)
Config.setChromiumOpenGlRenderer(process.env.CI ? 'swangle' : 'angle');
Config.setVideoImageFormat('jpeg');
Config.setJpegQuality(95);
Config.setCodec('h264');
Config.setCrf(16);
Config.setOverwriteOutput(true);
