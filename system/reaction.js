import fetch from 'node-fetch'
import { vn } from '../cmd/interactive.js'

async function rct_key(xp, m) {
  try {
    const react = m.message?.reactionMessage,
          emoji = react?.text,
          keyId = react?.key?.id

    if (!emoji || !keyId) return !1

    const target = xp.reactionCache.get(keyId)
    if (!target) return !1

    const chat   = global.chat(m),
          botNum = `${xp.user.id.split(':')[0]}@s.whatsapp.net`,
          fromBot = target.key.participant === botNum || target.key.fromMe

    if (chat.group) {
      const { botAdm, usrAdm } = await grupify(xp, m)
      if (!fromBot && (!usrAdm || !botAdm)) return !1
    }

    switch (emoji) {
      case '❌':
        await xp.sendMessage(chat.id, {
          delete: {
            remoteJid: chat.id,
            fromMe: fromBot,
            id: target.key.id,
            ...(fromBot ? {} : { participant: target.key.participant })
          }
        })
        xp.reactionCache.delete(keyId)
        return !0

      case '👑':
        if (!chat.group) return !1
        await xp.groupParticipantsUpdate(
          chat.id,
          [target.key.participant],
          'promote'
        )
        return !0

      case '🦵':
        if (!chat.group) return !1
        await xp.groupParticipantsUpdate(
          chat.id,
          [target.key.participant],
          'remove'
        )
        return !0

      case '💨':
        if (!chat.group) return !1
        await xp.groupParticipantsUpdate(
          chat.id,
          [target.key.participant],
          'demote'
        )
        return !0

      case '🎤':
        const voice = 'dabi',
              pitch = 0,
              speed = 0.9,
              msg = target.message || {},
              text =
                msg?.conversation ||
                msg?.extendedTextMessage?.text

        if (!text) return !1

        const res = await fetch(`${termaiWeb}/api/text2speech/elevenlabs?text=${encodeURIComponent(text)}&voice=${encodeURIComponent(voice)}&pitch=${encodeURIComponent(pitch)}&speed=${encodeURIComponent(speed)}&key=${termaiKey}`),
              audio = Buffer.from(await res.arrayBuffer())

        await vn(xp, audio, target)
        return !0

      default:
        return !1
    }
  } catch {
    return !1
  }
}

let rct_txt = `*berikut penjelasan fitur reaction cmd*\n`
    rct_txt += `${readmore}\n`
    rct_txt += `Reaction Command adalah fitur bot yang memungkinkan pengguna menjalankan perintah hanya dengan memberi reaction emoji pada pesan tertentu, tanpa mengetik command.\n\n`
    rct_txt += `*cara pakai*\nreact:\n`
    rct_txt += `❌ → hapus pesan ( digrup )\n`
    rct_txt += `👑 → menjadikan admin grup\n`
    rct_txt += `💨 → menurukan admin grup\n`
    rct_txt += `🦵 → mengeluarkan member dari grup\n`
    rct_txt += `🎤 → membuat vn dari chat yang direply`

export { rct_key, rct_txt }