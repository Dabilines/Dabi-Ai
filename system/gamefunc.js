import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const filename = fileURLToPath(import.meta.url),
      dirname = path.dirname(filename)

const sfg = {
  timer: 24 * 60 * 60 * 1000,
  cost: 1000,
  sleep: ms => new Promise(r => setTimeout(r, ms))
}

const th = { timer: 120000 }

const file_tebak_kata = path.join(dirname, '../temp/history_tebak_kata.json'),
      file_tebak_gambar = path.join(dirname, '../temp/history_tebak_gambar.json'),
      file_sambung_kata = path.join(dirname, '../temp/history_sambung_kata.json'),
      file_tebak_dadu = path.join(dirname, '../temp/history_tebak_dadu.json')

let runTimerHistory = !1,
    runfarm = !1,
    thCache = null,
    thTick  = 0,
    runRobberyCost = !1,
    rundeath = !1,
    tebakDaduInterval = null

async function tmdead() {
  if (rundeath) return

  rundeath = !0

  const delay = 9e5

  while (!0) {
    let dbsv = !1

    try {
      const usrDb = Object.values(db().key),
            now = Date.now()

      for (const usr of usrDb) {
        const dead = usr?.game?.dead,
              buff = Object.keys(usr?.game?.buff || {}),
              debuff = Object.keys(usr?.game?.debuff || {}),
              buffTotal = buff.reduce((a, b) => a + Number(b || 0), 0),
              debuffTotal = debuff.reduce((a, b) => a + Number(b || 0), 0),
              total = buffTotal - debuffTotal,
              start = Number(dead?.start) || 0,
              last = start - total,
              diff = now - last

        if (!dead || dead.status !== !0) continue

        if (last <= 0 || last > now) {
          dead.status = !1
          dead.start = 0
          dbsv = !0
          continue
        }

        if (diff < delay) continue

        dead.status = !1
        dead.start = 0
        dbsv = !0
      }

      if (dbsv) save.db()
    } catch (e) {
      err('error pada tmdead', e)
      saveErr(e, 'tmdead')
    }

    await sfg.sleep(delay)
  }
}

async function cost_robbery() {
  if (runRobberyCost) return
  runRobberyCost = !0

  while (!0) {
    await sfg.sleep(sfg.timer)

    let dbsv = !1

    try {
      const usrDb = Object.values(db().key)

      for (const usr of usrDb) {
        if (!usr?.jid) continue

        usr.game ??= {}
        usr.game.robbery ??= {}
        usr.game.robbery.cost ??= 0

        usr.game.robbery.cost += 3
        dbsv = !0
      }

      if (dbsv) save.db()
    } catch (e) {
      err('error pada robberyCostLoop', e)
      saveErr(e, 'cost_robbery')
    }
  }
}

async function timerTebakDadu(xp) {
  if (tebakDaduInterval) return

  tebakDaduInterval = setInterval(async () => {
    try {
      if (!xp?.user?.id || !fs.existsSync(file_tebak_dadu)) return

      const data = JSON.parse(fs.readFileSync(file_tebak_dadu, 'utf-8') || '{}')

      let update = !1

      for (const chatId in data?.key || {}) {
        for (const id in data.key[chatId]) {
          if (!id || !chatId) continue

          const game = data.key[chatId][id]

          if (!game?.status || !game?.time || Date.now() - game.time < 12e4) continue

          await xp.sendMessage(chatId, { text: 'pendaftaran ditutup permainan akan dimulai' })

          const mentions = game.ply || [],
                totalPlayer = mentions.length

          await xp.sendMessage(chatId, { text: `player yang bermain\n${mentions.map(v => `@${v.split('@')[0]}`).join('\n')}`, mentions })

          if (totalPlayer <= 1) {
            await xp.sendMessage(chatId, { text: 'permainan dibubarkan karena hanya ada 1 pemain' })

            delete data.key[chatId][id]
            update = !0
            continue
          }

          const hasilDadu = Math.floor(Math.random() * 6) + 1

          await xp.sendMessage(chatId, { text: `dadu keluar angka *${hasilDadu}*` })

          const pilihan = Object.entries(game.dadu || {}).map(([angka, sender]) => ({
            angka: Number(angka),
            sender,
            selisih: Math.abs(Number(angka) - hasilDadu)
          }))

          if (!pilihan.length) {
            await xp.sendMessage(chatId, { text: 'tidak ada pemain yang memilih dadu' })

            delete data.key[chatId][id]
            update = !0
            continue
          }

          let pemenang = null

          if (totalPlayer < 5) {
            pilihan.sort((a, b) => a.selisih - b.selisih)
            pemenang = pilihan[0]
          } else {
            pemenang = pilihan.find(v => v.angka === hasilDadu)

            if (!pemenang) {
              await xp.sendMessage(chatId, { text: `hasil dadu ${hasilDadu}\n\npertandingan seri` })

              delete data.key[chatId][id]
              update = !0
              continue
            }
          }

          const winusr = get.db(pemenang.sender),
                buff = Object.keys(winusr?.game?.buff || {}).reduce((a, b) => a + Number(b), 0),
                debuff = Object.keys(winusr?.game?.debuff || {}).reduce((a, b) => a + Number(b), 0),
                base =
                  totalPlayer == 2 ? 500 :
                  totalPlayer == 3 ? 750 :
                  totalPlayer == 4 ? 1e3 :
                  totalPlayer == 5 ? 15e2 :
                  totalPlayer == 6 ? 2e3 : 25e2,
                bonus = Math.floor(base * .12),
                reward = base + bonus

          let total = reward

          total += Math.floor(reward * (buff / 100))
          total -= Math.floor(reward * (debuff / 100))
          total = total < 1 ? 1 : total

          if (winusr) {
            winusr.moneyDb.money += total
            winusr.exp += 1
            save.db()
          }

          let text = `pemenang adalah @${pemenang.sender.split('@')[0]}\n` +
            `pilihan: ${pemenang.angka}\n` +
            `hasil: ${hasilDadu}`

          if (winusr) {
            text += `\n\nUang: +${total}`
            text += `\nLevel: +1`

            if (buff > 0 || debuff > 0) text += `${buff > 0 ? `\nBuff: +${buff}%` : ''}${debuff > 0 ? `\nDebuff: -${debuff}%` : ''}`
          }

          await xp.sendMessage(chatId, { text, mentions: [pemenang.sender] })

          delete data.key[chatId][id]
          update = !0
        }
      }

      if (update) fs.writeFileSync(file_tebak_dadu, JSON.stringify(data, null, 2))
    } catch (e) {
      err('error pada timerTebakDadu', e)
      saveErr(e, 'timerTebakDadu')
    }
  }, 1e4)
}

async function tebakdadu(xp, m) {
  try {
    const chat = global.chat(m),
          gcData = get.gc(chat.id),
          data = fs.existsSync(file_tebak_dadu) ? JSON.parse(fs.readFileSync(file_tebak_dadu)) : {},
          txt = chat.msg,
          stanzaId = m.message?.extendedTextMessage?.contextInfo?.stanzaId,
          [action = null, angka = null] = txt?.toLowerCase()?.trim()?.split(/\s+/) || [],
          dadu = Number(angka)

    if (!gcData || !txt) return !1

    if (['nyerah', 'menyerah']?.includes(txt)) {
      const room = data?.key?.[chat.id]

      if (!room || !stanzaId) return !1

      for (const id in room) {
        const game = room[id]

        if (game?.idOn !== stanzaId) continue

        if (!game?.status) return xp.sendMessage(chat.id, { text: 'permainan sudah dimulai, kamu tidak bisa menyerah' }, { quoted: m })

        game.ply ||= []

        if (!game.ply.includes(chat.sender)) return xp.sendMessage(chat.id, { text: 'kamu tidak ikut dalam permainan ini' }, { quoted: m })

        game.ply = game.ply.filter(v => v !== chat.sender)

        for (const angka in game.dadu) {
          if (game.dadu[angka] === chat.sender) delete game.dadu[angka]
        }

        fs.writeFileSync(file_tebak_dadu, JSON.stringify(data, null, 2))

        return xp.sendMessage(chat.id, { text: `@${chat.sender.split('@')[0]} menyerah dan keluar dari permainan`, mentions: [chat.sender] }, { quoted: m })
      }

      return !1
    }

    if (['join', 'ikut', 'gabung'].includes(action)) {
      const room = data?.key?.[chat.id]

      if (!room || !stanzaId) return !1

      if (!angka || (isNaN(dadu) ? !0 : !1) || dadu < 1 || dadu > 6) return xp.sendMessage(chat.id, { text: 'contoh:\nikut 4\njoin 2\ngabung 6' }, { quoted: m })

      for (const id in room) {
        const game = room[id]

        if (!game?.his?.includes(stanzaId)) continue

        for (const id in room) {
          const game = room[id]

          if (!game?.his?.includes(stanzaId)) continue

          if (!game?.status) return xp.sendMessage(chat.id, { text: 'pendaftaran ditutup atau game sudah dimulai, buat game baru' }, { quoted: m })

          if (game.dadu[dadu]) return xp.sendMessage(chat.id, { text: `dadu ${dadu} sudah dipilih pemain lain` }, { quoted: m })

          if (!game.ply.includes(chat.sender)) {
            game.ply.push(chat.sender)
            game.dadu[dadu] = chat.sender
            game.time = Date.now()

            const msg = await xp.sendMessage(chat.id, { text: `@${chat.sender.split('@')[0]} bergabung dalam permainan`, mentions: [chat.sender] }, { quoted: m })

            msg?.key?.id && game.his.push(msg.key.id)
          }

          fs.writeFileSync(file_tebak_dadu, JSON.stringify(data, null, 2))

          return !0
        }

        game.ply ||= []
        game.his ||= []

        if (!game.ply.includes(chat.sender)) {
          game.ply.push(chat.sender)
          game.time = Date.now()

          const msg = await xp.sendMessage(chat.id, { text: `@${chat.sender.split('@')[0]} bergabung dalam permainan`, mentions: [chat.sender] }, { quoted: m })

          msg?.key?.id && game.his.push(msg.key.id)
        }

        fs.writeFileSync(file_tebak_dadu, JSON.stringify(data, null, 2))

        return !0
      }
    }
  } catch (e) {
    console.error('error pada tebakdadu', e)
    saveErr(e, 'tebakdadu')
  }
}

async function autofarm() {
  if (runfarm) return

  runfarm = !0

  while (!0) {
    let dbsv = !1,
        gmsv = !1,
        totalFarm = 0

    try {
      const usrDb = Object.values(db().key),
            dbFarm = gm().key.farm || {}

      for (const usr of usrDb) {
        if (!usr?.game?.farm) continue

        const jid = usr.jid,
              gameDb = Object.values(dbFarm).find(v => v.jid === jid)

        if (!gameDb || (usr?.moneyDb?.moneyInBank ?? 0) > 1e8) continue

        const buff = Object.keys(usr?.game?.buff || {}),
              debuff = Object.keys(usr?.game?.debuff || {}),
              buffTotal = buff.reduce((a, b) => a + Number(b || 0), 0),
              debuffTotal = debuff.reduce((a, b) => a + Number(b || 0), 0),
              timeTotal = debuffTotal - buffTotal,
              moneyTotal = buffTotal - debuffTotal,
              nowTm = global.time.timeIndo('Asia/Jakarta', 'DD-MM-YYYY HH:mm:ss'),
              now = new Date(nowTm.split(' ').reverse().join(' ')),
              lastSet = gameDb?.set || nowTm,
              last = new Date(lastSet.split(' ').reverse().join(' ')),
              diff = now - last,
              timer = sfg.timer + timeTotal

        if (diff < timer) continue

        const exp = gameDb?.exp || 1,
              multiplier = Math.floor(exp / 10) || 1,
              cycle = Math.floor(25 / 2),
              reward = (sfg.cost * multiplier * cycle) + moneyTotal

        gameDb.moneyDb.money += reward

        if (reward <= 0 || gameDb.moneyDb.money <= 0) gameDb.moneyDb.money = 0

        usr.moneyDb.moneyInBank += gameDb.moneyDb.money

        gameDb.moneyDb.money = 0
        gameDb.set = nowTm

        dbsv = !0
        gmsv = !0
        totalFarm++
      }

      if (dbsv) save.db()
      if (gmsv) save.gm()

    } catch (e) {
      err('error pada autofarm', e)
      saveErr(e, 'autofarm')
    }

    await sfg.sleep(sfg.timer)
  }
}

async function sambungkata(xp, m) {
  try {
    const chat = global.chat(m),
          usr = get.db(chat.sender),
          txt = chat.quoted.txt,
          ans = m.message?.extendedTextMessage?.text || m.message?.extendedTextMessage?.conversation,
          data = fs.existsSync(file_sambung_kata) ? JSON.parse(fs.readFileSync(file_sambung_kata)) : {},
          now = Date.now(),
          quoted = m.message?.extendedTextMessage?.contextInfo?.stanzaId

    if (!txt || !usr || !quoted || !ans) return

    let lastKey = null,
        lastGame = null,
        lastPlayerKey = null,
        game = null

    for (const key of Object.keys(data)) {
      const g = data[key]
      if (!g) continue

      const players = Object.keys(g).filter(k => k !== 'reset'),
            lp = players.slice(-1)[0],
            gm = g[lp]

      if (gm && gm.id === quoted) {
        lastKey = key
        lastGame = g
        lastPlayerKey = lp
        game = gm
        break
      }
    }

    if (!game) return fs.writeFileSync(file_sambung_kata, JSON.stringify(data))

    const players = Object.keys(lastGame).filter(k => k !== 'reset'),
          last = players.slice(-1)[0],
          lastTime = lastGame[last]?.time || 0,
          resetTime = lastGame.reset || 0

    if ((now - (lastTime || resetTime)) > 18e4) {
      const lastPlayer = (lastPlayerKey?.split(':')[0] + '@s.whatsapp.net'),
            winusr = get.db(lastPlayer)

      let rewardText = `Waktu habis\nGame sambung kata berakhir`

      if (winusr || !1) {
        const buff = Object.keys(winusr.game?.buff || {}).reduce((a, b) => a + Number(b), 0),
              debuff = Object.keys(winusr.game?.debuff || {}).reduce((a, b) => a + Number(b), 0),
              base = 1e3,
              bonus = Math.floor(base * .12),
              reward = base + bonus

        let total = reward

        total += Math.floor(reward * (buff / 100))
        total -= Math.floor(reward * (debuff / 100))
        total = total < 1 ? 1 : total
        winusr.moneyDb.money += total
        winusr.exp += 1
        rewardText += `\n\nPemenang: @${lastPlayer.split('@')[0]}`
        rewardText += `\nUang: +${total}`
        rewardText += `\nLevel: +1`
        buff > 0 ? rewardText += `\nBuff: +${buff}%` : ''
        debuff > 0 ? rewardText += `\nDebuff: -${debuff}%` : ''
      }

      delete data[lastKey]
      fs.writeFileSync(file_sambung_kata, JSON.stringify(data))

      save.db()

      return xp.sendMessage(chat.id, { text: rewardText, mentions: winusr ? [lastPlayer] : [] }, { quoted: m })
    }

    const sender = chat.sender.split('@')[0],
          lastSender = lastPlayerKey.split(':')[0]

    if (lastSender === sender || !1) return xp.sendMessage(chat.id, { text: 'Kamu sudah menjawab, tunggu yang lain' }, { quoted: m })

    const answer = ans.trim().toLowerCase(),
          first = answer[0],
          val = game.val,
          isUsed = Object.values(lastGame).some(v => typeof v === 'object' && v.ans === answer)

    if (isUsed || first !== val) return xp.sendMessage(chat.id, { text: isUsed ? `Kata *${answer}* sudah digunakan\nGunakan kata lain` : `Salah\nHarus diawali huruf ${val}` }, { quoted: m })

    const lastChar = ans.slice(-1),
          res = await xp.sendMessage(chat.id, { text: `Benar\nKata: ${ans}\nLanjut huruf: ${lastChar}` }, { quoted: m }),
          botId = res.key.id

    let newKey = sender,
        count = 0

    while (lastGame[newKey]) {
      count++
      newKey = `${sender}:${count}`
    }

    lastGame[newKey] = {
      id: botId,
      ans: answer,
      key: txt,
      val: lastChar,
      time: +new Date
    }

    lastGame.reset = Date.now()

    data[lastKey] = lastGame
    fs.writeFileSync(file_sambung_kata, JSON.stringify(data))
  } catch (e) {
    err('error pada sambungkata', e)
    saveErr(e, 'sambungkata')
  }
}

async function tebakkata(xp, m) {
  try {
    const chat = global.chat(m),
          usr = get.db(chat.sender),
          q = m.message?.extendedTextMessage?.contextInfo,
          jawaban = m.message?.conversation || m.message?.extendedTextMessage?.text,
          idBot = xp.user?.id?.split(':')[0] + '@s.whatsapp.net'

    if (!usr || !q?.stanzaId || !jawaban || q.participant !== idBot) return

    let history = await fs.promises.readFile(file_tebak_kata, 'utf8').then(v => v ? JSON.parse(v) : { key:{} }).catch(() => ({ key:{} }))

    const uh = history.key?.[chat.sender],
          data = uh?.[q.stanzaId]

    if (!data?.status || data.no !== usr.noId) return

    const jawab = jawaban.trim().toLowerCase(),
          benar = data.key.toLowerCase()

    data.chance = jawab === benar ? data.chance : (data.chance ?? 1) - 1

    if (jawab !== benar)
      return data.chance <= 0
        ? (
            data.status = !1,
            await fs.promises.writeFile(file_tebak_kata, JSON.stringify(history)),
            xp.sendMessage(chat.id, { text:`Kesempatan habis!\nJawaban benar: *${data.key}*` }, { quoted:m })
          )
        : (
            await fs.promises.writeFile(file_tebak_kata, JSON.stringify(history)),
            xp.sendMessage(chat.id, { text:`Jawaban salah!\nChance tersisa: ${data.chance}` }, { quoted: m })
          )

    const lvl = Math.floor((usr.exp || 0) / 1e2) || 1,
          reward = 1e3 * lvl,
          buff = Object.keys(usr.game?.buff || {}).reduce((a, b) => a + Number(b), 0),
          debuff = Object.keys(usr.game?.debuff || {}).reduce((a, b) => a + Number(b), 0)

    let finalReward = reward
    finalReward += Math.floor(reward * (buff / 100))
    finalReward -= Math.floor(reward * (debuff / 100))
    finalReward = Math.max(1, finalReward)
    usr.moneyDb.moneyInBank = Number(usr.moneyDb.moneyInBank || 0) + finalReward
    data.status = !1

    await fs.promises.writeFile(file_tebak_kata, JSON.stringify(history))
    save.db()

    return xp.sendMessage(chat.id, { text:`Jawaban benar!\nHadiah: Rp ${reward.toLocaleString('id-ID')}` }, { quoted:m })
  } catch (e) {
    err('error pada tebakkata', e)
    saveErr(e, 'tebakkata')
  }
}

async function tebakGambar(xp, m) {
  try {
    const chat = global.chat(m),
          usr = get.db(chat.sender),
          q = m.message?.extendedTextMessage?.contextInfo,
          jawaban = m.message?.conversation || m.message?.extendedTextMessage?.text,
          idBot = xp.user?.id?.split(':')[0] + '@s.whatsapp.net'

    if (!usr || !q?.stanzaId || !jawaban || q.participant !== idBot) return

    let history = await fs.promises.readFile(file_tebak_gambar, 'utf8').then(v => v ? JSON.parse(v) : { key:{} }).catch(() => ({ key:{} }))

    const uh = history.key?.[chat.sender],
          data = uh?.[q.stanzaId]

    if (!data?.status || data.no !== usr.noId) return

    const jawab = jawaban.trim().toLowerCase(),
          benar = data.key.toLowerCase()

    data.chance = jawab === benar ? data.chance : (data.chance ?? 1) - 1

    if (jawab !== benar)
      return data.chance <= 0 ? (
            data.status = !1,
            await fs.promises.writeFile(file_tebak_gambar, JSON.stringify(history)),
            xp.sendMessage(chat.id, { text: `Kesempatan habis!\nJawaban benar: *${data.key}*` }, { quoted:m }),
            await xp.sendMessage(data.chat, {
              delete: {
                remoteJid: data.chat,
                fromMe: true,
                id: data.id
              }
            })
          ) : (
            await fs.promises.writeFile(file_tebak_gambar, JSON.stringify(history)),
            xp.sendMessage(chat.id, { text: `Jawaban salah!\nChance tersisa: ${data.chance}` }, { quoted:m })
          )

    const lvl = Math.floor((usr.exp || 0) / 1e2) || 1,
          reward = 1e3 * lvl,
          buff = Object.keys(usr.game?.buff || {}).reduce((a, b) => a + Number(b), 0),
          debuff = Object.keys(usr.game?.debuff || {}).reduce((a, b) => a + Number(b), 0)

    let finalReward = reward
    finalReward += Math.floor(reward * (buff / 100))
    finalReward -= Math.floor(reward * (debuff / 100))
    finalReward = Math.max(1, finalReward)
    usr.moneyDb.moneyInBank = Number(usr.moneyDb.moneyInBank || 0) + finalReward
    data.status = !1

    await fs.promises.writeFile(file_tebak_gambar, JSON.stringify(history))
    save.db()

    await xp.sendMessage(data.chat, {
      delete: {
        remoteJid: data.chat,
        fromMe: true,
        id: data.id
      }
    })

    return xp.sendMessage(chat.id, { text: `Jawaban benar!\nHadiah: Rp ${finalReward.toLocaleString('id-ID')}` }, { quoted:m })
  } catch (e) {
    err('error pada tebakGambar', e)
    saveErr(e, 'tebakGambar')
  }
}

function timerhistory(xp) {
  try {
    if (runTimerHistory) return

    runTimerHistory = !0

    setInterval(async () => {
      try {
        thTick++

        if (!thCache || thTick % 8 === 0) {
          const txt = await fs.promises.readFile(file, 'utf8').catch(() => '')
          thCache = txt ? JSON.parse(txt) : { key: {} }
        }

        const history = thCache,
              now = Date.now()
        let changed = !1

        history.key ??= {}

        for (const sender in history.key) {
          const rooms = history.key[sender]

          for (const id in rooms) {
            const d = rooms[id]

            if (!d?.status) d.status = d.status

            if (d?.status) {
              now - d.set < th.timer ? d.status = d.status : (
                    d.status = !1,
                    changed = !0,
                    await xp.sendMessage(d.chat, {
                        text: `@${sender.split('@')[0]} waktu habis!\njawaban yang bener: ${d.key}\nuntuk soal: ${d.soal}`,
                        mentions: [sender]
                      }).catch(() => !1)
                  )
            }
          }
        }

        if (changed) await fs.promises.writeFile(file, JSON.stringify(history))
      } catch {
        !1
      }
    }, 1.5e4)
  } catch (e) {
    err('error pada timerhistory', e)
    saveErr(e, 'timerhistory')
  }
}

export { tmdead, autofarm, timerTebakDadu, sambungkata, tebakdadu, tebakGambar, tebakkata, timerhistory, cost_robbery }