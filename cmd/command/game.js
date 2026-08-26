import fs from 'fs'
import path from 'path'
import fetch from 'node-fetch'
import { fileURLToPath } from 'url'

const filename = fileURLToPath(import.meta.url),
      dirname = path.dirname(filename),
      bankData = path.join(dirname, '../../system/db/bank.json')

export default function game(ev) {
  ev.on({
    name: 'auto farming',
    cmd: ['farm', 'autofarm', 'autofarming'],
    tags: 'Game Menu',
    desc: 'mengaktifkan auto farming',
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
        const input = args[0]?.toLowerCase(),
              user = get.db(chat.sender),
              opsi = !!user?.game?.farm,
              type = v => v ? 'Aktif' : 'Tidak',
              modefarm = type(user?.game?.farm)

        if (!input || !['on', 'off'].includes(input) || (input === 'on' && opsi) || (input === 'off' && !opsi)) return xp.sendMessage(chat.id, { text: !input || !['on', 'off'].includes(input) ? `gunakan:\n ${prefix}${cmd} on/off\n\n${cmd}: ${modefarm}` : `${cmd} sudah ${opsi ? 'Aktif' : 'nonaktif'}` }, { quoted: m })

        user.game.farm = input === 'on'
        save.db()

        await xp.sendMessage(chat.id, { text: `${cmd} berhasil di-${input === 'on' ? 'aktifkan' : 'nonaktifkan'}` }, { quoted: m })
      } catch (e) {
        err(`error pada ${cmd}`, e)
        call(xp, e, m, cmd)
      }
    }
  })

  ev.on({
    name: 'bunuh',
    cmd: ['bunuh', 'kill'],
    tags: 'Game Menu',
    desc: 'membunuh orang',
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

        const target = chat.quoted.id?.[0]
        if (!target) return xp.sendMessage(chat.id, { text: 'reply/tag pengguna' }, { quoted: m })

        const usr = get.db(chat.sender),
              trg = get.db(target)

        if (!trg || !usr?.game?.kill) {
          usr.game ??= {}
          usr.game.kill ??= {}

          return xp.sendMessage(chat.id, { text: `@${target?.replace(/@s\.whatsapp\.net$/, '') || 'pengguna'} belum terdaftar`, mentions: [target] }, { quoted: m })
        }

        const now = Date.now(),
              cd = 9e5

        if (usr.game.dead.status || trg.game.dead.status) return xp.sendMessage(chat.id, { text: usr.game.dead.status ? 'kamu sudah mati' : 'target sudah mati' }, { quoted: m })

        if (usr.game.dead.start && now - usr.game.dead.start < cd) {
          const sisa = cd - (now - usr.game.dead.start)

          return xp.sendMessage(chat.id, { text: `tunggu ${Math.ceil(sisa / 6e4)} menit lagi untuk kill lagi` }, { quoted: m })
        }

        const lvlUsr = Math.max(1, Math.floor(usr.exp || 1)),
              lvlTrg = Math.max(1, Math.floor(trg.exp || 1)),
              chance = Math.max(1, Math.min(100, Math.floor((lvlUsr / (lvlUsr + lvlTrg)) * 100))),
              roll = Math.floor(Math.random() * 100) + 1,
              win = roll <= chance,
              percent = chance / 100,
              takeExp = Math.floor((win ? lvlTrg : lvlUsr) * percent),
              takeMoney = Math.floor(((win ? trg : usr).moneyDb?.money || 0) * percent)

        win
          ? (
              trg.exp -= takeExp,
              usr.exp += takeExp,
              trg.moneyDb.money -= takeMoney,
              usr.moneyDb.money += takeMoney,
              trg.game.dead.status = !0,
              trg.game.dead.start = now,
              usr.game.kill.target = (usr.game.kill.target ?? 0) + 1
            )
          : (
              usr.exp -= takeExp,
              trg.exp += takeExp,
              usr.moneyDb.money -= takeMoney,
              trg.moneyDb.money += takeMoney,
              usr.game.dead.status = !0,
              usr.game.dead.start = now
            )

        save.db()

        return xp.sendMessage(chat.id, { text: win ? `berhasil membunuh target!\n\npeluang: ${chance}%\nexp target: -${takeExp}\nexp kamu: +${takeExp}\nuang: +${takeMoney}` : `gagal membunuh target...\n\nkamu mati\nexp kamu: -${takeExp}\nexp target: +${takeExp}\nuang hilang: ${takeMoney}` }, { quoted: m })
      } catch (e) {
        err(`error pada ${cmd}`, e)
        call(xp, e, m, cmd)
      }
    }
  })

  ev.on({
    name: 'cek bank',
    cmd: ['cekbank'],
    tags: 'Game Menu',
    desc: 'cek saldo bank pusat',
    owner: !1,
    prefix: !0,
    money: 100,
    exp: 0.1,

    run: async (xp, m, {
      chat,
      cmd
    }) => {
      try {
        const bankDb = JSON.parse(fs.readFileSync(bankData, 'utf-8')),
              saldo = bankDb.key?.saldo || 0

        let txt = `BANK BOT ${botName}\n`
            txt += `${line}\n`
            txt += `Akun: Bank Pusat\n`
            txt += `Saldo: Rp ${saldo.toLocaleString('id-ID')}\n`
            txt += `Pajak: ${bankDb?.key?.tax}\n`
            txt += `${line}`

        await xp.sendMessage(chat.id, { text: txt }, { quoted: m })
      } catch (e) {
        err(`error pada ${cmd}`, e)
        call(xp, e, m, cmd)
      }
    }
  })

  ev.on({
    name: 'cek buff & debuff',
    cmd: ['cekbuff', 'cekdebuff'],
    tags: 'Game Menu',
    desc: 'cek buff dan debuff pengguna',
    owner: !1,
    prefix: !0,
    money: 1,
    exp: 0.1,

    run: async (xp, m, {
      chat,
      cmd,
      prefix
    }) => {
      try {
        const usr = get.db(chat.sender)

        if (!usr) return xp.sendMessage(chat.id, { text: 'kamu belum terdaftar ulangi' }, { quoted: m })

        const type = /debuff/i.test(cmd) ? 'debuff' : 'buff',
              data = usr?.game?.[type] || {},
              list = Object.entries(data)

        if (!list.length && type === 'debuff') return xp.sendMessage(chat.id, { text: `kamu tidak memiliki ${type}` }, { quoted: m })

        let txt = `list ${type} kamu\n`

        for (const [lvl, name] of list)
          txt += `${name}: ${lvl}\n`

        if (type === 'buff') {
          const trial = global.trialBuff?.get(chat.sender)?.buff,
                tList = trial ? Object.entries(trial) : []

          if (tList.length) {
            txt += `\ntrial buff\n`

            for (const [lvl, name] of tList)
              txt += `${name}: ${lvl}\n`
          }

          if (!list.length && !tList.length) return xp.sendMessage(chat.id, { text: 'kamu tidak memiliki buff' }, { quoted: m })
        }

        xp.sendMessage(chat.id, { text: txt.trim() }, { quoted: m })
      } catch (e) {
        err(`error pada ${cmd}`, e)
        call(xp, e, m, cmd)
      }
    }
  })

  ev.on({
    name: 'nabung',
    cmd: ['nabung', 'isiatm'],
    tags: 'Game Menu',
    desc: 'mengisi saldo bank orang',
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
        if (!args) return xp.sendMessage(chat.id, { text: 'contoh: .isiatm 10000' }, { quoted: m })

        const usr = get.db(chat.sender),
              nominal = Number(args[0])

        if (!usr || !nominal || usr.moneyDb?.money < nominal) return xp.sendMessage(chat.id, { text: !usr ? 'kamu belum terdaftar coba lagi' : !nominal ? `nominal tidak valid\ncontoh: ${prefix}${cmd} 10000` : `uang kamu hanya tersisa ${usr.moneyDb?.money.toLocaleString('id-ID')}` }, { quoted: m })

        usr.moneyDb.money -= nominal
        usr.moneyDb.moneyInBank += nominal
        save.db()

        await xp.sendMessage(chat.id, { text: `Rp ${nominal.toLocaleString('id-ID')} berhasil masukan ke bank` }, { quoted: m })
      } catch (e) {
        err(`error pada ${cmd}`, e)
        call(xp, e, m, cmd)
      }
    }
  })

  ev.on({
    name: 'rampok',
    cmd: ['rampok'],
    tags: 'Game Menu',
    desc: 'merampok orang',
    owner: !1,
    prefix: !0,
    money: 0,
    exp: 0.2,

    run: async (xp, m, {
      chat,
      cmd
    }) => {
      try {
        if (!chat.group) return xp.sendMessage(chat.id, { text: 'perintah ini hanya bisa digunakan digrup' }, { quoted: m })

        const target = chat.quoted.id?.[0],
              trg = get.db(target),
              usr = get.db(chat.sender)

        if (!target || !trg) return xp.sendMessage(chat.id, { text: !target ? 'reply/tag pengguna' : 'pengguna belum terdaftar' }, { quoted: m })

        if (usr.game?.robbery?.cost <= 0) return xp.sendMessage(chat.id, { text: 'kesempatan merampok habis coba kembali besok' }, { quoted: m })

        if (target === chat.sender) return

        const moneyTarget = trg.moneyDb.money,
              moneyUsr = usr.moneyDb.money,
              usrBuff = Object.keys(usr?.game?.buff || {}).reduce((a, b) => a + Number(b), 0),
              usrDebuff = Object.keys(usr?.game?.debuff || {}).reduce((a, b) => a + Number(b), 0),
              trgBuff = Object.keys(trg?.game?.buff || {}).reduce((a, b) => a + Number(b), 0),
              trgDebuff = Object.keys(trg?.game?.debuff || {}).reduce((a, b) => a + Number(b), 0)

        if (moneyTarget <= 0) return xp.sendMessage(chat.id, { text: 'target miskin' }, { quoted: m })

        const baseChance = Math.floor(Math.random() * 1e2) + 1

        let chance = baseChance

        chance += usrBuff
        chance -= usrDebuff
        chance += trgDebuff
        chance -= trgBuff
        chance = Math.max(1, Math.min(1e2, chance))

        const escapeBase = chance >= 45 ? Math.floor(Math.random() * 21) + 25 : Math.floor(Math.random() * 21) + 10

        let escapeChance = escapeBase

        escapeChance += trgBuff
        escapeChance -= trgDebuff
        escapeChance += usrDebuff
        escapeChance -= usrBuff
        escapeChance = Math.max(1, Math.min(1e2, escapeChance))

        const escapeRoll = Math.floor(Math.random() * 1e2) + 1

        if (escapeRoll <= escapeChance) return xp.sendMessage(chat.id, { text: 'Target berhasil lolos!' }, { quoted: m })

        const persen = chance > 1e2 ? 1e2 : chance,
              stolin = Math.floor(moneyTarget * (persen / 1e2)),
              finalSt = stolin < 1 ? 1 : stolin

        trg.moneyDb.money -= finalSt
        usr.moneyDb.money += finalSt
        usr.game.robbery.cost -= 1

        save.db()

        let txt = `${head}\n`
            txt += `${body} ${btn} *Berhasil Merampok:* Rp ${finalSt.toLocaleString('id-ID')} dari @${target?.replace(/@s\.whatsapp\.net$/, '')}\n`
            txt += `${body} ${btn} *Saldo Kamu:* Rp ${usr.moneyDb.money.toLocaleString('id-ID')}\n`
            txt += `${foot}${line}`

        await xp.sendMessage(chat.id, { text: txt, mentions: [target] }, { quoted: m })
      } catch (e) {
        err(`error pada ${cmd}`, e)
        call(xp, e, m, cmd)
      }
    }
  })

  ev.on({
    name: 'rules game',
    cmd: ['rulesgame', 'rules'],
    tags: 'Game Menu',
    desc: 'cek rules game',
    owner: !1,
    prefix: !0,
    money: 10,
    exp: 0.1,

    run: async (xp, m, {
      args,
      chat,
      cmd,
      prefix
    }) => {
      try {
        const game = args?.join(' ')?.toLowerCase()?.trim()

        if (!game) return xp.sendMessage(chat.id, { text: `contoh:\n${prefix}${cmd} tebakdadu` }, { quoted: m })

        const url = await fetch('https://raw.githubusercontent.com/Dabilines/Dabi-Ai-Documentation/main/assets/db/datarules.json').then(r => r.json())

        if (!url) {
          addErr(cmd)
          return xp.sendMessage(chat.id, { text: 'gagal mendapatkan url' }, { quoted: m })
        }

        const rules = url?.key?.[game]

        if (!rules) return xp.sendMessage(chat.id, { text: `${game} tidak ada` }, { quoted: m })

        return xp.sendMessage(chat.id, { text: rules.text }, { quoted: m })
      } catch (e) {
        err(`error pada ${cmd}`, e)
        call(xp, e, m, cmd)
      }
    }
  })

  ev.on({
    name: 'sambung kata',
    cmd: ['sambungkata', 'samkat'],
    tags: 'Game Menu',
    desc: 'game sambungkata',
    owner: !1,
    prefix: !0,
    money: 10,
    exp: 0.1,

    run: async (xp, m, {
      args,
      chat,
      cmd,
      prefix
    }) => {
      try {
        if (!chat.group) return xp.sendMessage(chat.id, { text: 'perintah ini hanya bisa digunakan digrup' }, { quoted: m })

        const arg = args?.[0],
              usr = get.db(chat.sender)

        if (!arg || !usr) return xp.sendMessage(chat.id, { text: !arg ? `masukan teks nya:\ncontoh: ${prefix}${cmd} ayam` : null }, { quoted: m })

        const txt = arg?.slice(-1),
              hystemp = path.join(dirname, '../../temp/history_sambung_kata.json')

        if (!fs.existsSync(hystemp)) fs.writeFileSync(hystemp, '{}')

        let tekka = {}

        if (fs.existsSync(hystemp)) tekka = JSON.parse(fs.readFileSync(hystemp, 'utf-8') || '{}')

        const msg = await xp.sendMessage(chat.id, { text: `sambung kata dimulai dari ${arg}\nbalas chat ini untuk melanjutkan` }, { quoted: m }),
              values = `${arg}_${chat.sender?.replace(/@s\.whatsapp\.net$/, '') || chat.sender}`

        tekka[values] ??= { reset: Date.now() }

        tekka[values].reset ??= Date.now()

        tekka[values][chat.sender?.replace(/@s\.whatsapp\.net$/, '')] = {
          id: msg?.key?.id,
          ans: arg?.toLowerCase()?.trim(),
          key: arg,
          val: txt,
          time: Date.now()
        }

        fs.writeFileSync(hystemp, JSON.stringify(tekka))
      } catch (e) {
        err(`error pada ${cmd}`, e)
        call(xp, e, m, cmd)
      }
    }
  })

  ev.on({
    name: 'slot',
    cmd: ['isi', 'spin', 'slot', 'gacha'],
    tags: 'Game Menu',
    desc: 'gacha uang',
    owner: !1,
    prefix: !0,
    money: 15000,
    exp: 0.1,

    run: async (xp, m, {
      args,
      chat,
      cmd
    }) => {
      try {
        const saldoBank = JSON.parse(fs.readFileSync(bankData, 'utf-8')),
              user = get.db(chat.sender),
              delay = ms => new Promise(res => setTimeout(res, ms)),
              sym = ['🕊️','🦀','🦎','🍀','💎','🍒','❤️','🎊'],
              randSym = () => sym[Math.floor(Math.random() * sym.length)]

        if (!user) {
          addErr(cmd)
          return xp.sendMessage(chat.id, { text: 'kamu belum terdaftar' }, { quoted: m })
        }

        const isi = parseInt(args[0]),
              saldo = user.moneyDb?.money || 0

        if (!args[0] || isNaN(isi) || isi < 0) return xp.sendMessage(chat.id, { text: 'masukan jumlah yang valid\ncontoh: .isi 10000' }, { quoted: m })

        if (isi > saldo) return xp.sendMessage(chat.id, { text: `saldo kamu tersisa Rp ${saldo.toLocaleString('id-ID')}` }, { quoted: m })

        const isi1 = [randSym(), randSym(), randSym()],
              isi3 = [randSym(), randSym(), randSym()],
              menang = Math.random() < 0.5,
              isi2 = menang ? Array(3).fill(randSym()) : (() => {
                let r; do { r = [randSym(), randSym(), randSym()] } while (r[0] === r[1] && r[1] === r[2]);
                return r;
              })(),
              hasil = isi2.join(' : '),
              isiBank = saldoBank.key?.saldo || 0

        let rsMoney = menang ? isi * 2 : -isi

        if (menang) {
          const hadiah = isiBank >= rsMoney ? rsMoney : isiBank
          user.moneyDb.money += hadiah
          saldoBank.key.saldo = isiBank >= rsMoney ? isiBank - rsMoney : 0
          rsMoney = hadiah
        } else {
          user.moneyDb.money += rsMoney
          saldoBank.key.saldo += Math.abs(rsMoney)
        }

        const saveBank = d => fs.writeFileSync(bankData, JSON.stringify(d)),
              txt = `
╭───🎰 GACHA UANG 🎰───╮
│               ${isi1.join(' : ')}
│               ${hasil}
│               ${isi3.join(' : ')}
╰────────────────────╯
             ${menang ? `🎉 Kamu Menang! +${rsMoney.toLocaleString('id-ID')}` : `💥 Zonk! -${Math.abs(rsMoney).toLocaleString('id-ID')}`}
`.trim();

        save.db()
        saveBank(saldoBank)

        const pesanAwal = await xp.sendMessage(chat.id, { text: '🎲 Gacha dimulai...' }, { quoted: m });

        await delay(2000);
        await xp.sendMessage(chat.id, { text: txt, edit: pesanAwal.key });
      } catch (e) {
        err(`error pada ${cmd}`, e)
        call(xp, e, m, cmd)
      }
    }
  })

  ev.on({
    name: 'tarik saldo',
    cmd: ['tariksaldo', 'tarik'],
    tags: 'Game Menu',
    desc: 'mengambil saldo dari bank',
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
        if (!args) return xp.sendMessage(chat.id, { text: 'masukan nominal\ncontoh: .tarik 1000' }, { quoted: m })

        const nominal = Number(args[0]),
              usr = get.db(chat.sender)

        if (!nominal || !usr || usr?.moneyDb?.moneyInBank < nominal) return xp.sendMessage(chat.id, { text: !nominal ? 'nominal tidak valid' : !usr ? 'kamu belum terdaftar coba lagi' : `saldo bank kamu hanya tersisa Rp ${usr?.moneyDb?.moneyInBank.toLocaleString('id-ID')}` }, { quoted: m })

        usr.moneyDb.moneyInBank -= nominal
        usr.moneyDb.money += nominal
        save.db()

        await xp.sendMessage(chat.id, { text: `Rp ${nominal.toLocaleString('id-ID')} berhasil di tarik dari bank` }, { quoted: m })
      } catch (e) {
        err(`error pada ${cmd}`, e)
        call(xp, e, m, cmd)
      }
    }
  })

  ev.on({
    name: 'tebak dadu',
    cmd: ['tebakdadu'],
    tags: 'Game Menu',
    desc: 'game tebak dadu',
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
        if (!chat.group) return xp.sendMessage(chat.id, { text: 'perintah ini hanya bisa dijalankan digrup' }, { quoted: m })

        const usrdb = get.db(chat.sender),
              __tebakdadu = path.join(dirname, '../../temp/history_tebak_dadu.json'),
              arg = args?.[0]?.toLowerCase()?.trim(),
              dadu = Number(args?.[1])

        let history = {},
            text = `contoh:\n${prefix}${cmd} start 6\n\nangka dadu harus 1 - 6`

        if (!usrdb) return xp.sendMessage(chat.id, { text: 'kamu belum terdaftar' }, { quoted: m })

        fs.existsSync(__tebakdadu) && (history = JSON.parse(fs.readFileSync(__tebakdadu, 'utf-8') || '{}'))

        if (!arg) return xp.sendMessage(chat.id, { text }, { quoted: m })

        if (['start', 'mulai']?.includes(arg)) {
          if (!args?.[1] || isNaN(dadu) || dadu < 1 || dadu > 6) return xp.sendMessage(chat.id, { text }, { quoted: m })

          const game = Object.values(history?.key?.[chat.id] || {}).find(v => v?.status && v?.ply?.includes(chat.sender))

          if (game) {
            const ms = await xp.sendMessage(chat.id, { text: 'kamu masih berada di dalam game tebak dadu balas pesan ini jika ingin menyerah' }, { quoted: m })

            game.idOn = ms?.key?.id

            fs.writeFileSync(__tebakdadu, JSON.stringify(history, null, 2))
            return
          }

          const msg = await xp.sendMessage(chat.id, { text: `${cmd} dimulai menunggu pemain lain bergabung\nbalas pesan ini dan ketik join untuk bergabung` }, { quoted: m })

          history.key ??= {}
          history.key[chat.id] ??= {}

          history.key[chat.id] = {
            [msg.key?.id]: {
              his: [msg?.key?.id],
              status: !0,
              idOn: null,
              time: Date.now(),
              ply: [chat.sender],
              dadu: {
                [dadu]: chat.sender
              }
            }
          }

          return fs.writeFileSync(__tebakdadu, JSON.stringify(history, null, 2))
        }
      } catch (e) {
        err(`error pada ${cmd}`, e)
        call(xp, e, m, cmd)
      }
    }
  })

  ev.on({
    name: 'tebak gambar',
    cmd: ['tebakgambar'],
    tags: 'Game Menu',
    desc: 'game tebak gambar',
    owner: !1,
    prefix: !0,
    money: 1,
    exp: 0.1,

    run: async (xp, m, {
      chat,
      cmd
    }) => {
      try {
        const user = get.db(chat.sender),
              key = Object.values(global.tebakgambar || {}),
              list = key[Math.floor(Math.random() * key.length)]

        if (!user) return xp.sendMessage(chat.id, { text: 'kamu belum terdaftar' }, { quoted: m })

        const msg = await xp.sendMessage(chat.id, { image: { url: list.img }, caption: `tebak gambar dimulai\ndeskripsi: ${list?.deskripsi || ''}\n\nreply gambar ini untuk menjawab` }, { quoted: m }),
              __tebakgambar = path.join(dirname, '../../temp/history_tebak_gambar.json')

        let history = {}

        if (fs.existsSync(__tebakgambar)) {
          history = JSON.parse(fs.readFileSync(__tebakgambar, 'utf-8') || '{}')
        }

        history.key ??= {}
        history.key[chat.sender] ??= {}

        history.key[chat.sender][msg.key.id] = {
          name: chat.pushName,
          id: msg.key.id,
          chat: chat.id,
          no: user?.noId || chat.sender,
          soal: list.img,
          desc: list.deskripsi,
          key: list.jawaban.toLowerCase().trim(),
          chance: 3,
          status: !0,
          set: msg.messageTimestamp || Date.now()
        }

        fs.writeFileSync(__tebakgambar, JSON.stringify(history))
      } catch (e) {
        err(`error pada ${cmd}`, e)
        call(xp, e, m, cmd)
      }
    }
  })

  ev.on({
    name: 'tebak hero ml',
    cmd: ['tebakheroml', 'tebakml'],
    tags: 'Game Menu',
    desc: 'game tebak hero mobile legend',
    owner: !1,
    prefix: !0,
    money: 1,
    exp: 0.1,

    run: async (xp, m, {
      chat,
      cmd
    }) => {
      try {
        const url = await fetch(`https://api.siputzx.my.id/api/games/tebakheroml`,
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json'
                }
              }).then(r => r.json()),
              __tebakml = path.join(dirname, '../../temp/history_tebak_ml.json')

        await xp.sendMessage(chat.id, { react: { text: '⏳', key: m.key } })

        let history = {}

        if (!url?.status) return xp.sendMessage(chat.id, { text: url?.error }, { quoted: m })

        if (url?.status && url?.data?.audio) {
          const audio = await fetch(url.data.audio).then(r => r.arrayBuffer())

          const msg = await xp.sendMessage(chat.id, { audio: Buffer.from(audio), mimetype: 'audio/mpeg' }, { quoted: m })

          if (fs.existsSync(__tebakml)) history = JSON.parse(fs.readFileSync(__tebakml, 'utf-8') || '{}')

          history.key ??= {}
          history.key[chat.sender] ??= {}

          history.key[chat.sender] = {
            id: chat.id,
            key: msg.key.id,
            jwb: url?.data?.name,
            chance: 3,
            status: !0
          }

          fs.writeFileSync(__tebakml, JSON.stringify(history))
        }
      } catch (e) {
        err(`error pada ${cmd}`, e)
        call(xp, e, m, cmd)
      }
    }
  })

  ev.on({
    name: 'tebak kata',
    cmd: ['tebakkata', 'tekka'],
    tags: 'Game Menu',
    desc: 'game tebak kata',
    owner: !1,
    prefix: !0,
    money: 1,
    exp: 0.1,

    run: async (xp, m, {
      chat,
      cmd
    }) => {
      try {
        const { tebakkata } = await global.func(),
              user = get.db(chat.sender),
              key = Object.values(tebakkata),
              list = key[Math.floor(Math.random() * key.length)]

        const msg = await xp.sendMessage(chat.id, { text: `tebak kata dimulai\nsoal: ${list.soal}\n\nreply chat ini untuk menjawab` }, { quoted: m }),
              __tebakkata = path.join(dirname, '../../temp/history_tebak_kata.json')

        let history = {}

        if (fs.existsSync(__tebakkata)) {
          history = JSON.parse(fs.readFileSync(__tebakkata, 'utf-8') || '{}')
        }

        history.key ??= {}
        history.key[chat.sender] ??= {}

        history.key[chat.sender][msg.key.id] = {
          name: chat.pushName,
          id: msg.key.id,
          chat: chat.id,
          no: user?.noId || chat.sender,
          soal: list.soal,
          key: list.jawaban,
          chance: 3,
          status: !0,
          set: Date.now()
        }

        fs.writeFileSync(__tebakkata, JSON.stringify(history))
      } catch (e) {
        err(`error pada ${cmd}`, e)
        call(xp, e, m, cmd)
      }
    }
  })

  ev.on({
    name: 'transfer',
    cmd: ['tf', 'transfer'],
    tags: 'Game Menu',
    desc: 'mentransfer uang',
    owner: !1,
    prefix: !0,
    money: 100,
    exp: 0.5,

    run: async (xp, m, {
      args,
      chat,
      cmd
    }) => {
      try {
        if (!chat.group) return xp.sendMessage(chat.id, { text: 'perintah ini hanya bisa digunakan digrup' }, { quoted: m })

        const target = chat.quoted.id?.[0],
              trg = get.db(target),
              usr = get.db(chat.sender)

        if (!target || !args?.[0]) return xp.sendMessage(chat.id, { text: !target ? 'reply/tag orang yang akan menerima transfer' : 'nominal tidak valid\ncontoh: .tf @pengguna/reply 10000' }, { quoted: m })

        const nominal = Number(args[1]) || Number(args[0])
        if (!nominal || nominal < 1e0) return xp.sendMessage(chat.id, { text: 'nominal tidak valid' }, { quoted: m })

        if (!usr || !trg) return xp.sendMessage(chat.id, { text: !usr ? 'data kamu tidak ditemukan di database' : 'data penerima tidak ditemukan di database' }, { quoted: m })

        const uMoney = usr.moneyDb.money

        if (uMoney < nominal) return xp.sendMessage(chat.id, { text: `saldo kamu tersisa Rp ${usr.moneyDb?.money.toLocaleString('id-ID')}` }, { quoted: m })

        usr.moneyDb.money -= nominal
        trg.moneyDb.money += nominal
        save.db()

        await xp.sendMessage(chat.id, { text: `Rp ${nominal.toLocaleString('id-ID')} berhasil ditransfer` }, { quoted: m })
      } catch (e) {
        err(`error pada ${cmd}`, e)
        call(xp, e, m, cmd)
      }
    }
  })
}