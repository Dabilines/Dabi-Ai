import fs from 'fs'
import path from 'path'

const sfg = {
  timer: 24 * 60 * 60 * 1000,
  cost: 1000,
  sleep: ms => new Promise(r => setTimeout(r, ms))
}

const th = { timer: 120000 }

const file = path.join(dirname, '../temp/history_tebak_kata.json')

let runTimerHistory = !1,
    runfarm = !1,
    thCache = null,
    thTick  = 0,
    runRobberyCost = !1,
    rundeath = !1

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
              last = Number(dead?.start) || 0,
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
    }
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

        const nowTm = global.time.timeIndo("Asia/Jakarta", "DD-MM-YYYY HH:mm:ss"),
              now = new Date(nowTm.split(' ').reverse().join(' ')),
              lastSet = gameDb?.set || nowTm,
              last = new Date(lastSet.split(' ').reverse().join(' ')),
              diff = now - last

        if (diff < sfg.timer) continue

        const exp = gameDb?.exp || 1,
              multiplier = Math.floor(exp / 10) || 1,
              cycle = Math.floor(25 / 2),
              reward = sfg.cost * multiplier * cycle

        gameDb.moneyDb.money += reward
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
    }

    await sfg.sleep(sfg.timer)
  }
}

async function sambungkata(xp, m) {
  const chat = global.chat(m),
        usr = get.db(chat.sender),
        txt = chat.quoted.txt,
        file = path.join(dirname, '../temp/sambungkata_hystory.json'),
        data = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file)) : {},
        now = Date.now(),
        quoted = m.message?.extendedTextMessage?.contextInfo?.stanzaId

  if (!txt || !usr) return
  if (!quoted) return

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

  if (!game) return fs.writeFileSync(file, JSON.stringify(data))

  const players = Object.keys(lastGame).filter(k => k !== 'reset'),
        last = players.slice(-1)[0],
        lastTime = lastGame[last]?.time || 0,
        resetTime = lastGame.reset || 0

  if ((now - (lastTime || resetTime)) > 18e4) {
    const lastPlayer = (lastPlayerKey?.split(':')[0] + '@s.whatsapp.net'),
          winusr = get.db(lastPlayer)

    let rewardText = `Waktu habis\nGame sambung kata berakhir`

    if (winusr || !1) {
      const base = 1e3,
            bonus = Math.floor(base * .12),
            total = base + bonus

      winusr.moneyDb.money += total
      winusr.exp += 1

      rewardText += `\n\nPemenang: @${lastPlayer.split('@')[0]}`
      rewardText += `\nUang: +${total}`
      rewardText += `\nLevel: +1`
    }

    delete data[lastKey]
    fs.writeFileSync(file, JSON.stringify(data))

    return xp.sendMessage(chat.id, {
      text: rewardText,
      mentions: winusr ? [lastPlayer] : []
    }, { quoted: m })
  }

  const first = txt[0],
        val = game.val,
        isUsed = Object.values(lastGame).some(v => typeof v === 'object' && v.key === txt)

  if (isUsed || !1) {
    return xp.sendMessage(chat.id, { text: `Kata *${txt}* sudah digunakan\nGunakan kata lain` }, { quoted: m })
  }

  if (first !== val || !1) {
    return xp.sendMessage(chat.id, { text: `Salah\nHarus diawali huruf ${val}` }, { quoted: m })
  }

  const sender = chat.sender.split('@')[0],
        lastSender = lastPlayerKey.split(':')[0]

  if (lastSender === sender || !1) {
    return xp.sendMessage(chat.id, { text: `Kamu sudah menjawab, tunggu yang lain` }, { quoted: m })
  }

  const lastChar = txt.slice(-1)

  const res = await xp.sendMessage(chat.id, { text: `Benar\nKata: ${txt}\nLanjut huruf: ${lastChar}` }, { quoted: m })

  const botId = res.key.id

  let newKey = sender,
      count = 0

  while (lastGame[newKey]) {
    count++
    newKey = `${sender}:${count}`
  }

  lastGame[newKey] = {
    id: botId,
    key: txt,
    val: lastChar,
    time: +new Date
  }

  lastGame.reset = Date.now()

  data[lastKey] = lastGame
  fs.writeFileSync(file, JSON.stringify(data))
}

async function tebakkata(xp, m) {
  const chat = global.chat(m),
        usr = get.db(chat.sender),
        q = m.message?.extendedTextMessage?.contextInfo,
        jawaban = m.message?.conversation || m.message?.extendedTextMessage?.text,
        idBot = xp.user?.id?.split(':')[0] + '@s.whatsapp.net'

  if (!usr || !q?.stanzaId || !jawaban || q.participant !== idBot) return

  let history = await fs.promises.readFile(file, 'utf8')
    .then(v => v ? JSON.parse(v) : { key:{} })
    .catch(() => ({ key:{} }))

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
          await fs.promises.writeFile(file, JSON.stringify(history)),
          xp.sendMessage(chat.id, { text:`Kesempatan habis!\nJawaban benar: *${data.key}*` }, { quoted:m })
        )
      : (
          await fs.promises.writeFile(file, JSON.stringify(history)),
          xp.sendMessage(chat.id, { text:`Jawaban salah!\nChance tersisa: ${data.chance}` }, { quoted:m })
        )

  const lvl = Math.floor((usr.exp || 0) / 1e2) || 1,
        reward = 1e3 * lvl

  usr.moneyDb.moneyInBank += reward
  data.status = !1

  await fs.promises.writeFile(file, JSON.stringify(history))
  save.db()

  return xp.sendMessage(chat.id, { text:`Jawaban benar!\nHadiah: Rp ${reward.toLocaleString('id-ID')}` }, { quoted:m })
}

function timerhistory(xp) {
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
            now - d.set < th.timer
              ? d.status = d.status
              : (
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

      if (changed)
        await fs.promises.writeFile(file, JSON.stringify(history))

    } catch {
      !1
    }
  }, 1.5e4)
}


export { tmdead, autofarm, sambungkata, tebakkata, timerhistory, cost_robbery }