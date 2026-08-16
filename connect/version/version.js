import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { fetchLatestBaileysVersion } from 'baileys'

const bailvers = path.join(path.dirname(fileURLToPath(import.meta.url)), 'bailvers.json')

export async function createVers() {
  const { version } = await fetchLatestBaileysVersion()
  fs.writeFileSync(bailvers, JSON.stringify({ vers: version }, null, 2))
}

export function getVers() {
  return JSON.parse(fs.readFileSync(bailvers)).vers
}

if (!fs.existsSync(bailvers)) await createVers()