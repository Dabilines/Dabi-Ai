import fetch from 'node-fetch'
import jimp from 'jimp'
import { isJidGroup, jidNormalizedUser, prepareWAMessageMedia } from 'baileys'
import { bnk, dbsider } from './db/data.js'
import { ev } from '../cmd/handle.js'

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

function replaceLid(o, v = new WeakSet()) {
  if (!o) return o

  if (typeof o == "object") {
    if (v.has(o)) return o
    v.add(o)

    const arr = Array.isArray(o),
          buf = Buffer.isBuffer(o) || o instanceof Uint8Array

    if (arr ? !0 : buf) return arr ? o.map(i => replaceLid(i, v)) : o

    for (const k in o) o[k] = replaceLid(o[k], v)
    return o
  }

  if (typeof o == "string") {
    const e = Object.entries(global.lidCache ?? {}),
          lid = /@lid$/.test(o)

    if (lid) {
      const p = e.find(([, v]) => v === o)?.[0]
      if (p) return `${p}@s.whatsapp.net`
    }

    return o
      .replace(/@(\d+)@lid/g, (_, i) => {
        const p = e.find(([, v]) => v === `${i}@lid`)?.[0]
        return p ? `@${p}` : `@${i}@lid`
      })
      .replace(/@(\d+)(?!@)/g, (m, l) => {
        const p = e.find(([, v]) => v === `${l}@lid`)?.[0]
        return p ? `@${p}` : m
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

async function call(xp, e, m, cmd) {
  try {
    await addErr(cmd)

    const err = (typeof e === 'string' ? e : e?.stack || e?.message || String(e)).replace(/file:\/\/\/[^\s)]+/g, '').replace(/at\s+/g, '\n→ ').trim(),
          chat = global.chat(m),
          sender = chat.sender || 'unknown',
          txt = `Tolong bantu jelaskan error ini dengan bahasa alami dan ramah pengguna:\n\n${e}`,
          res = await bell(txt, m, xp)

    res?.msg ? await xp.sendMessage(chat.id, { text: res.msg }, { quoted: m }) : await xp.sendMessage(chat.id, { text: `Gagal memproses error: ${res?.message || 'tidak diketahui'}` }, { quoted: m })
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

async function filter(xp, m, text) {
  const chat = global.chat(m),
        gcData = get.gc(chat.id),
        meta = await grupify(xp, m)

  if (!meta) return

  const { usrAdm, botAdm, adm } = meta

  const filter = {
    link: async t =>
      typeof t == 'string' &&
      /(?:https?:\/\/)?chat\.whatsapp\.com\/[A-Za-z0-9]{20,24}/i.test(t.trim().replace(/\s+/g, '').replace(/\/{2,}/g, '/')),

    linkCh: async t =>
      typeof t == 'string' &&
      /(?:https?:\/\/)?whatsapp\.com\/channel\/[A-Za-z0-9]+/i.test(t.trim().replace(/\s+/g, '').replace(/\/{2,}/g, '/')),

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
        const sorted = Object.entries(db)
          .sort((a, b) => b[1] - a[1])

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

      if (gcData?.resbot === 'kick') {
        return await xp.groupParticipantsUpdate(chat.id, [chat.sender], 'remove').catch(() => {})
      }

      return await xp.sendMessage(chat.id, { delete: m.key }).catch(() => {})
    },

    antiSpam: async () => {
      const cht = m.message,
            now = (m.messageTimestamp * 1e3) || Date.now(),
            limit = 6,
            window = 2e4,
            data = antispam.get(chat.sender)

      if (!gcData || !botAdm || data === xp.user?.id?.split(':')[0] + '@s.whatsapp.net' || !(gcData?.filter?.antispam ? !0 : !1) || usrAdm || !cht) return !1

      if (!data || (data && (now - data.start > window)))
        antispam.set(chat.sender, { start: now, chat: 1 })
      else
        data.chat++,
        antispam.set(chat.sender, data)

      const usr = antispam.get(chat.sender)

      if ((usr.chat > limit || !1) && (now - usr.start <= window)) {
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

    antiswgc: async () => {
      const txt = m.message?.groupStatusMessageV2

      if (!gcData || !botAdm || !gcData?.filter?.antiswgc || usrAdm || !txt ) return !1

      if (gcData?.resbot === 'kick') return await xp.groupParticipantsUpdate(chat.id, [chat.sender], 'remove').catch(() => {})

      return await xp.sendMessage(chat.id, { delete: m.key }).catch(() => {})
    },

    antiTagSw: async () => {
      const txt = m.message?.groupStatusMentionMessage,
            count = dbsider?.[chat.id]?.[chat.sender] || 0

      if (!gcData || !botAdm || !gcData?.filter?.antitagsw || usrAdm || !txt || count >= 1e2) return !1

      await xp.sendMessage(chat.id, { text: 'minimal nimbrung' }, { quoted: m })

      if (gcData?.resbot === 'kick') return await xp.groupParticipantsUpdate(chat.id, [chat.sender], 'remove').catch(() => {})

      return await xp.sendMessage(chat.id, { delete: m.key }).catch(() => {})
    },

    autoback: async () => {
      if (!gcData || !botAdm) return !1

      const txt = m.message?.conversation || m.message?.extendedTextMessage?.text || m.message?.extendedTextMessage?.conversation || text,
            bot = chat.sender === xp.user?.id?.split(':')[0]

      if (bot || !txt) return !1

      global.autoback = global.autoback || {}
      global.autoback[chat.id] = global.autoback[chat.id] || {}

      const isLink = await filter.link(txt),
            match = txt.match(/https?:\/\/[^\s]+/gi),
            link = match ? match[0] : null

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
            { imageMessage: thumb } = media,
            linkusr = link.split('/').pop().split('?')[0]

      let res,
          status = null,
          is304 = !1

      const sendBack = async idgc => {
        await xp.relayMessage(idgc, {
          extendedTextMessage: {
            text: `back tadi @${chat.sender?.replace(/@s\.whatsapp\.net$/, '')}\n${linkgc}`,
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
            inviteLinkGroupTypeV2: 0,
            contextInfo: {
              mentionedJid: [chat.sender]
            }
          }
        }, {}).catch(() => !1)

        await new Promise(resolve => setTimeout(resolve, 10 * 1e3))

        await xp.groupLeave(idgc).catch(() => !1)
      }

      try {
        res = await xp.groupAcceptInvite(linkusr)
      } catch (e) {
        status = e?.data

        if (e?.data === 410) return !1
        if (e?.data === 401) {
          await xp.sendMessage(chat.id, { text: 'gw di kick lol' }, { quoted: m }).catch(() => !1)

          await xp.sendMessage(chat.id, { delete: m.key }).catch(() => !1)

          if (global.autoback?.[chat.id]?.[chat.sender]) delete global.autoback[chat.id][chat.sender]
          return !0
        }

        if (e?.data === 304) is304 = !0
      }

      const isGc = is304 ? !1 : isJidGroup(res) || status === 409

      if (isGc) {
        let idgc = res

        if (!isJidGroup(res)) {
          try {
            const info = await xp.groupGetInviteInfo(linkusr)

            if (info?.id) idgc = info.id
          } catch {}
        }

        await xp.sendMessage(chat.id, { text: 'okey gw bck ya' }, { quoted: m }).catch(() => !1)

        if (idgc) await sendBack(idgc)

        delete global.autoback[chat.id]
        return !0
      }

      await xp.sendMessage(chat.id, { text: is304 ? 'gw gak di acc 3 menit gak di acc del.' : 'acc lama hapus' }, { quoted: m }).catch(() => !1)

      const data = global.autoback[chat.id][chat.sender] = {
        id: m.key.id,
        linkusr,
        timer: {
          start: Date.now()
        }
      }

      data.timer.back = setTimeout(async () => {
        try {
          if (!global.autoback?.[chat.id]?.[chat.sender])
            return

          let cek,
              cekStatus = null

          try {
            cek = await xp.groupAcceptInvite(linkusr)
          } catch (e) {
            cekStatus = e?.data
          }

          const backGc = isJidGroup(cek) || cekStatus === 409

          if (!backGc) return

          let idgc = cek

          if (!isJidGroup(cek)) {
            try {
              const info = await xp.groupGetInviteInfo(linkusr)

              if (info?.id) idgc = info.id
            } catch {}
          }

          await xp.sendMessage(chat.id, { text: 'okey gw bck ya' }, { quoted: m }).catch(() => !1)

          if (idgc) await sendBack(idgc)

          if (global.autoback?.[chat.id]?.[chat.sender]) {
            clearTimeout(global.autoback[chat.id][chat.sender]?.timer?.del)

            delete global.autoback[chat.id][chat.sender]
          }
        } catch {}
      }, 170000)

      data.timer.del = setTimeout(async () => {
        try {
          if (!global.autoback?.[chat.id]?.[chat.sender])
            return

          await xp.sendMessage(chat.id, { text: 'lama lu' }, { quoted: m }).catch(() => !1)

          await xp.sendMessage(chat.id, { delete: m.key }).catch(() => !1)

          delete global.autoback[chat.id][chat.sender]
        } catch {}
      }, 180000)
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
            ch = m.message?.extendedTextMessage?.contextInfo ?? m.message?.imageMessage?.contextInfo ?? m.message?.videoMessage?.contextInfo ?? m.message?.audioMessage?.contextInfo ?? m.message?.stickerMessage?.contextInfo

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

  if (diff <= 3e3) {
    spamData[target].count++,
    spamData[target].time.last = msgTime

    if (spamData[target].count >= 1) {
      await xp.sendMessage(chat.id, { text: 'jangan spam' }, { quoted: m }),
      spamData[target].block = now + 1e4

      return spamData[target].count = 0, !0
    }
    return !1
  }

  return diff >= 1e4
    ? (spamData[target] = {
        count: 1,
        time: { last: msgTime },
        block: 0
      }, !1)
    : (spamData[target].time.last = msgTime, !1)
}

async function afk(xp, m) {
  if (!m?.key || m.key.fromMe) return

  const chat = global.chat(m)

  if (!chat.group) return

  const users = Object.values(db()?.key || {}),
        self = users.find(u => u.jid === chat?.sender),
        canQuote = m?.message && typeof m.message === 'object' && !m.key?.isViewOnce,
        quoted = canQuote ? { quoted: m } : {},
        ctx = m.message?.extendedTextMessage?.contextInfo,
        target = Array.isArray(ctx?.mentionedJid) ? ctx.mentionedJid[0] : ctx?.participant,
        targetUsr = users.find(u => u.jid === target),
        now = global.time.timeIndo('Asia/Jakarta', 'DD-MM HH:mm:ss'),
        calc = a => {
          if (!a?.afkStart) return 'baru saja'
          const [d, mo, h, mi, s] = a.afkStart.match(/\d+/g).map(Number),
                [nd, nmo, nh, nmi, ns] = now.match(/\d+/g).map(Number),
                diff = ((new Date(new Date().getFullYear(), nmo - 1, nd, nh, nmi, ns) -
                        new Date(new Date().getFullYear(), mo - 1, d, h, mi, s)) / 1e3) | 0
          return diff < 8.64e4
            ? diff < 60
              ? 'baru saja'
              : diff < 3.6e3
                ? `${(diff / 60 | 0)} menit yang lalu`
                : `${(diff / 3.6e3 | 0)} jam yang lalu`
            : `${(diff / 8.64e4 | 0)} hari yang lalu`
        }

  if (!chat?.id || !self) return

  if (targetUsr?.afk?.status) return xp.sendMessage(chat.id, { text: `jangan tag dia,\ndia sedang afk, dengan alasan: ${targetUsr?.afk?.reason || 'tidak ada alasan'}\nwaktu AFK: ${calc(targetUsr.afk)}` }, quoted)

  if (!self.afk?.status) return

  const dur = calc(self.afk),
        tag = !m?.message,
        text = tag
          ? `@${chat.sender.split('@')[0]} kembali dari AFK: "${self?.afk?.reason || 'tidak ada alasan'}"\nWaktu AFK: ${dur}`
          : `Kamu kembali dari AFK: "${self?.afk?.reason || 'tidak ada alasan'}"\nWaktu AFK: ${dur}`

  self.afk.status = !1
  self.afk.reason = ''
  self.afk.afkStart = ''

  save.db()

  return xp.sendMessage(chat.id, { text, ...(tag ? { mentions: [chat.sender] } : {}) }, quoted)
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
        same = global.cacheCmd.find(v =>
          v.id === id &&
          v.no === no &&
          v.text === text &&
          v.time === time
        )

  if (same) {
    if (same.jadibot && !jadibot)
      global.cacheCmd = global.cacheCmd.filter(v => v !== same)

    else if (!same.jadibot && jadibot)
      return !1

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

        const mainExists = global.cacheCmd.find(v =>
          v.id === id &&
          v.no === no &&
          v.text === text &&
          v.time === time &&
          !v.jadibot
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
    global.cacheCmd = global.cacheCmd.filter(v =>
      !(v.id === id &&
        v.no === no &&
        v.time === time)
    )
  }, 3e5)

  return !0
}

async function setpp({ xp }) {
  xp.setProfilePicture = async (id, buffer) => {
    try {
      id = jidNormalizedUser(id)

      const img = await jimp.read(buffer),
            buff = await img
              .scaleToFit(720, 720)
              .quality(1e2)
              .getBufferAsync(jimp.MIME_JPEG)

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
    }
  }
}

async function pull(xp) {
  const url = 'https://dabilines.my.id/api/rch?action=pull',
        cache = new Map()

  const run = async () => {
    try {
      const controller = new AbortController(),
            timeout = setTimeout(() => controller.abort(), 1e4),
            res = await fetch(url, {
              signal: controller.signal
            })
              .then(v => v.json())
              .catch(() => null)

      clearTimeout(timeout)

      if (!res?.status || !res?.data?.length) return

      for (const item of res.data) {
        if (!item.inQueue) continue

        const key = `${item.id}_${item.srv}`,
              old = cache.get(key),
              randReact = Array.isArray(item.react)
                ? item.react[Math.floor(Math.random() * item.react.length)]
                : item.react

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

export {
  addErr,
  getMetadata,
  replaceLid,
  saveLidCache,
  call,
  cleanMsg,
  groupCache,
  func,
  filter,
  cekSpam,
  afk,
  filterMsg,
  stubEncode,
  setpp,
  pull,
  _tax
}