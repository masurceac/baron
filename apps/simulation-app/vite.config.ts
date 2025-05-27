import { removeUseClientDirective } from '@baron/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import checker from 'vite-plugin-checker';
import tsconfigPaths from 'vite-tsconfig-paths';
import tailwindcss from '@tailwindcss/vite';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    tailwindcss(),
    react(),
    tsconfigPaths(),
    removeUseClientDirective(),
    checker({
      typescript: true,
    }),
  ],
  server: {
    port: 2300,
  },
});
