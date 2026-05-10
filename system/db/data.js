import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url),
      dirname = path.dirname(__filename),
      database = path.join(dirname, 'database.json'),
      dataGc = path.join(dirname, 'datagc.json'),
      datagame = path.join(dirname, 'datagame.json'),
      bankdb = path.join(dirname, 'bank.json')

let saving = Promise.resolve(),
    dirty = { db: !1, gm: !1, gc: !1 },
    init = (() => {
      const load = (file, def = { key: {} }) => {
        if (!fs.existsSync(file))
          return fs.writeFileSync(file, JSON.stringify(def, null, 2)), def

        try {
          const data = JSON.parse(fs.readFileSync(file))
          return data ? data : (fs.writeFileSync(file, JSON.stringify(def, null, 2)), def)
        } catch {
          fs.existsSync(file) && fs.writeFileSync(file + '.bak', fs.readFileSync(file))
          fs.writeFileSync(file, JSON.stringify(def, null, 2))
          return def
        }
      }

      const inBank = () => load(bankdb, { key: { saldo: 0, tax: '12%' } }),
            gm = () => load(datagame, { key: { farm: {} } })

      return {
        db: load(database),
        gc: load(dataGc),
        gm: gm(),
        bnk: inBank()
      }
    })()

const db = () => init.db,
      gc = () => init.gc,
      gm = () => init.gm,
      bnk = () => init.bnk

const usr = new Map(),
      grup = new Map()

for (const u of Object.values(init.db.key)) usr.set(u.jid, u)
for (const g of Object.values(init.gc.key || {})) grup.set(String(g.id), g)

const get = {
  db: jid => usr.get(jid) || null,
  gc: id => grup.get(String(id)) || null
}

const addUser = (key, user) => (
        db().key[key] = user,
        usr.set(user.jid, user),
        save.db()
      ),
      addGc = (key, data) => (
        gc().key[key] = data,
        grup.set(String(data.id), data)
      ),
      delUser = jid => {
        const key = Object.keys(db().key).find(k => db().key[k]?.jid === jid)
        if (!key) return
        delete db().key[key],
        usr.delete(jid),
        save.db()
      },
      delGc = id => {
        const key = Object.keys(gc().key).find(k => String(gc().key[k]?.id) === String(id))
        if (!key) return

        delete gc().key[key]
        grup.delete(String(id))
        save.gc()
      },
      existsUser = jid => usr.has(jid)

const writeSafe = async (file, data) => {
        if (fs.existsSync(file)) fs.copyFileSync(file, file + '.bak')
        await fs.promises.writeFile(file, JSON.stringify(data))
      },
      flushSave = () => (
        saving = saving.then(async () => {
          if (dirty.db || dirty.gm || dirty.gc) {
            dirty.db && await writeSafe(database, init.db)
            dirty.gm && await writeSafe(datagame, init.gm)
            dirty.gc && await writeSafe(dataGc, init.gc)
            dirty.db = dirty.gm = dirty.gc = !1
          }
        }),
        saving
      ),
      save = {
        db: () => dirty.db = !0,
        gm: () => dirty.gm = !0,
        gc: () => dirty.gc = !0
      }

setInterval(() => flushSave(), 18e4)

const listRole = [
  'Gak Kenal',
  'Baru Kenal',
  'Temen Biasa',
  'Temen Ngobrol',
  'Temen Gosip',
  'Temen Lama',
  'Temen Hangout',
  'Temen Dekat',
  'Temen Akrab',
  'Temen Baik',
  'Sahabat',
  'Pacar',
  'Soulmate'
]

const role = jid => {
  const user = get.db(jid)
  if (!user?.ai) return

  const exp = user.exp || 0,
        maxExp = 2e3,
        len = listRole.length,
        step = maxExp / len,
        idx = Math.min(len - 1, Math.floor(exp / step)),
        newRole = listRole[idx]

  user.ai.role !== newRole && (user.ai.role = newRole, !0)
}

const randomId = m => {
  const chat = global.chat(m),
        letters = 'abcdefghijklmnopqrstuvwxyz',
        pick = s => Array.from({ length: 5 }, () => s[Math.floor(Math.random() * s.length)]),
        jid = chat.sender?.replace(/@s\.whatsapp\.net$/, ''),
        base = [...pick(letters), ...jid.slice(-4)]

  for (let i = base.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[base[i], base[j]] = [base[j], base[i]]
  }

  return base.join('')
}

const authUser = async m => {
  try {
    const chat = global.chat(m),
          time = global.time.timeIndo("Asia/Jakarta", "DD-MM-YYYY")

    if (!chat.sender?.endsWith('@s.whatsapp.net') || existsUser(chat.sender)) return

    const nama = chat.pushName?.trim().slice(0, 20)
    let k = nama, i = 1
    while (db().key[k]) k = `${nama}_${i++}`

    addUser(k, {
      jid: chat.sender,
      noId: randomId(m),
      acc: time,
      ban: !1,
      cmd: 0,
      exp: 0,
      moneyDb: { money: 2e5, moneyInBank: 0 },
      ai: { bell: !1, chat: 0, role: listRole[0] },
      afk: { status: !1, reason: '', afkStart: '' },
      game: {
        farm: !1,
        dead: { status: !1, start: 0 },
        kill: { status: !1, target: 0 },
        robbery: { cost: 3 },
        buff: {},
        debuff: {}
      }
    })
  } catch (e) {
    console.error('error pada authUser', e)
  }
}

const authFarm = async m => {
  try {
    const chat = global.chat(m),
          userDb = get.db(chat.sender),
          gameDb = Object.values(gm().key.farm).find(u => u.jid === chat.sender),
          time = global.time.timeIndo("Asia/Jakarta", "DD-MM-YYYY HH:mm:ss"),
          nama = chat.pushName?.trim().slice(0, 20),
          costMny = (userDb?.moneyDb?.money ?? 0) + (userDb?.moneyDb?.moneyInBank ?? 0)

    if (!chat.sender?.endsWith('@s.whatsapp.net') || gameDb) return

    let k = nama, i = 1
    while (gm().key.farm[k]) k = `${nama}_${i++}`

    gm().key.farm[k] = {
      jid: chat.sender,
      set: time,
      exp: userDb?.exp || 0,
      moneyDb: { money: costMny }
    }

    save.gm()
  } catch (e) {
    console.error('error pada authFarm', e)
  }
}

const dbPath = './system/db/dbsider.json',
      loadDB = () => {
        try {
          return fs.existsSync(dbPath)
            ? JSON.parse(fs.readFileSync(dbPath))
            : {}
        } catch {
          return {}
        }
      },
      saveDB = data =>
        fs.writeFileSync(dbPath, JSON.stringify(data, null, 2)),
      dbsider = loadDB(),
      addChatCount = (m, xp) => {
        const { key, message } = m,
              gid = key?.remoteJid,
              rawUid = key?.participant || key?.remoteJid,
              uid = rawUid?.endsWith('@lid')
                ? (key?.participantAlt || m?.participant || rawUid)
                : rawUid,
              botId = xp?.user?.id?.split(':')[0] + '@s.whatsapp.net',
              isSwTag = m.message?.groupStatusMentionMessage

        if (!message || !gid || !gid.endsWith('@g.us') || uid.endsWith('@g.us') || uid === botId || isSwTag) return

        dbsider[gid] ||= {}
        dbsider[gid][uid] = (dbsider[gid][uid] || 0) + 1
      }

setInterval(() => saveDB(dbsider), 18e4)

export {
  init,
  get,
  db,
  addGc,
  gm,
  bnk,
  authFarm,
  save,
  role,
  randomId,
  authUser,
  addUser,
  delUser,
  dbsider,
  addChatCount
}