import fs from 'fs'
import path from 'path'
import moment from 'moment-timezone'
import { authUser, authFarm } from './db/data.js'
import { kickSider, afk } from './function.js'
import { tebakkata, sambungkata, tebakGambar, tebakdadu, tebakml, cekCp, putus } from './gamefunc.js'
import { randomTxt } from './msg.js'

const msgCache = new Map()

const number = input => {
  const digits = String(input).replace(/\D/g, '')
  return digits.startsWith('0') ? '62' + digits.slice(1) : digits
}

const own = (m) => {
  const chat = global.chat(m),
        sender = chat.sender.replace(/@s\.whatsapp\.net$/, ''),
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

async function event(xp, m) {
  await authUser(m)
  await authFarm(m)
  await kickSider(xp, m)
  if (await afk(xp, m)) return
  await tebakkata(xp, m)
  await sambungkata(xp, m)
  await tebakGambar(xp, m)
  await tebakdadu(xp, m)
  await tebakml(xp, m)
  await cekCp(xp, m)
  await putus(xp, m)
  await randomTxt(xp, m)
}

export {
  number,
  own,
  event,
  prem,
  makeInMemoryStore,
  channelFollow
}