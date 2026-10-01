import c from 'chalk'
import fs from 'fs'
import path from 'path'
import pino from 'pino'
import { default as makeWASocket, useMultiFileAuthState, makeCacheableSignalKeyStore } from 'baileys'
import { cleanMsg, filter, filterMsg, getMetadata, replaceLid, saveLidCache, stubEncode, autoBlock, setpp } from './function.js'
import { rct_key } from './reaction.js'
import { signal } from '../cmd/interactive.js'
import { handleCmd, ev } from '../cmd/handle.js'
import { jadibotConnect } from '../connect/evConnect.js'
import { getVers } from '../connect/version/version.js'
import { getMessageContent, sendMsg } from './msg.js'
import { txtWlc, txtLft, bangc, banned, mode, loadCht } from './sys.js'
import { event, gcFilter } from './helper.js'
import { addChat } from './db/data.js'

global.client = global.client || {}

const participantQueue = new Map()

const makeSimpleStore = () => {
  const msg = {},
        loadMessage = async (remoteJid, id) =>
          msg[remoteJid]?.find(m => m.key?.id === id) || null,
        bind = ev => {
          ev.on('messages.upsert', ({ messages }) => {
            if (!Array.isArray(messages)) return
            for (const m of messages) {
              const jid = m.key?.remoteJid
              if (!jid) continue
              const arr = msg[jid] ||= []
              if (!arr.find(x => x.key?.id === m.key?.id)) {
                arr.push(m)
                if (arr.length > 100) arr.shift()
              }
            }
          })
        }

  return { bind, loadMessage }
}

async function evJadiBot(from) {
  global.client[from] ? (async () => {
    try {
      global.client[from].ws.close()
    } catch {}

    delete global.client[from]
  })() : null

  const sessionFolder = path.join('./connect', from.replace(/[^0-9]/g, '')),
        { state, saveCreds } = await useMultiFileAuthState(sessionFolder),
        store = makeSimpleStore(),
        xp = makeWASocket({
          version: getVers(),
          logger: pino({ level: 'silent' }),
          browser: ['Ubuntu', 'Chrome', '20.0.04'],
          auth: state
        })

  xp.ev.on('creds.update', data => saveCreds(data))

  xp.reactionCache ??= new Map()
  await setpp({ xp })
  await sendMsg({ xp })

  store.bind(xp.ev)

  let pairingCode = null

  if (!state.creds?.registered) {
    try {
      const cleanNumber = String(from).replace(/[^0-9]/g, '')

      await new Promise(r => setTimeout(r, 2e3))

      const code = await xp.requestPairingCode(cleanNumber)

      pairingCode = (code || '').match(/.{1,4}/g)?.join('-') || ''
    } catch {
      return
    }
  }

  xp.ev.on('messages.upsert', async ({ messages }) => {
    for (let m of messages) {
      if (m?.message?.messageContextInfo?.deviceListMetadata && !Object.keys(m.message).some(k => k === 'conversation' || k === 'extendedTextMessage')) continue

      if (m.key?.noBot) continue

      m = cleanMsg(m)
      m = replaceLid(m)
      m = stubEncode(m)

      const botId = xp.user?.id?.split(':')[0] || xp.user?.id || '',
            prtNum = m?.participant?.split(':')[0],
            sendNum = m.key?.participantAlt || m.key?.participant || m.key?.remoteJid || '',
            num = prtNum || sendNum?.replace(/@s\.whatsapp\.net$/, '')

      m.key.jadibot = botId

      if (!global.loadChat && (!m.messageTimestamp || !loadCht(m.messageTimestamp))) continue

      const chat = global.chat(m, botName),
            time = global.time.timeIndo('Asia/Jakarta', 'HH:mm'),
            meta = chat.group ? (groupCache.get(chat.id) || await getMetadata(chat.id, xp) || {}) : {},
            groupName = chat.group ? meta?.subject || 'Grup' : chat.channel ? chat.id : '',
            { text, media } = getMessageContent(m),
            name = chat.pushName || chat.sender || chat.id,
            isMode = await mode(xp, chat),
            gcData = chat.group && get.gc(chat.id)

      await rct_key(xp, m)
      await autoBlock(xp, m)

      if (chat.group && Object.keys(meta).length) { await saveLidCache(meta) }

      log(
        c.bgGrey.yellowBright.bold(
          chat.group
            ? `[ ${groupName} | ${name} | Bot Mode ]`
            : chat.channel
              ? `[ ${groupName} ]`
              : `[ ${name} ]`
        ) +
        c.white.bold(' | ') +
        c.blueBright.bold(`[ ${time} ]`)
      )

      ;(media || text) &&
      log(
        c.white.bold(
          [media && `[ ${media} ]`, text && `[ ${text} ]`]
            .filter(Boolean)
            .join(' ')
        )
      )

      addChat(m, xp)

      if (banned(chat) ? log(c.yellowBright.bold(`${chat.sender} diban`)) : chat.group && bangc(chat) ? !0 : !(await filterMsg(m, chat, text))) return

      await event(xp, m)

      if (chat.group) {
        await gcFilter(xp, m, text)
      }

      if (!isMode) return

      if (gcData) {
        const meta = await grupify(xp, m)

        if (!meta) return
        const { usrAdm } = meta

        if (gcData.filter?.mute && !usrAdm) return !1
      }

      if (text || media) {
        xp.reactionCache.set(m.key?.id, m)
        setTimeout(() => xp.reactionCache.delete(m.key?.id), 18e5)
      }

      if (text) await signal(text, m, xp, ev)

      await handleCmd(m?.key ? m : null, xp, store)
    }
  })

  xp.ev.on('group-participants.update', async u => {
    if (!u.id) return
    groupCache.delete(u.id)

    if (u.action !== 'add' && u.action !== 'remove') return

    const gcData = get.gc(u.id),
          isAdd = u.action === 'add',
          cfg = isAdd ? gcData?.filter?.welcome?.welcomeGc : gcData?.filter?.left?.leftGc

    if (!gcData || !cfg) return

    const key = `${u.id}:${u.action}`
    let queue = participantQueue.get(key)

    if (!queue) {
      const ppgc = await xp.profilePictureUrl(u.id, 'image').catch(() => null)

      queue = {
        users: new Set(),
        ppgc,
        timer: setTimeout(async () => {
          try {
            const users = [...queue.users]

            if (!users.length) return

            const meta = await getMetadata(u.id, xp),
                  idToPhone = Object.fromEntries((meta?.participants || []).map(p => [p.id, p.phoneNumber])),
                  { txt } = await (isAdd ? txtWlc : txtLft)(xp, u.id),
                  jids = users.map(pid => pid?.phoneNumber || idToPhone[pid] || pid).filter(Boolean)

            if (!jids.length) return

            const mentions = jids.map(jid => '@' + jid.split('@')[0]),
                  text = txt.replace(/@user|%user/gi, mentions.join(' '))

            await xp.sendMsg(u.id, { text, image: queue.ppgc, mentions: jids })
          } catch {
          } finally {
            participantQueue.delete(key)
          }
        }, 5e3)
      }

      participantQueue.set(key, queue)
    }

    for (const pid of u.participants) {
      queue.users.add(pid)
    }
  })

  xp.ev.on('groups.update', u => 
    u.forEach(async v => {
      if (!v.id) return
      groupCache.delete(v.id)

      const m = await getMetadata(v.id, xp).catch(() => ({})),
            a = v.participantAlt || v.participant || v.author,
            f = a && m?.participants?.length ? m.participants.find(p => p.id === a) : 0
      v.author = f?.phoneNumber || a
    })
  )

  jadibotConnect(
    xp,
    async () => {
      try { xp.ws.close() } catch {}
      await evJadiBot(from)
    },
    sessionFolder,
    from
  )

  global.client[from] = xp
  return { socket: xp, pairingCode }
}

async function jadiBot(xp, from, m, txt) {
  if (global.client[from]) {
    await xp.sendMessage(m.key?.remoteJid, { text: 'Sudah aktif' }, { quoted: m })

    return
  }

  const result = await evJadiBot(from)

  if (!result) {
    await xp.sendMessage(m.key.remoteJid, { text: 'Gagal membuat jadibot' }, { quoted: m })

    return
  }

  const { socket, pairingCode } = result

  global.client[from] = socket

  if (pairingCode) {
    await xp.sendMessage(m.key.remoteJid, { text: txt }, { quoted: m })

    await xp.sendMessage(m.key.remoteJid, { text: `Pairing Code: ${pairingCode}` }, { quoted: m })
  } else {
    await xp.sendMessage(m.key.remoteJid, { text: 'Jadibot aktif' }, { quoted: m })
  }
}

async function loadJadibot() {
  const baseDir = './connect',
        folders = fs.existsSync(baseDir) ? fs.readdirSync(baseDir) : null;

  if (!folders) return;

  for (const folder of folders) {
    const fullPath = path.join(baseDir, folder),
          from = folder;

    if (folder === 'session' || folder === 'version' || !fs.lstatSync(fullPath).isDirectory()) continue

    try { 
      await evJadiBot(from);
    } catch (e) { 
      log(c.redBright.bold('Gagal restore:', from));
      delete global.client[from];
      fs.rmSync(fullPath, { recursive: true, force: true });
    }
  }
}

export { jadiBot, loadJadibot }