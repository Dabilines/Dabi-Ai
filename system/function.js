import fetch from 'node-fetch'
import fs from 'fs'
import path from 'path'
import jimp from 'jimp'
import { isJidGroup, jidNormalizedUser, downloadMediaMessage, prepareWAMessageMedia } from 'baileys'
import { bnk, dbsider, delGc, dbchat } from './db/data.js'
import { ev } from '../cmd/handle.js'
import { own } from '../system/helper.js'

const memoryCache = {},
      groupCache = new Map(),
      spamData = {}

let antispam = new Map()

async function getMetadata(id, xp, retry = 2) {
  if (groupCache.has(id)) return groupCache.get(id)
  try {
    const m = await xp.groupMetadata(id)
    groupCache.set(id, m)
    setTimeout(() => groupCache.delete(id), 12e4)
    return m
  } catch (e) {
    return retry > 0 ? (await new Promise(r => setTimeout(r, 1e3)), getMetadata(id, xp, retry - 1)) : null
  }
}

async function saveLidCache(metadata) {
  for (const p of metadata?.participants || []) {
    const phone = p.phoneNumber?.replace(/@.*/, ""),
          lid = p.id?.endsWith("@lid") ? p.id : null
    if (phone && lid) global.lidCache[phone] = lid
  }
}

function replaceLid(o, m = {}, v = new WeakSet()) {
  if (!o) return o

  if (typeof o == 'object') {
    if (v.has(o)) return o
    v.add(o)

    const arr = Array.isArray(o),
          buf = Buffer.isBuffer(o) || o instanceof Uint8Array,
          lid = o.lid?.endsWith('@lid') ? o.lid : o.participant?.endsWith('@lid') ? o.participant : null

    if (lid && o.participantAlt?.endsWith('@s.whatsapp.net')) m[lid] = o.participantAlt

    if (arr || buf) return arr ? o.map(i => replaceLid(i, m, v)) : o

    for (const k in o) o[k] = k == 'lid' ? o[k] : replaceLid(o[k], m, v)

    return o
  }

  if (typeof o == 'string') {
    const alt = m[o],
          e = Object.entries(global.lidCache ?? {}),
          lid = /@lid$/.test(o)

    if (alt) return alt

    if (lid) {
      const p = e.find(([, v]) => v == o)?.[0]

      if (p) return `${p}@s.whatsapp.net`
    }

    return o.replace(/@(\d+)@lid/g, (_, i) => {
        const alt = m[`${i}@lid`],
              p = e.find(([, v]) => v == `${i}@lid`)?.[0]

        if (alt || p) return `@${(alt || `${p}@s.whatsapp.net`).replace(/@s\.whatsapp\.net$/, '')}`

        return `@${i}@lid`
      }).replace(/@(\d+)(?!@)/g, (s, i) => {
        const alt = m[`${i}@lid`],
              p = e.find(([, v]) => v == `${i}@lid`)?.[0]

        if (alt || p) return `@${(alt || `${p}@s.whatsapp.net`).replace(/@s\.whatsapp\.net$/, '')}`

        return s
      })
  }

  return o
}

function stubEncode(m) {
  const params = m?.messageStubParameters || [],
        stub = {}

  for (let i = 0; i < params.length; i++) {
    const raw = params[i]

    if (typeof raw !== 'string') continue

    let data = null

    try {
      data = JSON.parse(raw)
    } catch {
      data = null
    }

    if (data && typeof data === 'object') {
      for (const k in data) {
        const key = k === 'phoneNumber' ? 'pn' : k

        stub[key] = data[k]
      }
    } else {
      stub[raw] = !0
    }
  }

  if (!Object.keys(stub).length) return m

  m.key = m.key || {}
  m.key.stub = stub

  return m
}

async function addErr(cmd) {
  try {
    const data = ev.cmd.find(u => u.cmd.includes(cmd))
    data && (data.err = (data.err || 0) + 1)
  } catch (e) {
    err('error pada addErr', e)
  }
}

async function saveErr(e, cmd) {
  try {
    const file = path.join(process.cwd(), 'temp', 'output.log'),
          error = e?.stack || String(e)

    let data = ''

    try {
      data = await fs.promises.readFile(file, 'utf8')
    } catch {}

    const regex = new RegExp(`${cmd}: \\{([\\s\\S]*?)\\}`, 'm')

    if (regex.test(data)) {
      data = data.replace(
        regex,
        (_, content) => `${cmd}: {\n${content.trim()}\n\n${error}\n}`
      )
    } else {
      data += `${data ? '\n\n' : ''}${cmd}: {\n${error}\n}`
    }

    await fs.promises.writeFile(file, data)
  } catch (e) {
    err('error pada saveErr', e)
  }
}

async function call(xp, e, m, cmd) {
  try {
    await addErr(cmd)
    await saveErr(e, cmd)

    const err = (typeof e === 'string' ? e : e?.stack || e?.message || String(e)).replace(/file:\/\/\/[^\s)]+/g, '').replace(/at\s+/g, '\n→ ').trim(),
          chat = global.chat(m),
          sender = chat.sender || 'unknown',
          txt = `Tolong bantu jelaskan error ini dengan bahasa alami dan ramah pengguna:\n\n${e}`,
          res = await bell(txt, m, xp)

    res?.msg ? await xp.sendMessage(chat.id, { text: res.msg }, { quoted: m }) : await xp.sendMessage(chat.id, { text: `Gagal memproses error:\n${e || res?.message || 'tidak diketahui'}` }, { quoted: m })
  } catch (errSend) {
    await xp.sendMessage(m?.chat || m?.key?.remoteJid || 'unknown', { text: `Gagal menjalankan call(): ${errSend?.message || String(errSend)}` }, { quoted: m })
  }
}

const cleanMsg = obj => {
  if (obj == null) return

  if (Array.isArray(obj)) {
    const arr = obj.map(cleanMsg).filter(v => v !== undefined)
    return arr.length ? arr : undefined
  }

  if (typeof obj === 'object') {
    if (Buffer.isBuffer(obj) || ArrayBuffer.isView(obj)) return obj

    obj.participant?.endsWith('@lid') && obj.participantAlt?.endsWith('@s.whatsapp.net') && !obj.lid && (obj.lid = obj.participant)

    const cleaned = Object.entries(obj).reduce((acc, [k, v]) => {
      const c = cleanMsg(v)
      if (c !== undefined) acc[k] = c
      return acc
    }, {})

    return Object.keys(cleaned).length ? cleaned : undefined
  }

  return obj
}

async function func() {
  const url = 'https://raw.githubusercontent.com/Dabilines/Dabi-Ai-Documentation/main/assets/func.js',
        code = await fetch(url).then(r => r.text()),
        data = 'data:text/javascript;base64,' + Buffer.from(code).toString('base64'),
        md = await import(data),
        funcs = md.default

  return Object.assign(global, funcs), funcs
}

async function tebakgambar() {
  if (global.tebakgambar) return global.tebakgambar

  const url = 'https://raw.githubusercontent.com/Dabilines/Dabi-Ai-Documentation/main/assets/db/tebakgambar.json',
        data = await fetch(url).then(r => r.json())

  global.tebakgambar = data

  return data
}

async function filter(xp, m, text) {
  const chat = global.chat(m),
        gcData = get.gc(chat.id),
        meta = await grupify(xp, m)

  if (!meta) return saveErr(meta, 'filter bagian meta')

  const { usrAdm, botAdm, adm } = meta

  const filter = {
    link: async t =>
      typeof t == 'string' &&
      /(?:https?:\/\/)?chat\.whatsapp\.com\/[A-Za-z0-9]{20,24}/i.test(t.trim().replace(/\s+/g, '').replace(/\/{2,}/g, '/')),

    linkCh: async t =>
      typeof t == 'string' &&
      /(?:https?:\/\/)?whatsapp\.com\/channel\/[A-Za-z0-9]+/i.test(t.trim().replace(/\s+/g, '').replace(/\/{2,}/g, '/')),

    antidelete: async () => {
      if (usrAdm || !gcData || !botAdm || !(gcData?.filter?.antidel || !1)) return !1

      const delMsg = m.message?.protocolMessage?.type === 0
      if (!delMsg || m.key?.fromMe) return !1

      const { remoteJid, id } = m.message.protocolMessage.key,
            old = await store.loadMsg(remoteJid, id)

      if (!old) return !1

      const participant = old.key?.participant || old.key?.participantAlt,
            type = Object.keys(old.msg).find(key => [
              "conversation",
              "extendedTextMessage",
              "imageMessage",
              "videoMessage",
              "audioMessage",
              "stickerMessage",
              "documentMessage",
              "contactMessage",
              "contactsArrayMessage",
              "locationMessage",
              "liveLocationMessage"
            ].includes(key)),
            data = type ? old.msg[type] : null

      if (!type) return !1

      const ctx = {
        forwardingScore: 1,
        isForwarded: !0,
        quotedMessage: {
          protocolMessage: m.message.protocolMessage
        },
        stanzaId: id,
        participant,
        remoteJid
      }

      switch (type) {
        case "conversation":
          return xp.sendMessage(remoteJid, {
            text: old.msg.conversation,
            contextInfo: ctx })

        case "extendedTextMessage":
          return xp.sendMessage(remoteJid, {
            text: data.text,
            contextInfo: {
              ...(data.contextInfo || {}),
              ...ctx
            } })

        case "imageMessage": {
          const buffer = await downloadMedia(xp, "fungsi antidel: image", m, old.msg)

          if (!buffer) return

          return xp.sendMessage(remoteJid, {
            image: buffer,
            caption: data.caption,
            contextInfo: {
              ...(data.contextInfo || {}),
              ...ctx
            } })
        }

        case "videoMessage": {
          const buffer = await downloadMedia(xp, "fungsi antidel: video", m, old.msg)

          if (!buffer) return

          return xp.sendMessage(remoteJid, {
            video: buffer,
            caption: data.caption,
            gifPlayback: data.gifPlayback,
            ptv: data.ptv,
            contextInfo: {
              ...(data.contextInfo || {}),
              ...ctx
            } })
        }

        case "audioMessage": {
          const buffer = await downloadMedia(xp, "fungsi antidel: audio", m, old.msg)

          if (!buffer) return

          return xp.sendMessage(remoteJid, {
            audio: buffer,
            mimetype: data.mimetype,
            ptt: data.ptt,
            contextInfo: {
              ...(data.contextInfo || {}),
              ...ctx
            } })
        }

        case "stickerMessage": {
          const buffer = await downloadMedia(xp, "fungsi antidel: stiker", m, old.msg)

          if (!buffer) return

          return xp.sendMessage(remoteJid, {
            sticker: buffer,
            contextInfo: {
              ...(data.contextInfo || {}),
              ...ctx
            } })
        }

        case "documentMessage": {
          const buffer = await downloadMedia(xp, "fungsi antidel: document", m, old.msg)

          if (!buffer) return

          return xp.sendMessage(remoteJid, {
            document: buffer,
            mimetype: data.mimetype,
            fileName: data.fileName,
            caption: data.caption,
            contextInfo: {
              ...(data.contextInfo || {}),
              ...ctx
            } })
        }

        case "contactMessage":
          return xp.sendMessage(remoteJid, {
            contacts: {
              displayName: data.displayName,
              contacts: [{
                vcard: data.vcard
              }]
            },
            contextInfo: {
              ...(data.contextInfo || {}),
              ...ctx
            } })

        case "contactsArrayMessage":
          return xp.sendMessage(remoteJid, {
            contacts: { displayName: data.displayName, contacts: data.contacts },
            contextInfo: {
              ...(data.contextInfo || {}),
              ...ctx
            } })

        case "locationMessage":
        case "liveLocationMessage":
          return xp.sendMessage(remoteJid, { location: { degreesLatitude: data.degreesLatitude, degreesLongitude: data.degreesLongitude, name: data.name, address: data.address },
            contextInfo: {
              ...(data.contextInfo || {}),
              ...ctx
            } })
      }
    },

    antikudet: async () => {
      if (!gcData || !botAdm || !(gcData?.filter?.antikudet || !1)) return !1

      global.antikudet = global.antikudet || {}

      const stub = m.messageStubType,
            botNumber = xp?.user?.id?.split(':')[0] + '@s.whatsapp.net',
            actor = m.participant || chat.sender || null,
            metaGc = groupCache.get(chat.id) || {},
            participants = metaGc?.participants || [],
            db = dbsider?.[chat.id] || {},
            demote = stub === 30,
            promote = stub === 29,
            isKick = stub === 28,
            now = (m.messageTimestamp * 1e3) || Date.now(),
            rawTarget = m.messageStubParameters?.[0] || null,
            parsed = (() => {
              try {
                return typeof rawTarget === 'string' ? JSON.parse(rawTarget) : rawTarget
              } catch {
                return null
              }
            })(),
            target = parsed?.phoneNumber || parsed?.id || rawTarget

      if (!actor || actor === botNumber || !(demote || promote || isKick) || target === botNumber || actor === target || (!target && (demote || promote))) return !1

      let owner = gcData?.owner

      if (!owner) {
        const sorted = Object.entries(db).sort((a, b) => b[1] - a[1])

        owner = sorted?.[0]?.[0] || metaGc?.subjectOwnerPn || null
      }

      const own = actor === owner

      if (own) return !1

      global.antikudet[chat.id] = global.antikudet[chat.id] || {}
      global.antikudet[chat.id][actor] = global.antikudet[chat.id][actor] || {
        start: 0,
        kick: 0
      }

      const data = global.antikudet[chat.id][actor]

      if (isKick && target && !own) {
        (!data.start || (now - data.start > 2e4)) ? (data.start = now, data.kick = 1) : data.kick++

        global.antikudet[chat.id][actor] = data

        if ((data.kick >= 3 || !1) && (now - data.start <= 2e4)) {
          try {
            await xp.groupParticipantsUpdate(chat.id, [actor], 'remove').catch(() => {})

            const tag = `@${actor.split('@')[0]}`
            await xp.sendMsg(chat.id, { type: 'text', text: `peringatan kudeta ${tag} dikeluarkan`, mentions: [actor] }).catch(() => {})
          } catch (e) {
            err(`error`, e)
          }

          delete global.antikudet[chat.id][actor]
          return !0
        }
      }

      if (demote && target) {
        try {
          await xp.groupParticipantsUpdate(chat.id, [target], 'promote').catch(() => {})
        } catch {}
        return !0
      }

      if (promote && target) {
        try {
          await xp.groupParticipantsUpdate(chat.id, [target], 'demote').catch(() => {})

          const tag = `@${actor.split('@')[0]}`
          await xp.sendMsg(chat.id, { type: 'text', text: `${tag} potensi kudeta akan diturunkan`, mentions: [actor]} ).catch(() => {})
        } catch {}
        return !0
      }

      return !1
    },

    antiLink: async () => {
      const txt = m.message?.extendedTextMessage?.text,
            isLink = await filter.link(txt)

      if (!gcData || !botAdm || !gcData?.filter?.antilink || usrAdm || !isLink) return !1

      if (gcData?.resbot === 'kick') return await xp.groupParticipantsUpdate(chat.id, [chat.sender], 'remove').catch(() => {})

      return await xp.sendMessage(chat.id, { delete: m.key }).catch(() => {})
    },

    antimedia: async () => {
      if (!gcData || !botAdm || !(gcData?.filter?.antimedia ? !0 : !1) || usrAdm) return !1

      const cht = m.message,
            img = cht?.imageMessage,
            vid = cht?.videoMessage,
            bot = xp.user?.id?.split(':')[0] + '@s.whatsapp.net'

      if (chat.sender === bot || !cht || (!img && !vid)) return !1

      const media = await downloadMediaMessage({ message: cht }, 'buffer').catch(() => null)

      if (!media) return !1

      const caption = img?.caption || vid?.caption || ''

      await xp.sendMessage(chat.id, { ...(img ? { image: media } : { video: media }), caption, viewOnce: !0 }, { quoted: m })

      await xp.sendMessage(chat.id, { delete: m.key }).catch(() => !1)

      return !0
    },

    antiSpam: async () => {
      const cht = m.message,
            now = (m.messageTimestamp * 1e3) || Date.now(),
            limit = 6,
            window = 2e4,
            bot = xp.user?.id?.split(':')[0] + '@s.whatsapp.net',
            data = antispam.get(chat.sender)

      if (!gcData || !botAdm || chat.sender === bot || !(gcData?.filter?.antispam ? !0 : !1) || usrAdm || !cht) return !1

      if (!data || (now - data.start > window))
        antispam.set(chat.sender, { start: now, chat: 1 })
      else
        data.chat++,
        antispam.set(chat.sender, data)

      const usr = antispam.get(chat.sender)

      if ((usr.chat > limit || !1) && (now - usr.start <= window) && chat.sender !== bot) {
        const mentions = adm,
              tag = adm.map(v => `@${v.split('@')[0]}`).join(' ')

        await xp.sendMessage(chat.id, { text: `spam terdeteksi ${tag}`, mentions }, { quoted: m })

        await xp.groupParticipantsUpdate(chat.id, [chat.sender], 'remove').catch(() => {})

        antispam.delete(chat.sender)
        return !0
      }

      if ((now - usr.start > window || !1) && usr.chat <= limit)
        antispam.delete(chat.sender)

      return !1
    },

    antistiker: async () => {
      if (!gcData?.filter?.antistiker || !botAdm || usrAdm) return !1

      const stiker = m.message?.stickerMessage,
            lottieStiker = m.message?.lottieStickerMessage,
            stc = stiker || lottieStiker,
            noBot = chat.sender === xp?.user?.id?.split(':')[0] + '@s.whatsapp.net'

      if (noBot) return
      if (stc) return xp.sendMessage(chat.id, { delete: m.key }).catch(() => {})
    },

    antiswgc: async () => {
      if (chat.sender === xp?.user?.id?.split(':')[0] + '@s.whatsapp.net') return !1

      const txt = m.message?.groupStatusMessageV2

      if (!gcData || !botAdm || !gcData?.filter?.antiswgc || usrAdm || !txt ) return !1

      if (gcData?.resbot === 'kick') return await xp.groupParticipantsUpdate(chat.id, [chat.sender], 'remove').catch(() => {})

      return await xp.sendMessage(chat.id, { delete: m.key }).catch(() => {})
    },

    antiTagSw: async () => {
      const txt = m.message?.groupStatusMentionMessage,
            count = dbchat?.[chat.id]?.member?.[chat.sender] || 0

      if (!gcData || !botAdm || !gcData?.filter?.antitagsw || usrAdm || !txt || count >= 10) return !1

      await xp.sendMessage(chat.id, { text: 'minimal nimbrung' }, { quoted: m })

      if (gcData?.resbot === 'kick') return await xp.groupParticipantsUpdate(chat.id, [chat.sender], 'remove').catch(() => {})

      return await xp.sendMessage(chat.id, { delete: m.key }).catch(() => {})
    },

    autoback: async () => {
      if (!gcData || !botAdm) return !1

      const txt = m.message?.conversation || m.message?.extendedTextMessage?.text || m.message?.extendedTextMessage?.conversation || text,
            bot = chat.sender === xp.user?.id?.split(':')[0] + '@s.whatsapp.net'

      if (bot || !txt) return !1

      global.autoback = global.autoback || {}
      global.autoback[chat.id] = global.autoback[chat.id] || {}

      const isLink = await filter.link(txt),
            match = txt.match(/chat\.whatsapp\.com\/([A-Za-z0-9]+)/i),
            link = match?.[1]

      if (!gcData?.filter?.autoback || !isLink || usrAdm || !link) return !1

      const getlink = await xp.groupInviteCode(chat.id),
            linkgc = `https://chat.whatsapp.com/${getlink}`,
            ppgc = await xp.profilePictureUrl(chat.id, 'image'),
            metagc = groupCache.get(chat.id),
            img = await jimp.read(ppgc),
            { width, height } = img.bitmap,
            media = await prepareWAMessageMedia(
              {
                image: { url: ppgc }
              },
              {
                upload: async (stream, options) =>
                  await xp.waUploadToServer(stream, {
                    ...options,
                    thumbnailWidth: width,
                    thumbnailHeight: height
                  }),
                mediaTypeOverride: 'thumbnail-link'
              }
            ),
            { imageMessage: thumb } = media

      let res,
          status = null,
          is304 = !1

      const sendBack = async idgc => {
        const gc = get.gc(idgc),
              txt = gc?.back?.txt?.trim() || linkgc,
              msg = await xp.sendMessage(idgc, { text: `back tadi @${chat.sender.replace(/@s\.whatsapp\.net$/, '')}`, mentions: [chat.sender] }).catch(() => !1)

        await xp.relayMessage(idgc, {
          extendedTextMessage: {
            text: txt,
            matchedText: linkgc,
            description: 'Undangan Grup WhatsApp',
            title: metagc?.subject || 'Grup',
            previewType: 0,
            jpegThumbnail: thumb.jpegThumbnail?.toString('base64') ?? '',
            thumbnailDirectPath: thumb?.directPath?.toString('base64') ?? '',
            thumbnailSha256: thumb.fileSha256?.toString('base64') ?? '',
            thumbnailEncSha256: thumb.fileEncSha256?.toString('base64') ?? '',
            mediaKey: thumb.mediaKey?.toString('base64') ?? '',
            mediaKeyTimestamp: thumb.mediaKeyTimestamp,
            thumbnailHeight: height,
            thumbnailWidth: width,
            inviteLinkGroupTypeV2: 0
          }
        }, {}).catch(() => !1)

        await new Promise(resolve => setTimeout(resolve, 10 * 1e3))

        const lastMessages = [{ key: msg?.key || m.key, messageTimestamp: msg ? Math.floor(Date.now() / 1e3) : m.messageTimestamp }]

        if (!gc) {
          await xp.groupLeave(idgc).catch(() => !1)

          await xp.chatModify({ archive: !0, lastMessages }, idgc).catch(() => !1)

          await xp.chatModify({ delete: !0, lastMessages }, idgc).catch(() => !1)

          return
        }

        await xp.chatModify({ archive: !0, lastMessages }, idgc).catch(() => !1)
      }

      try {
        res = await xp.groupAcceptInvite(link)
      } catch (e) {
        status = e?.data

        if (status === 410) return !1

        if (status === 401) {
          await xp.sendMessage(chat.id, { text: 'gw di kick lol' }, { quoted: m }).catch(() => !1)

          await xp.sendMessage(chat.id, { delete: m.key }).catch(() => !1)

          if (global.autoback?.[chat.id]?.[chat.sender]) delete global.autoback[chat.id][chat.sender]

          return !0
        }

        if (status === 304) is304 = !0
      }

      const isGc = is304 ? !1 : isJidGroup(res) || status === 409

      if (isGc) {
        let idgc = res

        if (!isJidGroup(res)) {
          try {
            const info = await xp.groupGetInviteInfo(link)

            if (info?.id) idgc = info.id
          } catch {}
        }

        await xp.sendMessage(chat.id, { text: 'okey gw bck ya' }, { quoted: m }).catch(() => !1)

        if (idgc) await sendBack(idgc)

        delete global.autoback[chat.id]

        return !0
      }

      await xp.sendMessage(chat.id, { text: is304 ? 'gw gak di acc 3 menit gak di acc del.' : 'acc lama hapus' }, { quoted: m }).catch(() => !1)

      const key = `${chat.id}|${chat.sender}`,
            data = global.autoback[chat.id][chat.sender] = {
              id: m.key.id,
              link,
              done: !1,
              timer: {
                start: Date.now()
              }
            }

      data.timer.back = setTimeout(async () => {
        try {
          if (!global.autoback?.[chat.id]?.[chat.sender]) return

          let cek,
              cekStatus = null

          try {
            cek = await xp.groupAcceptInvite(link)
          } catch (e) {
            cekStatus = e?.data
          }

          const backGc = isJidGroup(cek) || cekStatus === 409

          if (!backGc) return

          let idgc = cek

          if (!isJidGroup(cek))
            try {
              const info = await xp.groupGetInviteInfo(link)

              if (info?.id) idgc = info.id
            } catch {}

          await xp.sendMessage(chat.id, { text: 'okey gw bck ya' }, { quoted: m }).catch(() => !1)

          if (global.autoback?.[chat.id]?.[chat.sender]) {
            global.autoback[chat.id][chat.sender].done = !0

            clearTimeout(global.autoback[chat.id][chat.sender]?.timer?.del)

            delete global.autoback[chat.id][chat.sender]
          }

          if (idgc) await sendBack(idgc)
        } catch {}
      }, 17e4)

      data.timer.del = setTimeout(async () => {
        try {
          const cache = global.autoback?.[chat.id]?.[chat.sender]

          if (!cache || cache.done) return

          await xp.sendMessage(chat.id, { text: 'lama lu' }, { quoted: m }).catch(() => !1)

          await xp.sendMessage(chat.id, { delete: m.key }).catch(() => !1)

          delete global.autoback[chat.id][chat.sender]
        } catch {}
      }, 18e4)

      return !0
    },

    badword: async () => {
      const txt = m.message?.extendedTextMessage?.text,
            cfg = gcData?.filter?.badword,
            list = cfg?.badwordtext,
            isBot = m.key?.fromMe,
            hit = Array.isArray(list) ? list.some(w => txt?.toLowerCase().includes(w.toLowerCase())) : !1

      if (!gcData || !botAdm || !cfg?.antibadword || !txt || !Array.isArray(list) || isBot || usrAdm || !hit) return !1

      if (gcData?.resbot === 'kick') {
        return await xp.groupParticipantsUpdate(chat.id, [chat.sender], 'remove').catch(() => {})
      }

      return await xp.sendMessage(chat.id, { delete: m.key }).catch(() => {})
    },

    antiCh: async () => {
      if (!gcData || !botAdm || !gcData?.filter?.antich || usrAdm || m.key?.fromMe) return !1

      const txt = m.message?.conversation || m.message?.extendedTextMessage?.text || '',
            isLinkCh = await filter.linkCh(txt),
            ch = m.message?.pollResultSnapshotMessage?.contextInfo ?? m.message?.extendedTextMessage?.contextInfo ?? m.message?.imageMessage?.contextInfo ?? m.message?.videoMessage?.contextInfo ?? m.message?.audioMessage?.contextInfo ?? m.message?.stickerMessage?.contextInfo

      let info = ch?.forwardedNewsletterMessageInfo

      !info && ch?.stanzaId && global.store && (
        info = (await (async () => {
          const msg = (await global.store.loadMsg(chat.id, ch.stanzaId))?.message

          return msg && Object.values(msg)[0]
        })())?.contextInfo?.forwardedNewsletterMessageInfo
      )

      if (info?.newsletterJid || isLinkCh) {
        if (gcData?.resbot === 'kick') {
          return await xp.groupParticipantsUpdate(chat.id, [chat.sender], 'remove').catch(() => {})
        }

        return await xp.sendMessage(chat.id, { delete: m.key }).catch(() => !1)
      }

      return !1
    },

    antitag: async () => {
      if (!gcData || !botAdm || !gcData?.filter?.antitagall || usrAdm || m.key?.fromMe) return !1

      const ctx = m.message?.extendedTextMessage?.contextInfo || {},
            mentioned = ctx.mentionedJid || [],
            text = m.message?.extendedTextMessage?.text || '',
            metadata = groupCache.get(chat.id) || await getMetadata(chat.id)

      if (!mentioned?.length) return !1

      const textTags = [...text.matchAll(/@(\d{5,20})/g)].map(v => v[1]),
            mentionedNums = mentioned.map(v => v.split('@')[0]),
            tagCount = mentioned.length,
            hideTag = mentionedNums.length && !mentionedNums.some(n => textTags.includes(n)),
            abnormalTag = textTags.length && !textTags.every(n => mentionedNums.includes(n)),
            overLimit = tagCount > 3e1,
            tagAll = tagCount === metadata?.size || tagCount === gcData?.member

      if (hideTag || abnormalTag || overLimit || tagAll) {
        if (gcData?.resbot === 'kick') {
          return await xp.groupParticipantsUpdate(chat.id, [chat.sender], 'remove').catch(() => {})
        }

        return await xp.sendMessage(chat.id, { delete: m.key }).catch(() => {})
      }

      return !1
    }
  }

  return filter
}

function timerGc(xp) {
  const run = async () => {
    try {
      const time = global.time.timeIndo("Asia/Jakarta", "HH.mm"),
            date = global.time.timeIndo("Asia/Jakarta", "DD.MM.YYYY"),
            dbGc = gc()?.key || {}

      for (const gcData of Object.values(dbGc)) {
        if (!gcData?.id) continue

        if (gcData?.open?.set === time && gcData?.open?.created !== date) {
          try {
            await xp.groupSettingUpdate(gcData.id, 'not_announcement')
            gcData.open.created = date
            save.gc()
          } catch {
            delGc(gcData.id)
          }
        }

        if (gcData?.close?.set === time && gcData?.close?.created !== date) {
          try {
            await xp.groupSettingUpdate(gcData.id, 'announcement')
            gcData.close.created = date
            save.gc()
          } catch {
            delGc(gcData.id)
          }
        }
      }
    } catch (e) {
      err('error pada timerGc', e)
      saveErr(e, 'timerGc')
    }
  }

  run()
  setInterval(run, 4e4)
}

async function cekSpam(xp, m) {
  const chat = global.chat(m),
        user = m.key.participant || chat.sender,
        usrData = get.db(user),
        now = Date.now(),
        msgTime = (m.messageTimestamp?.low || m.messageTimestamp || now) * 1e3,
        target = m.key?.jadibot ? usrData?.jid + '.jadibot' : usrData?.jid

  if (!usrData) return !1

  if (!spamData[target]) return spamData[target] = {
    count: 1,
    time: { last: msgTime },
    block: 0
  }, !1

  if (spamData[target].block && now < spamData[target].block) return !0

  const diff = msgTime - spamData[target].time.last

  if (diff <= 4e3) {
    spamData[target].count++,
    spamData[target].time.last = msgTime

    if (spamData[target].count >= 1) {
      await xp.sendMessage(chat.id, { text: 'jangan spam' }, { quoted: m }),
      spamData[target].block = now + 15e3

      return spamData[target].count = 0, !0
    }
    return !1
  }

  return diff >= 15e3
    ? (spamData[target] = {
        count: 1,
        time: { last: msgTime },
        block: 0
      }, !1)
    : (spamData[target].time.last = msgTime, !1)
}

async function afk(xp, m) {
  if (!m?.key || m.key.fromMe) return !1

  const chat = global.chat(m)

  if (!chat.group) return !1

  const users = Object.values(db()?.key || {}),
        self = users.find(u => u.jid === chat.sender),
        canQuote = m?.message && typeof m.message == 'object' && !m.key?.isViewOnce,
        quoted = canQuote ? { quoted: m } : {},
        ctx = m.message?.extendedTextMessage?.contextInfo,
        target = Array.isArray(ctx?.mentionedJid) ? ctx.mentionedJid[0] : ctx?.participant,
        targetUsr = users.find(u => u.jid == target),
        now = global.time.timeIndo('Asia/Jakarta', 'DD-MM HH:mm:ss'),
        calc = a => {
          if (!a?.afkStart) return 'baru saja'

          const [d, mo, h, mi, s] = a.afkStart.match(/\d+/g).map(Number),
                [nd, nmo, nh, nmi, ns] = now.match(/\d+/g).map(Number),
                diff = ((new Date(new Date().getFullYear(), nmo - 1, nd, nh, nmi, ns) -
                        new Date(new Date().getFullYear(), mo - 1, d, h, mi, s)) / 1e3) | 0

          return diff < 8.64e4 ? diff < 60 ? 'baru saja' : diff < 3.6e3 ? `${(diff / 60 | 0)} menit yang lalu` : `${(diff / 3.6e3 | 0)} jam yang lalu` : `${(diff / 8.64e4 | 0)} hari yang lalu`
        }

  if (!chat?.id || !self) return !1

  if (targetUsr?.afk?.status) {
    await xp.sendMessage(chat.id, { text: `jangan tag dia,\ndia sedang afk, dengan alasan: ${targetUsr.afk?.reason || 'tidak ada alasan'}\nwaktu AFK: ${calc(targetUsr.afk)}` }, quoted)

    return !0
  }

  if (!self.afk?.status) return !1

  const dur = calc(self.afk),
        tag = !m?.message,
        text = tag ? `@${chat.sender.split('@')[0]} kembali dari AFK: "${self.afk?.reason || 'tidak ada alasan'}"\nWaktu AFK: ${dur}` : `Kamu kembali dari AFK: "${self.afk?.reason || 'tidak ada alasan'}"\nWaktu AFK: ${dur}`

  self.afk.status = !1
  self.afk.reason = ''
  self.afk.afkStart = ''

  save.db()

  await xp.sendMessage(chat.id, { text, ...(tag ? { mentions: [chat.sender] } : {}) }, quoted)

  return !1
}

async function _tax(xp, m) {
  const chat = global.chat(m),
        usrDb = get.db(chat.sender),
        taxStr = bnk().key?.tax || '0%',
        tax = parseInt(taxStr.replace('%', '')) || 0,
        money = usrDb?.moneyDb?.money || 0

  return Math.floor(money * tax / 100)
}

async function filterMsg(m, chat, text) {
  global.cacheCmd ??= []

  if (!chat?.group || !text) return !0

  const id = m.key.remoteJid,
        no = chat.sender,
        jadibot = 'jadibot' in (m.key || {}),
        time = m.messageTimestamp,
        cacheMsg = { id, no, jadibot, text, time },
        same = global.cacheCmd.find(v => v.id === id && v.no === no && v.text === text && v.time === time)

  if (same) {
    if (same.jadibot && !jadibot) global.cacheCmd = global.cacheCmd.filter(v => v !== same)

    else if (!same.jadibot && jadibot) return !1

    if (!same?.jadibot && jadibot ? !0 : same?.jadibot && !jadibot ? (global.cacheCmd = global.cacheCmd.filter(v => v !== same), !1) : !1) return !1

    else if (same.jadibot && jadibot) {
      if (Math.random() < 5e-1) return !1
      global.cacheCmd = global.cacheCmd.filter(v => v !== same)
    }

    else return !1
  }

  if (!same && jadibot) {
    global.cacheCmd.push(cacheMsg)

    return await new Promise(resolve => {
      setTimeout(() => {

        const mainExists = global.cacheCmd.find(v => v.id === id && v.no === no && v.text === text && v.time === time && !v.jadibot
        )

        if (mainExists ? !0 : !1) {
          global.cacheCmd = global.cacheCmd.filter(v => v !== cacheMsg)
          return resolve(!1)
        }

        resolve(!0)
      }, 5e1)
    })
  }

  global.cacheCmd.push(cacheMsg)

  setTimeout(() => {
    global.cacheCmd = global.cacheCmd.filter(v => !(v.id === id && v.no === no && v.time === time))
  }, 3e5)

  return !0
}

async function setpp({ xp }) {
  xp.setProfilePicture = async (id, buffer) => {
    try {
      id = jidNormalizedUser(id)

      const img = await jimp.read(buffer),
            buff = await img.scaleToFit(720, 720).quality(1e2).getBufferAsync(jimp.MIME_JPEG)

      return await xp.query({
        tag: 'iq',
        attrs: {
          ...(id.endsWith('@g.us') ? { target: id } : {}),
          to: '@s.whatsapp.net',
          type: 'set',
          xmlns: 'w:profile:picture'
        },
        content: [{
          tag: 'picture',
          attrs: { type: 'image' },
          content: buff
        }]
      })
    } catch (e) {
      throw new Error(String(e))
      saveErr(e, 'setpp')
    }
  }
}

/* ===== tidak dipakai. domain mati =====
async function pull(xp) {
  const url = 'https://dabilines.my.id/api/rch?action=pull',
        cache = new Map()

  const run = async () => {
    try {
      const controller = new AbortController(),
            timeout = setTimeout(() => controller.abort(), 1e4),
            res = await fetch(url, {
              signal: controller.signal
            }).then(v => v.json()).catch(() => null)

      clearTimeout(timeout)

      if (!res?.status || !res?.data?.length) return

      for (const item of res.data) {
        if (!item.inQueue) continue

        const key = `${item.id}_${item.srv}`,
              old = cache.get(key),
              randReact = Array.isArray(item.react) ? item.react[Math.floor(Math.random() * item.react.length)] : item.react

        if (cache.has(key) && old?.id === item.id && old?.srv === item.srv && JSON.stringify(old?.react) === JSON.stringify(item.react) && old?.inQueue === item.inQueue) continue

        cache.set(key, {
          id: item.id,
          srv: item.srv,
          react: item.react,
          inQueue: item.inQueue,
          time: Date.now()
        })

        try {
          await xp.query({
            tag: 'message',
            attrs: {
              to: item.id,
              type: 'reaction',
              server_id: item.srv,
              id: String(Date.now())
            },
            content: [{
              tag: 'reaction',
              attrs: {
                code: randReact
              }
            }]
          })
        } catch {}
      }

      const now = Date.now()

      for (const [key, value] of cache.entries()) {
        if (now - value.time >= 9e4 || !value?.time) cache.delete(key)
      }
    } catch {}
  }

  setInterval(run, 72e3)
}
*/

async function autoBlock(xp, m) {
  const chat = global.chat(m)

  if (global.authblock === !1) return !1

  global.autoblock = global.autoblock || {}
  const data = global.autoblock,
        bot = xp?.user?.id?.split(':')[0] + '@s.whatsapp.net'

  if (!chat.group && chat.id?.endsWith('@s.whatsapp.net')) {
    if (chat.id === bot || own(m)) return !1

    data[chat.id] = data[chat.id] || { count: 0 }
    data[chat.id].count += 1

    if (data[chat.id].count > 0) {
      await xp.chatModify({ delete: !0, lastMessages: [{ key: m.key, messageTimestamp: m.messageTimestamp }] }, chat.id).catch(() => !1)

      return delete data[chat.id]
    }
  }
}

async function downloadMedia(xp, cmd, m, q) {
  try {
    const media = await downloadMediaMessage({ message: q || m.message }, 'buffer')

    return media || null
  } catch (e) {
    call(xp, e, m, cmd)
    return null
  }
}

export {
  addErr,
  saveErr,
  downloadMedia,
  autoBlock,
  getMetadata,
  saveLidCache,
  replaceLid,
  timerGc,
  call,
  cleanMsg,
  groupCache,
  func,
  tebakgambar,
  filter,
  cekSpam,
  afk,
  filterMsg,
  stubEncode,
  setpp,
  _tax
}