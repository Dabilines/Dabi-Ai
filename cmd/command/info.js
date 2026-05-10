import fetch from 'node-fetch'
import fs from 'fs'
import path from 'path'
import { execSync } from 'child_process'
import { performance } from 'perf_hooks'
import { rct_txt } from '../../system/reaction.js'
import os from 'os'

export default function info(ev) {
  ev.on({
    name: 'afk',
    cmd: ['afk'],
    tags: 'Info Menu',
    desc: 'menandai kamu afk',
    owner: !1,
    prefix: !0,
    money: 1,
    exp: 0.1,

    run: async (xp, m, {
      args,
      chat,
      cmd
    }) => {
      try {
        const usr = get.db(chat.sender),
              reason = args.join(' ') || 'tidak ada alasan',
              time = global.time.timeIndo('Asia/Jakarta', 'DD-MM HH:mm:ss')

        if (!usr) return xp.sendMessage(chat.id, { text: 'kamu belum terdaftar, ulangi' }, { quoted: m })

        usr.afk.status = !0
        usr.afk.reason = reason
        usr.afk.afkStart = time 
        save.db()

        await xp.sendMessage(chat.id, { text: `Kamu memulai afk\ndengan alasan: ${reason}` }, { quoted: m })
      } catch (e) {
        err(`error pada ${cmd}`, e)
        call(xp, e, m)
      }
    }
  })

  ev.on({
    name: 'cek cuaca',
    cmd: ['cekcuaca', 'cuaca'],
    tags: 'Info Menu',
    desc: 'info saluran cuaca',
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
        const kota = args.join(' ')
        if (!kota) return xp.sendMessage(chat.id, { text: `contoh: ${prefix}${cmd} jakarta` }, { quoted: m })

        const url = await fetch(`https://api.ootaizumi.web.id/lokasi/cuaca?lokasi=${encodeURIComponent(kota)}`),
              res = await url.json()

        await xp.sendMessage(chat.id, { react: { text: '⏳', key: m.key } })

        if (!res.status || !res.result) return xp.sendMessage(chat.id, { text: `gagal mendapatkan info cuaca untuk kota: ${kota}` }, { quoted: m })

        const {
          namaTempat,
          lokasi,
          cuaca
        } = res.result

        let txt = '*Cuaca Hari Ini Di*\n\n'
            txt += `${head}${opb} ${namaTempat}, ${lokasi.kotkab}, ${lokasi.provinsi} ${clb}\n`
            txt += `${body} ${btn} *Cuaca:* ${cuaca.deskripsi}\n`
            txt += `${body} ${btn} *Kelembapan:* ${cuaca.kelembapan}\n`
            txt += `${body} ${btn} *Kec Angin:* ${cuaca.angin.kecepatan}\n`
            txt += `${body} ${btn} *Suhu Saat Ini:* ${cuaca.suhu}\n`
            txt += `${body} ${btn} *Tutupan Awan:* ${cuaca.tutupanAwan}\n`
            txt += `${body} ${btn} *Jarak Pandang:* ${cuaca.jarakPandang.teks}\n`
            txt += `${foot}${line}\n\n`
            txt += 'Semoga harimu menyenangkan! Jangan lupa bawa payung kalau cuacanya mendung ya! ☂'

        await xp.sendMessage(chat.id, { text: txt }, { quoted: m })
      } catch (e) {
        err(`error pada ${cmd}`, e)
        call(xp, e, m)
      }
    }
  })

  ev.on({
    name: 'cek gc',
    cmd: ['cekgc'],
    tags: 'Info Menu',
    desc: 'mengecek status grup',
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
        const gcData = get.gc(chat.id),
              metadata = groupCache.get(chat.id),
              name = metadata.subject,
              member = metadata.participants.length,
              { usrAdm, botAdm } = await grupify(xp, m),
              defThumb = 'https://c.termai.cc/i0/7DbG.jpg'

        if (!chat.group || !gcData || !usrAdm || !botAdm) {
          return xp.sendMessage(chat.id, { text: !chat.group ? 'perintah ini hanya bisa digunakan digrup' : !gcData ? `grup ini belum terdaftar ketik ${prefix}daftargc untuk mendaftar` : !usrAdm ? 'kamu bukan admin' : 'aku bukan admin' }, { quoted: m })
        }

        let txt = `${head} ${opb} *Informasi Grup* ${clb}\n`
            txt += `${body} ${btn} *Nama: ${name}*\n`
            txt += `${body} ${btn} *Id: ${gcData?.id}*\n`
            txt += `${body} ${btn} *Diban:* ${gcData?.ban ? 'Iya' : 'Tidak'}\n`
            txt += `${body} ${btn} *Member: ${gcData?.member}*\n`
            txt += `${body} ${btn} *Owner: ${gcData?.owner}*\n`
            txt += `${foot}${line}\n`
            txt += `${readmore}`
            txt += `${head}${opb} *Pengaturan Grup* ${clb}\n`
            txt += `${body} ${btn} *Anti Ch:* ${gcData?.filter?.antich ? 'Aktif' : 'Tidak Aktif'}\n`
            txt += `${body} ${btn} *Anti Badword:* ${gcData?.filter?.badword?.antibadword ? 'Aktif' : 'Tidak Aktif'}\n`
            txt += `${body} ${btn} *Anti Kudeta:* ${gcData?.filter?.antikudet ? 'Aktif' : 'Tidak Aktif'}\n`
            txt += `${body} ${btn} *Anti Link:* ${gcData?.filter?.antilink ? 'Aktif' : 'Tidak Aktif'}\n`
            txt += `${body} ${btn} *Anti Spam:* ${gcData?.filter?.antispam ? 'Aktif' : 'Tidak Aktif'}\n`
            txt += `${body} ${btn} *Anti Sw Gc:* ${gcData?.filter?.antiswgc ? 'Aktif' : 'Tidak Aktif'}\n`
            txt += `${body} ${btn} *Anti TagSw:* ${gcData?.filter?.antitagsw ? 'Aktif' : 'Tidak Aktif'}\n`
            txt += `${body} ${btn} *Anti Tag All:* ${gcData?.filter?.antitagall ? 'Aktif' : 'Tidak Aktif'}\n`
            txt += `${body} ${btn} *Auto Back:* ${gcData?.filter?.autoback ? 'Aktif' : 'Tidak Aktif'}\n`
            txt += `${body} ${btn} *Mute:* ${gcData?.filter?.mute ? 'Aktif' : 'Tidak Aktif'}\n`
            txt += `${body} ${btn} *Leave:* ${gcData?.filter?.left?.leftGc ? 'Aktif' : 'Tidak Aktif'}\n`
            txt += `${body} ${btn} *Welcome:* ${gcData?.filter?.welcome?.welcomeGc ? 'Aktif' : 'Tidak Aktif'}\n`
            txt += `${foot}${line}\n`
            txt += `${head}${opb} *Blacklist Kata* ${clb}\n`
            txt += `${body} ${btn} *Kata:* ${gcData?.filter?.badword?.badwordtext || '-'}\n`
            txt += `${foot}${line}`

        const thumb = await xp.profilePictureUrl(metadata.id, 'image') || defThumb,
            oldName = name,
            newName = metadata.subject

        await xp.sendMessage(chat.id, {
          text: txt,
          contextInfo: {
            externalAdReply: {
              body: `Ini adalah informasi grup ${name}`,
              thumbnailUrl: thumb,
              mediaType: 1,
              renderLargerThumbnail: !0
            },
            forwardingScore: 1,
            isForwarded: !0,
            forwardedNewsletterMessageInfo: {
              newsletterJid: idCh,
              newsletterName: `klik disini untuk dukung ${botName}`
            }
          }
        }, { quoted: m })

        if (gcData.member === metadata?.participants.length) return

        gcData.member = metadata.participants.length
        save.gc()

        if (oldName !== newName) {
          gc().key[newName] = gc().key[oldName]
          delete gc().key[oldName]
          save.gc()
        }
      } catch (e) {
        err(`error pada ${cmd}`, e)
        call(xp, e, m)
      }
    }
  })

  ev.on({
    name: 'help',
    cmd: ['help'],
    tags: 'Info Menu',
    desc: 'informasi fitur',
    owner: !1,
    prefix: !0,
    money: 1,
    exp: 0.1,

    run: async (xp, m, {
      args,
      chat,
      cmd,
      prefix
    }) => {
      try {
        const text = args[0]?.toLowerCase(),
              cmdFile = path.join(process.cwd(), 'cmd', 'command')

        if (!text) return xp.sendMessage(chat.id, { text: `gunakan:\n${prefix}${cmd} menu\n\nlist bantuan:\n1. reaction cmd -> .help reaction/react` }, { quoted: m })

        const files = fs.readdirSync(cmdFile).filter(f => f.endsWith('.js'))
        let found = null

        for (const file of files) {
          const event = (await import (`file://${path.join(cmdFile, file)}`)).default
          if (typeof event !== 'function') continue

          event({
            on: obj => {
              const name = obj?.name?.toLowerCase(),
                    cmds = Array.isArray(obj?.cmd) ? obj.cmd.map(v => v.toLowerCase()) : []

              if (name === text || cmds.includes(text)) {
                found = obj
              }
            }
          })

          if (found) break
        }

        if (['reaction', 'react'].includes(text)) {
          return xp.sendMessage(chat.id, { text: rct_txt }, { quoted: m })
        }

        if (!found) return xp.sendMessage(chat.id, { text: `fitur ${text} tidak ada` }, { quoted: m })

        let txt = `${head} ${opb} *I N F O R M A S I* ${clb}\n`
            txt += `${body} ${btn} *Nama: ${found.name || '-'}*\n`
            txt += `${body} ${btn} *Cmd: ${Array.isArray(found.cmd) ? found.cmd.map(c => '.' + c).join(', ') : '-'}*\n`
            txt += `${body} ${btn} *Tags: ${found.tags || '-'}*\n`
            txt += `${body} ${btn} *Deskripsi: ${found.desc || '-'}*\n`
            txt += `${body} ${btn} *Owner Only: ${found.owner ? 'Ya' : 'Tidak'}*\n`
            txt += `${body} ${btn} *Prefix: ${found.prefix ? 'Ya' : 'Tidak'}*\n`
            txt += `${body} ${btn} *Pajak: Rp ${found.money.toLocaleString('id-ID') || 0}*\n`
            txt += `${body} ${btn} *Exp: ${found.exp || 0.1}*\n`
            txt += `${foot}${line}`

        await xp.sendMessage(chat.id, {
          text: txt,
          contextInfo: {
            externalAdReply: {
              body: `informasi fitur ${found.name}`,
              thumbnailUrl: thumbnail,
              mediaType: 1,
              renderLargerThumbnail: !0,
            },
            forwardingScore: 1,
            isForwarded: !0,
            forwardedNewsletterMessageInfo: {
              newsletterJid: idCh,
              newsletterName: `klik disini untuk dukung ${botName}`
            }
          }
        }, { quoted: m })
      } catch (e) {
        err(`error pada ${cmd}`, e)
        call(xp, e, m)
      }
    }
  })

  ev.on({
    name: 'leaderboard',
    cmd: ['ld', 'leaderboard'],
    ocrs: ['exp', 'money', 'cmd', 'ai', 'rb'],
    tags: 'Info Menu',
    desc: 'list leaderboard user',
    owner: !1,
    prefix: !0,
    money: 1,
    exp: 0.1,

    run: async (xp, m, {
      args,
      chat,
      cmd,
      ocrs,
      prefix
    }) => {
      try {
        const usr = get.db(chat.sender),
              data = Object.values(db().key),
              Format = n => n.toLocaleString('id-ID')

        if (!ocrs) return xp.sendMessage(chat.id, { text: `contoh:\n${prefix + cmd} money\n${prefix + cmd} exp\n${prefix + cmd} cmd\n${prefix + cmd} ai\n${prefix + cmd} rb` }, { quoted: m })

        const sort =
          ocrs === 'money'
          ? data.map(v => ({
              jid: v.jid,
              name: v.jid.split('@')[0],
              total: (v.moneyDb?.money || 0) + (v.moneyDb?.moneyInBank || 0)
            })).sort((a,b) => b.total - a.total)

          : ocrs === 'exp'
          ? data.map(v => ({
              jid: v.jid,
              name: v.jid.split('@')[0],
              total: v.exp || 0
            })).sort((a,b) => b.total - a.total)

          : ocrs === 'cmd'
          ? data.map(v => ({
              jid: v.jid,
              name: v.jid.split('@')[0],
              total: v.cmd || 0
            })).sort((a,b) => b.total - a.total)

          : ocrs === 'ai'
          ? data.map(v => ({
              jid: v.jid,
              name: v.jid.split('@')[0],
              total: v.ai?.chat || 0
            })).sort((a,b) => b.total - a.total)

          : data.map(v => ({
              jid: v.jid,
              name: v.jid.split('@')[0],
              total: v.game?.robbery?.cost || 0
            })).sort((a,b) => b.total - a.total)

        const top = sort.slice(0,10)

        let txt = `🏆 *LEADERBOARD ${ocrs.toUpperCase()}* 🏆\n\n`

        top.forEach((v,i) => {
          txt += `${i+1}. ${v.name}\n`
          txt += `   ${ocrs}: ${Format(v.total)}\n\n`
        })

        xp.sendMessage(chat.id,{ text: txt },{ quoted: m })
      } catch (e) {
        err(`error pada ${cmd}`, e)
        call(xp, e, m)
      }
    }
  })

  ev.on({
    name: 'list admin',
    cmd: ['lsadm', 'listadmin'],
    tags: 'Info Menu',
    desc: 'mentag all admin',
    owner: !1,
    prefix: !0,
    money: 1,
    exp: 0.1,

    run: async (xp, m, {
      chat,
      cmd
    }) => {
      try {
        if (!chat.group) return xp.sendMessage(chat.id, { text: 'perintah ini hanya bisa digunakan digrup' }, { quoted: m })

        const meta = groupCache.get(chat.id) || await getMetadata(chat.id, xp),
              admins = meta.participants.filter(v => v.admin).map(v => v.id),
              text = admins.map((v, i) => `${i + 1}. @${v.split('@')[0]}`).join('\n')

        xp.sendMessage(chat.id, { text, mentions: admins }, { quoted: m })
      } catch (e) {
        err(`error pada ${cmd}`, e)
        call(xp, e, m)
      }
    }
  })

  ev.on({
    name: 'menu',
    cmd: ['menu'],
    tags: 'Info Menu',
    desc: 'main Menu',
    owner: !1,
    prefix: !0,
    money: 1,
    exp: 0.1,

    run: async (xp, m, {
      args,
      chat,
      cmd,
      prefix
    }) => {
      try {
        const time = global.time.timeIndo('Asia/Jakarta', 'HH:mm'),
              filterTag = args[0]?.toLowerCase(),
              cmds = ev.cmd || [],
              name = chat.pushName,
              commands = {},
              allUsr = Object.keys(db().key).length,
              last = global.lastCmdUpdate

        const newest = (ev.cmd || [])
          .slice()
          .sort((a, b) => (b.set || 0) - (a.set || 0))[0]

        const newCmd = newest
          ? (Array.isArray(newest.cmd) ? newest.cmd[0] : newest.cmd)
          : 'tidak ada yang baru'

        for (const c of cmds) {
          const tag = c.tags || 'Other',
                cname = c.name || (Array.isArray(c.cmd) ? c.cmd[0] : c.cmd)
          commands[tag] ??= []
          cname && commands[tag].push(cname)
        }

        const allCmd = Object.values(commands).reduce((a, b) => a + b.length, 0)

        const fav = (ev.cmd || [])
          .filter(c => (c.call || 0) > 0)
          .sort((a, b) => (b.call || 0) - (a.call || 0))
          .slice(0, 2)
          .map(c => {
            const cname = c.name || (Array.isArray(c.cmd) ? c.cmd[0] : c.cmd)
            return `${cname} [${c.call}]`
          }),
              up = (s => {
                const d = Math.floor(s / 86400),
                      h = Math.floor(s % 86400 / 3600),
                      m = Math.floor(s % 3600 / 60),
                      sec = Math.floor(s % 60)
                return d > 0 
                  ? `${d}d ${h}h ${m}m ${sec}s` 
                  : `${h.toString().padStart(2,'0')}:${m.toString().padStart(2,'0')}:${sec.toString().padStart(2,'0')}`
              })(process.uptime())

        let txt =
          `Halo *${name}*, Saya adalah asisten virtual.\n\n` +
          `${head}${opb} *${botName}* ${clb}\n` +
          `${body} ${btn} *Bot Name: ${botFullName}*\n` +
          `${body} ${btn} *Owner: ${ownerName}*\n` +
          `${body} ${btn} *Uptime: ${up}*\n` +
          `${body} ${btn} *All Cmd: ${allCmd}*\n` +
          `${body} ${btn} *Total User: ${allUsr}*\n` +
          `${foot}${line}\n\n` +
          `${head}\n` +
          `${body} ${btn} *Favorit Cmd: ${fav.length ? fav.join(', ') : 'tidak ada command favorit'}*\n` +
          `${body} ${btn} *New Cmd: ${newCmd}*\n` +
          `${foot}${line}\n`+
          `${readmore}\n`

        const entries = (filterTag
          ? Object.entries(commands).filter(([cat]) => cat.toLowerCase().includes(filterTag))
          : Object.entries(commands)
        ).sort(([a], [b]) => a.localeCompare(b))

        !entries.length
          ? txt += `${body} Tag *${filterTag}* tidak ditemukan!\n`
          : entries.forEach(([cat, features]) => {
            features.length &&
            (txt +=
              `${head}${opb} *${cat.charAt(0).toUpperCase() + cat.slice(1)}* ${clb}\n` +
              features
                .slice()
                .sort((a, b) => a.localeCompare(b))
                .map(f => `${body} ${btn} *${f}*`)
                .join('\n') +
              `\n${foot}${line}\n\n`)
            })

        txt += `> ketik ${prefix}help untuk melihat cara pakai ${botName}\n\n`
        txt += `${footer}`

        await xp.sendMessage(chat.id, {
          text: txt,
          contextInfo: {
            externalAdReply: {
              body: `${time}`,
              thumbnailUrl: thumbnail,
              mediaType: 1,
              renderLargerThumbnail: !0
            },
            forwardingScore: 1,
            isForwarded: !0,
            forwardedNewsletterMessageInfo: {
              newsletterJid: idCh,
              newsletterName: `klik disini untuk dukung ${botName}`
            }
          }
        }, { quoted: m })
      } catch (e) {
        err(`error pada ${cmd}`, e)
        call(xp, e, m)
      }
    }
  })

  ev.on({
    name: 'owner',
    cmd: ['owner',  'contact'],
    tags: 'Info Menu',
    desc: 'menampilkan kontak owner',
    owner: !1,
    prefix: !0,
    money: 100,
    exp: 0.1,

    run: async (xp, m, {
      chat,
      cmd
    }) => {
      try {
        const owner = global.ownerName || 'error',
              bot = global.botName || 'error',
              ownerNumber = Array.isArray(global.ownerNumber) ? global.ownerNumber : [global.ownerNumber]

        if (!ownerNumber || !ownerNumber.length) return xp.sendMessage(chat.id, { text: 'tidak ada kontak owner' }, { quoted: m })

        const contact = ownerNumber.map((num, i) => ({ vcard: `BEGIN:VCARD\nVERSION:3.0\nFN:${owner} ${i + 1}\nTEL;type=CELL;waid=${num}:${num}\nEND:VCARD` })),
              displayName = ownerNumber.length > 1 ? `${owner} dan ${ownerNumber.length - 1} lainnya` : owner

        await xp.sendMessage(chat.id, { contacts: { displayName, contacts: contact } }, { quoted: m })
        await xp.sendMessage(chat.id, { text: 'ini adalah kontak owner ku' }, { quoted: m })
      } catch (e) {
        err(`error pada ${cmd}`, e)
        call(xp, e, m)
      }
    }
  })

  ev.on({
    name: 'profile',
    cmd: ['profile', 'me'],
    tags: 'Info Menu',
    desc: 'mengecek profile orang',
    owner: !1,
    prefix: !0,
    money: 1,
    exp: 0.1,

    run: async (xp, m, {
      chat,
      cmd
    }) => {
      try {
        const usr = get.db(chat.sender),
              base64 = v => Buffer.from(v).toString('base64'),
              defThumb = 'https://c.termai.cc/i0/7DbG.jpg',
              type = v => v ? 'Aktif' : 'Tidak'

        if (!usr) return xp.sendMessage(chat.id, { text: 'kamu belum terdaftar, ulangi' }, { quoted: m })

        let thumb
        try { thumb = await xp.profilePictureUrl(chat.sender, 'image') }
        catch { thumb = defThumb }

        let txt = `${head} ${opb} *P R O F I L E* ${clb}\n`
            txt += `${body} ${btn} *Nama:* ${chat.pushName}\n`
            txt += `${body} ${btn} *Nomor:* ${usr.jid}\n`
            txt += `${body} ${btn} *No ID:* ${base64(usr.noId)}\n`
            txt += `${body} ${btn} *Cmd:* ${usr.cmd}\n`
            txt += `${body} ${btn} *Ban:* ${type(usr.ban)}\n`
            txt += `${body} ${btn} *Acc:* ${usr.acc}\n`
            txt += `${foot}${line}\n\n`
            txt += `${readmore}`
            txt += `${head} ${opb} *A I* ${clb}\n`
            txt += `${body} ${btn} *Ai:* ${type(usr.ai?.bell)}\n`
            txt += `${body} ${btn} *Chat Ai:* ${usr.ai.chat}\n`
            txt += `${body} ${btn} *Role:* ${usr.ai.role}\n`
            txt += `${foot}${line}\n\n`
            txt += `${head} ${opb} *G A M E* ${clb}\n`
            txt += `${body} ${btn} *Status Terbunuh:* ${usr.game?.dead?.status ? 'Terbunuh' : 'Tidak Terbunuh'}\n`
            txt += `${body} ${btn} *List Kill:* ${usr.game?.kill?.target || 0}\n`
            txt += `${body} ${btn} *Money:* Rp ${usr.moneyDb.money.toLocaleString('id-ID')}\n`
            txt += `${body} ${btn} *Uang Di Bank:* Rp ${usr.moneyDb.moneyInBank.toLocaleString('id-ID')}\n`
            txt += `${body} ${btn} *Level:* ${((usr.exp + 10) / 10).toFixed(1)}\n`
            txt += `${body} ${btn} *Auto Farm:* ${type(usr.game.farm)}\n`
            txt += `${body} ${btn} *Kesempatan Rampok:* ${usr.game.robbery.cost}\n`
            txt += `${foot}${line}`

        await xp.sendMessage(chat.id, {
          text: txt,
          contextInfo: {
            externalAdReply: {
              body: `ini profile ${chat.pushName}`,
              thumbnailUrl: thumb,
              mediaType: 1,
              renderLargerThumbnail: !0
            },
            forwardingScore: 1,
            isForwarded: !0,
            forwardedNewsletterMessageInfo: {
              newsletterJid: idCh,
              newsletterName: `klik disini untuk dukung ${botName}`
            }
          }
        }, { quoted: m })
      } catch (e) {
        err(`error pada ${cmd}`, e)
        call(xp, e, m)
      }
    }
  })

  ev.on({
    name: 'stats',
    cmd: ['st', 'stats', 'ping'],
    tags: 'Info Menu',
    desc: 'status Bot',
    owner: !1,
    prefix: !0,
    money: 100,
    exp: .1,

    run: async (xp, m, {
      chat,
      cmd
    }) => {
      try {
        const a = performance.now(),
              bytes = b => (b / 1024 ** 2).toFixed(2),
              time = global.time.timeIndo("Asia/Jakarta", "HH:mm"),
              cpu = os.cpus()?.[0]?.model ?? 'Tidak diketahui',
              up = (s => {
                const d = Math.floor(s / 86400),
                      h = Math.floor(s % 86400 / 3600),
                      m = Math.floor(s % 3600 / 60),
                      sec = Math.floor(s % 60)
                return d > 0 
                  ? `${d}d ${h}h ${m}m ${sec}s` 
                  : `${h.toString().padStart(2,'0')}:${m.toString().padStart(2,'0')}:${sec.toString().padStart(2,'0')}`
              })(process.uptime()),
              platform = os.platform(),
              arch = os.arch(),
              totalMem = os.totalmem(),
              usedMem = totalMem - os.freemem(),
              memoryUsg = Object.fromEntries(Object.entries(process.memoryUsage()).map(([k,v]) => [k, (v / 1024 ** 2).toFixed(2) + ' MB'])),
              startCpu = process.cpuUsage(),
              startTime = performance.now()

        await new Promise(r => setTimeout(r, 5e2))

        const endCpu = process.cpuUsage(startCpu),
              endTime = performance.now(),
              elapsedMs = endTime - startTime,
              totalCpu = endCpu.user + endCpu.system,
              cpuPercent = ((totalCpu / 1e3) / elapsedMs * 100).toFixed(2)

        let totalDisk = 'Tidak diketahui',
            usedDisk = 'Tidak diketahui',
            freeDisk = 'Tidak diketahui'

        try {
          const d = execSync('df -h /', { encoding: 'utf8' }).split('\n')[1]?.split(/\s+/)
          if (!d || d.length < 4) totalDisk = usedDisk = freeDisk = 'Tidak diketahui'
          else [totalDisk, usedDisk, freeDisk] = [d[1], d[2], d[3]]
        } catch {}

        const stats = `Ini adalah status dari ${botName}

  ${head} ${opb} Stats *${botName}* ${clb}
  ${body} ${btn} *Bot Name:* ${botName}
  ${body} ${btn} *Bot Full Name:* ${botFullName}
  ${body} ${btn} *Time:* ${time}
  ${body} ${btn} *Uptime:* ${up}
  ${body} ${btn} *Respon:* ${(performance.now() - a).toFixed(2)} ms
  ${foot}${line}
  ${readmore}
  ${head} ${opb} Stats System ${clb}
  ${body} ${btn} *Cpu Usage:* ${cpuPercent}%
  ${body} ${btn}   user: ${(endCpu.user / 1e3).toFixed(2)} ms
  ${body} ${btn}   system: ${(endCpu.system / 1e3).toFixed(2)} ms
  ${body} ${btn} *Memory Usage:*
  ${Object.entries(memoryUsg).map(([k,v]) => `${body} ${btn}    ${k}: ${v}`).join('\n  ')}
  ${foot}${line}

  ${head} ${opb} Stats Platform ${clb}
  ${body} ${btn} *Platform:* ${platform} ( ${arch} )
  ${body} ${btn} *Cpu:* ${cpu}
  ${body} ${btn} *Ram:* ${bytes(usedMem)} MB / ${bytes(totalMem)} MB
  ${body} ${btn} *Storage:* ${usedDisk} / ${totalDisk} ( ${freeDisk} )
  ${foot}${line}`.trim()

        await xp.sendMessage(chat.id, {
          text: stats,
          contextInfo: {
            externalAdReply: {
              title: botFullName,
              body: `Ini adalah stats ${botName}`,
              thumbnailUrl: thumbnail,
              mediaType: 1,
              renderLargerThumbnail: !0
            },
            forwardingScore: 1,
            isForwarded: !0,
            forwardedNewsletterMessageInfo: {
              newsletterJid: idCh,
              newsletterName: `klik disini untuk dukung ${botName}`
            }
          }
        }, { quoted: m })
      } catch (e) {
        err(`error pada ${cmd}`, e)
        call(xp, e, m)
      }
    }
  })

  ev.on({
    name: 'total fitur',
    cmd: ['totalfitur', 'allfitur'],
    tags: 'Info Menu',
    desc: 'list jumlah fitur',
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
        const tags = {}

        for (const c of ev.cmd) {
          const tag = c.tags || 'Other'
          tags[tag] ??= 0
          tags[tag]++
        }

        const cmdAll = ev.cmd?.length,
              tagAll = Object.keys(tags).length,
              usr = get.db(chat.sender)

        let txt = `*All Cmd: ${cmdAll}*\n`
            txt += `*All Tags: ${tagAll}*\n\n`
            txt += `*Cmd ${chat.pushName}: ${usr.cmd}*`

        await xp.sendMessage(chat.id, { text: txt }, { quoted: m })
      } catch (e) {
        err(`error pada ${cmd}`, e)
        call(xp, e, m)
      }
    }
  })
}