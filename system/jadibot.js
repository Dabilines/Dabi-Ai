import c from 'chalk'
import fs from 'fs'
import path from 'path'
import pino from 'pino'
import { default as makeWASocket, useMultiFileAuthState, makeCacheableSignalKeyStore, fetchLatestBaileysVersion } from 'baileys'
import { afk, cleanMsg, filter, filterMsg, getMetadata, replaceLid, saveLidCache } from './function.js'
import { tebakkata, sambungkata } from './gamefunc.js'
import { rct_key } from './reaction.js'
import { signal } from '../cmd/interactive.js'
import { handleCmd, ev } from '../cmd/handle.js'
import { authFarm, authUser } from './db/data.js'
import { jadibotConnect } from '../connect/evConnect.js'
import getMessageContent from './msg.js'
import { txtWlc, txtLft, bangc, banned, mode } from './sys.js'

global.client = global.client || {}

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
  global.client[from]
    ? (async () => {
        try { global.client[from].ws.close() } catch {}
        delete global.client[from]
      })()
    : null

  const sessionFolder = path.join('./connect', from.replace(/[^0-9]/g, '')),
        { state, saveCreds } = await useMultiFileAuthState(sessionFolder),
        store = makeSimpleStore(),
        { version } = await fetchLatestBaileysVersion(),
        Xp = makeWASocket({
          version,
          logger: pino({ level: 'silent' }),
          browser: ['Ubuntu', 'Chrome', '20.0.04'],
          auth: state
        })

  Xp.ev.on('creds.update', saveCreds)
  Xp.reactionCache ??= new Map()
  store.bind(Xp.ev)

  Xp.ev.on('connection.update', ({ connection, lastDisconnect }) => null)

  let pairingCode = null,
      ft

  if (!state.creds?.registered) {
    try {
      const cleanNumber = String(from).replace(/[^0-9]/g, '')

      await new Promise(r => setTimeout(r, 2000))

      const code = await Xp.requestPairingCode(cleanNumber)
      pairingCode = (code || '').match(/.{1,4}/g)?.join('-') || ''
    } catch (e) {
      return
    }
  }

  Xp.ev.on('messages.upsert', async ({ messages }) => {
    for (let m of messages) {
      if (m?.message?.messageContextInfo?.deviceListMetadata && !Object.keys(m.message).some(k => k === 'conversation' || k === 'extendedTextMessage')) continue

      m = cleanMsg(m)
      m = replaceLid(m)

      const botId = Xp.user?.id?.split(':')[0] || Xp.user?.id || '',
            prtNum = m?.participant?.split(':')[0],
            sendNum = m.key?.participantAlt || m.key?.participant || m.key?.remoteJid || '',
            num = prtNum || sendNum?.replace(/@s\.whatsapp\.net$/, '')

      m.key.jadibot = num === botId

      const chat = global.chat(m, botName),
            time = global.time.timeIndo('Asia/Jakarta', 'HH:mm'),
            meta = chat.group
              ? (groupCache.get(chat.id) || await getMetadata(chat.id, Xp) || {})
              : {},
            groupName = chat.group ? meta?.subject || 'Grup' : chat.channel ? chat.id : '',
            { text, media } = getMessageContent(m),
            name = chat.pushName || chat.sender || chat.id,
            isMode = await mode(Xp, chat),
            gcData = chat.group && get.gc(chat.id)

      await rct_key(Xp, m)

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

      await authUser(m)

      if (banned(chat)) return log(c.yellowBright.bold(`${chat.sender} diban`))
      if (chat.group && bangc(chat)) return
      if (!(await filterMsg(m, chat, text))) return

      await authFarm(m)
      await afk(Xp, m)
      await sambungkata(Xp, m)
      await tebakkata(Xp, m)

      if (chat.group) {
        ft = await filter(Xp, m, text)
        ft && (
          ft.antiLink(),
          ft.antiTagSw(),
          ft.badword(),
          ft.antiCh(),
          ft.antitag(),
          ft.autoback()
        )
      }

      if (!isMode) return

      if (gcData) {
        const meta = await grupify(Xp, m)

        if (!meta) return
        const { usrAdm } = meta

        if (gcData.filter?.mute && !usrAdm) return !1
      }

      if (text || media) {
        Xp.reactionCache.set(m.key?.id, m)
        setTimeout(() => Xp.reactionCache.delete(m.key?.id), 18e5)
      }

      if (text) await signal(text, m, Xp, ev)

      await handleCmd(m?.key ? m : null, Xp, store)
    }
  })

  Xp.ev.on('group-participants.update', async u => {
    if (!u.id) return
    groupCache.delete(u.id)

    const meta = await getMetadata(u.id, Xp),
          g = meta?.subject || 'Grup',
          idToPhone = Object.fromEntries((meta?.participants || []).map(p => [p.id, p.phoneNumber]))

    for (const pid of u.participants) {
      const phone = pid.phoneNumber || idToPhone[pid],
            msg = u.action === 'add' ? c.greenBright.bold(`+ ${phone} joined ${g}`) :
                  u.action === 'remove'  ? c.redBright.bold(`- ${phone} left ${g}`) :
                  u.action === 'promote' ? c.magentaBright.bold(`${phone} promoted in ${g}`) :
                  u.action === 'demote'  ? c.cyanBright.bold(`${phone} demoted in ${g}`) : ''

      if (u.action === 'add' || u.action === 'remove') {
        const gcData = get.gc({ id: u.id }),
              isAdd = u.action === 'add',
              cfg = isAdd ? gcData?.filter?.welcome?.welcomeGc : gcData?.filter?.left?.leftGc

        if (!gcData || !cfg) return

        const id = { id: u.id },
              { txt } = await (isAdd ? txtWlc : txtLft)(Xp, id),
              jid = pid.phoneNumber || idToPhone[pid],
              mention = '@' + (jid?.split('@')[0] || jid),
              text = txt.replace(/@user|%user/gi, mention)

        await Xp.sendMessage(u.id, { text, mentions: [jid] })
      }
    }
  })

  Xp.ev.on('groups.update', u => 
    u.forEach(async v => {
      if (!v.id) return
      groupCache.delete(v.id)

      const m = await getMetadata(v.id, Xp).catch(() => ({})),
            a = v.participantAlt || v.participant || v.author,
            f = a && m?.participants?.length ? m.participants.find(p => p.id === a) : 0
      v.author = f?.phoneNumber || a
    })
  )

  jadibotConnect(
    Xp,
    async () => {
      try { Xp.ws.close() } catch {}
      await evJadiBot(from)
    },
    sessionFolder,
    from
  )

  global.client[from] = Xp
  return { socket: Xp, pairingCode }
}

async function jadiBot(xp, from, m, txt) {
  if (global.client[from])
    return xp.sendMessage(m.key?.remoteJid, { text: 'Sudah aktif' }, { quoted: m })

  const result = await evJadiBot(from)

  if (!result) return xp.sendMessage(m.key.remoteJid, { text: 'Gagal membuat jadibot' }, { quoted: m })

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

    if (folder === 'session') continue;

    if (!fs.lstatSync(fullPath).isDirectory()) continue;

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