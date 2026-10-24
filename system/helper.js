import fs from 'fs'
import path from 'path'
import moment from 'moment-timezone'
import { authUser, authFarm } from './db/data.js'
import { kickSider, afk, filter } from './function.js'
import { tebakkata, sambungkata, tebakGambar, tebakdadu, tebakml, cekCp, putus } from './gamefunc.js'
import { randomTxt } from './msg.js'
import { writeExifImg, writeExifVid } from './exif.js'

const msgCache = new Map()

const number = input => {
  const digits = String(input).replace(/\D/g, '')
  return digits.startsWith('0') ? '62' + digits.slice(1) : digits
}

function trimSender(sender) {
  try {
    if (!sender) return !1

    return sender?.endsWith('@lid') || sender?.endsWith('@s.whatsapp.net') ? sender.split('@')[0] : undefined
  } catch (e) {
    saveErr(e, 'trimSender')
    return !1
  }
}

const own = (m) => {
  const chat = global.chat(m),
        sender = trimSender(chat.sender),
        number = Array.isArray(ownerNumber) ? ownerNumber.map(n => n.replace(/\D/g, '')) : [ownerNumber?.replace(/\D/g, '')]

  return number.includes(sender)
}

const prem = (m) => {
  const chat = global.chat(m)
  return get.db(chat.sender)?.prem?.status === !0
}

const makeInMemoryStore = () => {
  const msg = {},
        loadMsg = async (remoteJid, stanzaId) => msg[remoteJid]?.array?.find(m => m.id === stanzaId) || null,
        bind = (ev) => {
          ev.on('messages.upsert', ({ messages }) => {
            if (!Array.isArray(messages)) return
            for (const m of messages) {
              const jid = m.key?.remoteJid
              if (!jid) continue

              const store = msg[jid] ||= { array: [] }

              if (!store.array.find(x => x.key?.id === m.key?.id)) {
                store.array.push({ id: m.key.id, msg: m.message })
                store.array.length > 50 && store.array.shift()
              }
            }
          })
        }

  return { msg, bind, loadMsg }
}

async function channelFollow(xp, id) {
  if (!xp?.newsletterFollow || !id || !String(id).includes('@newsletter'))
    return {
      status: !1,
      message: null
    }

  try {
    await xp.newsletterFollow(id)
    return
  } catch (e) {
    if (e?.message?.includes('unexpected response structure') || e?.message?.includes('Failed to newsletter follow')) {
      return
    }

    return
  }
}

async function autoSt(xp, m) {
  try {
    if (!global.autoStc) return !1

    const img = m.message?.imageMessage,
          vid = m.message?.videoMessage,
          msg = img || vid,
          chat = global.chat(m)

    if (!msg || msg.caption || get.gc(chat.id)?.filter?.autostiker === !1) return !1

    const media = await downloadMedia(xp, 's', m, null)

    if (!media) return xp.sendMessage(chat.id, { text: 'gagal mengunduh media, ulangi' }, { quoted: m })

    const pack = { packname: global.footer, author: chat.pushName },
          Spath = img ? await writeExifImg(media, pack) : await writeExifVid(media, pack)

    if (!Spath) return xp.sendMessage(chat.id, { text: 'gagal membuat stiker' }, { quoted: m })

    if (!fs.existsSync(Spath)) return !1

    await xp.sendMessage(chat.id, { sticker: fs.readFileSync(Spath) }, { quoted: m })

    if (fs.existsSync(Spath)) fs.unlinkSync(Spath)

    return !0
  } catch (e) {
    saveErr(e, 'autoSt')
    return !1
  }
}

async function event(xp, m) {
  await authUser(m)
  await authFarm(m)
  await kickSider(xp, m)
  if (await afk(xp, m)) return
  await autoSt(xp, m)
  await tebakkata(xp, m)
  await sambungkata(xp, m)
  await tebakGambar(xp, m)
  await tebakdadu(xp, m)
  await tebakml(xp, m)
  await cekCp(xp, m)
  await putus(xp, m)
  await randomTxt(xp, m)
}

async function gcFilter(xp, m, text) {
  const ft = await filter(xp, m, text)

  if (ft) {
    ft.antiLink()
    ft.antimedia()
    ft.antidelete()
    ft.antiTagSw()
    ft.antistiker()
    ft.badword()
    ft.antiCh()
    ft.antitag()
    ft.autoback()
    ft.antiSpam()
    ft.antikudet()
    ft.antiswgc()
  }
}

export {
  number,
  own,
  event,
  prem,
  gcFilter,
  makeInMemoryStore,
  channelFollow,
  trimSender
}