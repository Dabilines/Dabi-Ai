import axios from 'axios'
import fs from 'fs'
import os from 'os'
import path from 'path'
import c from 'chalk'
import fetch from 'node-fetch'
import ffmpeg from 'fluent-ffmpeg'
import jimp from 'jimp'
import { vn } from '../interactive.js'
import { saveTemp, tmpPath, readAndDelete } from '../../system/exif.js'
import { downloadMediaMessage, prepareWAMessageMedia } from 'baileys'
import { tmpFiles, termup } from '../../system/tmpfiles.js'
import { fileTypeFromBuffer } from 'file-type'

export default function tools(ev) {
  ev.on({
    name: 'test',
    cmd: ['tes'],
    tags: 'Tools Menu',
    desc: 'tes',
    owner: !1,
    prefix: !0,
    money: 50,
    exp: 0.1,

    run: async (xp, m, {
      chat,
      cmd
    }) => {
      try {
const rawContent = {
  "productMessage": {
    "product": {
      "productImage": {
        "url": `${thumbnail}`,
        "mimetype": "image/jpeg",
        "fileSha256": "lcZ0U/wC7fs3bbbrVtFwlRgC8aIXptV1gOnBIs/mzz0=",
        "fileLength": "7613",
        "height": 300,
        "width": 300,
        "mediaKey": "KobTTk4jEcjrWxsXys/IIwkJcq30sfsffcePUPiUcdM=",
        "fileEncSha256": "JJZ5GvJ9bRwDXeIl+c5jOW3imbhIueQRxq6N5T0rT8c=",
        "directPath": "/o1/v/t24/f2/m269/AQN8KOMdEHsltbVU6DERZNXVt3WTK196aZkAUVh2wtyUEegqxpMR7STPva4luNwwFGTd7EDncChLlH2etDa_m61uAB3oE44fi9Jh1vQYQQ?ccb=9-4&oh=01_Q5Aa5QHQLJSqS0huoapvwEdNgjpOvVBLnj-D25uVcLP3yJ1qZQ&oe=6A990D46&_nc_sid=e6ed6c",
        "mediaKeyTimestamp": "1785832954",
        "jpegThumbnail": "/9j/4AAQSkZJRgABAQAAAQABAAD/2wCEABsbGxscGx4hIR4qLSgtKj04MzM4PV1CR0JHQl2NWGdYWGdYjX2Xe3N7l33gsJycsOD/2c7Z//////////////8BGxsbGxwbHiEhHiotKC0qPTgzMzg9XUJHQkdCXY1YZ1hYZ1iNfZd7c3uXfeCwnJyw4P/Zztn////////////////CABEIAEgASAMBIgACEQEDEQH/xAAwAAEAAwEBAQAAAAAAAAAAAAAAAwQFAgYBAQADAQEAAAAAAAAAAAAAAAAAAwQCAf/aAAwDAQACEAMQAAAA8yAdfNHWqUXqcBm6qzApfI5xs417e9nOnzaWa9PKmXn0GRqYbWVxFM1sv0dGo/P6tDvIDufmjY7hvZlOUC+ZI3C/fydi8z7mVeCCjpZswCQAdAcgAAA//8QAIhAAAgICAQUBAQEAAAAAAAAAAQIAAwQREhATICExBVEj/9oACAEBAAE/AOqqznSjZj0WoNsp89H+T83j3TuOoYEETKp7VkrxLrV2BHRkYqw99cHER05tDRX84iX1DHYWpKsquxfsyCl19aCLpQAJngdwHri5r0evqxv0E18MyMo3evgmyJjvwtUmdxQu9zJt7thPXExV0HeXpUa2HEQ9aMVmUF2OocOnXyWp23KxNcl3/YuuA0fWpkWlv809kyzHsQbI6JtWUkRbkKjREtyVUfY7F2JPQW2AaDHUwhtmMccgRMete44MKKfRAmRQaxyU+vHGs7bwsoXlud4raXETKrYe5kZCGsqPLm2tbPl//8QAIREAAQQBBAMBAAAAAAAAAAAAAQACAxESECExQQQTIiD/2gAIAQIBAT8ATRk4BSRYCxwqI60jIDt098ePIvpe3OmkdqcgMrSBjXEkqdtn5F1yUAsI2ts1SNWa4VkLx3N9ahkjot2G6mxz+f3/AP/EAB8RAAIBBAIDAAAAAAAAAAAAAAECAAMQERIhMRMwQf/aAAgBAwEBPwCKNmAlSlpzMGyEBuY7L87nlLYBlZlIGLLCc22UDr2f/9k="
      },
      "productId": "26052623991081935",
      "title": "Jasa/layanan Tentang Script",
      "description": "Layanan:\n- Fix all\n- Pembuatan\n- Script bot /wa/tele/dc\n- Website RestApi\n- Pengecekan Bug fitur dll\n\nNote: Harga bisa berubah tergantung pesanan && layanan",
      "currencyCode": "IDR",
      "priceAmount1000": "30000000",
      "retailerId": "231",
      "productImageCount": 1,
      "salePriceAmount1000": "25000000"
    },
    "businessOwnerJid": "114251163242733@lid"
  }
};

function reviveBuffers(obj) {
  if (obj && typeof obj === 'object') {
    if (obj.type === 'Buffer' && Array.isArray(obj.data)) {
      return Buffer.from(obj.data);
    }
    for (let k in obj) {
      obj[k] = reviveBuffers(obj[k]);
    }
  }
  return obj;
}

const content = reviveBuffers(rawContent);

const relayOptions = {
  messageId: "PP" + Date.now(),
  participant: "",
};

await xp.relayMessage(chat.id, content, relayOptions);
      } catch (e) {
        err(`error pada ${cmd}`, e)
        call(xp, e, m, cmd)
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
              data = Object.values(db.key || {}).find(v => v.jid === chat.sender),
              rotor = data?.rotor?.random || rand(),
              result = dec(text, rotor)

        await xp.sendMsg(chat.id, { type: 'text', text: result }, m)
      } catch (e) {
        err(`error pada ${cmd}`, e)
        call(xp, e, m, cmd)
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

        if (!info?.newsletterJid) {
          addErr(cmd)
          return xp.sendMessage(chat.id, { text: 'Tidak ditemukan informasi saluran.' }, { quoted: m })
        }

        let txt = `${head}${opb} Data Channel ${clb}\n`
            txt += `${body} ${btn} *Nama: ${info.newsletterName}*\n`
            txt += `${body} ${btn} *ID Saluran: ${info.newsletterJid}*\n`
            txt += `${body} ${btn} *ID Pesan: ${info.serverMessageId}*\n`
            txt += `${foot}${line}`

        await xp.sendMsg(chat.id, { text: txt, body: `informasi saluran ${info.newsletterName}` }, m)
      } catch (e) {
        err(`error pada ${cmd}`, e)
        call(xp, e, m, cmd)
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
              user = target?.replace(/@s\.whatsapp\.net$/, ''),
              { usrAdm, botAdm } = await grupify(xp, m),
              defThumb = 'https://c.termai.cc/i0/7DbG.jpg'

        if (!chat.group || !usrAdm || !botAdm || !target) return xp.sendMessage(chat.id, { text: !chat.group ? 'perintah ini hanya bisa dijalankan digrup' : !usrAdm ? 'kamu bukan admin' : !botAdm ? 'aku bukan admin' : 'reply/tag target' }, { quoted: m })

        let thumb
        try { thumb = await xp.profilePictureUrl(target, 'image') }
        catch { thumb = defThumb }

        await xp.sendMessage(chat.id, { image: { url: thumb }, caption: `pp @${user}`, mentions: [target] }, { quoted: m })
      } catch (e) {
        err(`error pada ${cmd}`, e)
        call(xp, e, m, cmd)
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
    money: 1500,
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

        const media = await downloadMedia(xp, cmd, m, q)

        if (!media) {
          addErr(cmd)
          return xp.sendMessage(chat.id, { text: 'gagal mengunduh mendia ulangi, jika masih sama media rusak' }, { quoted: m })
        }

        await xp.sendMessage(chat.id, { react: { text: '⏳', key: m.key } })

        const imageUrl = await termup(media),
              { data } = await axios.get(`${sylva.web}/api/tools/hd?url=${encodeURIComponent(imageUrl.path)}&apikey=${sylva.key}`, { responseType: 'arraybuffer' })

        log(imageUrl)

        if (!data) return xp.sendMessage(chat.id, { text: `${sylva.web} error` }, { quoted: m })

        await xp.sendMessage(chat.id, { image: data, caption: 'Gambar berhasil diupscale' }, { quoted: m })
      } catch (e) {
        err(`error pada ${cmd}`, e)
        call(xp, e, m, cmd)
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
        decmc = text => text.trim().split(" ").map(v => v === "/" ? " " : Object.keys(mc).find(k => mc[k] === v) ?? v).join("")

        await xp.sendMessage(chat.id, { text: decmc(text) }, { quoted: m })
      } catch (e) {
        err(`error pada ${cmd}`, e)
        call(xp, e, m, cmd)
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
        decodemrs = text => text.trim().replace(/ {3,}/g, " / ").split(" ").map(v => v === "/" ? " " : Object.keys(mrs).find(key => mrs[key] === v) ?? v).join("")

        await xp.sendMessage(chat.id, { text: decodemrs(text) }, { quoted: m })
      } catch (e) {
        err(`error pada ${cmd}`, e)
        call(xp, e, m, cmd)
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

        const media = await downloadMedia(xp, cmd, m, quoted)

        if (!media) {
          addErr(cmd)
          return xp.sendMessage(chat.id, { text: 'gagal mengunduh mendia ulangi, jika masih sama media rusak' }, { quoted: m })
        }

        await xp.sendMessage(chat.id, { video: media, mimetype: 'video/mp4', ptv: !0 })
      } catch (e) {
        err(`error pada ${cmd}`, e)
        call(xp, e, m, cmd)
      }
    }
  })

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

        if (!text || !text.includes('|') || (!id || !server_id || !reactText)) return xp.sendMessage(chat.id, { text: !text || !text.includes('|') ? `Format salah\n\nContoh:\n.rch 123@newsletter | 123 | 👌👍✅` : `Data tidak lengkap\n\nFormat:\n.rch 123@newsletter | 123 | 👌👍✅` }, { quoted: m })

        const reaction = [...reactText]

        await fetch(`https://dabilines.my.id/api/rch?action=push&id=${encodeURIComponent(id)}&srv=${encodeURIComponent(server_id)}&react=${encodeURIComponent(JSON.stringify(reaction))}`).then(r => r.json())

        if (reaction.length > 1 || reaction.length === 1) return xp.sendMessage(chat.id, { text: `dalam antrian\n\nID: ${id}\nServer: ${server_id}\nReaction: ${reaction.join(', ')}` }, { quoted: m })
      } catch (e) {
        err(`error pada ${cmd}`, e)
        call(xp, e, m, cmd)
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
        call(xp, e, m, cmd)
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
              reply = ['imageMessage','videoMessage','audioMessage'].map(v => q?.[v]).find(Boolean),
              mediaMsg = ['image', 'video', 'audio'],
              mediaType = mediaMsg.find(t => reply?.mimetype?.includes(t))

        if (chat.group) {
          const { usrAdm } = await grupify(xp, m)
          if (!usrAdm) return xp.sendMessage(chat.id, { text: 'kamu bukan admin' }, { quoted: m })
        } else {
          if (!reply || !mediaType || !reply.mediaKey) return xp.sendMessage(chat.id, { text: !reply ? 'reply pesan satu kali lihat' : !mediaType ? 'tipe media tidak didukung' : 'media sudah tidak bisa diambil' }, { quoted: m })
        }

        const media = await downloadMediaMessage({ message: { [`${mediaType}Message`]: reply } }, 'buffer', {}, { logger: xp.logger, reuploadRequest: xp.updateMediaMessage })

        if (!media) {
          addErr(cmd)
          throw new Error('gagal mengunduh media')
        }

        await xp.sendMessage(chat.id, {
          [mediaType]: media,
          caption: reply.caption ? `pesan: ${reply.caption}` : 'media berhasil diambil'
        }, { quoted: m })
      } catch (e) {
        err(`error pada ${cmd}`, e)
        call(xp, e, m, cmd)
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

        !fs.existsSync(file) ? fs.writeFileSync(file, JSON.stringify({ key: {} }, null, 2)) : !0

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
        call(xp, e, m, cmd)
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
        encmc = text => text.toLowerCase().split("").map(v => mc[v] ?? v).join(" ")

        await xp.sendMessage(chat.id, { text: encmc(text) }, { quoted: m })
      } catch (e) {
        err(`error pada ${cmd}`, e)
        call(xp, e, m, cmd)
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
        encmrs = text => text.toLowerCase().split("").map(v => mrs[v] ?? v).join(" ")

        await xp.sendMessage(chat.id, { text: ` ${encmrs(text)}` }, { quoted: m })
      } catch (e) {
        err(`error pada ${cmd}`, e)
        call(xp, e, m, cmd)
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

        const media = await downloadMedia(xp, cmd, m, q)

        if (!media) {
          addErr(cmd)
          return xp.sendMessage(chat.id, { text: 'gagal mengunduh mendia ulangi, jika masih sama media rusak' }, { quoted: m })
        }

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
      } catch (e) {
        err(`error pada ${cmd}`, e)
        call(xp, e, m, cmd)
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

        const media = await downloadMedia(xp, cmd, m, q)

        if (!media) {
          addErr(cmd)
          return xp.sendMessage(chat.id, { text: 'gagal mengunduh mendia ulangi, jika masih sama media rusak' }, { quoted: m })
        }

        const url = await tmpFiles(media)

        if (!url) {
          addErr(cmd)
          return xp.sendMessage(chat.id, { text: 'respon api false' }, { quoted: m })
        }

        await xp.sendMessage(chat.id, { text: url }, { quoted: m })
      } catch (e) {
        err(`error pada ${cmd}`, e)
        call(xp, e, m, cmd)
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
              mediaMsg = ['imageMessage','videoMessage','documentMessage','audioMessage'].map(v => m.message?.[v] || q?.[v]).find(Boolean),
              name = chat.pushName,
              time = global.time.timeIndo("Asia/Jakarta", "HH")

        if (!mediaMsg) return xp.sendMessage(chat.id, { text: 'reply media yang ingin dijadikan url' }, { quoted: m })

        const media = await downloadMedia(xp, cmd, m, q)

        if (!media) {
          addErr(cmd)
          return xp.sendMessage(chat.id, { text: 'gagal mengunduh mendia ulangi, jika masih sama media rusak' }, { quoted: m })
        }

        const res = await termup(media, name, time)

        if (!res) {
          addErr(cmd)
          return xp.sendMessage(chat.id, { text: 'error pada api' }, { quoted: m })
        }

        let txt = `upload file berhasil\n\n`
            txt += `${head}${opb} *${botName}* ${clb}\n`
            txt += `${body} ${btn} *url:* ${res.path}\n`
            txt += `${body} ${btn} *type:* ${res.mimetype}\n`
            txt += `${body} ${btn} *size:* ${res.size}\n`
            txt += `${foot}${line}`

        await xp.sendMsg(chat.id, { text: txt }, m)
      } catch (e) {
        err(`error pada ${cmd}`, e)
        call(xp, e, m, cmd)
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
              reply = ['audioMessage', 'videoMessage'].map(v => m.message?.[v] || q?.[v]).find(Boolean)

        if (!reply) return xp.sendMessage(chat.id, { text: 'reply atau kirim audio atau video yang akan diubah ke vn' }, { quoted: m })

        const audio = await downloadMedia(xp, cmd, m, q)

        if (!audio) {
          addErr(cmd)
          return xp.sendMessage(chat.id, { text: 'gagal mengunduh mendia ulangi, jika masih sama media rusak' }, { quoted: m })
        }

        await vn(xp, audio, m)
      } catch (e) {
        err(`error pada ${cmd}`, e)
        call(xp, e, m, cmd)
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

        const media = await downloadMedia(xp, cmd, m, q)

        if (!media) {
          addErr(cmd)
          return xp.sendMessage(chat.id, { text: 'gagal mengunduh mendia ulangi, jika masih sama media rusak' }, { quoted: m })
        }

        xp.sendMessage(chat.id, { text: 'bentar aku dengerin dulu...' }, { quoted: m })

        const res = await axios.post(`${termai.web}/api/audioProcessing/whatmusic?key=${termai.key}`, media, { headers: { 'Content-Type': 'audio/mpeg' } })

        if (!res.data?.status || !res.data.data) {
          addErr(cmd)
          return xp.sendMessage(chat.id, { text: 'Lagu tidak dikenali.' }, { quoted: m })
        }

        const { title, artists, acrid } = res.data.data

        let txt = `${head} ${opb} *Lagu Ditemukan* ${clb}\n`
            txt += `${body} ${btn} *Judul:* ${title}\n`
            txt += `${body} ${btn} *Artis:* ${artists}\n`
            txt += `${body} ${btn} *ACRID:* ${acrid}\n`
            txt += `${foot}${line}`

      await xp.sendMessage(chat.id, { text: txt }, { quoted: m })
      } catch (e) {
        err(`error pada ${cmd}`, e)
        call(xp, e, m, cmd)
      }
    }
  })
}