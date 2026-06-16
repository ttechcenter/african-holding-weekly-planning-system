import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
// https://vitejs.dev/config/
import obfuscator from "vite-plugin-javascript-obfuscator";

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
   build: {
    sourcemap: false,
    minify: 'esbuild'
  },
  plugins: [
    obfuscator({
      compact: true,
      controlFlowFlattening: true,
      deadCodeInjection: true,
      stringArray: true,
      rotateStringArray: true
    })
  ],
});
