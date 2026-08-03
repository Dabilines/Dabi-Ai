import axios from 'axios'
import fd from 'form-data'
import fetch from 'node-fetch'
import fs from 'fs'
import path from 'path'
import { spawn, exec } from 'child_process'
import { writeExifImg, writeExifVid, mediaMessage } from '../../system/exif.js'
import { fileURLToPath } from 'url'

const filename = fileURLToPath(import.meta.url),
      dirname = path.dirname(filename)

export default function maker(ev) {
  ev.on({
    name: 'brat',
    cmd: ['brat'],
    tags: 'Maker Menu',
    desc: 'membuat stiker brat',
    owner: !1,
    prefix: !0,
    money: 0,
    exp: 0.1,

    run: async (xp, m, {
      args,
      chat,
      cmd
    }) => {
      try {
        const txt = args.join(' ') || chat.quoted.txt,
              name = chat.pushName.replace(/\s+/g, '').toLowerCase(),
              time = global.time.timeIndo("Asia/Jakarta", "HH_mm"),
              url = `https://aqul-brat.hf.space/api/brat?text=${encodeURIComponent(txt)}`

        if (!txt) return xp.sendMessage(chat.id, { text: 'masukan teks atau reply text yang akan dijadikan brat' }, { quoted: m })

        await xp.sendMessage(chat.id, { react: { text: '⏳', key: m.key } })

        const temp = path.join(dirname, '../../temp'),
              input = path.join(temp, `input_${name}_${time}.png`),
              output = path.join(temp, `output_${name}_${time}.webp`)

        let data
        try {
          data = (await axios.get(url, { responseType: 'arraybuffer' })).data
        } catch {
          addErr(cmd)
          return xp.sendMessage(chat.id, { text: 'gagal mengambil data dari API brat' }, { quoted: m })
        }

        if (!data) {
          addErr(cmd)
          return xp.sendMessage(chat.id, { text: 'gagal mengambil data' }, { quoted: m })
        }

        try {
          fs.writeFileSync(input, data)
        } catch (e) {
          addErr(cmd)
          return xp.sendMessage(chat.id, { text: `gagal menyimpan file brat\n${e}` }, { quoted: m })
        }

        const ff = spawn('ffmpeg', [
          '-i', input,
          '-vf', 'scale=512:512:force_original_aspect_ratio=decrease',
          '-c:v', 'libwebp',
          '-lossless', '1',
          output
        ])

        ff.on('close', async code => {
          if (code !== 0) {
            addErr(cmd)
            return xp.sendMessage(chat.id, { text: 'gagal memproses gambar brat (ffmpeg error)' }, { quoted: m })
          }

          let final
          try {
            final = await writeExifImg(fs.readFileSync(output), {
              packname: `${botName}`,
              author: `${name}`
            })
          } catch (e) {
            addErr(cmd)
            log('error pada metadata', e)
          }

          await xp.sendMessage(chat.id, { sticker: fs.readFileSync(final) }, { quoted: m })

          ;[input, output, final].forEach(p => fs.existsSync(p) && fs.unlinkSync(p))
        })
      } catch (e) {
        err(`error pada ${cmd}`, e)
        call(xp, e, m, cmd)
      }
    }
  })

  ev.on({
    name: 'fake ngl',
    cmd: ['ngl', 'fakengl'],
    tags: 'Maker Menu',
    desc: 'membuat fake ngl',
    owner: !1,
    prefix: !0,
    money: 0,
    exp: 0.1,

    run: async (xp, m, {
      args,
      chat,
      cmd
    }) => {
      try {
        if (!args.length) return xp.sendMessage(chat.id, { text: 'example: .fakengl halo' }, { quoted: m })

        await xp.sendMessage(chat.id, { react: { text: '⏳', key: m.key } })

        const txt = args.join(' ').trim(),
              emoji = 'whatsapp',
              backgroundColor = 'light',
              url = `${termai.web}/api/maker/ngl?text=${encodeURIComponent(txt)}&emoji=${emoji}&backgroundColor=${backgroundColor}&key=${termai.key}`,
              res = await xp.sendMessage(chat.id, { image: { url }, caption: 'hasil generate', ai: !0 }, { quoted: m })

        res ? !0 : await xp.sendMessage(chat.id, { text: 'gagal membuat fakengl' }, { quoted: m })
      } catch (e) {
        err(`error pada ${cmd}`, e)
        call(xp, e, m, cmd)
      }
    }
  })

  ev.on({
    name: 'fake sw',
    cmd: ['fsw', 'fake sw'],
    tags: 'Maker Menu',
    desc: 'membuat fake status wa',
    owner: !1,
    prefix: !0,
    money: 0,
    exp: 0.1,

    run: async (xp, m, {
      args,
      chat,
      cmd,
      prefix
    }) => {
      try {
        const query = args.join(' ')

        if (!query) return xp.sendMessage(chat.id, { text: `conton penggunaan:\n${prefix}${cmd} nama | waktu\n\n${prefix}${cmd} ${chat.pushName} | ${global.time.timeIndo("Asia/Jakarta", "HH.mm")}` }, { quoted: m })

        const txt = query?.split('|'),
              nama = txt?.[0]?.trim(),
              waktu = txt?.[1]?.trim()

        await xp.sendMessage(chat.id, { react: { text: '⏳', key: m.key } })

        const url = await fetch(`https://api.azbry.com/api/maker/wastatus?nama=${encodeURIComponent(nama)}&waktu=${encodeURIComponent(waktu)}&teks=tes`),
              buff = Buffer.from(await url.arrayBuffer())

        await xp.sendMessage(chat.id, { image: buff, caption: 'Berhasil membuat fake sw' }, { quoted: m })
      } catch (e) {
        err(`error pada ${cmd}`, e)
        call(xp, e, m, cmd)
      }
    }
  })

  ev.on({
    name: 'iqc',
    cmd: ['iqc'],
    tags: 'Maker Menu',
    desc: 'membuat quoted chat iphone',
    owner: !1,
    prefix: !0,
    money: 0,
    exp: 0.1,

    run: async (xp, m, {
      args,
      chat,
      cmd,
      prefix
    }) => {
      try {
        const time = global.time.timeIndo("Asia/Jakarta", "HH:mm"),
              txt = args.join(' ')

        if (!txt?.includes('|')) return xp.sendMessage(chat.id, { text: `contoh penggunaan:\n${prefix}${cmd} text pesan | sim card/catatan\n${prefix}${cmd} halo aku ${botName} | indosat\n${prefix}${cmd} halo aku ${botName} | hari yang cerah` }, { quoted: m })

        const q = txt?.split('|'),
              text = q?.[0]?.trim(),
              crr = q?.[1]?.trim()

        await xp.sendMessage(chat.id, { react: { text: '⏳', key: m.key } })

        let res = await axios.get(`${termai.web}/api/maker/iqc?text=${encodeURIComponent(text)}&timestamp=${time}&emojiType=ios&statusBarTime=${time}&signal=4&battery=56&carrier=${encodeURIComponent(crr)}&key=${termai.key}`, {
              responseType: 'arraybuffer'
            })

        if (!res?.data) {
          addErr(cmd)
          return xp.sendMessage(chat.id, { text: 'api error' }, { quoted: m })
        }

        const buf = res.data

        await xp.sendMessage(chat.id, { image: buf, caption: `sukses membuat iqc` }, { quoted: m })
      } catch (e) {
        err(`error pada ${cmd}`, e)
        call(xp, e, m, cmd)
      }
    }
  })

  ev.on({
    name: 'qc',
    cmd: ['qc'],
    tags: 'Maker Menu',
    desc: 'membuat quoted pesan',
    owner: !1,
    prefix: !0,
    money: 0,
    exp: 0.1,

    run: async (xp, m, {
      args,
      chat,
      cmd
    }) => {
      try {
        const quoted = m.message?.extendedTextMessage?.contextInfo,
              reply = quoted?.quotedMessage?.conversation,
              user = chat.sender|| chat.id,
              name = chat.pushName || m.key?.pushName || m.key.participant,
              defPP = 'https://c.termai.cc/i0/7DbG.jpg',
              colors = ['black', 'white', 'darkgrey']

        if (!args.length && !reply) return xp.sendMessage(chat.id, { text: `reply atau masukan teks\ncontoh: .qc white halo dunia\ndaftar warna:\n${colors.join('\n- ')}` }, { quoted: m })

        const [clr, ...rest] = (args.join(' ') || '').split(' '),
              valid = colors.includes(clr),
              teks = reply ? (valid ? (rest.join(' ') || reply) : reply) : (valid ? rest.join(' ') : '')

        if (!valid && !reply) return xp.sendMessage(chat.id, { text: `masukan warna valid\ncontoh: .qc white halo dunia\ndaftar warna:\n${colors.join('\n- ')}` }, { quoted: m })

        await xp.sendMessage(chat.id, { react: { text: '⏳', key: m.key } })

        let avatar
        try { avatar = await xp.profilePictureUrl(user, 'image') }
        catch { avatar = defPP }

        const url = `${sylva.web}/api/maker/qc?text=${encodeURIComponent(teks)}&nama=${encodeURIComponent(name)}&url=${encodeURIComponent(avatar)}&color=${encodeURIComponent(reply && !valid ? 'white' : clr)}&apikey=${sylva.key}`,
              res = await fetch(url)

        if (!res.ok) return xp.sendMessage(chat.id, { text: 'Gagal membuat quote' }, { quoted: m })

        const buff = Buffer.from(await res.arrayBuffer()),
              stc = await writeExifImg(buff, { packname: 'My sticker', author: '© ' + name })

        await xp.sendMessage(chat.id, { sticker: { url: stc } }, { quoted: m })
      } catch (e) {
        err(`error pada ${cmd}`, e)
        call(xp, e, m, cmd)
      }
    }
  })

  ev.on({
    name: 'smeme',
    cmd: ['smeme'],
    tags: 'Maker Menu',
    desc: 'Membuat stiker meme dari gambar dengan teks atas dan bawah.',
    owner: !1,
    prefix: !0,
    money: 0,
    exp: 0.1,

    run: async (xp, m, {
      args,
      chat,
      cmd,
      prefix
    }) => {
      try {
        const q = m.message?.extendedTextMessage?.contextInfo?.quotedMessage,
              img = m.message?.conversation || m.message?.imageMessage?.caption || q?.imageMessage || q?.stickerMessage,
              txt = args?.join(' ')

        if (!img || !txt?.includes('|')) return xp.sendMessage(chat.id, { text: !img ? `reply gambar/stiker\ncontoh: ${prefix + cmd} atas | bawah` : `format salah\ncontoh: ${prefix + cmd} atas | bawah` }, { quoted: m })

        await xp.sendMessage(chat.id, { react: { text: '⏳', key: m.key } })

        const upUguu = async (buf, name, mime) => {
                const f = new fd()
                f.append('files[]', buf, { filename: name, contentType: mime })

                const { data } = await axios.post(
                  'https://uguu.se/upload.php',
                  f,
                  { headers: f.getHeaders() }
                )

                if (!data?.files?.[0]?.url) {
                  addErr(cmd)
                  throw Error('Upload gagal ke uguu.se')
                }
                return data.files[0].url
              },
              genMemeBuf = async (url, atas, bawah) =>
                Buffer.from(
                  (await axios.get(
                    `https://api.memegen.link/images/custom/${encodeURIComponent(atas)}/${encodeURIComponent(bawah)}.png?background=${encodeURIComponent(url)}`,
                    { responseType: 'arraybuffer' }
                  )).data
                )

        const [atas, bawah] = txt.split('|').map(v => v.trim() || '_'),
              media = await downloadMedia(xp, cmd, m, q)

        if (!media) {
          addErr(cmd)
          return xp.sendMessage(chat.id, { text: 'gagal mengunduh mendia ulangi, jika masih sama media rusak' }, { quoted: m })
        }

        const url = await upUguu(media, 'smeme.jpg', 'image/jpeg'),
              meme = await genMemeBuf(url, atas, bawah),
              stcPath = await writeExifImg(meme, { packname: `${botName}`, author: `${chat.pushName}` })

        await xp.sendMessage(chat.id, { sticker: fs.readFileSync(stcPath) }, { quoted: m })
      } catch (e) {
        err(`error pada ${cmd}`, e)
        call(xp, e, m, cmd)
      }
    }
  })

  ev.on({
    name: 'stiker',
    cmd: ['s', 'stiker', 'sticker'],
    tags: 'Maker Menu',
    desc: 'membuat stiker',
    owner: !1,
    prefix: !0,
    money: 0,
    exp: 0.1,

    run: async (xp, m, {
      chat,
      cmd
    }) => {
      try {
        const quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage,
              image = quoted?.imageMessage || m.message?.imageMessage,
              video = quoted?.videoMessage || m.message?.videoMessage

        if (!image && !video) return xp.sendMessage(chat.id, { text: 'reply/kirim media dengan caption yang akan dijadikan stiker' }, { quoted: m })

        const media = await downloadMedia(xp, cmd, m, quoted)

        if (!media) {
          addErr(cmd)
          return xp.sendMessage(chat.id, { text: 'gagal mengunduh mendia ulangi, jika masih sama media rusak' }, { quoted: m })
        }

        const pack = { packname: footer, author: chat.pushName },
              Spath = image ? await writeExifImg(media, pack) : await writeExifVid(media, pack)

        if (!Spath) {
          addErr(cmd)
          throw new Error('gagal membuat stiker')
        }

        const exists = fs.existsSync(Spath)
        if (!exists) {
          addErr(cmd)
          throw new Error('file tidak ditemukan setelah ffmpeg')
        }

        await xp.sendMessage(chat.id, { sticker: fs.readFileSync(Spath) }, { quoted: m })
        fs.existsSync(Spath) && fs.unlinkSync(Spath)
      } catch (e) {
        err(`error pada ${cmd}`, e)
        call(xp, e, m, cmd)
      }
    }
  })

  ev.on({
    name: 'swm',
    cmd: ['swm'],
    tags: 'Maker Menu',
    desc: 'set wm stiker',
    owner: !1,
    prefix: !0,
    money: 0,
    exp: 0.1,

    run: async (xp, m, {
      args,
      chat,
      cmd,
      prefix
    }) => {
      try {
        const txt = args.join(' '),
              [packname, author] = txt.split('|').map(v => v?.trim()),
              stc = m.message?.extendedTextMessage?.contextInfo?.quotedMessage,
              mime = stc?.stickerMessage?.mimetype,
              isStiker = /webp/.test(mime)

        if ((!txt || txt === '') || (!packname || !author) || !isStiker) return xp.sendMessage(chat.id, { text: !txt || txt === '' ? `format:\n${prefix}${cmd} packname | author\nreply stiker` : !packname || !author ? 'format salah, gunakan packname | author' : 'reply stiker yang ingin diubah' }, { quoted: m })

        const media = await downloadMedia(xp, cmd, m, stc)

        if (!media) {
          addErr(cmd)
          return xp.sendMessage(chat.id, { text: 'gagal mengunduh mendia ulangi, jika masih sama media rusak' }, { quoted: m })
        }

        const pack = { packname, author },
              isAnimated = stc?.stickerMessage?.isAnimated,
              Spath = isAnimated ? await writeExifVid(media, pack) : await writeExifImg(media, pack)

        if (!Spath) {
          addErr(cmd)
          throw new Error('gagal membuat stiker')
        }

        await xp.sendMessage(chat.id, { sticker: fs.readFileSync(Spath) }, { quoted: m })
      } catch (e) {
        err(`error pada ${cmd}`, e)
        call(xp, e, m, cmd)
      }
    }
  })

  ev.on({
    name: 'to img',
    cmd: ['toimg'],
    tags: 'Maker Menu',
    desc: 'konversi stiker ke gambar',
    owner: !1,
    prefix: !0,
    money: 0,
    exp: 0.1,

    run: async (xp, m, {
      chat,
      cmd
    }) => {
      try {
        const quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage,
              stiker = quoted?.stickerMessage || m.message?.stickerMessage,
              temp = path.join(dirname, '../../temp'),
              time = global.time.timeIndo("Asia/Jakarta", "HH:mm")

        if (!stiker || stiker.isAnimated || !fs.existsSync(temp)) return xp.sendMessage(chat.id, { text: !stiker ? 'reply/kirim stiker yang ingin dikonversi' : stiker.isAnimated ? 'stiker animasi tidak bisa dikonversi' : 'folder temp belum ada' }, { quoted: m })

        const timeDir = `${time}`,
              webpPath = await mediaMessage({ message: quoted || m.message }, 'buffer'),
              outputPath = path.join(temp, `${webpPath}_${time}.png`)

        exec(`ffmpeg -i "${webpPath}" "${outputPath}"`, async err => {
          await fs.promises.unlink(webpPath).catch(() => {})
          if (err || !fs.existsSync(outputPath)) {
            addErr(cmd)
            return xp.sendMessage(chat.id, { text: `gagal mengonversi: ${err.message || 'tidak diketahui'}` }, { quoted: m })
          }

          const buffer = await fs.promises.readFile(outputPath)
          await xp.sendMessage(chat.id, { image: buffer, caption: 'hasil konversi' }, { quoted: m })
        })
      } catch (e) {
        err(`error pada ${cmd}`, e)
        call(xp, e, m, cmd)
      }
    }
  })
}