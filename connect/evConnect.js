import { DisconnectReason } from 'baileys'
import c from 'chalk'
import fs from 'fs'
import path from 'path'
import { loadJadibot } from '../system/jadibot.js'
import { channelFollow } from '../system/helper.js'

const sessionPath = path.join(dirname, '../connect/session')

async function initReadline() {
  if (global.rl && !global.rl.closed) return
  const { createInterface } = await import('readline')
  global.rl = createInterface({ input: process.stdin, output: process.stdout })
  global.q = t => new Promise(r => global.rl.question(t, r))
}

const removeSessi = async restart => {
  try {
    fs.existsSync(sessionPath)
      ? fs.rmSync(sessionPath, { recursive: !0, force: !0 })
      : log(c.redBright.bold('Folder session tidak ada:', sessionPath))
  } catch (e) {
    err(c.redBright.bold('Gagal hapus session:', e))
  }
  log(c.yellowBright.bold('Restarting...'))
  setTimeout(restart, 5e2)
}

const handleSessi = async (msg, restart) => {
  err(c.redBright.bold('Session error:'), msg)
  await initReadline()
  const ans = await q(c.yellowBright.bold('Hapus session & restart? (y/n): '))
  if (['y', 'ya'].includes(ans.toLowerCase())) {
    await removeSessi(restart)
  } else {
    log(c.greenBright.bold('Bot dihentikan'))
    process.exit(0)
  }
}

let retryCount = 0, retryTimeout = null
const tryReconnect = async restart => {
  if (++retryCount <= 3) return restart()
  if (retryCount <= 6) {
    if (retryCount === 4) {
      retryTimeout = setTimeout(() => {
        retryTimeout = null
        restart()
      }, 6e4)
      return
    }
    return restart()
  }
  log(c.redBright.bold('Reconnect gagal'))
  retryCount = 0
  retryTimeout && clearTimeout(retryTimeout)
  await handleSessi('Session bermasalah', restart)
}

function evConnect(xp, restart) {
  xp.ev.on('connection.update', async ({ connection, lastDisconnect }) => {
    if (connection === 'close') {
      const r = lastDisconnect?.error?.output?.statusCode
      log(c.redBright.bold('Koneksi tertutup, status:', r))
      switch (r) {
        case DisconnectReason.badSession:
          return handleSessi('Session rusak', restart)
        case DisconnectReason.loggedOut:
          return handleSessi('Logout dari perangkat lain', restart)
        case DisconnectReason.connectionClosed:
        case DisconnectReason.connectionLost:
        case DisconnectReason.timedOut:
        case 428:
          return tryReconnect(restart)
        case DisconnectReason.restartRequired:
          log(c.yellowBright.bold('Restart diperlukan'))
          return restart()
        default:
          log(c.yellowBright.bold('Disconnect tidak dikenal, coba reconnect...'))
          return tryReconnect(restart)
      }
    }
    if (connection === 'connecting')
      log(c.yellowBright.bold('Menyambungkan...'))
    if (connection === 'open') {
      log(c.greenBright.bold('Terhubung'))
      retryCount = 0
      await channelFollow(xp, idCh)
      try {
        await loadJadibot()
      } catch (e) {
        err('error pada koneksi', e)
      }
    }
  })
}

function jadibotConnect(Xp, restart, sessiFol, from) {
  let destroyTimer = null,
      sessi = from

  const startDestroyTimer = () => {
    if (destroyTimer) return

    log(c.yellowBright.bold(`Session ${sessi} akan dihapus dalam 5 menit jika tidak reconnect...`))

    destroyTimer = setTimeout(() => {
      try {
        fs.existsSync(sessiFol)
          ? fs.rmSync(sessiFol, { recursive: true, force: true })
          : log(c.redBright.bold('Folder session tidak ada:', sessiFol))
      } catch (e) {
        log(c.redBright.bold('Gagal hapus session:', e))
      }

      delete global.client[from]

      log(c.redBright.bold(`Session ${sessi} dihapus karena timeout 5 menit`))
      destroyTimer = null
    }, 4.2e5)
  }

  const clearDestroyTimer = () => {
    if (!destroyTimer) return
    clearTimeout(destroyTimer)
    destroyTimer = null
    log(c.greenBright.bold('Reconnect berhasil, timer dibatalkan'))
  }

  Xp.ev.on('connection.update', async ({ connection, lastDisconnect }) => {

    if (connection === 'close') {
      const r = lastDisconnect?.error?.output?.statusCode
      log(c.redBright.bold(`${sessi} koneksi tertutup, status:`, r))

      switch (r) {
        case DisconnectReason.badSession:
        case DisconnectReason.loggedOut:
        case DisconnectReason.connectionClosed:
        case DisconnectReason.connectionLost:
        case DisconnectReason.timedOut:
        case 428:
          startDestroyTimer()
          return restart()

        case DisconnectReason.restartRequired:
          console.log(c.yellowBright.bold('Restart diperlukan'))
          return restart()

        default:
          startDestroyTimer()
          return restart()
      }
    }

    if (connection === 'connecting')
      log(c.yellowBright.bold(`menyambungkan ${sessi}...`))

    if (connection === 'open') {
      log(c.greenBright.bold(`${sessi} berhasil terhubung`))
      clearDestroyTimer()
      await channelFollow(Xp, idCh)
    }
  })
}

export { evConnect, jadibotConnect, handleSessi }