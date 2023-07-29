import { defineConfig } from 'vite';
import basicSsl from '@vitejs/plugin-basic-ssl';
import react from '@vitejs/plugin-react';
import { viteStaticCopy } from 'vite-plugin-static-copy'
// https://vitejs.dev/config/

export default defineConfig(async ({ command, mode, ssrBuild }) => {
  let baseConfigObj = {
    preview: {
      https: true,
      host: '0.0.0.0',
      open: true,
      port: 3000,
      cors: true,
    },
    build: {
      rollupOptions: {
        input: `./index.html`,
      }
    },
    server: {
      port: 3000,
      host: '0.0.0.0',
      https: true,
      cors: true,
      open: 'localhost',
      strictPort: true,
    },
    // NOTE: vite (and webpack / react-scripts) treats the 'process' variable in a funky way (they do a straight string replace, the process variable is replaced by a constant), so we have to create these special "defines" for our
    // third party libraries to play nice
    define: {
      'CONSTANTS.SINGLE_SPA_ENABLED': "'stand-alone'",
      'process.env[NODE_ENV]': mode === 'production' ? '"production"' : '"development"',
      'process.env.NODE_ENV': mode === 'production' ? '"production"' : '"development"',
    },
    plugins: [react({
      template: {
        transformAssetUrls: {
          base: '/src',
        },
      },
    }),
    basicSsl(),
    viteStaticCopy({
      targets: [
        { src: './manifest.json', dest: './' },
        { src: './service-worker.js', dest: './' },
        { src: './icons/*', dest: './icons' },
        { src: './screenshots/*', dest: './' },
        // Add more src-dest pairs as needed
      ],
      hook: 'writeBundle' // This is important
    })
    ],
  };
  // add our single-spa specific options
  if (process.env._SINGLE_SPA_ === 'single-spa') {
    baseConfigObj = {
      ...baseConfigObj,
      // NOTE: vite (and webpack / react-scripts) treats the 'process' variable in a funky way (they do a straight string replace, the process variable is replaced by a constant), so we have to create these special "defines" for our
      // third party libraries to play nice
      define: {
        'process.env[NODE_ENV]': mode === 'production' ? '"production"' : '"development"',
        'process.env.NODE_ENV': mode === 'production' ? '"production"' : '"development"',
        'CONSTANTS.SINGLE_SPA_ENABLED': "'single-spa'",
      },
      build: {
        rollupOptions: {
          preserveEntrySignatures: true,
          input: 'src/microapp.jsx',
          output: {
            assetFileNames: `[name][extname]`,
            chunkFileNames: `[name][extname]`,
            entryFileNames: `[name].js`,
            manualChunks: {},
            dir: 'dist',
            format: 'system',
          }
        },
      },
      preview: {
        port: 3000,
        host: 'local.buildingbrain.com',
        https: true,
        cors: true,
        open: 'https://local.buildingbrain.com',
        strictPort: true,
      },
      server: {
        port: 3000,
        host: 'local.buildingbrain.com',
        https: true,
        cors: true,
        open: 'https://local.buildingbrain.com',
        strictPort: true,
      },
    };
  }

  return baseConfigObj;
});
