import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: './',

  export default defineConfig({
    base: '/ff14market/',  // リポジトリ名に合わせる
    ...
})
