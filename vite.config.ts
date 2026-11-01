import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
// mode "preview" builds a hash-routed, relative-path bundle for static previews
export default defineConfig(({ mode }) => ({
  plugins: [react()],
  base: mode === 'preview' ? './' : '/',
}))
