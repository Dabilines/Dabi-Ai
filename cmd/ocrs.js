import { ev } from './handle.js'
import getMessageContent from '../system/msg.js'

const getSetList = () => {
  try {
    return (ev.cmd || [])
      .filter(d => typeof d.run === 'function' && Array.isArray(d.ocrs) && d.ocrs.length)
      .flatMap(d => d.cmd || [])
  } catch {
    return []
  }
}

async function ocrs(xp, m) {
  try {
    const { text } = getMessageContent(m),
          chat = global.chat(m),
          pfx = [].concat(global.prefix),
          pre = pfx.find(p => text.startsWith(p)) || '',
          raw = pre ? text.slice(pre.length).trim() : text.trim(),
          [base, target, ...rest] = raw.split(/\s+/)

    if (!base || base.toLowerCase() !== 'set') return !1

    const listMenu = () => {
      const list = getSetList()
        .map(x => `${pre}set ${x.toLowerCase()}`)
        .sort()
        .join('\n') || '-'

      return xp.sendMessage(chat.id, { text: `list menu set:\n${list}` }, { quoted: m })
    }

    if (!pre || !target) return !pre ? null : listMenu()

    const realCmd = target.toLowerCase()

    if (!ev.listenerCount(realCmd)) return listMenu()

    const def = (ev.cmd || []).find(d =>
            Array.isArray(d.cmd) &&
            d.cmd.map(c => c.toLowerCase()).includes(realCmd)
          ),
          valid = Array.isArray(def?.ocrs) ? def.ocrs.map(v => v.toLowerCase()) : null

    if (!valid) return !1

    const action = (rest[0] || '').toLowerCase(),
          ocrsAction = valid.includes(action) ? action : 'set',
          args0 = valid.includes(action) ? rest.slice(1) : rest,
          quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage?.conversation || '',
          args = args0.length ? args0 : quoted ? [quoted] : []

    const newText = `${pre}${realCmd} ${ocrsAction} ${args.join(' ')}`.trim()

    ev.emit(realCmd, xp, m, {
      args,
      chat,
      text: newText,
      cmd: realCmd,
      prefix: pre,
      ocrs: ocrsAction
    })

    return !0
  } catch {
    return !0
  }
}

export { ocrs }