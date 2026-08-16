import { addGc } from '../../system/db/data.js'
import { ev, syncDiscmd } from '../handle.js'
import { isJidGroup } from 'baileys'

export default function group(ev) {
  ev.on({
    name: 'anti badword',
    cmd: ['antibadword', 'badword'],
    ocrs: ['set', 'reset', 'on', 'off'],
    tags: 'Group Menu',
    desc: 'mengatur fitur anti badword dalam grup',
    owner: !1,
    prefix: !0,
    money: 100,
    exp: 0.1,

    run: async (xp, m, {
      args,
      chat,
      cmd,
      ocrs,
      prefix,
      text,
    }) => {
      try {
        if (!chat.group) return xp.sendMessage(chat.id, { text: 'perintah ini hanya bisa digunakan digrup' }, { quoted: m })

        const gcData = get.gc(chat.id),
              { usrAdm, botAdm } = await grupify(xp, m)

        if (!gcData || !usrAdm || !botAdm || !ocrs) return xp.sendMessage(chat.id, { text: !gcData ? `grup ini belum terdaftar ketik ${prefix}daftargc untuk mendaftar` : !usrAdm ? 'kamu bukan admin' : !botAdm ? 'aku bukan admin' : `masukan input\ncontoh:\n${prefix}${cmd} on → aktifkan ${cmd}\n${prefix}${cmd} off → nonaktifkan ${cmd}\n${prefix}${cmd} set <text> → setting ${cmd}\n${prefix}${cmd} reset → reset ${cmd}` }, { quoted: m })

        gcData.filter = gcData.filter || {}
        gcData.filter.badword = gcData.filter.badword || {
          antibadword: !1,
          badwordtext: []
        }

        if (['on', 'off'].includes(ocrs)) {
          gcData.filter.badword.antibadword = ocrs === 'on'
          save.gc()
          return await xp.sendMessage(chat.id, { text: `${cmd} ${ocrs === 'on' ? 'diaktifkan' : 'dinonaktifkan'}` }, { quoted: m })
        }

        if (['set', 'reset'].includes(ocrs)) {
          if (ocrs === 'set') {
            let txt = args.join(' ').trim()

            if (!txt) return xp.sendMessage(chat.id, { text: `masukan kata-kata kasar nya\ncontoh: ${prefix}${cmd} set bahlil` }, { quoted: m })

            if ((!Array.isArray(gcData.filter.badword.badwordtext) && (gcData.filter.badword.badwordtext = []), !gcData.filter.badword.badwordtext.includes(txt))) gcData.filter.badword.badwordtext.push(txt)

            gcData.filter.badword.antibadword = !0
            save.gc()

            await xp.sendMessage(chat.id, { text: `kata "${txt}" berhasil ditambahkan ke blacklist` }, { quoted: m })
          } else {
            gcData.filter.badword.antibadword = !1
            gcData.filter.badword.badwordtext = []
            save.gc()

            await xp.sendMessage(chat.id, { text: `${cmd} berhasil direset` }, { quoted: m })
          }
        }
      } catch (e) {
        err(`error pada ${cmd}`, e)
        call(xp, e, m, cmd)
      }
    }
  })

  ev.on({
    name: 'anti ch',
    cmd: ['antich'],
    tags: 'Group Menu',
    desc: 'mengatur fitur anti saluran/ch',
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
        if (!chat.group) return xp.sendMessage(chat.id, { text: 'perintah ini hanya bisa digunakan digrup' }, { quoted: m })

        const gcData = get.gc(chat.id),
              { usrAdm, botAdm } = await grupify(xp, m)

        if (!gcData || !usrAdm || !botAdm) return xp.sendMessage(chat.id, { text: !gcData ? `grup ini belum terdaftar ketik ${prefix}daftargc untuk mendaftar` : !usrAdm ? 'kamu bukan admin' : 'aku bukan admin' }, { quoted: m })

        const input = args[0]?.toLowerCase(),
              opsi = !!gcData?.filter?.antich,
              modech = gcData?.filter?.antich ? 'Aktif' : 'Tidak Aktif'

        if (!input || !['on', 'off'].includes(input) || (input === 'on' && opsi) || (input === 'off' && !opsi)) return xp.sendMessage(chat.id, { text: !input || !['on', 'off'].includes(input) ? `gunakan:\n ${prefix}${cmd} on/off\n\n${cmd}: ${modech}` : `${cmd} sudah ${opsi ? 'Aktif' : 'nonaktif'}` }, { quoted: m })

        gcData.filter.antich = input === 'on'
        save.gc()

        await xp.sendMessage(chat.id, { text: `${cmd} berhasil di${input === 'on' ? 'aktifkan' : 'nonaktifkan'}` }, { quoted: m })
      } catch (e) {
        err(`error pada ${cmd}`, e)
        call(xp, e, m, cmd)
      }
    }
  })

  ev.on({
    name: 'anti delate',
    cmd: ['antidel', 'antidelate'],
    tags: 'Group Menu',
    desc: 'anti delate pesan',
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
        if (!chat.group) return xp.sendMessage(chat.id, { text: 'pesan ini hanya bisa digunakan digrup' }, { quoted: m })

        const gcData = get.gc(chat.id),
              { usrAdm, botAdm } = await grupify(xp, m)

        if (!gcData || !usrAdm || !botAdm) return xp.sendMessage(chat.id, { text: !gcData ? `grup ini belum terdaftar ketik ${prefix}daftargc untuk mendaftar` : !usrAdm ? 'kamu bukan admin' : 'aku bukan admin' }, { quoted: m })

        gcData.filter.antidel ??= !1

        const input = args.join(' ').toLowerCase().trim(),
              opsi = !!gcData?.filter?.antidel

        if (!input || !['on', 'off'].includes(input) || (input === 'on' && opsi) || (input === 'off' && !opsi)) return xp.sendMessage(chat.id, { text: !input || !['on', 'off'].includes(input) ? `gunakan:\n ${prefix}${cmd} on/off\n\nantidel: ${gcData?.filter?.antidel ? 'Aktif' : 'Tidak Aktif'}` : `${cmd} sudah ${opsi ? 'Aktif' : 'nonaktif'}` }, { quoted: m })

        gcData.filter.antidel = input === 'on'
        save.gc()

        await xp.sendMessage(chat.id, { text: `${cmd} berhasil di${input === 'on' ? 'aktifkan' : 'nonaktifkan'}` }, { quoted: m })
      } catch (e) {
        err(`error pada ${cmd}`, e)
        call(xp, e, m, cmd)
      }
    }
  })

  ev.on({
    name: 'anti kudeta',
    cmd: ['antikudet', 'antikudeta', 'antihama'],
    tags: 'Group Menu',
    desc: 'anti kudeta grup',
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

        const gcData = get.gc(chat.id),
              { botAdm, usrAdm } = await grupify(xp, m)

        if (!gcData || !botAdm || !usrAdm) return xp.sendMessage(chat.id, { text: !gcData ? `grup ini belum terdaftar ketik ${prefix}daftargc untuk mendaftar` : !botAdm ? 'aku bukan admin' : 'kamu bukan admin' }, { quoted: m })

        const input = args[0]?.toLowerCase(),
              opsi = !!gcData?.filter?.antikudet,
              modekudet = gcData?.filter?.antikudet ? 'Aktif' : 'Tidak Aktif'

        if (!input || !['on', 'off'].includes(input) || (input === 'on' && opsi) || (input === 'off' && !opsi)) return xp.sendMessage(chat.id, { text: !input || !['on', 'off'].includes(input) ? `gunakan:\n ${prefix}${cmd} on/off\n\nantikudeta: ${modekudet}` : `${cmd} sudah ${opsi ? 'Aktif' : 'nonaktif'}` }, { quoted: m })

        gcData.filter.antikudet = input === 'on'
        save.gc()

        await xp.sendMessage(chat.id, { text: `${cmd} berhasil di${input === 'on' ? 'aktifkan' : 'nonaktifkan'}` }, { quoted: m })
      } catch (e) {
        err(`error pada ${cmd}`, e)
        call(xp, e, m, cmd)
      }
    }
  })

  ev.on({
    name: 'anti link',
    cmd: ['antilink'],
    tags: 'Group Menu',
    desc: 'anti link grup',
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
        const gcData = get.gc(chat.id),
              { usrAdm, botAdm } = await grupify(xp, m)

        if (!chat.group || !gcData || !usrAdm || !botAdm) return xp.sendMessage(chat.id, { text: !chat.group ? 'perintah ini hanya bisa dijalankan digrup' : !gcData ? `grup ini belum terdaftar ketik ${prefix}daftargc untuk mendaftar` : !usrAdm ? 'kamu bukan admin' : 'aku bukan admin' }, { quoted: m })

        const input = args[0]?.toLowerCase(),
              opsi = !!gcData?.filter?.antilink,
              modelink = gcData?.filter?.antilink ? 'Aktif' : 'Tidak Aktif'

        if (!input || !['on', 'off'].includes(input) || (input === 'on' && opsi) || (input === 'off' && !opsi)) return xp.sendMessage(chat.id, { text: !input || !['on', 'off'].includes(input) ? `gunakan:\n ${prefix}${cmd} on/off\n\nantilink: ${modelink}` : `${cmd} sudah ${opsi ? 'Aktif' : 'nonaktif'}` }, { quoted: m })

        gcData.filter.antilink = input === 'on'
        save.gc()

        await xp.sendMessage(chat.id, { text: `${cmd} berhasil di${input === 'on' ? 'aktifkan' : 'nonaktifkan'}` }, { quoted: m })
      } catch (e) {
        err(`error pada ${cmd}`, e)
        call(xp, e, m, cmd)
      }
    }
  })

  ev.on({
    name: 'anti media',
    cmd: ['antimedia'],
    tags: 'Group Menu',
    desc: 'anti media',
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
        if (!chat.group) return xp.sendMessage(chat.id, { text: 'perintah ini hanya bisa digunakan digrup' }, { quoted: m })

        const { usrAdm, botAdm } = await grupify(xp, m),
              gcData = get.gc(chat.id)

        if (!gcData || !usrAdm || !botAdm) return xp.sendMessage(chat.id, { text: !gcData ? `grup ini belum terdaftar, ketik ${prefix}daftargc untuk mendaftar` : !usrAdm ? 'kamu bukan admin' : 'aku bukan admin' }, { quoted: m })

        const input = args[0]?.toLowerCase(),
              opsi = !!gcData?.filter?.antimedia,
              modeantimedia = gcData?.filter?.antimedia ? 'Aktif' : 'Tidak Aktif'

        if (!input || !['on', 'off'].includes(input) || (input === 'on' && opsi) || (input === 'off' && !opsi)) return xp.sendMessage(chat.id, { text: !input || !['on', 'off'].includes(input) ? `gunakan:\n ${prefix}${cmd} on/off\n\nantimedia: ${modeantimedia}` : `${cmd} sudah ${opsi ? 'Aktif' : 'nonaktif'}` }, { quoted: m })

        gcData.filter.antimedia ??= !1

        gcData.filter.antimedia = input === 'on'
        save.gc()

        await xp.sendMessage(chat.id, { text: `${cmd} berhasil di${input === 'on' ? 'aktifkan' : 'nonaktifkan'}` }, { quoted: m })
      } catch (e) {
        err(`error pada ${cmd}`, e)
        call(xp, e, m, cmd)
      }
    }
  })

  ev.on({
    name: 'anti spam',
    cmd: ['antispam', 'antispm'],
    tags: 'Group Menu',
    desc: 'anti spam',
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
        if (!chat.group) return xp.sendMessage(chat.id, { text: 'perintah ini hanya bisa digunakan digrup' }, { quoted: m })

        const { usrAdm, botAdm } = await grupify(xp, m),
              gcData = get.gc(chat.id)

        if (!usrAdm || !botAdm || !gcData) return xp.sendMessage(chat.id, { text: !usrAdm ? 'kamu bukan admin' : !botAdm ? 'aku bukan admin' : `grup ini belum terdaftar ketik ${prefix}daftargc untuk mendaftar` }, { quoted: m })

        const input = args[0]?.toLowerCase(),
              opsi = !!gcData?.filter?.antispam,
              modeantispm = gcData?.filter?.antispam ? 'Aktif' : 'Tidak Aktif'

        if (!input || !['on', 'off'].includes(input) || (input === 'on' && opsi) || (input === 'off' && !opsi)) return xp.sendMessage(chat.id, { text: !input || !['on', 'off'].includes(input) ? `gunakan:\n ${prefix}${cmd} on/off\n\nantispam: ${modeantispm}` : `${cmd} sudah ${opsi ? 'Aktif' : 'Nonaktif'}` }, { quoted: m })

        gcData.filter.antispam ??= !1

        gcData.filter.antispam = input === 'on'
        save.gc()

        await xp.sendMessage(chat.id, { text: `${cmd} berhasil di${input === 'on' ? 'aktifkan' : 'nonaktifkan'}` }, { quoted: m })
      } catch (e) {
        err(`error pada ${cmd}`, e)
        call(xp, e, m, cmd)
      }
    }
  })

  ev.on({
    name: 'anti stiker',
    cmd: ['antistiker', 'antis'],
    tags: 'Group Menu',
    desc: 'anti stiker',
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
        if (!chat.group) return xp.sendMessage(chat.id, { text: 'perintah ini hanya bisa digunakan digrup' }, { quoted: m })

        const gcData = get.gc(chat.id),
              { usrAdm, botAdm } = await grupify(xp, m)

        if (!usrAdm || !botAdm || !gcData) return xp.sendMessage(chat.id, { text: !usrAdm ? 'kamu bukan admin' : !botAdm ? 'aku bukan admin' : `grup ini belum terdaftar ketik ${prefix}daftargc untuk mendaftar` }, { quoted: m })

        const input = args?.[0]?.toLowerCase(),
              opsi = !!gcData?.filter?.antistiker,
              modeantis = gcData?.filter?.antistiker ? 'Aktif' : 'Tidak Aktif'

        if (!input || !['on', 'off'].includes(input) || (input === 'on' && opsi) || (input === 'off' && !opsi)) return xp.sendMessage(chat.id, { text: !input || !['on', 'off'].includes(input) ? `gunakan:\n ${prefix}${cmd} on/off\n\nantistiker: ${modeantis}` : `${cmd} sudah ${opsi ? 'Aktif' : 'Nonaktif'}` }, { quoted: m })

        gcData.filter.antistiker ??= !1
        gcData.filter.antistiker = input === 'on'
        save.gc()

        await xp.sendMessage(chat.id, { text: `${cmd} berhasil di${input === 'on' ? 'aktifkan' : 'nonaktifkan'}` }, { quoted: m })
      } catch (e) {
        err(`error pada ${cmd}`, e)
        call(xp, e, m, cmd)
      }
    }
  })

  ev.on({
    name: 'anti sw gc',
    cmd: ['antiswgc'],
    tags: 'Group Menu',
    desc: 'anti sw gc',
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
        if (!chat.group) return xp.sendMessage(chat.id, { text: 'perintah ini hanya bisa digunakan digrup' }, { quoted: m })

        const { usrAdm, botAdm } = await grupify(xp, m),
              gcData = get.gc(chat.id)

        if (!usrAdm || !botAdm || !gcData) return xp.sendMessage(chat.id, { text: !usrAdm ? 'kamu bukan admin' : !botAdm ? 'aku bukan admin' : `grup ini belum terdaftar ketik ${prefix}daftargc untuk mendaftar` }, { quoted: m })

        const input = args[0]?.toLowerCase(),
              opsi = !!gcData?.filter?.antiswgc,
              modeswgc = gcData?.filter?.antiswgc ? 'Aktif' : 'Tidak Aktif'

        if (!input || !['on', 'off'].includes(input) || (input === 'on' && opsi) || (input === 'off' && !opsi)) return xp.sendMessage(chat.id, { text: !input || !['on', 'off'].includes(input) ? `gunakan:\n ${prefix}${cmd} on/off\n\nanti sw gc: ${modeswgc}` : `${cmd} sudah ${opsi ? 'Aktif' : 'nonaktif'}` }, { quoted: m })

        gcData.filter.antiswgc ??= !1

        gcData.filter.antiswgc = input === 'on'
        save.gc()

        await xp.sendMessage(chat.id, { text: `${cmd} berhasil di-${input === 'on' ? 'aktifkan' : 'nonaktifkan'}` }, { quoted: m })
      } catch (e) {
        err(`error pada ${cmd}`, e)
        call(xp, e, m, cmd)
      }
    }
  })

  ev.on({
    name: 'anti tag all',
    cmd: ['antitagall', 'antitag', 'antihidetag'],
    tags: 'Group Menu',
    desc: 'anti tag all digrup',
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
        const gcData = get.gc(chat.id),
              { botAdm, usrAdm } = await grupify(xp, m)

        if (!chat.group || !gcData || !usrAdm || !botAdm) return xp.sendMessage(chat.id, { text: !chat.group ? 'perintah ini hanya bisa dijalankan digrup' : !gcData ? `grup ini belum terdaftar ketik ${prefix}daftargc untuk mendaftar` : !usrAdm ? 'kamu bukan admin' : 'aku bukan admin' }, { quoted: m })

        const input = args[0]?.toLowerCase(),
              opsi = !!gcData?.filter?.antitagall,
              modeantitag= gcData?.filter?.antitagall ? 'Aktif' : 'Tidak Aktif'

        if (!input || !['on', 'off'].includes(input) || (input === 'on' && opsi) || (input === 'off' && !opsi)) return xp.sendMessage(chat.id, { text: !input || !['on', 'off'].includes(input) ? `gunakan:\n ${prefix}${cmd} on/off\n\nantitagall: ${modeantitag}` : `${cmd} sudah ${opsi ? 'Aktif' : 'nonaktif'}` }, { quoted: m })

        gcData.filter.antitagall = input === 'on'
        save.gc()

        await xp.sendMessage(chat.id, { text: `${cmd} berhasil di${input === 'on' ? 'aktifkan' : 'nonaktifkan'}` }, { quoted: m })
      } catch (e) {
        err(`error pada ${cmd}`, e)
        call(xp, e, m, cmd)
      }
    }
  })

  ev.on({
    name: 'anti tag sw',
    cmd: ['antitagsw', 'tagsw'],
    tags: 'Group Menu',
    desc: 'anti tag status digrup',
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
        const gcData = get.gc(chat.id),
              { usrAdm, botAdm } = await grupify(xp, m)

        if (!chat.group || !gcData || !usrAdm || !botAdm) return xp.sendMessage(chat.id, { text: !chat.group ? 'perintah ini hanya bisa dijalankan digrup' : !gcData ? `grup ini belum terdaftar ketik ${prefix}daftargc untuk mendaftar` : !usrAdm ? 'kamu bukan admin' : 'aku bukan admin' }, { quoted: m })

        const input = args[0]?.toLowerCase(),
              opsi = !!gcData?.filter?.antitagsw,
              modetagsw = gcData?.filter?.antitagsw ? 'Aktif' : 'Tidak Aktif'

        if (!input || !['on', 'off'].includes(input) || (input === 'on' && opsi) || (input === 'off' && !opsi)) return xp.sendMessage(chat.id, { text: !input || !['on', 'off'].includes(input) ? `gunakan:\n ${prefix}${cmd} on/off\n\n${cmd}: ${modetagsw}` : `${cmd} sudah ${opsi ? 'Aktif' : 'nonaktif'}` }, { quoted: m })

        gcData.filter.antitagsw = input === 'on'
        save.gc()

        await xp.sendMessage(chat.id, { text: `${cmd} di${input === 'on' ? 'aktifkan' : 'nonaktifkan'}` }, { quoted: m })
      } catch (e) {
        err(`error pada ${cmd}`, e)
        call(xp, e, m, cmd)
      }
    }
  })

  ev.on({
    name: 'auto back',
    cmd: ['autoback'],
    tags: 'Group Menu',
    desc: 'mengaktifkan autoback grup',
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
        if (!chat.group) return xp.sendMessage(chat.id, { text: 'perintah ini hanya bisa digunakan digrup' }, { quoted: m })

        const { usrAdm, botAdm } = await grupify(xp, m),
              gcData = get.gc(chat.id)

        if (!usrAdm || !botAdm || !gcData) return xp.sendMessage(chat.id, { text: !usrAdm ? 'kamu bukan admin' : !botAdm ? 'aku bukan admin' : `grup ini belum terdaftar ketik ${prefix}daftargc untuk mendaftar` }, { quoted: m })

        const input = args[0]?.toLowerCase(),
              opsi = !!gcData?.filter?.autoback,
              modeback = gcData?.filter?.autoback ? 'Aktif' : 'Tidak Aktif'

        if (!input || !['on', 'off'].includes(input) || (input === 'on' && opsi) || (input === 'off' && !opsi)) return xp.sendMessage(chat.id, { text: !input || !['on', 'off'].includes(input) ? `gunakan:\n ${prefix}${cmd} on/off\n\n${cmd}: ${modeback}` : `${cmd} sudah ${opsi ? 'Aktif' : 'nonaktif'}` }, { quoted: m })

        gcData.filter.autoback = input === 'on'
        save.gc()

        await xp.sendMessage(chat.id, { text: `${cmd} di${input === 'on' ? 'aktifkan' : 'nonaktifkan'}` }, { quoted: m })
      } catch (e) {
        err(`error pada ${cmd}`, e)
        call(xp, e, m, cmd)
      }
    }
  })

  ev.on({
    name: 'blacklist member',
    cmd: ['blacklistmember', 'blacklist'],
    tags: 'Group Menu',
    desc: 'menutup grup',
    owner: !1,
    prefix: !0,
    money: 100,
    exp: 0.1,

    run: async (xp, m, {
      chat,
      cmd
    }) => {
      try {
        if (!chat.group) return xp.sendMessage(chat.id, { text: 'Perintah ini hanya untuk grup' }, { quoted: m })

        const { usrAdm, botAdm } = await grupify(xp, m),
              q = m.message?.extendedTextMessage?.contextInfo,
              target = q?.participant || q?.mentionedJid?.[0]

        if (!usrAdm || !botAdm || !target) return xp.sendMessage(chat.id, { text: !usrAdm ? 'kamu bukan admin' : !botAdm ? 'aku bukan admin' : 'reply/tag target yang akan diblacklist' }, { quoted: m })

        const gcData = get.gc(chat.id),
              usr = target.replace(/@s\.whatsapp\.net$/, '')

        gcData.blacklist ??= []
        gcData.blacklist.push(target)

        await xp.sendMessage(chat.id, { text: `${usr} berhasil di blacklist` }, { quoted: m })
      } catch (e) {
        err(`error pada ${cmd}`, e)
        call(xp, e, m, cmd)
      }
    }
  })

  ev.on({
    name: 'close group',
    cmd: ['tutup', 'close', 'closegroup'],
    tags: 'Group Menu',
    desc: `menutup grup, ketik .close set untuk set waktu tutup`,
    owner: !1,
    prefix: !0,
    money: 100,
    exp: 0.1,

    run: async (xp, m, {
      args,
      chat,
      cmd,
      ocrs,
      prefix
    }) => {
      try {
        if (!chat.group) return xp.sendMessage(chat.id, { text: 'Perintah ini hanya untuk grup' }, { quoted: m })

        const { botAdm, usrAdm } = await grupify(xp, m),
              meta = groupCache.get(chat.id) || await xp.groupMetadata(chat.id),
              cm = args?.[0],
              gcData = get.gc(chat.id)

        if (!botAdm || !usrAdm) return xp.sendMessage(chat.id, { text: !botAdm ? 'aku bukan admin' : 'kamu bukan admin' }, { quoted: m })

        if (cm === 'set') {
          if (!gcData) return xp.sendMessage(chat.id, { text: `grup ini belum terdaftar, ketik ${prefix}daftargc untuk mendaftar` }, { quoted: m })

          const arg = args?.[1],
                time = global.time.timeIndo("Asia/Jakarta", "DD.MM.YYYY")

          gcData.close ??= {}

          if (!arg) return xp.sendMessage(chat.id, { text: `contoh:\n${prefix}${cmd} ${cm} 22.00` }, { quoted: m })

          gcData.close = {
            set: arg,
            created: time
          }
          save.gc()

          return xp.sendMessage(chat.id, { text: `timer waktu ${cmd} berhasil diset ke jam ${arg}` }, { quoted: m })
        }

        if (['del', 'reset'].includes(cm)) {
          if (!gcData || !gcData?.close?.set) return xp.sendMessage(chat.id, { text: !gcData ? `grup ini belum terdaftar, ketik ${prefix}daftargc untuk mendaftar` : 'timer sudah direset' }, { quoted: m })

          gcData.close.set = null
          gcData.close.created = null
          save.gc()

          return xp.sendMessage(chat.id, { text: `timer ${cmd} berhasil dihapus` }, { quoted: m })
        }

        if (meta?.announce) return xp.sendMessage(chat.id, { text: 'grup sudah ditutup' }, { quoted: m })

        await xp.groupSettingUpdate(chat.id, 'announcement')
      } catch (e) {
        err(`error pada ${cmd}`, e)
        call(xp, e, m, cmd)
      }
    }
  })

  ev.on({
    name: 'daftar gc',
    cmd: ['daftargc'],
    tags: 'Group Menu',
    desc: 'mendaftarkan grup ke database',
    owner: !1,
    prefix: !0,
    money: 300,
    exp: 0.1,

    run: async (xp, m, {
      chat,
      cmd
    }) => {
      try {
        if (!chat.group) return xp.sendMessage(chat.id, { text: 'perintah ini hanya bisa digunakan digrup' }, { quoted: m })

        const gcData = get.gc(chat.id),
              usrdb = get.db(chat.sender)

        if (!usrdb?.prem?.status || gcData) return xp.sendMessage(chat.id, { text: !usrdb?.prem?.status ? 'kamu bukan pengguna premium' : 'grup ini sudah terdaftar' }, { quoted: m })

        const cache = groupCache.get(chat.id) || await xp.groupMetadata(chat.id),
              groupName = cache.subject,
              owner = cache.participants.find(i => i.admin === 'superadmin')?.phoneNumber || cache?.subjectOwnerPn || cache?.descOwnerPn || null,
              admin = {}

        for (const i of cache.participants || []) {
          const jid = i?.phoneNumber?.replace(/:\d+(?=@)/, '')
          if (!jid || jid === owner || !i.admin) continue

          admin[jid] = global.time.timeIndo("Asia/Jakarta", "DD-MM-YYYY HH:mm:ss")
        }

        addGc(groupName, {
          id: chat.id,
          ban: !1,
          owner,
          member: cache?.participants?.length || 0,
          admin,
          resbot: 'del',
          filter: {
            mute: !1,
            antilink: !1,
            antimedia: !1,
            antidel: !1,
            antikudet: !1,
            antispam: !1,
            antitagsw: !1,
            antiswgc: !1,
            antich: !1,
            autoback: !1,
            antitagall: !1,
            antistiker: !1,
            badword: {
              antibadword: !1,
              badwordtext: []
            },
            left: {
              leftGc: !1,
              leftText: ''
            },
            welcome: {
              welcomeGc: !1,
              welcomeText: ''
            }
          },
          close: {},
          open: {},
          discmd: []
        })

        save.gc()

        xp.sendMessage(chat.id, { text: `grup *${groupName}* berhasil didaftarkan` }, { quoted: m })
      } catch (e) {
        err(`error pada ${cmd}`, e)
        call(xp, e, m, cmd)
      }
    }
  })

  ev.on({
    name: 'delete',
    cmd: ['d', 'del', 'delete'],
    tags: 'Group Menu',
    desc: 'menghapus pesan di group',
    owner: !1,
    prefix: !0,
    money: 50,
    exp: 0.1,

    run: async (xp, m, {
      chat,
      cmd
    }) => {
      try {
        const quoted = m.message?.extendedTextMessage?.contextInfo,
              reply = quoted?.quotedMessage,
              mKey = quoted?.stanzaId,
              user = quoted?.participant

        if (!reply || !mKey || !user) return xp.sendMessage(chat.id, { text: 'reply chat yang ingin dihapus' }, { quoted: m })

        const botNum = `${xp.user.id.split(':')[0]}@s.whatsapp.net`,
              fromBot = user === botNum,
              { botAdm, usrAdm } = await grupify(xp, m)

        if (!fromBot && (!usrAdm || !botAdm)) return xp.sendMessage(chat.id, { text: !usrAdm ? 'kamu bukan admin' : 'aku bukan admin' }, { quoted: m })

        await xp.sendMessage(chat.id, { delete: { remoteJid: chat.id, fromMe: fromBot, id: mKey, ...(fromBot? {} : { participant: user }) } })
      } catch (e) {
        err(`error pada ${cmd}`, e)
        call(xp, e, m, cmd)
      }
    }
  })

  ev.on({
    name: 'demote',
    cmd: ['demote'],
    tags: 'Group Menu',
    desc: 'menurunkan admin',
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

        const target = chat.quoted.id?.[0],
              { usrAdm, botAdm } = await grupify(xp, m)

        if (!usrAdm || !botAdm || !target) return xp.sendMessage(chat.id, { text: !usrAdm ? 'kamu bukan admin' : !botAdm ? 'aku bukan admin' : 'reply atau tag nomor yang ingin diturunkan jabatannya' }, { quoted: m })

        const gcInfo = groupCache.get(chat.id) || await xp.groupMetadata(chat.id),
              isAdmin = gcInfo?.participants?.find(v => v.phoneNumber === target)?.admin != null

        if (!isAdmin) return xp.sendMessage(chat.id, { text: `@${target.replace(/@s\.whatsapp\.net$/, '')} sudah bukan admin`, mentions: [target] }, { quoted: m })

        await xp.groupParticipantsUpdate(chat.id, [target], 'demote')

        await xp.sendMessage(chat.id, { react: { text: '✅', key: m.key } })
      } catch (e) {
        err(`error pada ${cmd}`, e)
        call(xp, e, m, cmd)
      }
    }
  })

  ev.on({
    name: 'dis cmd',
    cmd: ['discmd', 'hapuscmd', 'delcmd', 'distag', 'hapustag', 'deltag'],
    tags: 'Group Menu',
    desc: 'menonaktifkan command di dalam grup',
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
        if (!chat.group) return xp.sendMessage(chat.id, { text: 'perintah ini hanya bisa digunakan digrup' }, { quoted: m })

        const gcData = get.gc(chat.id),
              { usrAdm, botAdm } = await grupify(xp, m)

        if (!usrAdm || !botAdm || !gcData) return xp.sendMessage(chat.id, { text: !usrAdm ? 'kamu bukan admin' : !botAdm ? 'aku bukan admin' : `grup ini belum terdaftar ketik ${prefix}daftargc untuk mendaftar` }, { quoted: m })

        gcData.discmd ??= []

        if (['discmd', 'hapuscmd', 'delcmd'].includes(cmd)) {
          const txt = args.join(' ')?.toLowerCase()

          if (!txt) return xp.sendMessage(chat.id, { text: `masukan cmd yang ingin dihapus dari grup ini\ncontoh: ${prefix}${cmd} menu` }, { quoted: m })

          const cmds = ev.cmd.find(u => Array.isArray(u.cmd) && u.cmd.some(v => v.toLowerCase() === txt))

          if (!cmds) return xp.sendMessage(chat.id, { text: `${txt} tidak ada` }, { quoted: m })

          for (const x of cmds.cmd || []) {
            const lc = x.toLowerCase()

            if (!gcData.discmd.includes(lc)) gcData.discmd.push(lc)
          }
          save.gc()
          syncDiscmd()

          return xp.sendMessage(chat.id, { text: `${txt} berhasil dinonaktifkan di grup ini` }, { quoted: m })
        }

        if (['distag', 'hapustag', 'deltag'].includes(cmd)) {
          const txt = args.join(' ')?.toLowerCase()

          if (!txt) return xp.sendMessage(chat.id, { text: `masukan tag yang ingin dihapus dari grup ini\ncontoh: ${prefix}${cmd} game menu` }, { quoted: m })

          const cmds = ev.cmd.filter(u => (u.tags || '').toLowerCase() === txt)

          if (!cmds.length) return xp.sendMessage(chat.id, { text: `tag ${txt} tidak ada` }, { quoted: m })

          const seen = new Set()

          for (const c of cmds) {
            for (const x of c.cmd || []) {
              const lc = x.toLowerCase()

              if (seen.has(lc)) continue
              seen.add(lc)

              if (!gcData.discmd.includes(lc)) gcData.discmd.push(lc)
            }
          }
          save.gc()
          syncDiscmd()

          return xp.sendMessage(chat.id, { text: `berhasil menonaktifkan ${cmds.length} command dari tag ${txt}` }, { quoted: m })
        }
      } catch (e) {
        err(`error pada ${cmd}`, e)
        call(xp, e, m, cmd)
      }
    }
  })

  ev.on({
    name: 'hidetag',
    cmd: ['h', 'hidetag'],
    tags: 'Group Menu',
    desc: 'tag all member',
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
        const { botAdm, usrAdm } = await grupify(xp, m),
              text = args.join(' '),
              fallback = chat.quoted.txt || text,
              gcInfo = groupCache.get(chat.id) || await xp.groupMetadata(chat.id),
              all = gcInfo.participants.map(v => v.phoneNumber).filter(Boolean)

        if (!chat.group || !usrAdm || !botAdm || !fallback) return !chat.group ? xp.sendMessage(chat.id, { text: 'perintah ini hanya bisa dijalankan di grup' }, { quoted: m }) : !usrAdm ? xp.sendMessage(chat.id, { text: 'kamu bukan admin' }, { quoted: m }) : !botAdm ? xp.sendMessage(chat.id, { text: 'aku bukan admin' }, { quoted: m }) : xp.sendMessage(chat.id, { text: 'hidetag tidak boleh kosong' }, { quoted: m })

        xp.sendMessage(chat.id, { text: fallback, mentions: all }, { quoted: m })
      } catch (e) {
        err(`error pada ${cmd}`, e)
        call(xp, e, m, cmd)
      }
    }
  })

  ev.on({
    name: 'intro',
    cmd: ['intro'],
    tags: 'Group Menu',
    desc: 'melihat intro grup',
    owner: !1,
    prefix: !0,
    money: 0,
    exp: 0.1,

    run: async (xp, m, {
      chat,
      cmd,
      prefix
    }) => {
      try {
        const gcData = get.gc(chat.id),
              w = gcData?.filter?.welcome,
              txt = w?.welcomeText?.trim() || 'halo selamat datang',
              wlcOn = w?.welcomeGc === true;

        if (!chat.group || !gcData || !wlcOn) return xp.sendMessage(chat.id, { text: !chat.group ? 'perintah ini hanya bisa dijalankan digrup' : !gcData ? `grup ini belum terdaftar ketik ${prefix}daftargc untuk mendaftar` : `fitur welcome off ketik ${prefix}welcome on untuk mengaktifkan` }, { quoted: m })

        await xp.sendMessage(chat.id, { text: txt }, { quoted: m })
      } catch (e) {
        err(`error pada ${cmd}`, e)
        call(xp, e, m, cmd)
      }
    }
  })

  ev.on({
    name: 'join gc',
    cmd: ['join', 'masuk', 'joingc'],
    tags: 'Group Menu',
    desc: 'memasukkan bot ke grup dengan link',
    owner: !0,
    prefix: !0,
    money: 1.5e3,
    exp: 1e-1,

    run: async (xp, m, {
      chat,
      args,
      cmd
    }) => {
      try {
        const txt = chat.quoted.txt || args.join(' '),
              match = txt.match(/https?:\/\/[^\s]+/gi),
              link = match ? match[0] : null,
              code = link ? link.split('/').pop().split('?')[0] : null

        if (!link || !/chat\.whatsapp\.com/i.test(link)) return xp.sendMessage(chat.id, { text: !link ? 'link grup nya mana?' : 'link tidak valid' }, { quoted: m })

        const res = await xp.groupAcceptInvite(code),
              text = isJidGroup(res) ? `Berhasil masuk ke grup dengan ID: ${res}` : 'Undangan diterima, menunggu persetujuan admin'

        await xp.sendMessage(chat.id, { text }, { quoted: m })
      } catch (e) {
        err(`error pada ${cmd}`, e)
        call(xp, e, m, cmd)
      }
    }
  })

  ev.on({
    name: 'kick',
    cmd: ['kick', 'dor'],
    tags: 'Group Menu',
    desc: 'mengeluarkan orang dari grup',
    owner: !1,
    prefix: !0,
    money: 100,
    exp: 0.1,

    run: async (xp, m, {
      chat,
      cmd
    }) => {
      try {
        if (!chat.group) return xp.sendMessage(chat.id, { text: 'perintah ini hanya bisa dijalankan di grup' }, { quoted: m })

        const { botAdm, usrAdm, adm } = await grupify(xp, m),
              target = chat.quoted.id?.[0]

        if (!usrAdm || !botAdm || !target || adm.includes(target)) return xp.sendMessage(chat.id, { text: !usrAdm ? 'kamu bukan admin' : !botAdm ? 'aku bukan admin' : !target ? 'reply/tag pengguna yang akan dikeluarkan' : 'tidak bisa mengeluarkan admin' }, { quoted: m })

        await xp.groupParticipantsUpdate(chat.id, [target], 'remove').catch(() => xp.sendMessage(chat.id, { text: 'gagal mengeluarkan anggota' }, { quoted: m }))
      } catch (e) {
        err(`error pada ${cmd}`, e)
        call(xp, e, m, cmd)
      }
    }
  })

  ev.on({
    name: 'left',
    cmd: ['left'],
    ocrs: ['set', 'reset', 'on', 'off'],
    tags: 'Group Menu',
    desc: 'seting left outro',
    owner: !1,
    prefix: !0,
    money: 100,
    exp: 0.1,

    run: async (xp, m, {
      args,
      chat,
      cmd,
      ocrs,
      prefix,
      text
    }) => {
      try {
        if (!chat.group) return xp.sendMessage(chat.id, { text: 'perintah ini hanya bisa dijalankan digrup' }, { quoted: m })

        const gcData = get.gc(chat.id),
              { usrAdm, botAdm } = await grupify(xp, m)

        if (!gcData || !usrAdm || !botAdm || !ocrs) return xp.sendMessage(chat.id, { text: !gcData ? `grup ini belum terdaftar ketik ${prefix}daftargc untuk mendaftar` : !usrAdm ? 'kamu bukan admin' : !botAdm ? 'aku bukan admin' : `masukan input\ncontoh:\n${prefix}${cmd} on → aktifkan ${cmd}\n${prefix}${cmd} off → nonaktifkan ${cmd}\n${prefix}${cmd} set <text> → setting ${cmd}\n${prefix}${cmd} reset → reset ${cmd}` }, { quoted: m })

        gcData.filter.left ??= { leftGc: !1, leftText: '' }

        if (['on', 'off'].includes(ocrs)) {
          gcData.filter.left.leftGc = ocrs === 'on'
          save.gc()
          return xp.sendMessage(chat.id, { text: `${cmd} ${ocrs === 'on' ? 'diaktifkan' : 'dinonaktifkan'}` }, { quoted: m })
        }

        if (['set', 'reset'].includes(ocrs)) {
          if (ocrs === 'set') {
            let lftTxt = text.replace(/^[^\s]+\s*left\s+set/i, "").trim() || chat.quoted.txt

            if (!lftTxt) return xp.sendMessage(chat.id, { text: 'masukan/reply pesan selamat tinggalnya' }, { quoted: m })

            gcData.filter.left.leftGc = !0
            gcData.filter.left.leftText = lftTxt
            save.gc()

            return xp.sendMessage(chat.id, { text: `pesan selamat tinggal diperbaharui\n${lftTxt}` }, { quoted: m })
          }

          gcData.filter.left.leftGc = !1
          gcData.filter.left.leftText = ''
          save.gc()

          return xp.sendMessage(chat.id, { text: `${cmd} berhasil direset` }, { quoted: m })
        }
      } catch (e) {
        err(`error pada ${cmd}`, e)
        call(xp, e, m, cmd)
      }
    }
  })

  ev.on({
    name: 'get link gc',
    cmd: ['getlinkgc', 'linkgc'],
    tags: 'Group Menu',
    desc: 'mengambil link grup',
    owner: !1,
    prefix: !0,
    money: 0,
    exp: 0.1,

    run: async (xp, m, {
      chat,
      cmd
    }) => {
      try {
        const { usrAdm, botAdm } = await grupify(xp, m)

        if (!usrAdm || !botAdm) return xp.sendMessage(chat.id, { text: !usrAdm ? 'kamu bukan admin' : 'aku bukan admin' }, { quoted: m })

        await xp.sendMessage(chat.id, { react: { text: '⏳', key: m.key } })

        const linkgc = await xp.groupInviteCode(chat.id),
              ppgc = await xp.profilePictureUrl(chat.id, 'image')

        await xp.sendMsg(chat.id, { text: `https://chat.whatsapp.com/${linkgc}`, image: ppgc }, m)
      } catch (e) {
        err(`error pada ${cmd}`, e)
        call(xp, e, m, cmd)
      }
    }
  })

  ev.on({
    name: 'mute',
    cmd: ['mute'],
    tags: 'Group Menu',
    desc: 'setting mute grup',
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
        if (!chat.group) return xp.sendMessage(chat.id, { text: 'perintah ini hanya bisa digunakan digrup' }, { quoted: m })

        const input = args.join(' '),
              gcData = get.gc(chat.id),
              modeMute = gcData?.filter?.mute ? 'Aktif' : 'Tidak Aktif',
              opsi = !!gcData?.filter?.mute,
              { usrAdm, botAdm } = await grupify(xp, m)

        if (!usrAdm || !botAdm || !input || !gcData) return xp.sendMessage(chat.id, { text: !usrAdm ? 'kamu bukan admin' : !botAdm ? 'aku bukan admin' : !input ? `contoh:\n${prefix}${cmd} on/off\n\n${cmd}: ${modeMute}` : `grup ini belum terdaftar, ketik ${prefix}daftargc untuk mendaftar` }, { quoted: m })

        if (!input || !['on', 'off'].includes(input) || (input === 'on' && opsi) || (input === 'off' && !opsi)) return xp.sendMessage(chat.id, { text: !input || !['on', 'off'].includes(input) ? `gunakan:\n ${prefix}${cmd} on/off\n\n${cmd}: ${modeMute}` : `${cmd} sudah ${opsi ? 'Aktif' : 'nonaktif'}` }, { quoted: m })

        gcData.filter.mute = input === 'on'
        save.gc()

        await xp.sendMessage(chat.id, { text: `${cmd} di${input === 'on' ? 'aktifkan' : 'nonaktifkan'}` }, { quoted: m })
      } catch (e) {
        err(`error pada ${cmd}`, e)
        call(xp, e, m, cmd)
      }
    }
  })

  ev.on({
    name: 'open group',
    cmd: ['buka', 'open'],
    tags: 'Group Menu',
    desc: 'membuka grup, ketik .open set untuk mengatur waktu buka grup',
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
        if (!chat.group) return xp.sendMessage(chat.id, { text: 'perintah ini hanya untuk grup' }, { quoted: m })

        const { botAdm, usrAdm } = await grupify(xp, m),
              meta = groupCache.get(chat.id) || await xp.groupMetadata(chat.id),
              cm = args?.[0],
              gcData = get.gc(chat.id)

        if (!botAdm || !usrAdm) return xp.sendMessage(chat.id, { text: !botAdm ? 'aku bukan admin' : 'kamu bukan admin' }, { quoted: m })

        if (cm === 'set') {
          if (!gcData) return xp.sendMessage(chat.id, { text: `grup ini belum terdaftar, ketik ${prefix}daftargc untuk mendaftar` }, { quoted: m })

          const arg = args?.[1],
                time = global.time.timeIndo("Asia/Jakarta", "DD.MM.YYYY")

          gcData.open ??= {}

          if (!arg) return xp.sendMessage(chat.id, { text: `contoh:\n${prefix}${cmd} ${cm} 06.00` }, { quoted: m })

          gcData.open = {
            set: arg,
            created: time
          }
          save.gc()

          return xp.sendMessage(chat.id, { text: `timer waktu ${cmd} berhasil diset ke jam ${arg}` }, { quoted: m })
        }

        if (['del', 'reset'].includes(cm)) {
          if (!gcData || !gcData?.open?.set) return xp.sendMessage(chat.id, { text: !gcData ? `grup ini belum terdaftar, ketik ${prefix}daftargc untuk mendaftar` : 'timer sudah direset' }, { quoted: m })

          gcData.open.set = null
          gcData.open.created = null
          save.gc()

          return xp.sendMessage(chat.id, { text: `timer ${cmd} berhasil dihapus` }, { quoted: m })
        }

        if (!meta?.announce) return xp.sendMessage(chat.id, { text: 'grup ini sudah dibuka' }, { quoted: m })

        await xp.groupSettingUpdate(chat.id, 'not_announcement');
      } catch (e) {
        err(`error pada ${cmd}`, e)
        call(xp, e, m, cmd)
      }
    }
  })

  ev.on({
    name: 'out gc',
    cmd: ['out', 'keluar', 'outgc'],
    tags: 'Group Menu',
    desc: 'mengeluarkan bot dari grup',
    owner: !0,
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
        const gc = await xp.groupFetchAllParticipating(),
              gcList = Object.values(gc)

        if (!gcList.length) return xp.sendMessage(chat.id, { text: `Tidak ada grup yang ${botName} masuk` }, { quoted: m })

        if (!args.length) {
          let text = `*Daftar Grup ${botName}:*\n\n`
          gcList.forEach((g, i) => {
            text += `${i + 1}. ${g.subject}\nID: ${g.id}\n\n`
          })
          text += `Ketik: ${prefix}${cmd} <nomor atau id grup>\nContoh:\n${prefix}${cmd} 1\n${prefix}${cmd} 628xxx-xxx@g.us`
          return xp.sendMessage(chat.id, { text }, { quoted: m })
        }

        const input = args[0]
        let target = null

        if (/^\d+$/.test(input)) {
          const i = parseInt(input, 10) - 1
          if (i >= 0 && i < gcList.length) target = gcList[i].id
        } else if (input.endsWith('@g.us')) {
          target = gcList.find(g => g.id === input)?.id
        }

        if (!target || !target.endsWith('@g.us')) return xp.sendMessage(chat.id, { text: !target ? 'Grup tidak ditemukan.' : 'ID grup tidak valid.' }, { quoted: m })

        await xp.groupLeave(target)
        xp.sendMessage(chat.id, { text: `${botName} berhasil keluar dari grup:\n${target}` }, { quoted: m })
      } catch (e) {
        err(`error pada ${cmd}`, e)
        call(xp, e, m, cmd)
      }
    }
  })

  ev.on({
    name: 'promote',
    cmd: ['promote'],
    tags: 'Group Menu',
    desc: 'menjadikan member sebagai admin',
    owner: !1,
    prefix: !0,
    money: 100,
    exp: 0.1,

    run: async (xp, m, {
      chat,
      cmd
    }) => {
      try {
        if (!chat.group) return xp.sendMessage(chat.id, { text: 'perintah ini hanya untuk grup' }, { quoted: m })

        const target = chat.quoted.id?.[0],
              { usrAdm, botAdm } = await grupify(xp, m)

        if (!usrAdm || !botAdm || !target) return xp.sendMessage(chat.id, { text: !usrAdm ? 'kamu bukan admin' : !botAdm ? 'aku bukan admin' : 'reply atau tag nomor yang ingin dijadikan admin' }, { quoted: m })

        const gcInfo = groupCache.get(chat.id) || await xp.groupMetadata(chat.id),
              isAdmin = gcInfo?.participants?.find(v => v.phoneNumber === target)?.admin != null

        if (isAdmin) return xp.sendMessage(chat.id, { text: `@${target?.replace(/@s\.whatsapp\.net$/, '')} sudah menjadi admin`, mentions: [target] }, { quoted: m })

        await xp.groupParticipantsUpdate(chat.id, [target], 'promote')

        await xp.sendMessage(chat.id, { react: { text: '✅', key: m.key } })
      } catch (e) {
        err(`error pada ${cmd}`, e)
        call(xp, e, m, cmd)
      }
    }
  })

  ev.on({
    name: 'res bot',
    cmd: ['resbot'],
    ocrs: ['kick', 'del'],
    tags: 'Group Menu',
    desc: 'setting respon bot setiap pengaturan grup',
    owner: !1,
    prefix: !0,
    money: 100,
    exp: 0.1,

    run: async (xp, m, {
      args,
      chat,
      cmd,
      ocrs,
      prefix
    }) => {
      try {
        if (!chat.group) return xp.sendMessage(chat.id, { text: 'perintah ini hanya bisa digunakan digrup' }, { quoted: m })

        const gcData = get.gc(chat.id),
              { usrAdm, botAdm } = await grupify(xp, m),
              txt = args.join(' ')

        if (!gcData || !botAdm || !usrAdm || !ocrs) return xp.sendMessage(chat.id, { text: !gcData ? `grup ini belum terdaftar ketik ${prefix}daftargc untuk mendaftar` : !botAdm ? 'aku bukan admin' : !usrAdm ? 'kamu bukan admin' : `masukan input\n\ncontoh:\n${prefix}${cmd} kick -> akan langsung kick pengguna yang melanggar pengaturan grup\n${prefix}${cmd} del -> hanya menghapus pesan pengguna yang melanggar` }, { quoted: m })

        gcData.resbot ??= 'del'

        if (['del', 'kick'].includes(ocrs)) {
          gcData.resbot = ocrs
          save.gc()
          await xp.sendMessage(chat.id, { text: `respon bot telah diset ke ${ocrs === 'del' ? 'delate pesan' : 'langsung kick'}` }, { quoted: m })
        }
      } catch (e) {
        err(`error pada ${cmd}`, e)
        call(xp, e, m, cmd)
      }
    }
  })

  ev.on({
    name: 'set pp gc',
    cmd: ['setppgc', 'ppgc'],
    tags: 'Group Menu',
    desc: 'Mengatur foto profil grup',
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

        const q = m.message?.extendedTextMessage?.contextInfo?.quotedMessage,
              img = q?.imageMessage || m.message?.imageMessage,
              { usrAdm, botAdm } = await grupify(xp, m)

        if (!botAdm || !usrAdm || !img) return xp.sendMessage(chat.id, { text: !botAdm ? 'aku bukan admin' : !usrAdm ? 'kamu bukan admin' : `reply/kirim gambar dengan caption ${prefix}${cmd}` }, { quoted: m })

        const media = await downloadMedia(xp, cmd, m, q)

        if (!media) {
          addErr(cmd)
          return xp.sendMessage(chat.id, { text: 'gagal mengunduh mendia ulangi, jika masih sama media rusak' }, { quoted: m })
        }

        await xp.setProfilePicture(chat.id, media)
        await xp.sendMessage(chat.id, { text: 'foto profile grup berhasil diperbaharui' }, { quoted: m })
      } catch (e) {
        err(`error pada ${cmd}`, e)
        call(xp, e, m, cmd)
      }
    }
  })

  ev.on({
    name: 'unlock cmd',
    cmd: ['unlockcmd', 'addcmd', 'addtag', 'unlocktag'],
    tags: 'Group Menu',
    desc: 'mengaktifkan kembali command di dalam grup',
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
        if (!chat.group) return xp.sendMessage(chat.id, { text: 'perintah ini hanya bisa dijalankan digrup' }, { quoted: m })

        const gcData = get.gc(chat.id),
              { usrAdm, botAdm } = await grupify(xp, m)

        if (!usrAdm || !botAdm || !gcData) return xp.sendMessage(chat.id, { text: !usrAdm ? 'kamu bukan admin' : !botAdm ? 'aku bukan admin' : `grup ini belum terdaftar ketik ${prefix}daftargc untuk mendaftar` }, { quoted: m })

        gcData.discmd ??= []

        if (['unlockcmd', 'addcmd'].includes(cmd)) {
          const txt = args.join(' ')?.toLowerCase()

          if (!txt) return xp.sendMessage(chat.id, { text: `masukan cmd yang ingin diaktifkan\ncontoh: ${prefix}${cmd} menu` }, { quoted: m })

          const cmds = ev.cmd.find(u => Array.isArray(u.cmd) && u.cmd.some(v => v.toLowerCase() === txt))

          if (!cmds) return xp.sendMessage(chat.id, { text: `${txt} tidak ada` }, { quoted: m })

          let total = 0

          for (const x of cmds.cmd || []) {
            const lc = x.toLowerCase(),
                  idx = gcData.discmd.indexOf(lc)

            if (idx !== -1) {
              gcData.discmd.splice(idx, 1)
              total++
            }
          }
          save.gc()
          syncDiscmd()

          return xp.sendMessage(chat.id, { text: total ? `${txt} berhasil diaktifkan kembali di grup ini` : `${txt} sudah aktif` }, { quoted: m })
        }

        if (['addtag', 'unlocktag', 'tag'].includes(cmd)) {
          const txt = args.join(' ')?.toLowerCase()

          if (!txt) return xp.sendMessage(chat.id, { text: `masukan tag yang ingin diaktifkan\ncontoh: ${prefix}${cmd} game menu` }, { quoted: m })

          const cmds = ev.cmd.filter(u => (u.tags || '').toLowerCase() === txt)

          if (!cmds.length) return xp.sendMessage(chat.id, { text: `tag ${txt} tidak ada` }, { quoted: m })

          let total = 0,
              seen = new Set()

          for (const c of cmds) {
            for (const x of c.cmd || []) {
              const lc = x.toLowerCase(),
                    idx = gcData.discmd.indexOf(lc)

              if (seen.has(lc)) continue
              seen.add(lc)

              if (idx !== -1) {
                gcData.discmd.splice(idx, 1)
                total++
              }
            }
          }
          save.gc()
          syncDiscmd()

          return xp.sendMessage(chat.id, { text: total ? `berhasil mengaktifkan ${total} command dari tag ${txt}` : `semua command pada tag ${txt} sudah aktif` }, { quoted: m })
        }
      } catch (e) {
        err(`error pada ${cmd}`, e)
        call(xp, e, m, cmd)
      }
    }
  })

  ev.on({
    name: 'up sw gc',
    cmd: ['upswgc', 'swgc'],
    tags: 'Group Menu',
    desc: 'membuat sw grup',
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
        if (!chat.group) return xp.sendMessage(chat.id, { text: 'perintah ini hanya bisa digunakan digrup' }, { quoted: m })

        const { usrAdm, botAdm } = await grupify(xp, m),
              gcData = get.gc(chat.id),
              q = m.message?.extendedTextMessage?.contextInfo?.quotedMessage

        if (!usrAdm || !botAdm || !q || !gcData) return xp.sendMessage(chat.id, { text: !usrAdm ? 'kamu bukan admin' : !botAdm ? 'aku bukan admin' : !q ? 'reply pesan yang ingin dijadikan sw grup' : `grup ini belum terdaftar ketik ${prefix}daftargc untuk mendaftar` }, { quoted: m })

        const media = ['imageMessage', 'videoMessage'].find(t => q[t]),
              arg = args.join(' ') || null

        if (!media) return xp.sendMessage(chat.id, { text: 'hanya bisa gambar dan video' }, { quoted: m })

        const mediaData = {
          ...q[media],
          viewOnce: undefined,
          caption: arg || q[media]?.caption || ''
        }

        const statusMessage = {
          groupStatusMessageV2: {
            message: {
              [media]: mediaData
            }
          }
        }

        try {
          await xp.relayMessage(chat.id, statusMessage, {})
        } catch (e) {
          log('error pada sw gc', e)
          saveErr(cmd, e)
        }
      } catch (e) {
        err(`error pada ${cmd}`, e)
        call(xp, e, m, cmd)
      }
    }
  })

  ev.on({
    name: 'welcome',
    cmd: ['welcome'],
    ocrs: ['set', 'reset', 'on', 'off'],
    tags: 'Group Menu',
    desc: 'set welcome grup',
    owner: !1,
    prefix: !0,
    money: 50,
    exp: 0.1,

    run: async (xp, m, {
      args,
      chat,
      cmd,
      ocrs,
      prefix,
      text
    }) => {
      try {
        if (!chat.group) return xp.sendMessage(chat.id, { text: 'perintah ini hanya bisa digunakan digrup' }, { quoted: m })

        const gcData = get.gc(chat.id),
              { usrAdm, botAdm } = await grupify(xp, m)

        if (!gcData || !usrAdm || !botAdm || !ocrs) return xp.sendMessage(chat.id, { text: !gcData ? `grup ini belum terdaftar ketik ${prefix}daftargc untuk mendaftar` : !usrAdm ? 'kamu bukan admin' : !botAdm ? 'aku bukan admin' : `masukan input\ncontoh:\n${prefix}${cmd} on → aktifkan ${cmd}\n${prefix}${cmd} off → nonaktifkan ${cmd}\n${prefix}${cmd} set <text> → setting ${cmd}\n${prefix}${cmd} reset → reset ${cmd}` }, { quoted: m })

        gcData.filter.welcome ??= { welcomeGc: !1, welcomeText: '' }

        const wlc = gcData.filter.welcome

        if (['on', 'off'].includes(ocrs)) {
          wlc.welcomeGc = ocrs === 'on'
          save.gc()
          return xp.sendMessage(chat.id, { text: `${cmd} ${ocrs === 'on' ? 'diaktifkan' : 'dinonaktifkan'}` }, { quoted: m })
        }

        if (['set', 'reset'].includes(ocrs)) {
          if (ocrs === 'set') {
            let wlcTxt = text.replace(/^[^\s]+\s*welcome\s+set/i, "").trim() || chat.quoted.txt

            if (!wlcTxt) return xp.sendMessage(chat.id, { text: 'masukan/reply pesan selamat datangnya' }, { quoted: m })

            wlc.welcomeGc = !0
            wlc.welcomeText = wlcTxt
            save.gc()

            return xp.sendMessage(chat.id, { text: `pesan selamat datang diperbaharui\n${wlcTxt}` }, { quoted: m })
          }

          wlc.welcomeGc = !1
          wlc.welcomeText = ''
          save.gc()

          return xp.sendMessage(chat.id, { text: `${cmd} berhasil direset` }, { quoted: m })
        }
      } catch (e) {
        err(`error pada ${cmd}`, e)
        call(xp, e, m, cmd)
      }
    }
  })
}