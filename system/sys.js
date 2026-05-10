import c from 'chalk'
import fs from 'fs'
import moment from 'moment-timezone'
import { db } from './db/data.js'
import { getMetadata } from './function.js'

const time = {
  timeIndo: (zone = "Asia/Jakarta", fmt = "HH:mm:ss DD-MM-YYYY") => moment().tz(zone).format(fmt)
}

const chat = (m, xp, botName = "pengguna") => {
  const id = m?.key?.remoteJidAlt || m?.key?.remoteJid || "",
        group = id.endsWith("@g.us"),
        channel = id.endsWith("@newsletter"),
        sender = m?.key?.participantAlt || m?.key?.stub?.pn || m?.participant?.replace(/:\d+(?=@)/, '') || m?.key?.participant || id,

        pushName = (sender === (xp?.user?.id?.split(':')[0] + '@s.whatsapp.net') && xp?.user?.name ? xp?.user?.name : (m?.verifiedBizName || m?.pushName || sender.replace(/@s\.whatsapp\.net$/, "")))?.trim() || (sender.endsWith("@s.whatsapp.net") ? sender.replace(/@s\.whatsapp\.net$/, "") : botName),

        ctx = m?.message?.extendedTextMessage?.contextInfo,
        mj = ctx?.mentionedJid,
        pt = ctx?.participant?.replace(/:\d+(?=@)/, ''),

        quoted = {
          id: (Array.isArray(mj) || mj
              ? (Array.isArray(mj) ? mj : [mj])
              : (pt || !1 ? [pt] : [])),
          txt: ctx?.quotedMessage?.conversation
            || ctx?.quotedMessage?.text
            || null
        }

  if (!id) return null

  return { id, group, channel, sender, pushName, quoted }
}

export const banned = chat => {
  const sender = chat.sender,
        usr = Object.keys(db()?.key || {}),
        users = usr.map(k => db().key[k]),
        found = users.find(u => u?.jid === sender);

  let userData = found;

  if (!userData) {
    const clean = sender.replace(/\D/g, ''),
          fallback = users.find(u => u?.jid?.replace(/\D/g, '').endsWith(clean));
    if (fallback) userData = fallback;
  }

  return userData?.ban === !0;
};

export const bangc = chat => {
  const user = chat.sender,
        target = user.replace(/\D/g, ''),
        owner = (global.ownerNumber || []).map(v => v.replace(/\D/g, '')),
        ban = !owner.includes(target) && !!get.gc(chat.id)?.ban;

  return ban ? (log(c.redBright.bold(`Grup ${chat.id} diban`)), !0) : !1;
};

const grupify = async (xp, m) => {
  const cht = chat(m)
  if (!cht) return

  const meta = groupCache.get(cht.id) || await getMetadata(cht.id, xp)
  if (!meta) return

  const bot = `${xp.user?.id?.split(':')[0]}@s.whatsapp.net`,
        adm = (meta.participants || [])
          .filter(p => p.admin && p.phoneNumber !== bot)
          .map(p => p.phoneNumber),
        botAdm = (meta.participants || [])
          .some(p => p.admin && p.phoneNumber === bot),
        usrAdm = adm.includes(cht.sender)

  return {
    meta,
    bot,
    botAdm,
    usrAdm,
    adm
  }
}

export const txtWlc = async (xp, id) => {
  try {
    const gcData = get.gc(id),
          meta = groupCache.get(id) || await getMetadata(id, xp),
          txt = gcData?.filter?.welcome?.welcomeText?.trim()
                || `selamat datang @user digrup ${meta?.subject || id}`;

    return { txt };
  } catch (e) {
    console.error('txtWlc error:', e)
  }
}

export const txtLft = async (xp, id) => {
  try {
    const gcData = get.gc(id),
          meta = groupCache.get(id) || await getMetadata(id, xp),
          txt = gcData?.filter?.left?.leftText?.trim() || `%user keluar dari grup ${meta?.subject || id}`

    return { txt }
  } catch (e) {
    console.error('txtLft error', e)
  }
}

export const mode = async (xp, chat) => {
  if (!chat) return !1

  const cfg = JSON.parse(fs.readFileSync('./system/set/config.json', 'utf-8')),
        isGc = cfg.botSetting?.isGroup,
        ownerList = cfg.ownerSetting?.ownerNumber || [],
        sender = chat.sender?.replace(/@s\.whatsapp\.net$/, '')

  if (ownerList.includes(sender)) return !0

  return chat.group === isGc
}

export const loadCht = (msgTime) => {
  const ts = typeof msgTime === 'object'
        ? (msgTime?.low ?? msgTime)
        : msgTime,

        now = new Date(),
        jkt = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Jakarta' })),
        msg = new Date(ts * 1e3),
        msgJkt = new Date(msg.toLocaleString('en-US', { timeZone: 'Asia/Jakarta' })),
        y = jkt.getFullYear() === msgJkt.getFullYear(),
        m = jkt.getMonth() === msgJkt.getMonth(),
        d = jkt.getDate() === msgJkt.getDate(),
        h = jkt.getHours() === msgJkt.getHours(),
        min = jkt.getMinutes() === msgJkt.getMinutes()

  return (y && m && d && h && min) ? !0 : !1
}

const sys = {
  time,
  chat,
  grupify
}

export default sys;