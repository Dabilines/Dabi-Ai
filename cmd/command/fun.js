import fetch from 'node-fetch'
import { vn } from '../interactive.js'
import { dbsider } from '../../system/db/data.js'

export default function fun(ev) {
  ev.on({
    name: 'arti nama',
    cmd: ['artinama'],
    tags: 'Fun Menu',
    desc: 'melihat artinama orang',
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
        const nama = args.join(' ')

        if (!nama) return xp.sendMessage(chat.id, { text: `masukan nama contoh:\n${prefix}${cmd} ${botName}` }, { quoted: m })

        const text = `jelaskan arti nama ${nama}. Ingat, nama orang`,
              url = await fetch(`${termaiWeb}/api/chat/bard?query=${encodeURIComponent(text)}&key=${termaiKey}`).then(r => r.json())

        if (!url.status) return xp.sendMessage(chat.id, { text: 'status api false' }, { quoted: m })

        let txt = `${head}${opb} *A R T I  N A M A* ${clb}\n`
            txt += `${body} ${btn} *Nama:* ${nama}\n`
            txt += `${body} ${btn} *Arti Nama:*\n`
            txt += `${foot}${line}\n`
            txt += `${readmore}\n`
            txt += `${url?.chatUi}`

        await xp.sendMessage(chat.id, { text: txt }, { quoted: m })
      } catch (e) {
        err(`error pada ${cmd}`, e)
        call(xp, e, m)
      }
    }
  })

  ev.on({
    name: 'cek cantik',
    cmd: ['cekcantik'],
    tags: 'Fun Menu',
    desc: 'cek seberapa cantik orang',
    owner: !1,
    prefix: !0,
    money: 100,
    exp: 0.1,

    run: async (xp, m, {
      chat,
      cmd
    }) => {
      try {
        const user = chat.quoted.id?.[0] || chat.sender,
              target = user.replace(/@s\.whatsapp\.net$/, ''),
              persen = Math.floor(Math.random() * 101)

        let txt = persen <= 17 ? 'gak jelek² amat' :
                  persen <= 34 ? 'mayan lah' :
                  persen <= 51 ? 'cantik juga' :
                  persen <= 67 ? 'hmm menarik sih' :
                  persen <= 84 ? 'cantik sih ini' :
                  persen <= 93 ? 'bidadari cuy' : 'cantik banget',
            teks = `@${target} ${persen}%\n${txt}`

        await xp.sendMessage(chat.id, { text: teks, mentions: [user] }, { quoted: m })
      } catch (e) {
        err(`error pada ${cmd}`, e)
        call(xp, e, m)
      }
    }
  })

  ev.on({
    name: 'cek dompet',
    cmd: ['cekdompet'],
    tags: 'Fun Menu',
    desc: 'mengecek dompet orang',
    owner: !1,
    prefix: !0,
    money: 1,
    exp: 0.1,

    run: async (xp, m, {
      chat,
      cmd
    }) => {
      try {
        const q = chat.quoted.id?.[0] || chat.sender,
              usr = get.db(q)

        if (!usr) return xp.sendMessage(chat.id, { text: 'pengguna belum terdaftar di database' }, { quoted: m })

        const mny = usr?.moneyDb?.money ?? 0,
              fmny = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR'}).format(mny),
              txt = `Hasil investigasi dari dompet @${chat.sender.replace(/@s\.whatsapp\.net$/, '')}\n${fmny} ditemukan`

        await xp.sendMessage(chat.id, { text: txt, mentions: [usr.jid] }, { quoted: m })
      } catch (e) {
        err(`error pada ${cmd}`, e)
        call(xp, e, m)
      }
    }
  })

  ev.on({
    name: 'cek dosa',
    cmd: ['cekdosa'],
    tags: 'Fun Menu',
    desc: 'mengecek 10 dosa besar orang',
    owner: !1,
    prefix: !0,
    money: 100,
    exp: 0.1,

    run: async (xp, m, {
      chat,
      cmd
    }) => {
      try {
        const q = chat.quoted.id?.[0] || chat.sender,
              { cekDosa } = await global.func(),
              listDosa = [...cekDosa].sort(() => Math.random() - .5).slice(0, 10),
              user = q.replace(/@s\.whatsapp\.net$/, '')

        let teks = `Top 10 dosa besar @${user}\n`
        listDosa.forEach((d, i) => teks += `${i + 1}. ${d}\n`)

        await xp.sendMessage(chat.id, { text: teks.trim(), mentions: [q] }, { quoted: m })
      } catch (e) {
        err(`error pada ${cmd}`, e)
        call(xp, e, m)
      }
    }
  })

  ev.on({
    name: 'cek femboy',
    cmd: ['cekfemboy'],
    tags: 'Fun Menu',
    desc: 'cek seberapa femboy orang',
    owner: !1,
    prefix: !0,
    money: 100,
    exp: 0.1,

    run: async (xp, m, {
      chat,
      cmd
    }) => {
      try {
        const user = chat.quoted.id?.[0] || chat.sender,
              target = user.replace(/@s\.whatsapp\.net$/, ''),
              persen = Math.floor(Math.random() * 101)

        let txt = persen <= 17 ? 'masih aman bang' :
                  persen <= 34 ? 'agak agak sih' :
                  persen <= 51 ? 'dah gila sih' :
                  persen <= 67 ? 'anomali ini mah' :
                  persen <= 84 ? 'gangguan jiwa' :
                  persen <= 93 ? 'fiks femboy' : 'femboy out aja',
            teks = `@${target} ${persen}% ${txt}`

        await xp.sendMessage(chat.id, { text: teks, mentions: [user] }, { quoted: m })
      } catch (e) {
        err(`error pada ${cmd}`, e)
        call(xp, e, m)
      }
    }
  })  

  ev.on({
    name: 'cek ganteng',
    cmd: ['cekganteng'],
    tags: 'Fun Menu',
    desc: 'cek seberapa ganteng orang',
    owner: !1,
    prefix: !0,
    money: 100,
    exp: 0.1,

    run: async (xp, m, {
      chat,
      cmd
    }) => {
      try {
        const user = chat.quoted.id?.[0] || chat.sender,
              target = user.replace(/@s\.whatsapp\.net$/, ''),
              persen = Math.floor(Math.random() * 101)

        let txt = persen <= 17 ? 'gak jelek² amat' :
                  persen <= 34 ? 'mayan lah' :
                  persen <= 51 ? 'ganteng juga' :
                  persen <= 67 ? 'hmm menarik sih' :
                  persen <= 84 ? 'ganteng sih ini' :
                  persen <= 93 ? 'thomas cuy' : 'ganteng banget',
            teks = `@${target} ${persen}%\n${txt}`

        await xp.sendMessage(chat.id, { text: teks, mentions: [user] }, { quoted: m })
      } catch (e) {
        err(`error pada ${cmd}`, e)
        call(xp, e, m)
      }
    }
  })

  ev.on({
    name: 'cek iq',
    cmd: ['cekiq'],
    tags: 'Fun Menu',
    desc: 'mengecek iq orang',
    owner: !1,
    prefix: !0,
    money: 100,
    exp: 0.1,

    run: async (xp, m, {
      chat,
      cmd
    }) => {
      try {
        const user = chat.quoted.id?.[0] || chat.sender,
              target = user.replace(/@s\.whatsapp\.net$/, ''),
              rand = Math.floor(Math.random() * 3.4e1) + 7.4e1,
              persen = rand <= 81 ? 81 : rand <= 87 ? 87 : rand <= 94 ? 94 : rand <= 100 ? 100 : 107,
              txt = persen === 81 ? 'IQ rendah tapi masih normal' :
                    persen === 87 ? 'IQ lumayan, masih bisa mikir' :
                    persen === 94 ? 'IQ standar manusia cerdas' :
                    persen === 100 ? 'IQ di atas rata-rata' :
                                     'IQ jenius tingkat dewa',
              teks = `@${target} IQ kamu *${persen}*\n${txt}`

        await xp.sendMessage(chat.id, { text: teks, mentions: [user] }, { quoted: m })
      } catch (e) {
        err(`error pada ${cmd}`, e)
        call(xp, e, m)
      }
    }
  })

  ev.on({
    name: 'cek jodoh',
    cmd: ['cekjodoh'],
    tags: 'Fun Menu',
    desc: 'cek kecocokan jodoh orang',
    owner: !1,
    prefix: !0,
    money: 105,
    exp: 0.1,

    run: async (xp, m, {
      chat,
      cmd
    }) => {
      try {
        if (!chat.group) return xp.sendMessage(chat.id, { text: 'fitur ini hanya bisa digunakan di grup' }, { quoted: m })

        const usr = chat.quoted.id,
              metadata = groupCache.get(chat.id) || await xp.groupMetadata(chat.id)

        if (!metadata) throw new Error('gagal mengambil metadata')

        const target = metadata.participants.map(v => v.id).filter(id => id !== xp.user.id)

        const mention = Array.isArray(usr) ? usr
                      : usr ? [usr]
                      : []

        const persen = (Math.floor(Math.random() * 1e2) + 1),
              randomPick = (list, exclude = []) => {
                const f = list.filter(id => !exclude.includes(id)),
                      i = Math.floor(Math.random() * f.length)
                return f[i]
              },
              cnd = persen <= 17 ? 'gak cocok² amat'
                  : persen <= 34 ? 'lumayan cocok'
                  : persen <= 51 ? 'jodoh\nbilangnya enggak aslinya salting'
                  : persen <= 67 ? 'cocok banget tinggal jadian aja'
                  : persen <= 84 ? 'udah jadian\nini sih udah sering gandengan tangan'
                  : persen <= 93 ? 'udah lamaran\nfiks besok nikah diem²'
                  : 'udah nikah tinggal ngueu aja'

        const tgr1 = mention.length >= 1 ? mention[0] : randomPick(target),
              tgr2 = mention.length >= 2 ? mention[1] : randomPick(target, [tgr1])

        const name1 = tgr1.split('@')[0],
              name2 = tgr2.split('@')[0],
              teks = `@${name1} ❤️ @${name2} ${persen}% ${cnd}`

        await xp.sendMessage(chat.id, { text: teks, mentions: [tgr1, tgr2] }, { quoted: m })
      } catch (e) {
        err(`error pada ${cmd}`, e)
        call(xp, e, m)
      }
    }
  })

  ev.on({
    name: 'cek jomok',
    cmd: ['cekgay', 'cekjomok'],
    tags: 'Fun Menu',
    desc: 'cek seberapa jomok orang',
    owner: !1,
    prefix: !0,
    money: 100,
    exp: 0.1,

    run: async (xp, m, {
      chat,
      cmd
    }) => {
      try {
        const user = chat.quoted.id?.[0] || chat.sender,
              target = user.replace(/@s\.whatsapp\.net$/, ''),
              persen = Math.floor(Math.random() * 101)

        let txt = persen <= 17 ? 'masih aman bang' :
                  persen <= 34 ? 'agak agak sih' :
                  persen <= 51 ? 'agak lain sih' :
                  persen <= 67 ? 'gay banget lho ya' :
                  persen <= 84 ? 'gangguan jiwa' :
                  persen <= 93 ? 'fiks gay' : 'orang jomok',
            teks = `@${target} ${persen}% ${txt}`

        await xp.sendMessage(chat.id, { text: teks, mentions: [user] }, { quoted: m })
      } catch (e) {
        err(`error pada ${cmd}`, e)
        call(xp, e, m)
      }
    }
  })

  ev.on({
    name: 'cek lesbi',
    cmd: ['ceklesbi'],
    tags: 'Fun Menu',
    desc: 'mengecek seberapa lesbi orang',
    owner: !1,
    prefix: !0,
    money: 100,
    exp: 0.1,

    run: async (xp, m, {
      chat,
      cmd
    }) => {
      try {
        const user = chat.quoted.id?.[0] || chat.sender,
              target = user.replace(/@s\.whatsapp\.net$/, ''),
              persen = Math.floor(Math.random() * 101)

        let txt = persen <= 17 ? 'masih aman mbak' :
                  persen <= 34 ? 'agak agak sih' :
                  persen <= 51 ? 'agak lain sih' :
                  persen <= 67 ? 'lesbi banget lho ya' :
                  persen <= 84 ? 'gangguan jiwa' :
                  persen <= 93 ? 'fiks lesbi' : 'orang gila',
            teks = `@${target} ${persen}%\n${txt}`

        await xp.sendMessage(chat.id, { text: teks, mentions: [user] }, { quoted: m })
      } catch (e) {
        err(`error pada ${cmd}`, e)
        call(xp, e, m)
      }
    }
  })

  ev.on({
    name: 'cek mesum',
    cmd: ['cekmesum', 'ceksange', 'cekcabul'],
    tags: 'Fun Menu',
    desc: 'cek seberapa mesum orang',
    owner: !1,
    prefix: !0,
    money: 100,
    exp: 0.1,

    run: async (xp, m, {
      chat,
      cmd
    }) => {
      try {
        const user = chat.quoted.id?.[0] || chat.sender,
              mention = user.replace(/@s\.whatsapp\.net$/, ''),
              persen = Math.floor(Math.random() * 101)

        let txt = persen <= 17 ? 'masih aman' :
                  persen <= 34 ? 'agak agak sih' :
                  persen <= 51 ? 'mencurigakan' :
                  persen <= 67 ? `cabul banget jir` :
                  persen <= 71 ? 'sange banget ni orang' :
                  persen <= 84 ? 'dasar mesum' :
                  persen <= 93 ? 'fiks cabul' : 'orang gila',
            teks = `@${mention} ${persen}% ${txt}`

        await xp.sendMessage(chat.id, { text: teks, mentions: [user] }, { quoted: m })
      } catch (e) {
        err(`error pada ${cmd}`, e)
        call(xp, e, m)
      }
    }
  })

  ev.on({
    name: 'cek pedo',
    cmd: ['cekpedo'],
    tags: 'Fun Menu',
    desc: 'cek seberapa pedo orang',
    owner: !1,
    prefix: !0,
    money: 100,
    exp: 0.1,

    run: async (xp, m, {
      chat,
      cmd
    }) => {
      try {
        const user = chat.quoted.id?.[0] || chat.sender,
              target = user.replace(/@s\.whatsapp\.net$/, ''),
              persen = Math.floor(Math.random() * 101)

        let txt = persen <= 17 ? 'masih aman' :
                  persen <= 34 ? 'mencurigakan' :
                  persen <= 51 ? 'tanda² pedo' :
                  persen <= 67 ? 'pedo banget' :
                  persen <= 84 ? 'fiks pedo' :
                  persen <= 93 ? 'pedo,\nlapor fbi' : 'orang gila',
            teks = `@${target} ${persen}%\n${txt}`

        await xp.sendMessage(chat.id, { text: teks, mentions: [user] }, { quoted: m })
      } catch (e) {
        err(`error pada ${cmd}`, e)
        call(xp, e, m)
      }
    }
  })

  ev.on({
    name: 'cek pesan',
    cmd: ['cekpesan', 'cekchat'],
    tags: 'Fun Menu',
    desc: 'cek pesan member',
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
        if (!chat.group) return xp.sendMessage(chat.id, { text: 'perintah ini hanya bisa digunakan digrup' }, { quoted: m })

        const target = chat?.quoted?.id?.[0],
              gcData = get.gc(chat.id)

        if (!target) return xp.sendMessage(chat.id, { text: `reply/tag target\n\ncontoh: ${prefix}${cmd} @pengguna` }, { quoted: m })

        const groupData = dbsider?.[chat.id] || {},
              totalChat = groupData?.[target] || 0

        if (!groupData?.[target]) return xp.sendMessage(chat.id, { text: `@${target.replace(/@s\.whatsapp\.net$/, '')} tidak pernah nimbrung`, mentions: [target] }, { quoted: m })

        return xp.sendMessage(chat.id, { text: `@${target.replace(/@s\.whatsapp\.net$/, '')} telah mengirim *${totalChat}* pesan digrup ini`, mentions: [target]
        }, { quoted: m })
      } catch (e) {
        err(`error pada ${cmd}`, e)
        call(xp, e, m)
      }
    }
  })

  ev.on({
    name: 'cek sider',
    cmd: ['ceksider'],
    tags: 'Fun Menu',
    desc: 'cek member sider',
    owner: !1,
    prefix: !0,
    money: 100,
    exp: 0.1,

    run: async (xp, m, {
      chat,
      cmd
    }) => {
      try {
        if (!chat.group) return xp.sendMessage(chat.id, { text: 'perintah ini hanya bisa digunakan digrup' }, { quoted: m })

        const meta = groupCache.get(chat.id),
              participants = meta?.participants || [],
              groupDB = dbsider[chat.id] || {},
              sider = participants
                .map(v => v.phoneNumber)
                .filter(uid => !groupDB[uid])

        if (!sider.length) return xp.sendMessage(chat.id, { text: 'tidak ada sider' }, { quoted: m })

        let teks = `*LIST SIDER (${sider.length})*\n`,
            mention = []

        for (let i = 0; i < sider.length; i++) {
          teks += `${i + 1}. @${sider[i].split('@')[0]}\n`
          mention.push(sider[i])
        }

        await xp.sendMessage(chat.id, { text: teks, mentions: mention }, { quoted: m })
      } catch (e) {
        err(`error pada ${cmd}`, e)
        call(xp, e, m)
      }
    }
  })

  ev.on({
    name: 'cek sifat',
    cmd: ['ceksifat'],
    tags: 'Fun Menu',
    desc: 'cek sifat orang secara random',
    owner: !1,
    prefix: !0,
    money: 100,
    exp: 0.1,

    run: async (xp, m, {
      chat,
      cmd
    }) => {
      try {
        const user = chat.quoted.id?.[0] || chat.sender,
              { sifatList } = await global.func(),
              target = user.replace(/@s\.whatsapp\.net$/, '')

        const sifat = sifatList[Math.floor(Math.random() * sifatList.length)]

        let teks = `@${target}\nSifat kamu: *${sifat}*`

        await xp.sendMessage(chat.id, { text: teks, mentions: [user] }, { quoted: m })
      } catch (e) {
        err(`error pada ${cmd}`, e)
        call(xp, e, m)
      }
    }
  })

  ev.on({
    name: 'claim',
    cmd: ['claim'],
    tags: 'Fun Menu',
    desc: 'mengeclaim orang',
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
         if (!chat.group) return xp.sendMessage(chat.id, { text: 'perintah ini hanya bisa digunakan digrup' }, { quoted: m })

          const q = chat.quoted.id?.[0]

          if (!q) return xp.sendMessage(chat.id, { text: `reply atau tag target` }, { quoted: m })

          await xp.sendMessage(chat.id, { text: `@${q.replace(/@s\.whatsapp\.net$/, '')} telah di claim oleh @${chat.sender.replace(/@s\.whatsapp\.net$/, '')} `, mentions: [q, chat.sender] }, { quoted: m })
      } catch (e) {
        err(`error pada ${cmd}`, e)
        call(xp, e, m)
      }
    }
  })

  ev.on({
    name: 'elevenlabs',
    cmd: ['elevenlabs', 'vn'],
    tags: 'Fun Menu',
    desc: 'text to speech elevenlabs',
    owner: !1,
    prefix: !0,
    money: 1000,
    exp: 0.1,

    run: async (xp, m, {
      args,
      chat,
      cmd,
      prefix
    }) => {
      try {
        const vnList = [
          'prabowo',
          'yanzgpt',
          'bella',
          'megawati',
          'echilling',
          'adam',
          'thomas_shelby',
          'michi_jkt48',
          'nokotan',
          'jokowi',
          'boboiboy',
          'keqing',
          'anya',
          'yanami_anna',
          'MasKhanID',
          'Myka',
          'raiden',
          'CelzoID',
          'dabi'
        ],
              vnTxt = vnList.map(v => `- ${v}`).join('\n')

        if (args.length < 2) return xp.sendMessage(chat.id, { text: `contoh penggunaan:\n${prefix}${cmd} <voice> <text>\ndaftar voice:\n${vnTxt}` }, { quoted: m })

        await xp.sendMessage(chat.id, { react: { text: '⏳', key: m.key } })

        const [vnRaw, ...txtPart] = args,
              vnLow = vnRaw.toLowerCase(),
              txtLn = txtPart.join(' '),
              pitch = 0,
              speed = 0.9,
              url = await fetch(`${termaiWeb}/api/text2speech/elevenlabs?text=${encodeURIComponent(txtLn)}&voice=${vnLow}&pitch=${pitch}&speed=${speed}&key=${termaiKey}`)

        if (!vnList.includes(vnLow)) {
          return xp.sendMessage(chat.id, { text: `voice tidak valid\nlist voice:\n${vnTxt}`})
        }

        if (!url.ok) throw new Error(`HTTP ${url.status}`)

        const audio = Buffer.from(await url.arrayBuffer())
        await vn(xp, audio, m)
      } catch (e) {
        err(`error pada ${cmd}`, e)
        call(xp, e, m)
      }
    }
  })

  ev.on({
    name: 'get contact',
    cmd: ['getcontact', 'contact', 'contactme'],
    tags: 'Fun Menu',
    desc: 'membuat pesan contact',
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
        const name = args?.[0] || chat.pushName,
              num = chat.sender.split('@')[0]

        await xp.sendMessage(chat.id, {
          contacts: {
            displayName: name,
            contacts: [{ vcard: `BEGIN:VCARD\nVERSION:3.0\nFN:${name}\nTEL;type=CELL;waid=${num}:${num}\nEND:VCARD` }]
          }
        }, { quoted: m })
      } catch (e) {
        err(`error pada ${cmd}`, e)
        call(xp, e, m)
      }
    }
  })

  ev.on({
    name: 'list chat',
    cmd: ['listchat', 'listpesan', 'topchat'],
    tags: 'Fun Menu',
    desc: 'top 10 member yang sering nimbrung',
    owner: !1,
    prefix: !0,
    money: 1e2,
    exp: 1e-1,

    run: async (xp, m, {
      chat,
      cmd
    }) => {
      try {
        if (!chat.group) return xp.sendMessage(chat.id, { text: 'perintah ini hanya bisa digunakan digrup' }, { quoted: m })

        const { usrAdm } = await grupify(xp, m)
        if (!usrAdm) return xp.sendMessage(chat.id, { text: 'kamu bukan admin' }, { quoted: m })

        const data = dbsider[chat.id] || {},
              sorted = Object.entries(data)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 10)

        if (!sorted.length) return xp.sendMessage(chat.id, { text: 'belum ada data chat' }, { quoted: m })

        let txt = `*Top 10 Member Paling Aktif*\n`

        for (let i = 0; i < sorted.length; i++) {
          const [jid, total] = sorted[i],
                no = jid.split('@')[0]

          if (jid || !1) txt += `${i + 1}. @${no}: ${total} Pesan\n`
        }

        await xp.sendMessage(chat.id, { text: txt, mentions: sorted.map(v => v[0]) }, { quoted: m })
      } catch (e) {
        err(`error pada ${cmd}`, e)
        call(xp, e, m)
      }
    }
  })
}