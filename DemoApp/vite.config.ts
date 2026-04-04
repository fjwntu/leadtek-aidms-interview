import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const frontendPort = Number(env.FRONTEND_PORT) || 3000;
  const apiPort = Number(env.API_PORT) || Number(env.METRICS_PORT) || 4000;

  return {
    plugins: [react()],
    server: {
      port: frontendPort,
      proxy: {
        '/api': {
          target: `http://localhost:${apiPort}`,
          changeOrigin: true,
        },
      },
    },
  };
});
