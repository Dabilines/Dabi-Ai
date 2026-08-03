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
    meney: 0,
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

        if (!res) {
          try {
            const api1 = await fetch(`https://api.siputzx.my.id/api/d/facebook?url=${encodeURIComponent(link)}`).then(r => r.json())

            if (api1?.data) res = api1.data?.downloads?.[0]?.url
          } catch {
            addErr(cmd)
          }
        }

        if (!res) {
          try {
            const api2 = await fetch(`https://api-faa.my.id/faa/fbdownload?url=${encodeURIComponent(link)}`).then(r => r.json())

            if (api2?.status && api2?.result?.media) res = api2.result?.media?.video_hd || api2?.result?.media?.video_sd
          } catch {
            addErr(cmd)
          }
        }

        if (!res) {
          try {
            const api3 = await fetch(`https://api.azbry.com/api/download/facebook?url=${encodeURIComponent(link)}`).then(r => r.json())

            if (api3?.status && api3?.result?.medias) res = api3?.result?.medias?.[1]?.url
          } catch {
            addErr(cmd)
          }
        }

        if (!res) {
          try {
            const api4 = await fetch(`${sylva.web}/api/download/facebook?url=${encodeURIComponent(link)}&apikey=${sylva.key}`).then(r => r.json())

            if (api4?.status && api4?.data) res = api4?.data?.hd || api4?.data?.sd
          } catch {
            addErr(cmd)
          }
        }

        if (!res) {
          addErr(cmd)
          return xp.sendMessage(chat.id, { text: 'video tidak ditemukan' }, { quoted: m })
        }

        const links = res?.match(/https?:\/\/[^\s]+/gi) || null,
              videoUrl = links[0]

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

        let res = null

        if (!res) {
          try {
            const api1 = await fetch(`${sylva.web}/api/download/instagram?url=${encodeURIComponent(link)}&apikey=${sylva.key}`).then(r => r.json())

            if (api1?.status && api1?.data.media.videos) res = api1?.data.media.videos?.[0]?.url
          } catch {
            addErr(cmd)
          }
        }

        if (!res) {
          try {
            const api2 = await fetch(`https://api.nexray.eu.cc/downloader/instagram?url=${encodeURIComponent(link)}`).then(r => r.json())

            if (api2.status && api2?.result?.[0]?.url) res = api2?.result?.[0]?.url
          } catch {
            addErr(cmd)
          }
        }

        if (!res) {
          try {
            const api3 = await fetch(`https://api.azbry.com/api/download/instagram?url=${encodeURIComponent(link)}`).then(r => r.json())
            log(api3)

            if (api3.status && api3?.videos[0]) res = api3.videos?.[0]
          } catch {
            addErr(cmd)
          }
        }

        if (!res) {
          addErr(cmd)
          return xp.sendMessage(chat.id, { text: 'video tidak ditemukan' }, { quoted: m })
        }

        const links = res?.match(/https?:\/\/[^\s]+/gi),
              videoUrl = links[0]

        if (!videoUrl) {
          addErr(cmd)
          return xp.sendMessage(chat.id, { text: 'link video tidak ditemukan' }, { quoted: m })
        }

        await xp.sendMessage(chat.id, {
          video: { url: videoUrl },
          caption: `*I N S T A G R A M*`
        }, { quoted: m })
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
    money: 0,
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

        let res = null,
            type = null

        if (!res) {
          try {
            const api1 = await fetch(`https://api.azbry.com/api/download/pinterest?url=${link}`).then(r => r.json())

            if (api1?.status && api1?.result?.download) {
              res = api1.result.download
              type = api1.result.type
            }
          } catch {
            addErr(cmd)
          }
        }

        let txt = `${head}${opb} *P I N  D L* ${clb}\n`
            txt += `${body} ${btn} *Type:* ${type}\n`
            txt += `${foot}${line}`

        if (res) {
          try {
            await xp.sendMessage(chat.id, { video: { url: res }, caption: txt }, { quoted: m })
          } catch {
            try {
              await xp.sendMessage(chat.id, { image: { url: res }, caption: txt }, { quoted: m })
            } catch {
              addErr(cmd)
              return xp.sendMessage(chat.id, { text: 'media tidak ditemukan' }, { quoted: m })
            }
          }
        } else {
          addErr(cmd)
          return xp.sendMessage(chat.id, { text: 'res tidak ada' }, { quoted: m })
        }
      } catch (e) {
        err(`error pada ${cmd}`, e)
        call(xp, e, m, cmd)
      }
    }
  })

  ev.on({
    name: 'pins',
    cmd: ['pins'],
    tags: 'Download Menu',
    desc: 'mencari gambar dari pinterest',
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
        const query = args?.join(' ')

        if (!query) return xp.sendMessage(chat.id, { text: `masukan kata kunci\ncontoh: ${prefix}${cmd} kucing` }, { quoted: m })

        let res = null,
            desc = null

        await xp.sendMessage(chat.id, { react: { text: '⏳', key: m.key } })

        if (!res) {
          try {
            const api1 = await fetch(`https://api.siputzx.my.id/api/s/pinterest`,
                  {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                      query,
                      type: 'image'
                    })
                  }).then(r => r.json()),
                  rand = Math.floor(Math.random() * api1?.data.length)

            if (api1?.status && api1?.data) {
              res = api1?.data?.[rand]?.image_url
              desc = api1?.data?.[rand]?.description
            }
          } catch {
            addErr(cmd)
          }
        }

        if (!res) return xp.sendMessage(chat.id, { text: 'semua api gagal' }, { quoted: m })

        return xp.sendMessage(chat.id, { image: { url: res }, caption: desc }, { quoted: m })
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
    money: 0,
    exp: 0.1,

    run: async (xp, m, {
      args,
      chat,
      cmd,
      prefix
    }) => {
      try {
        const query = args?.join(' ')

        if (!query) return xp.sendMessage(chat.id, { text: `masukan judul lagu\ncontoh ${prefix}${cmd} migration of bird` }, { quoted: m })

        let res = null,
            data = null,
            image = null

        if (!res) {
          try {
            const api1 = await fetch(`https://api-faa.my.id/faa/ytplay?query=${encodeURIComponent(query)}`).then(r => r.json())

            if (api1?.status && api1?.result?.mp3) {
              image = api1?.result?.thumbnail
              res = api1?.result?.mp3
              data = api1?.result
            }
          } catch {
            addErr(cmd)
          }
        }

        if (!res) {
          try {
            const api2 = await fetch(`${sylva.web}/api/search/play?q=${encodeURIComponent(query)}&apikey=${sylva.key}`).then(r => r.json())

            if (api2?.status && api2?.result?.url) {
              res = api2?.result?.url
              data = api2?.result
            }
          } catch {
            addErr(cmd)
          }
        }

        if (!res) {
          addErr(cmd)
          return xp.sendMessage(chat.id, { text: 'video tidak ditemukan' }, { quoted: m })
        }

        const links = res?.match(/https?:\/\/[^\s]+/gi),
              musicurl = links[0]

        if (!musicurl) {
          addErr(cmd)
          return xp.sendMessage(chat.id, { text: 'link video tidak ditemukan' }, { quoted: m })
        }

        let txt = `Info Pencarian\n\n`
            txt += `${head} ${opb} M U S I C ${clb}\n`
            txt += `${body} ${btn} *Title:* ${data?.title || data?.filename || 'Tidak diketahui'}\n`
            txt += `${body} ${btn} *Author:* ${data?.author || 'Tidak diketahui'}\n`
            txt += `${body} ${btn} *Durasi:* ${data?.duration_timestamp || 'Tidak diketahui'}\n`
            txt += `${body} ${btn} *Views:* ${data?.views || 'Tidak diketahui'}\n`
            txt += `${foot}${line}`

        await xp.sendMsg(chat.id, { text: txt, image }, m)

        await xp.sendMessage(chat.id, { audio: { url: musicurl }, mimetype: 'audio/mpeg', ptt: !1 }, { quoted: m })
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

        let res = null,
            title = null

        if (isMp3) {
          try {
            const api = await fetch(`${sylva.web}/api/download/ytmp3?url=${encodeURIComponent(u)}&apikey=${sylva.key}`).then(r => r.json())

            if (api?.status && api?.data?.url) {
              res = api.data.url
              title = api.data.title
            }
          } catch {
            addErr(cmd)
          }
        } else {
          try {
            const api = await fetch(`${sylva.web}/api/download/ytmp4?url=${encodeURIComponent(u)}&apikey=${sylva.key}`).then(r => r.json())

            if (api?.status && api?.result?.download_url) {
              res = api.result.download_url
              title = api.result.title
            }
          } catch {
            addErr(cmd)
          }
        }

        if (!res) {
          addErr(cmd)

          if (isMp3) return xp.sendMessage(chat.id, { text: 'Link audio tidak tersedia.' }, { quoted: m })

          return xp.sendMessage(chat.id, { text: 'Link video tidak tersedia.' }, { quoted: m })
        }

        const mediaUrl = res

        if (!mediaUrl) {
          addErr(cmd)

          if (isMp3) return xp.sendMessage(chat.id, { text: 'Link audio tidak ditemukan.' }, { quoted: m })

          return xp.sendMessage(chat.id, { text: 'Link video tidak ditemukan.' }, { quoted: m })
        }

        let sendData

        if (isMp3) {
          sendData = {
            audio: {
              url: mediaUrl
            },
            mimetype: 'audio/mpeg',
            fileName: `${title || 'YouTube'}.mp3`,
            caption: title || 'YouTube',
            contextInfo: {
              forwardingScore: 1,
              isForwarded: !0,
              forwardedNewsletterMessageInfo: {
                newsletterJid: idCh,
                newsletterName: `klik disini untuk dukung ${botName}`
              }
            }
          }
        } else {
          sendData = {
            video: {
              url: mediaUrl
            },
            mimetype: 'video/mp4',
            caption: title || 'YouTube',
            contextInfo: {
              forwardingScore: 1,
              isForwarded: !0,
              forwardedNewsletterMessageInfo: {
                newsletterJid: idCh,
                newsletterName: `klik disini untuk dukung ${botName}`
              }
            }
          }
        }

        return xp.sendMessage(chat.id, sendData, { quoted: m })
      } catch (e) {
        err(`error pada ${cmd}`, e)
        call(xp, e, m, cmd)
      }
    }
  })
}