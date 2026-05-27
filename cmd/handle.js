import c from "chalk"
import fs from "fs"
import p from "path"
import EventEmitter from "events"
import { getMessageContent } from '../system/msg.js'
import { role } from '../system/db/data.js'
import { own } from '../system/helper.js'
import { cekSpam, _tax } from '../system/function.js'
import { ocrs } from './ocrs.js'
import { pathToFileURL } from "url"

const dir = p.join(dirname, "../cmd/command")

const _idCmd = def => {
  const fl = def.file || 'unknown',
        name = (def.name || 'noname')
          .toLowerCase()
          .trim()
          .split(/\s+/)
          .join('+'),
        cmds = []
          .concat(def.cmd || [])
          .map(x => x.toLowerCase())
          .sort()
          .join('+')

  return `file=${fl}&name=${name}&cmd=${cmds}`
}

class CmdEmitter extends EventEmitter {
  on(def, listener) {
    if (typeof def !== "object" || !def.cmd || !def.run)
      return super.on(def, listener)

    def.name && (this.pluginName = def.name)

    const cmds = Array.isArray(def.cmd) ? def.cmd : [def.cmd]

    def.file ??= global.lastCmdUpdate?.file
    def.call ??= 0
    def.set ??= Date.now()
    def.id ??= _idCmd(def)
    def.handlers ??= new Map()

    for (const c2 of cmds) {
      const lc = c2.toLowerCase()

      const handler = async (xp, m, extra) => {
        try {
          if (def.owner && !own(m)) return
          def.call += 1
          await def.run(xp, m, extra)
        } catch (e) {
          err(c.redBright.bold(`Error ${def.name || c2}: `), e)
        }
      }

      super.on(lc, handler)
      def.handlers.set(lc, handler)
    }

    ;(this.cmd ??= []).push(def)
  }
}

const ev = new CmdEmitter()

const unloadFile = file => {
  if (!file || !ev.cmd) return

  const targets = ev.cmd.filter(x => x.file === file)
  if (!targets.length) return

  for (const t of targets) {
    if (t.handlers?.size) {
      for (const [cmd, fn] of t.handlers)
        ev.removeListener(cmd, fn)
    }
  }

  ev.cmd = ev.cmd.filter(x => x.file !== file)
}

const loadFile = async (f, reload = !0) => {
  try {
    const fp = p.join(dir, f),
          oldMap = new Map(
            (ev.cmd ?? [])
              .filter(x => x.file === f)
              .map(x => [x.id, x])
          ),
          originalOn = ev.on.bind(ev)

    reload ? unloadFile(f) : null

    ev.on = def => {
      if (typeof def !== 'object' || !def.cmd)
        return originalOn(def)

      def.file ??= f
      def.id ??= _idCmd(def)

      const cmds = Array.isArray(def.cmd) ? def.cmd : [def.cmd],
            id = def.id,
            old = oldMap.get(id)

      if (old) {
        const runSame = old.run === def.run,
              configSame =
                old.owner === def.owner &&
                old.prefix === def.prefix &&
                old.money === def.money &&
                old.exp === def.exp,
              same = runSame && configSame

        if (same) return

        if (old.handlers?.size) {
          for (const [cmd, fn] of old.handlers)
            ev.removeListener(cmd, fn)
        }

        ev.cmd = ev.cmd.filter(x => x !== old)
      }

      def.set = Date.now()

      global.lastCmdUpdate = {
        name: cmds[0],
        file: f,
        time: Date.now()
      }

      originalOn(def)
    }

    const mod = await import(
      pathToFileURL(fp).href + `?update=${Date.now()}`
    )

    const plugin = mod.default || mod

    typeof plugin === 'function'
      ? plugin(ev)
      : null

    ev.on = originalOn

  } catch (e) {
    log('file error', f)
    log('detail error:', e)
  }
}

const loadAll = async () => {
  const files = fs.readdirSync(dir).filter(x => x.endsWith(".js"))
  for (const f of files) await loadFile(f, !0)
  const total = ev.cmd ? ev.cmd.length : 0
  log(c.greenBright.bgGrey.bold(`Berhasil memuat ${total} cmd`))
}

const watch = () => {
  const Deb_timer = {}
  try {
    fs.watch(dir, (_, f) => {
      if (!f?.endsWith(".js")) return
      clearTimeout(Deb_timer[f])
      Deb_timer[f] = setTimeout(() => {
        log(c.cyanBright.bold(`${f} diedit`))
        loadFile(f, !0)
      }, 3e2)
    })
  } catch {
    for (const f of fs.readdirSync(dir).filter(x => x.endsWith(".js"))) {
      fs.watchFile(p.join(dir, f), () => {
        log(c.cyanBright.bold(`${f} diedit`))
        loadFile(f, !0)
      })
    }
  }
}

const handleCmd = async (m, xp, store) => {
  try {
    const { text } = getMessageContent(m)
    if (!text || !m.key) return

    const bank = JSON.parse(fs.readFileSync(p.join(dirname, './db/bank.json'), 'utf-8')),
          pfx = [].concat(global.prefix),
          pre = pfx.find(v => text.startsWith(v)) || '',
          cmdText = pre ? text.slice(pre.length).trim() : text.trim(),
          [cmd, ...args] = cmdText.split(/\s+/),
          _cmdLow = cmd?.toLowerCase()

    if (!_cmdLow || await ocrs(xp, m)) return

    const chat = global.chat(m),
          sender = chat.sender?.replace(/@s\.whatsapp\.net$/, ''),
          usr = get.db(chat.sender),
          evData = ev.cmd?.find(v =>
            v.name?.toLowerCase() === _cmdLow ||
            v.cmd?.some(c => c.toLowerCase() === _cmdLow)
          )

    if (!evData || (evData.prefix ?? !0 ? !pre : pre)) return

    let sub = null

    if (evData.ocrs?.length && args[0]) {
      const check = args[0].toLowerCase()

      if (evData.ocrs.includes(check)) {
        sub = check
        args.shift()
      }
    }

    if (!usr ? (xp.sendMessage(chat.id, { text: 'ulangi' }, { quoted: m }), !0) : !usr?.prem?.status && await cekSpam(xp, m)) return

    let exp = evData.exp ?? 0.1,
        needSv = !1,
        cost = evData.money,
        expInt

    if (usr?.prem?.status === !0) exp += 0.5

    expInt = Math.round(exp * 10)

    if (usr) {
      usr.cmd = (usr.cmd || 0) + 1
      usr.exp = (usr.exp || 0) + expInt

      role()
      needSv = !0
    }

    if (usr?.prem?.status === !0 ? (cost = 0, !1) : !cost || cost <= 0) cost = await _tax(xp, m)

    if (cost > 0) {
      if ((usr.moneyDb?.money || 0) < cost) return xp.sendMessage(chat.id, { text: `uang kamu tersisa Rp ${usr.moneyDb.money.toLocaleString('id-ID')}\n` + `butuh: Rp ${cost.toLocaleString('id-ID')}` }, { quoted: m })

      usr.moneyDb.money -= cost
      bank.key.saldo += cost

      fs.writeFileSync(
        p.join(dirname, './db/bank.json'),
        JSON.stringify(bank, null, 2),
        'utf-8'
      )

      needSv = !0
    }

    if (needSv) await save.db()

    ev.emit(_cmdLow, xp, m, {
      args,
      chat,
      text,
      cmd: _cmdLow,
      prefix: pre,
      ocrs: sub,
      store
    })
  } catch (e) {
    err('error pada handleCmd', e)
  }
}

watch()
export { handleCmd, loadAll, ev }