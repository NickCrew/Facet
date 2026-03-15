import { existsSync } from 'node:fs'

const envPath = './.env'

if (existsSync(envPath) && typeof process.loadEnvFile === 'function') {
  process.loadEnvFile(envPath)
}

await import('./server.js')
