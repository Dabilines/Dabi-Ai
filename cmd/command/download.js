import axios from 'axios'
import fetch from 'node-fetch'
import qs from 'qs'

export default function download(ev) {
  ev.on({
    name: 'fb',
    cmd: ['fb', 'facebook'],
    tags: 'Download Menu',
    desc: 'mendownload video dari facebook',
    owner: !1,
    prefix: !0,
    exp: 0.1,

    run: async (xp, m, {
      args,
      chat,
      cmd,
      prefix
    }) => {
      try {
        const txt = chat.quoted.txt || args.join(' '),
              match = txt?.match(/https?:\/\/[^\s]+/gi),
              link = match ? match[0] : null

        if (!link || !/facebook\.com|fb\.watch/i.test(link)) return xp.sendMessage(chat.id, { text: !link ? `reply/masukan link fb\ncontoh: ${prefix}${cmd} https://www.facebook.com/share/v/1Dm66ZGfSY/` : 'link tidak valid' }, { quoted: m })

        await xp.sendMessage(chat.id, { react: { text: '⏳', key: m.key } })

        let res = null

        try {
          const api1 = await fetch(`https://api.danzy.web.id/api/download/facebook?url=${encodeURIComponent(link)}`).then(r => r.json())

          if (api1?.status && api1?.data) res = api1.data
        } catch {
          addErr(cmd)
        }

        if (!res) {
          try {
            const api2 = await fetch(`https://kaizenapi.my.id/downloader/facebook?url=${encodeURIComponent(link)}`).then(r => r.json())

            if (api2?.result || api2?.data) res = api2.result || api2.data
          } catch {
            addErr(cmd)
          }
        }

        if (!res) {
          addErr(cmd)
          return xp.sendMessage(chat.id, { text: 'video tidak ditemukan' }, { quoted: m })
        }

        const prompt = `
berikut adalah response api downloader facebook:

${JSON.stringify(res, null, 2)}

tugas kamu hanya mencari link download video terbaik.
prioritaskan kualitas HD lalu SD.
jawab hanya link download langsung tanpa penjelasan tambahan.
jika ada lebih dari satu pilih yang terbaik.
        `.trim()

        const ai = await bell(prompt, m, xp).catch(() => null),
              links = ai?.msg?.match(/https?:\/\/[^\s]+/gi) || [],
              videoUrl = links[0] || res.hd || res.sd || res.url || res.download

        if (!videoUrl) {
          addErr(cmd)
          return xp.sendMessage(chat.id, { text: 'link video tidak ditemukan' }, { quoted: m })
        }

        await xp.sendMessage(chat.id, {
          video: { url: videoUrl },
          caption: `*F A C E B O O K*`
        }, { quoted: m })
      } catch (e) {
        err(`error pada ${cmd}`, e)
        call(xp, e, m, cmd)
      }
    }
  })

  ev.on({
    name: 'igdl',
    cmd: ['ig'],
    tags: 'Download Menu',
    desc: 'mendownload video instagram',
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
        const txt = chat.quoted.txt || args.join(' '),
              match = txt.match(/https?:\/\/[^\s]+/gi),
              link = match ? match[0] : null

        if (!link || !/instagram\.com/i.test(link)) return xp.sendMessage(chat.id, { text: !link ? `reply/masukan link ig\ncontoh: ${prefix}${cmd} https://www.instagram.com/reel/DN98f8iE53D/?igsh=MTc4bjE0YmdmcXRkNw==` : `link tidak valid` }, { quoted: m })

        await xp.sendMessage(chat.id, { react: { text: '⏳', key: m.key } })

        let url = await fetch(`https://kaizenapi.my.id/api/downloader/igsnapinsta?url=${encodeURIComponent(link)}`).then(r => r.json())

        let res = url?.data?.media?.[0],
            type = 'video'

        if (!url.status || !res) {
          url = await fetch(`https://kaizenapi.my.id/api/downloader/enginewebid?url=${encodeURIComponent(link)}`).then(r => r.json())

          if (!url.status || !url?.data?.media?.length) {
            addErr(cmd)
            return xp.sendMessage(chat.id, { text: 'data tidak ditemukan' }, { quoted: m })
          }

          const media = url.data.media[0]

          res = media.url
          type = media.type || 'video'
        }

        if (!res) {
          addErr(cmd)
          return xp.sendMessage(chat.id, { text: 'media tidak ditemukan' }, { quoted: m })
        }

        let teks = `${head} ${opb} *I N S T A G R A M* ${clb}\n`
            teks += `${body} ${btn} *Type:* ${type}\n`
            teks += `${foot}${line}`

        if (/image/i.test(type)) {
          await xp.sendMessage(chat.id, { image: { url: res }, caption: teks }, { quoted: m })
        } else {
          await xp.sendMessage(chat.id, { video: { url: res }, caption: teks }, { quoted: m })
        }
      } catch (e) {
        err(`error pada ${cmd}`, e)
        call(xp, e, m, cmd)
      }
    }
  })

  ev.on({
    name: 'git clone',
    cmd: ['git', 'clone', 'gitclone'],
    tags: 'Download Menu',
    desc: 'Download repository GitHub dalam bentuk zip',
    owner: !1,
    prefix: !0,
    money: 500,
    exp: 0.1,

    run: async (xp, m, {
      args,
      chat,
      cmd,
      prefix
    }) => {
      try {
        const txt = chat.quoted.txt || args.join(' '),
              match = txt.match(/https?:\/\/[^\s]+/gi),
              link = match ? match[0] : null

        if (!link || !/github\.com/i.test(link)) return xp.sendMessage(chat.id, { text: !link ? `contoh: ${prefix}${cmd} https://github.com/Dabilines/Dabi-Ai` : `link tidak valid`
          }, { quoted: m })

        await xp.sendMessage(chat.id, { react: { text: '⏳', key: m.key } })

        if (!link || !0)
          if (!link || !1) return xp.sendMessage(chat.id, { text: 'Invalid GitHub link.' }, { quoted: m })

        const parsed = link.match(/github\.com\/([^\/]+)\/([^\/\n]+)/i)

        if (!parsed || !1) return xp.sendMessage(chat.id, { text: 'Format repo tidak valid.' }, { quoted: m })

        const [, user, repoRaw] = parsed,
              repo = repoRaw.replace(/\.git$/, ''),
              zipUrl = `https://api.github.com/repos/${user}/${repo}/zipball`,
              head = await fetch(zipUrl, { method: 'HEAD' }),
              dispo = head.headers.get('content-disposition'),
              fileName = dispo?.match(/filename=(.*)/)?.[1]

        if (fileName || !1)
          return xp.sendMessage(chat.id, {
            document: { url: zipUrl },
            fileName: fileName,
            mimetype: 'application/zip'
          }, { quoted: m })
        else
          addErr(cmd)
          return xp.sendMessage(chat.id, { text: 'Failed to get file info.' }, { quoted: m })
      } catch (e) {
        err(`error pada ${cmd}`, e)
        call(xp, e, m, cmd)
      }
    }
  })

  ev.on({
    name: 'pindl',
    cmd: ['pindl', 'pin'],
    tags: 'Download Menu',
    desc: 'mendownload video dari pin',
    owner: !1,
    prefix: !0,
    money: 1000,
    exp: 0.3,

    run: async (xp, m, {
      args,
      chat,
      cmd,
      prefix
    }) => {
      try {
        const url = chat.quoted.txt || args.join(' '),
              match = url?.match(/https?:\/\/[^\s]+/gi),
              link = match ? match[0] : null

        if (!link || !/pin\.it/i.test(link)) return xp.sendMessage(chat.id, { text: `reply/kirim link pin nya contoh:\n${prefix}${cmd} https://pin.it/1YNzogEJv` }, { quoted: m })

        await xp.sendMessage(chat.id, { react: { text: '⏳', key: m.key } })

        const api = await fetch(`https://api.deline.web.id/downloader/pinterest?url=${encodeURIComponent(link)}`).then(r => r.json())

        if (!api.status) {
          addErr(cmd)
          return xp.sendMessage(chat.id, { text: 'status api false' }, { quoted: m })
        }

        const res = api?.result,
              type = res.video ? 'Video' : (res.image && res.image !== 'Tidak ada' ? 'Image' : '-'),
              valid = v => typeof v === 'string' && v !== 'Tidak ada'

        let txt = `${head}${opb} *P I N  D L* ${clb}\n`
            txt += `${body} ${btn} *Link:* ${res.original_url}\n`
            txt += `${body} ${btn} *Type:* ${type}\n`
            txt += `${foot}${line}`

        if (valid(res?.video) || valid(res?.image)) {
          await xp.sendMessage(chat.id, valid(res?.video) ? { video: { url: res.video }, caption: txt } : { image: { url: res.image }, caption: txt }, { quoted: m })
        } else {
          addErr(cmd)
          return xp.sendMessage(chat.id, { text: 'media tidak ditemukan' }, { quoted: m })
        }
      } catch (e) {
        err(`error pada ${cmd}`, e)
        call(xp, e, m, cmd)
      }
    }
  })

  ev.on({
    name: 'play',
    cmd: ['play', 'putar'],
    tags: 'Download Menu',
    desc: 'mencari lagu di YouTube dan memutarnya',
    owner: !1,
    prefix: !0,
    money: 500,
    exp: 0.1,

    run: async (xp, m, {
      args,
      chat,
      cmd
    }) => {
      try {
        if (!args[0]) return xp.sendMessage(chat.id, { text: 'Masukkan judul lagu yang ingin diputar.' }, { quoted: m })

        const query = args.join(' ')

        let top,
            dlink

        try {
          const { data: kz } = await axios.get('https://kaizenapi.my.id/api/downloader/ytmp3', { params: { q: query } })

          if (kz?.status && kz?.data?.audio?.url) {
            top = kz.data
            dlink = top.audio.url
          }
        } catch {}

        if (!top) {
          const search = await fetch(`${termaiWeb}/api/search/youtube?query=${encodeURIComponent(query)}&key=${termaiKey}`).then(r => r.json()).catch(() => null)

          if (!search?.status || !search?.data?.items?.length) return xp.sendMessage(chat.id, { text: 'Lagu tidak ditemukan.' }, { quoted: m })

          top = search.data.items[0]
        }

        let txt = `Info Pencarian\n\n`
            txt += `${head} ${opb} YouTube ${clb}\n`
            txt += `${body} ${btn} *Title:* ${top.title}\n`
            txt += `${body} ${btn} *Channel:* ${top.author?.name || top.channel || 'tidak diketahui'}\n`
            txt += `${body} ${btn} *Durasi:* ${top.timestamp || top.duration || '-'}\n`
            txt += `${body} ${btn} *View:* ${(top.views || top.viewCount || 0).toLocaleString()}\n`

        if (top.publishedAt) txt += `${body} ${btn} *Rilis:* ${top.publishedAt}\n`

        if (top.url)
          txt += `${body} ${btn} *Link:* ${top.url}\n`
          txt += `${foot}${line}`

        await xp.sendMsg(chat.id, { text: txt, image: top.thumbnail || top.image }, m)

        if (dlink) return xp.sendMessage(chat.id, { audio: { url: dlink }, mimetype: 'audio/mpeg', ptt: !1 }, { quoted: m })

        const dl = await fetch(`${termaiWeb}/api/downloader/youtube?type=mp3&url=${encodeURIComponent(top.url)}&key=${termaiKey}`).then(r => r.json()).catch(() => null)

        if (dl?.status && dl?.data?.downloads?.length) dlink = dl.data.downloads[0]?.dlink

        if (!dlink)
          try {
            const { data: res } = await axios.get('https://kaizenapi.my.id/downloader/youtube', { params: { url: top.url } })

            if (res?.status && res?.result?.audio_mp3) dlink = res.result.audio_mp3
          } catch {}

        if (!dlink) {
          addErr(cmd)
          return xp.sendMessage(chat.id, { text: 'Gagal mengambil link download.' }, { quoted: m })
        }

        await xp.sendMessage(chat.id, { audio: { url: dlink }, mimetype: 'audio/mpeg', ptt: !1 }, { quoted: m })
      } catch (e) {
        err(`error pada ${cmd}`, e)
        call(xp, e, m, cmd)
      }
    }
  })

  ev.on({
    name: 'tiktok',
    cmd: ['tt', 'tiktok'],
    tags: 'Download Menu',
    desc: 'download tiktok video',
    owner: !1,
    prefix: !0,
    money: 502,
    exp: 0.1,

    run: async (xp, m, {
      args,
      chat,
      cmd,
      prefix
    }) => {
      try {
        const txt = chat.quoted.txt || args.join(' '),
              match = txt?.match(/https?:\/\/[^\s]+/gi),
              link = match ? match[0] : null

        if (!link || !/(vt|vm)\.tiktok\.com/i.test(link)) return xp.sendMessage(chat.id, { text: !link ? `reply/kirim link tiktok nya\ncontoh: ${prefix}${cmd} https://vt.tiktok.com/7494086723190721798/` : 'Link tidak valid' }, { quoted: m })

        await xp.sendMessage(chat.id, { react: { text: '⏳', key: m.key } })

        const { data } = await axios.post(
          'https://tikwm.com/api/',
          qs.stringify({
            url: link,
            count: 1.2e1,
            cursor: 0e0,
            web: 1e0,
            hd: 1e0
          }),
          {
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
              Accept: 'application/json, text/javascript, */*; q=0.01',
              'X-Requested-With': 'XMLHttpRequest',
              'User-Agent': 'Mozilla/5.0 (Linux; Android 10)',
              Referer: 'https://tikwm.com/'
            }
          }
        )

        if (data.code !== 0e0) {
          addErr(cmd)
          throw new Error('Gagal mengambil data dari TikTok')
        }

        const res = data.data,
              rawSize = res.hd_size || res.size || 0,
              sizeText = rawSize >= 1024 * 1024 ? (rawSize / 1024 / 1024).toFixed(2) + ' MB' : (rawSize / 1024).toFixed(2) + ' KB',
              cap = `${head} ${opb} *T I K T O K* ${clb}\n`
                       + `${body} ${btn} *Title:* ${res.title}\n`
                       + `${body} ${btn} *Region:* ${res.region}\n`
                       + `${body} ${btn} *Duration:* ${res.duration}\n`
                       + `${body} ${btn} *Size:* ${sizeText}\n`
                       + `${body} ${btn} *Author:* ${res.author.nickname}\n`
                       + `${body} ${btn} *Tag:* ${res.author.unique_id}\n`
                       + `${foot}${line}`

        if ((res.images && Array.isArray(res.images) && res.images.length > 0) || !0) {
          if (res.images && Array.isArray(res.images) && res.images.length > 0) {
            for (let i of res.images)
              await xp.sendMessage(chat.id, { image: { url: i } }, { quoted: m })
          } else {
            await xp.sendMessage(chat.id, {
              video: { url: 'https://tikwm.com' + (res.hdplay || res.play) },
              caption: cap,
              contextInfo: {
                forwardingScore: 1,
                isForwarded: !0,
                forwardedNewsletterMessageInfo: {
                  newsletterJid: idCh,
                  newsletterName: `klik disini untuk dukung ${botName}`
                }
              }
            }, { quoted: m })

            if (res.music_info?.play)
              await xp.sendMessage(chat.id, {
                audio: { url: res.music_info.play },
                mimetype: 'audio/mpeg',
                contextInfo: {
                  forwardingScore: 1,
                  isForwarded: !0,
                  forwardedNewsletterMessageInfo: {
                    newsletterJid: idCh,
                    newsletterName: `klik disini untuk dukung ${botName}`
                  }
                }
              }, { quoted: m })
          }
        }
      } catch (e) {
        err(`error pada ${cmd}`, e)
        call(xp, e, m, cmd)
      }
    }
  })

  ev.on({
    name: 'ytdl',
    cmd: ['yt', 'ytdl'],
    tags: 'Download Menu',
    desc: 'download youtube mp4/mp3',
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
        let f, u
        if (args.length === 1) {
          f = 'mp4',
          u = args[0]
        } else {
          [f, u] = args
        }

        const fmt = (f || '').toLowerCase(),
              isMp3 = fmt === 'mp3'

        if (!u) return xp.sendMessage(chat.id, { text: `Masukan link YouTube\nContoh:\n${prefix}${cmd} mp4 <url>\n${prefix}${cmd} mp3 <url>\n${prefix}${cmd} <url> ( opsional mp4 )` }, { quoted: m })

        await xp.sendMessage(chat.id, { react: { text: '⏳', key: m.key } })

        const { data: res } = await axios.get(
          'https://kaizenapi.my.id/downloader/youtube',
          {
            params: {
              url: u
            }
          }
        )

        if (!res?.status || !res?.result) {
          addErr(cmd)
          return xp.sendMessage(chat.id, { text: res?.message || 'Gagal mengambil data dari API.' }, { quoted: m })
        }

        const d = res.result || {},
              dl = isMp3 ? d.audio_mp3 : d.video_hd,
              failMsg = isMp3 ? 'Link audio tidak tersedia.' : 'Link video tidak tersedia.',
              sendData = isMp3
                ? {
                    audio: {
                      url: dl
                    },
                    mimetype: 'audio/mpeg',
                    fileName: `${d.title}.mp3`,
                    caption: d.title,
                    contextInfo: {
                      forwardingScore: 1,
                      isForwarded: !0,
                      forwardedNewsletterMessageInfo: {
                        newsletterJid: idCh,
                        newsletterName: `klik disini untuk dukung ${botName}`
                      }
                    }
                  }
                : {
                    video: {
                      url: dl
                    },
                    mimetype: 'video/mp4',
                    caption: d.title,
                    contextInfo: {
                      forwardingScore: 1,
                      isForwarded: !0,
                      forwardedNewsletterMessageInfo: {
                        newsletterJid: idCh,
                        newsletterName: `klik disini untuk dukung ${botName}`
                      }
                    }
                  }

        if (!dl || !sendData) {
          addErr(cmd)
          return xp.sendMessage(chat.id, { text: failMsg }, { quoted: m})
        }

        return xp.sendMessage(chat.id, sendData, { quoted: m })
      } catch (e) {
        err(`error pada ${cmd}`, e)
        call(xp, e, m, cmd)
      }
    }
  })
}