import axios from 'axios'
import fromdt from 'form-data'
import fs from 'fs'
import os from 'os'
import path from 'path'
import c from 'chalk'
import fetch from 'node-fetch'
import ffmpeg from 'fluent-ffmpeg'
import { vn } from '../interactive.js'
import { saveTemp, tmpPath, readAndDelete } from '../../system/exif.js'
import { downloadMediaMessage } from 'baileys'
import { tmpFiles } from '../../system/tmpfiles.js'
import { fileTypeFromBuffer } from 'file-type'

export default function tools(ev) {
  ev.on({
    name: 'reaction channel',
    cmd: ['reactchannel', 'rch'],
    tags: 'Tools Menu',
    desc: 'tes reaction ke saluran',
    owner: !1,
    prefix: !0,
    money: 2000,
    exp: 0,

    run: async (xp, m, {
      args,
      chat,
      cmd
    }) => {
      try {
        const text = args.join(' ').trim(),
              parts = text.split('|').map(v => v.trim()),
              id = parts[0],
              server_id = parts[1],
              reactText = parts[2]

        if (!text || !text.includes('|') || (!id || !server_id || !reactText)) {
          return xp.sendMessage(chat.id, { text: !text || !text.includes('|') ? `Format salah\n\nContoh:\n.rch 123@newsletter | 123 | 👌👍✅` : `Data tidak lengkap\n\nFormat:\n.rch 123@newsletter | 123 | 👌👍✅` }, { quoted: m })
        }

        const reaction = [...reactText]

        await fetch(`https://dabilines.my.id/api/rch?action=push&id=${encodeURIComponent(id)}&srv=${encodeURIComponent(server_id)}&react=${encodeURIComponent(JSON.stringify(reaction))}`).then(r => r.json())

        if (reaction.length > 1 || reaction.length === 1) await xp.sendMessage(chat.id, { text: `dalam antrian\n\nID: ${id}\nServer: ${server_id}\nReaction: ${reaction.join(', ')}` }, { quoted: m })
      } catch (e) {
        err(`error pada ${cmd}`, e)
        call(xp, e, m)
      }
    }
  })

  ev.on({
    name: 'enigma2text',
    cmd: ['enigma2text', 'en2text', 'en2txt'],
    tags: 'Tools Menu',
    desc: 'decode enigma personal',
    owner: !1,
    prefix: !0,
    money: 50,
    exp: 0.1,

    run: async (xp, m, {
      args,
      chat,
      cmd
    }) => {
      try {
        const file = './temp/enigma.json',
              abc = [...'abcdefghijklmnopqrstuvwxyz'],
              rand = () => [...abc].sort(() => Math.random() - .5),
              dec = (t, r) => t.toLowerCase().split('')
                .map(c => {
                  const i = r.indexOf(c)
                  return i !== -1 ? abc[i] : c
                }).join(''),
              text = chat.quoted.txt || args.join(' ')

        if (!text) return xp.sendMessage(chat.id, { text: 'reply atau masukkan teks enigma' }, { quoted: m })

        const db = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file)) : {},
              data = Object.values(db.key || {})
                .find(v => v.jid === chat.sender),
              rotor = data?.rotor?.random || rand(),
              result = dec(text, rotor)

        await xp.sendMessage(chat.id, { text: result }, { quoted: m })
      } catch (e) {
        err(`error pada ${cmd}`, e)
        call(xp, e, m)
      }
    }
  })

  ev.on({
    name: 'get ch id',
    cmd: ['getchid', 'getch'],
    tags: 'Tools Menu',
    desc: 'mengambil id ch/saluran whatsapp',
    owner: !1,
    prefix: !0,
    money: 500,
    exp: 0.1,

    run: async (xp, m, {
      chat,
      cmd,
      store
    }) => {
      try {
        const q = m.message?.extendedTextMessage?.contextInfo
        if (!q?.stanzaId) return xp.sendMessage(chat.id, { text: 'reply pesan yang diteruskan dari saluran' }, { quoted: m })

        const load = await store.loadMsg(chat.id, q.stanzaId)
        if (!load) return xp.sendMessage(chat.id, { text: 'pastikan reply pesan yang diteruskan dari saluran' }, { quoted: m })

        const msg = load.msg || {},
              type = Object.keys(msg)[0],
              ctx = msg[type]?.contextInfo || {},
              info = ctx.forwardedNewsletterMessageInfo

        if (!info?.newsletterJid) return xp.sendMessage(chat.id, { text: 'Tidak ditemukan informasi saluran.' }, { quoted: m })

        let txt = `${head}${opb} Data Channel ${clb}\n`
            txt += `${body} ${btn} *Nama: ${info.newsletterName}*\n`
            txt += `${body} ${btn} *ID Saluran: ${info.newsletterJid}*\n`
            txt += `${body} ${btn} *ID Pesan: ${info.serverMessageId}*\n`
            txt += `${foot}${line}`

        await xp.sendMessage(chat.id, {
          text: txt,
          contextInfo: {
            externalAdReply: {
              body: `informasi saluran ${info.newsletterName}`,
              thumbnailUrl: thumbnail,
              mediaType: 1,
              renderLargerThumbnail: !0
            },
            forwardingScore: 1,
            isForwarded: !0,
            forwardedNewsletterMessageInfo: {
              newsletterJid: info.newsletterJid,
              newsletterName: `klik disini untuk dukung ${botName}`
            }
          }
        })
      } catch (e) {
        err(`error pada ${cmd}`, e)
        call(xp, e, m)
      }
    }
  })

  ev.on({
    name: 'get pp',
    cmd: ['getpp'],
    tags: 'Tools Menu',
    desc: 'mengambil foto profil orang',
    owner: !1,
    prefix: !0,
    money: 100,
    exp: 0.1,

    run: async (xp, m, {
      chat,
      cmd
    }) => {
      try {
        const target = chat.quoted.id?.[0],
              user = target.replace(/@s\.whatsapp\.net$/, ''),
              { usrAdm, botAdm } = await grupify(xp, m),
              defThumb = 'https://c.termai.cc/i0/7DbG.jpg'

        if (!chat.group || !usrAdm || !botAdm || !target) {
          return xp.sendMessage(chat.id, {
              text: !chat.group
                ? 'perintah ini hanya bisa dijalankan digrup'
                : !usrAdm
                ? 'kamu bukan admin'
                : !botAdm
                ? 'aku bukan admin'
                : 'reply/tag target'
            }, { quoted: m })
        }

        let thumb
        try { thumb = await xp.profilePictureUrl(target, 'image') }
        catch { thumb = defThumb }

        await xp.sendMessage(chat.id, { image: { url: thumb }, caption: `pp @${user}`, mentions: [target] }, { quoted: m })
        thumb = null
      } catch (e) {
        err(`error pada ${cmd}`, e)
        call(xp, e, m)
      }
    }
  })

  ev.on({
    name: 'hd',
    cmd: ['hd'],
    tags: 'Tools Menu',
    desc: 'Upscale / enhance gambar menggunakan AI',
    owner: !1,
    prefix: !0,
    money: 500,
    exp: 0.1,

    run: async (xp, m, {
      chat,
      cmd,
      prefix
    }) => {
      try {
        const q = m.message?.extendedTextMessage?.contextInfo?.quotedMessage,
              img = q?.imageMessage || m.message?.imageMessage

        if (!img) return xp.sendMessage(chat.id, { text: `Kirim atau reply gambar dengan caption ${prefix}${cmd}` }, { quoted: m })

        const media = await downloadMediaMessage({ message: q || m.message }, 'buffer')
        if (!media) throw new Error('media tidak terunduh')

        await xp.sendMessage(chat.id, { react: { text: '⏳', key: m.key } })

        const imageUrl = await tmpFiles(media),
              type = 'stdx4',
              task = await fetch(`${termaiWeb}/api/tools/enhance/createTask?url=${encodeURIComponent(imageUrl)}&type=${type}&key=${termaiKey}`)
                .then(r => r.json())
                .catch(() => null)

        let i = 0

        if (!task?.status) {
          const fallbackUrl = `https://api.cuki.biz.id/api/editing/upscale?apikey=cuki-x&image=${encodeURIComponent(imageUrl)}`,
                fallbackRes = await fetch(fallbackUrl).catch(() => null)

          if (!fallbackRes) return xp.sendMessage(chat.id, { text: 'Gagal enhance gambar.' }, { quoted: m })

          const fallbackBuffer = await fallbackRes.arrayBuffer()
            .then(res => Buffer.from(res))
            .catch(() => null)

          if (!fallbackBuffer) return xp.sendMessage(chat.id, { text: task?.msg || 'Gagal enhance gambar.' }, { quoted: m })

          return xp.sendMessage(chat.id, { image: fallbackBuffer, caption: 'Gambar berhasil di-enhance' }, { quoted: m })
        }

        while (i++ < 5e1) {
          const status = await fetch(`${termaiWeb}/api/tools/enhance/taskStatus?id=${task.id}&key=${termaiKey}`)
            .then(r => r.json())
            .catch(() => null)

          if (!status) break

          if (
            status.task_status === 'failed' ||
            (status.status ? !1 : !0)
          ) {
            const fallbackUrl = `https://api.cuki.biz.id/api/editing/upscale?apikey=cuki-x&image=${encodeURIComponent(imageUrl)}`,
                  fallbackRes = await fetch(fallbackUrl).catch(() => null)

            if (!fallbackRes) return xp.sendMessage(chat.id, { text: 'Maaf terjadi kesalahan. Gunakan gambar lain!' }, { quoted: m })

            const fallback = await fallbackRes.arrayBuffer()
              .then(res => Buffer.from(res))
              .catch(() => null)

            if (!fallback) return xp.sendMessage(chat.id, { text: 'Maaf terjadi kesalahan. Gunakan gambar lain!' }, { quoted: m })

            return xp.sendMessage(chat.id, { image: fallback, caption: 'Gambar berhasil di-enhance' }, { quoted: m })
          }

          if (status.task_status === 'done') return xp.sendMessage(chat.id, { image: { url: status.output }, caption: 'Gambar berhasil di-enhance' }, { quoted: m })

          await new Promise(r => setTimeout(r, 1e3))
        }

        return xp.sendMessage(chat.id, { text: 'Waktu pemrosesan habis. Coba lagi.' }, { quoted: m })
        media = null
      } catch (e) {
        err(`error pada ${cmd}`, e)
        call(xp, e, m)
      }
    }
  })

  ev.on({
    name: 'mc2text',
    cmd: ['mc2text', 'decmc', 'decodeminecraft'],
    tags: 'Tools Menu',
    desc: 'mengubah bahasa mc menjadi text',
    owner: !1,
    prefix: !0,
    money: 50,
    exp: 0.1,

    run: async (xp, m, {
      args,
      chat,
      cmd,
      prefix
    }) => {
      try {
        const text = chat.quoted.txt || args.join(' ')

        if (!text) return xp.sendMessage(chat.id, { text: `Masukkan teks atau reply pesan\nContoh: ${prefix}${cmd} halo aku ${botName}` }, { quoted: m });

        const mc = {
          a: "ᔑ", b: "ʖ",
          c: "ᓵ", d: "↸",
          e: "ᒷ", f: "⎓",
          g: "⊣", h: "⍑",
          i: "╎", j: "⋮",
          k: "ꖌ", l: "ꖎ",
          m: "ᒲ", n: "リ",
          o: "𝙹", p: "!¡",
          q: "ᑑ", r: "∷",
          s: "ᓭ", t: "ℸ̣",
          u: "⚍", v: "⍊", 
          w: "∴", x: "̇/",
          y: "||", z: "⨅",
          " ": "/"
        },
        decmc = text => text
          .trim()
          .split(" ")
          .map(v => v === "/" ? " " : Object.keys(mc).find(k => mc[k] === v) ?? v)
          .join("")

        await xp.sendMessage(chat.id, { text: decmc(text) }, { quoted: m })
      } catch (e) {
        err(`error pada ${cmd}`, e)
        call(xp, e, m)
      }
    }
  })

  ev.on({
    name: 'morse2text',
    cmd: ['decodemorse', 'decomorse', 'morse2text'],
    tags: 'Tools Menu',
    desc: 'mengubah morse menjadi text',
    owner: !1,
    prefix: !0,
    money: 50,
    exp: 0.1,

    run: async (xp, m, {
      args,
      chat,
      cmd,
      prefix
    }) => {
      try {
        const text = chat.quoted.txt || args.join(' ')

        if (!text) return xp.sendMessage(chat.id, { text: `masukan atau reply pesan nya\ncontoh: ${prefix}${cmd} .... .- .-.. ---   .- -.- ..-   -... --- -` }, { quoted: m })

        const mrs = {
          a: ".-", b: "-...",
          c: "-.-.", d: "-..",
          e: ".", f: "..-.",
          g: "--.", h: "....",
          i: "..", j: ".---",
          k: "-.-", l: ".-..",
          m: "--", n: "-.",
          o: "---", p: ".--.",
          q: "--.-", r: ".-.",
          s: "...", t: "-",
          u: "..-", v: "...-",
          w: ".--", x: "-..-",
          y: "-.--", z: "--..",
          "0": "-----", "1": ".----",
          "2": "..---", "3": "...--",
          "4": "....-", "5": ".....",
          "6": "-....", "7": "--...",
          "8": "---..", "9": "----."
        },
        decodemrs = text => text
          .trim()
          .replace(/ {3,}/g, " / ")
          .split(" ")
          .map(v => v === "/" 
              ? " "
              : Object.keys(mrs).find(key => mrs[key] === v) ?? v
          ).join("")

        await xp.sendMessage(chat.id, { text: decodemrs(text) }, { quoted: m })
      } catch (e) {
        err(`error pada ${cmd}`, e)
        call(xp, e, m)
      }
    }
  })

  ev.on({
    name: 'ptv',
    cmd: ['ptv', 'p'],
    tags: 'Tools Menu',
    desc: 'generate ptv studio',
    owner: !1,
    prefix: !0,
    money: 100,
    exp: 0.1,

    run: async (xp, m, {
      args,
      chat,
      cmd
    }) => {
      try {
        const quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage,
              video = quoted?.videoMessage || m.message?.videoMessage

        if (!video) return xp.sendMessage(chat.id, { text: 'reply atau kirim video yang ingin dijadikan ptv' }, { quoted: m })

        let media = await downloadMediaMessage({ message: quoted || m.message }, 'buffer')

        if (!media) throw new Error('gagal mengunduh media')

        await xp.sendMessage(chat.id, { video: media, mimetype: 'video/mp4', ptv: !0 })
        media = null
      } catch (e) {
        err(`error pada ${cmd}`, e)
        call(xp, e, m)
      }
    }
  })

  ev.on({
    name: 'readmore',
    cmd: ['rm', 'readmore'],
    tags: 'Tools Menu',
    desc: 'membuat teks baca selengkapnya',
    owner: !1,
    prefix: !0,
    money: 100,
    exp: 0.1,

    run: async (xp, m, {
      args,
      chat,
      cmd,
      prefix
    }) => {
      try {
        const txt = args?.join(' ')

        if (!txt?.includes('|')) return xp.sendMessage(chat.id, { text: `format salah\ncontoh: ${prefix}${cmd} teks 1 | teks 2` }, { quoted: m })

        const [t1, t2] = txt.split('|').map(v => v.trim()),
              result = `${t1}${global.readmore} ${t2}`

        await xp.sendMessage(chat.id, { text: result }, { quoted: m })
      } catch (e) {
        err(`error pada ${cmd}`, e)
        call(xp, e, m)
      }
    }
  })

  ev.on({
    name: 'rvo',
    cmd: ['rvo'],
    tags: 'Tools Menu',
    desc: 'mengekstrak media viewOnce',
    owner: !1,
    prefix: !0,
    money: 100,
    exp: 0.1,

    run: async (xp, m, {
      chat,
      cmd
    }) => {
      try {
        const q = m.message?.extendedTextMessage?.contextInfo?.quotedMessage,
              reply = ['imageMessage','videoMessage','audioMessage']
                .map(v => q?.[v])
                .find(Boolean),
              mediaMsg = ['image', 'video', 'audio'],
              mediaType = mediaMsg.find(t => reply?.mimetype?.includes(t))

        if (chat.group) {
          const { usrAdm } = await grupify(xp, m)
          if (!usrAdm) return xp.sendMessage(chat.id, { text: 'kamu bukan admin' }, { quoted: m })
        } else {
          if (!reply || !mediaType || !reply.mediaKey) {
            return xp.sendMessage(chat.id, { text: !reply ? 'reply pesan satu kali lihat' : !mediaType ? 'tipe media tidak didukung' : 'media sudah tidak bisa diambil' }, { quoted: m })
          }
        }

        const media = await downloadMediaMessage({ message: { [`${mediaType}Message`]: reply } }, 'buffer', {}, { logger: xp.logger, reuploadRequest: xp.updateMediaMessage })

        if (!media) throw new Error('gagal mengunduh media')

        await xp.sendMessage(chat.id, {
          [mediaType]: media,
          caption: reply.caption
            ? `pesan: ${reply.caption}`
            : 'media berhasil diambil'
        }, { quoted: m })
      } catch (e) {
        err(`error pada ${cmd}`, e)
        call(xp, e, m)
      }
    }
  })

  ev.on({
    name: 'to enigma',
    cmd: ['toenigma', 'toen'],
    tags: 'Tools Menu',
    desc: 'encode teks enigma personal',
    owner: !1,
    prefix: !0,
    money: 50,
    exp: 0.1,

    run: async (xp, m, {
      args,
      chat,
      cmd,
      prefix
    }) => {
      try {
        const file = './temp/enigma.json',
              abc = [...'abcdefghijklmnopqrstuvwxyz'],
              rand = () => [...abc].sort(() => Math.random() - .5),
              enc = (t, r) => t.toLowerCase().split('')
                .map(c => {
                  const i = abc.indexOf(c)
                  return i !== -1 ? r[i] : c
                }).join(''),
              text = chat.quoted.txt || args.join(' ')

        if (!text) return xp.sendMessage(chat.id, { text: `Masukkan teks atau reply pesan\nContoh: ${prefix}${cmd} halo aku ${botName}` }, { quoted: m })

        !fs.existsSync(file)
          ? fs.writeFileSync(file, JSON.stringify({ key: {} }, null, 2))
          : !0

        const jid = m.key?.participant || chat.sender,
              rotor = rand(),
              result = enc(text, rotor),
              db = JSON.parse(fs.readFileSync(file))

        db.key[chat.pushName] = {
          jid,
          id: m.key?.id,
          rotor: {
            text: result,
            random: rotor
          }
        }

        fs.writeFileSync(file, JSON.stringify(db, null, 2))
        await xp.sendMessage(chat.id, { text: result }, { quoted: m })
      } catch (e) {
        err(`error pada ${cmd}`, e)
        call(xp, e, m)
      }
    }
  })

  ev.on({
    name: 'tomc',
    cmd: ['tomc', 'tominecraft', 'totomc'],
    tags: 'Tools Menu',
    desc: 'mengubah teks menjadi bahasa mc',
    owner: !1,
    prefix: !0,
    money: 50,
    exp: 0.1,

    run: async (xp, m, {
      args,
      chat,
      cmd,
      prefix
    }) => {
      try {
        const text = chat.quoted.txt || args.join(' ')

        if (!text) return xp.sendMessage(chat.id, { text: `Masukkan teks atau reply pesan\nContoh: ${prefix}${cmd} halo aku ${botName}` }, { quoted: m })

        const mc = {
          a: "ᔑ", b: "ʖ",
          c: "ᓵ", d: "↸",
          e: "ᒷ", f: "⎓",
          g: "⊣", h: "⍑",
          i: "╎", j: "⋮",
          k: "ꖌ", l: "ꖎ",
          m: "ᒲ", n: "リ",
          o: "𝙹", p: "!¡",
          q: "ᑑ", r: "∷",
          s: "ᓭ", t: "ℸ̣",
          u: "⚍", v: "⍊", 
          w: "∴", x: "̇/",
          y: "||", z: "⨅",
          " ": "/"
        },
        encmc = text => text
          .toLowerCase()
          .split("")
          .map(v => mc[v] ?? v)
          .join(" ")

        await xp.sendMessage(chat.id, { text: encmc(text) }, { quoted: m })
      } catch (e) {
        err(`error pada ${cmd}`, e)
        call(xp, e, m)
      }
    }
  })

  ev.on({
    name: 'to morse',
    cmd: ['tomorse'],
    tags: 'Tools Menu',
    desc: 'mengubah text menjadi morse',
    owner: !1,
    prefix: !0,
    money: 50,
    exp: 0.1,

    run: async (xp, m, {
      args,
      chat,
      cmd,
      prefix
    }) => {
      try {
        const text = chat.quoted.txt || args.join(' ')

        if (!text) return xp.sendMessage(chat.id, { text: `masukan atau reply pesan nya\ncontoh: ${prefix}${cmd} halo aku ${botName}` }, { quoted: m })

        const mrs = {
          a: ".-", b: "-...",
          c: "-.-.", d: "-..",
          e: ".", f: "..-.",
          g: "--.", h: "....",
          i: "..", j: ".---",
          k: "-.-", l: ".-..",
          m: "--", n: "-.",
          o: "---", p: ".--.",
          q: "--.-", r: ".-.",
          s: "...", t: "-",
          u: "..-", v: "...-",
          w: ".--", x: "-..-",
          y: "-.--", z: "--..",
          "0": "-----", "1": ".----",
          "2": "..---", "3": "...--",
          "4": "....-", "5": ".....",
          "6": "-....", "7": "--...",
          "8": "---..", "9": "----."
        },
        encmrs = text => text
           .toLowerCase()
            .split("")
            .map(v => mrs[v] ?? v)
            .join(" ")

        await xp.sendMessage(chat.id, { text: ` ${encmrs(text)}` }, { quoted: m })
      } catch (e) {
        err(`error pada ${cmd}`, e)
        call(xp, e, m)
      }
    }
  })

  ev.on({
    name: 'to mp3',
    cmd: ['tomp3', 'tomusik', 'tolagu'],
    tags: 'Tools Menu',
    desc: 'mengubah video menjadi musik/mp3',
    owner: !1,
    prefix: !0,
    money: 50,
    exp: 0.1,

    run: async (xp, m, {
      chat,
      cmd,
      prefix
    }) => {
      try {
        const q = m.message?.extendedTextMessage?.contextInfo?.quotedMessage,
              vid = q?.videoMessage || m.message?.videoMessage

        if (!vid) return xp.sendMessage(chat.id, { text: `Kirim atau reply video dengan caption ${prefix}${cmd}` }, { quoted: m })

        let media = await downloadMediaMessage({ message: q || m.message }, 'buffer')
        if (!media) throw new Error('media tidak terunduh')

        await xp.sendMessage(chat.id, { react: { text: '⏳', key: m.key } })

        const input = saveTemp(media, 'mp4'),
              output = tmpPath('mp3')

        await new Promise((resolve, reject) => {
          ffmpeg(input)
            .noVideo()
            .audioCodec('libmp3lame')
            .audioBitrate(128)
            .audioFrequency(44100)
            .on('error', reject)
            .on('end', resolve)
            .save(output)
        })

        const audio = readAndDelete(output)
        fs.unlinkSync(input)

        await xp.sendMessage(chat.id, {
          audio,
          mimetype: 'audio/mpeg',
          ptt: !1
        }, { quoted: m })
        media = null
      } catch (e) {
        err(`error pada ${cmd}`, e)
        call(xp, e, m)
      }
    }
  })

  ev.on({
    name: 'tmp files',
    cmd: ['tmpfiles', 'totmp'],
    tags: 'Tools Menu',
    desc: 'ubah gambar jadi link dengan tmpfiles',
    owner: !1,
    prefix: !0,
    money: 50,
    exp: 0.1,

    run: async (xp, m, {
      chat,
      cmd
    }) => {
      try {
        const q = m.message?.extendedTextMessage?.contextInfo?.quotedMessage || m.message,
              img = q?.imageMessage || q?.videoMessage

        if (!img) return xp.sendMessage(chat.id, { text: 'Kirim atau reply gambar/video untuk dijadikan link.' }, { quoted: m })

        let media = await downloadMediaMessage({ message: q }, 'buffer'),
              url = await tmpFiles(media)

        await xp.sendMessage(chat.id, { text: url }, { quoted: m })
        media = null
      } catch (e) {
        err(`error pada ${cmd}`, e)
        call(xp, e, m)
      }
    }
  })

  ev.on({
    name: 'to url',
    cmd: ['tourl', 'url'],
    tags: 'Tools Menu',
    desc: 'mengubah media menjadi url',
    owner: !1,
    prefix: !0,
    money: 500,
    exp: 0.1,

    run: async (xp, m, {
      chat,
      cmd
    }) => {
      try {
        const q = m.message?.extendedTextMessage?.contextInfo?.quotedMessage,
              mediaMsg = ['imageMessage','videoMessage','documentMessage','audioMessage']
                .map(v => m.message?.[v] || q?.[v])
                .find(Boolean),
              name = chat.pushName,
              time = global.time.timeIndo("Asia/Jakarta", "HH")

        if (!mediaMsg) return xp.sendMessage(chat.id, { text: 'reply media yang ingin dijadikan url' }, { quoted: m })

        let media = await downloadMediaMessage({ message: q || m.message }, 'buffer')
        if (!media) throw new Error('error saat mengunduh')

        const upload = async (file) => {
          const { ext } = await fileTypeFromBuffer(file),
                form = new fromdt()

          form.append('file', file, { filename: `${name}-${time}.` + ext })

          const url = await axios.post(`https://c.termai.cc/api/upload?key=AIzaBj7z2z3xBjsk`, form, { headers: form.getHeaders() })

          return url.data
        }

        const res = await upload(media)

        if (!res) return xp.sendMessage(chat.id, { text: 'error pada api' }, { quoted: m })

        let txt = `upload file berhasil\n\n`
            txt += `${head}${opb} *${botName}* ${clb}\n`
            txt += `${body} ${btn} *url:* ${res.path}\n`
            txt += `${body} ${btn} *type:* ${res.mimetype}\n`
            txt += `${body} ${btn} *size:* ${res.size}\n`
            txt += `${foot}${line}`

        await xp.sendMessage(chat.id, {
          text: txt,
          contextInfo: {
            externalAdReply: {
              body: `terima kasih telah menggunakan ${botName}`,
              thumbnailUrl: thumbnail,
              mediaType: 1,
              renderLargerThumbnail: !0
            },
            forwardingScore: 1,
            isForwarded: !0,
            forwardedNewsletterMessageInfo: {
              newsletterJid: idCh,
              newsletterName: footer
            }
          }
        })
        media = null
      } catch (e) {
        err(`error pada ${cmd}`, e)
        call(xp, e, m)
      }
    }
  })

  ev.on({
    name: 'to vn',
    cmd: ['tovn'],
    tags: 'Tools Menu',
    desc: 'ubah lagu jadi vn',
    owner: !1,
    prefix: !0,
    money: 100,
    exp: 0.1,

    run: async (xp, m, {
      chat,
      cmd
    }) => {
      try {
        const q = m.message?.extendedTextMessage?.contextInfo?.quotedMessage,
              reply = ['audioMessage', 'videoMessage']
                .map(v => m.message?.[v] || q?.[v])
                .find(Boolean)

        if (!reply) return xp.sendMessage(chat.id, { text: 'reply atau kirim audio atau video yang akan diubah ke vn' }, { quoted: m })

        let audio = await downloadMediaMessage({ message: q || m.message }, 'buffer')
        if (!audio) throw new Error('media tidak terunduh')

        await vn(xp, audio, m)
        audio = null
      } catch (e) {
        err(`error pada ${cmd}`, e)
        call(xp, e, m)
      }
    }
  })

  ev.on({
    name: 'what music',
    cmd: ['whatmusic', 'musikapa'],
    tags: 'Tools Menu',
    desc: 'mencari judul lagu',
    owner: !1,
    prefix: !0,
    money: 100,
    exp: 0.1,

    run: async (xp, m, {
      chat,
      cmd,
      prefix
    }) => {
      try {
        const q = m.message?.extendedTextMessage?.contextInfo?.quotedMessage,
              audio = q?.audioMessage || q?.voiceNoteMessage

        if (!q || !audio) return xp.sendMessage(chat.id, { text: 'reply pesan audio nya' }, { quoted: m })

        let media = await downloadMediaMessage({ message: q || m.message }, 'buffer')

        if (!media) throw new Error('media tidak terunduh')

        xp.sendMessage(chat.id, { text: 'bentar aku dengerin dulu...' }, { quoted: m })

        const res = await axios.post(`${termaiWeb}/api/audioProcessing/whatmusic?key=${termaiKey}`, media, { headers: { 'Content-Type': 'audio/mpeg' } })

        if (!res.data?.status || !res.data.data) return xp.sendMessage(chat.id, { text: 'Lagu tidak dikenali.' }, { quoted: m })

        const { title, artists, acrid } = res.data.data

        let txt = `${head} ${opb} *Lagu Ditemukan* ${clb}\n`
            txt += `${body} ${btn} *Judul:* ${title}\n`
            txt += `${body} ${btn} *Artis:* ${artists}\n`
            txt += `${body} ${btn} *ACRID:* ${acrid}\n`
            txt += `${foot}${line}`

      await xp.sendMessage(chat.id, { text: txt }, { quoted: m })
      media = null
      } catch (e) {
        err(`error pada ${cmd}`, e)
        call(xp, e, m)
      }
    }
  })
}