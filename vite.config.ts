import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import basicSsl from '@vitejs/plugin-basic-ssl'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    process.env.HTTPS === 'true' ? basicSsl() : null,
  ].filter(Boolean),
  server: { port: 5173, strictPort: true },
})
