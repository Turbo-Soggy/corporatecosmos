import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: { port: 5173, open: true },
  // Remotion's Player ships its own React peer; without deduping, Vite's dep
  // pre-bundle pulls in a 2nd React copy → "Invalid hook call". Force one React.
  resolve: { dedupe: ['react', 'react-dom'] },
  optimizeDeps: { include: ['react', 'react-dom', 'remotion', '@remotion/player'] },
});
