import fetch from 'node-fetch'
import fs from 'fs'

function getMessageContent(m) {
  let text = '',
      media = '',
      no = ''

  const chat = global.chat(m),
        key = m.key,
        msg = m.message,
        vo = key?.isViewOnce,
        stubType = m?.messageStubType,
        prm = msg?.protocolMessage,
        paramType = m.messageStubParameters

  no = (m?.key?.stub?.pn || chat.pushName || '').replace(/@.+$/, '')

  text =
    msg?.conversation
    || msg?.extendedTextMessage?.text
    || msg?.imageMessage?.caption
    || msg?.videoMessage?.caption
    || msg?.documentMessage?.caption
    || msg?.questionMessage?.message?.extendedTextMessage?.text
    || msg?.pollCreationMessageV5?.correctAnswer?.optionName
    || (msg?.call && 'seseorang menelpon')
    || (msg?.viewOnceMessage && 'Button Sekali lihat')
    || (m.call && 'Panggilan telepon')
    || (msg?.reactionMessage &&
        `Bereaksi ${msg.reactionMessage.text} ke ${msg.reactionMessage.key?.participant?.replace(/@s\.whatsapp\.net$/, '')}`)
    || (msg?.questionReplyMessage && `membalas ${msg?.questionReplyMessage?.message?.extendedTextMessage?.text} ke ${msg?.questionReplyMessage?.message?.extendedTextMessage?.contextInfo?.questionReplyQuotedMessage?.quotedResponse?.questionResponseMessage?.text}`)
    || (key?.remoteJid === 'status@broadcast' && 'Status')
    || (msg?.groupStatusMentionMessage && 'Grup ini disebut')
    || (prm?.type === 14 &&
        `Diedit ${prm?.editedMessage?.conversation || prm?.editedMessage?.extendedTextMessage?.text || ''}`.trim())
    || ({
        0: 'Pesan dihapus',
        3: 'Mengatur timer grup',
        5: 'Sinkronisasi',
        6: 'Sinkronisasi kunci aplikasi',
        9: 'Sinkronisasi kunci keamanan'
      })[prm?.type]
    || ({
        1: `${chat.sender.replace(/@s\.whatsapp\.net$/, '')} Menyimpan pesan`,
        2: `${chat.sender.replace(/@s\.whatsapp\.net$/, '')} Menghapus pesan tersimpan`
      })[msg?.keepInChatMessage?.keepType]
    || ({
        2: 'Pesan Rusak',
        20: 'Grup dibuat',
        22: 'Mengubah foto grup',
        24: `Mengedit info grup`,
        25: 'Mengedit peraturan anggota grup',
        26: 'Mengedit chat grup',
        27: 'Bergabung ke grup',
        28: `Mengeluarkan ${no}`,
        29: `Menjadikan ${no} admin`,
        30: `Menurunkan admin ${no}`,
        32: 'Keluar dari grup',
        145: 'Mengedit persetujuan admin',
        171: 'Mengedit peraturan tambahkan anggota',
        172: 'Meminta bergabung'
      })[stubType]
    || ({
        1: 'Menyematkan pesan',
        2: 'Melepaskan pin pesan'
      })[msg?.pinInChatMessage?.type]
    || (vo && 'Sekali lihat')

  const mt = {
    albumMessage: 'Album',
    audioMessage: 'Audio',
    contactMessage: `Kontak ${msg?.contactMessage?.displayName}`,
    documentMessage: 'Dokumen',
    eventMessage: `Acara ${msg?.eventMessage?.name}`,
    imageMessage: 'Gambar',
    interactiveMessage: 'Button',
    liveLocationMessage: 'Lokasi Live',
    locationMessage: 'Lokasi',
    lottieStickerMessage: 'Stiker Lottie',
    pollCreationMessage: 'Polling',
    pollCreationMessageV3: 'Polling',
    pollCreationMessageV5: 'Polling',
    pollUpdateMessage: 'Memilih polling',
    protocolMessage: 'Sistem',
    ptvMessage: 'Ptv',
    questionMessage: 'Pertanyaan',
    reactionMessage: 'Reaksi',
    stickerMessage: 'Stiker',
    stickerPackMessage: 'Stiker Pack',
    videoMessage: 'Video',
    groupStatusMessageV2: 'Status Group',
    questionReplyMessage: 'Pertanyaan',
    vo: 'Sekali lihat'
  }

  const mediaKey = Object.keys(msg || {}).find(k => mt[k])
  media = mediaKey ? mt[mediaKey] : ''
  media = text && media && text.toLowerCase() === media.toLowerCase() ? '' : media

  return { text, media }
}

async function sendMsg({ xp }) {
  xp.sendMsg = async (id, msg = {}, m) => {
    const type = msg.type || global.sendType || "image",
          image = msg.image || global.thumbnail || fs.readFileSync("./system/set/thumb-dabi.png"),
          body = msg.body || "",
          text = msg.text || "",
          mentions = Array.isArray(msg.mentions) && msg.mentions.length ? msg.mentions : null,
          options = m ? { quoted: m } : {},
          contextInfo = {
            forwardingScore: 1,
            isForwarded: !0,
            forwardedNewsletterMessageInfo: {
              newsletterJid: idCh,
              newsletterName: `klik disini untuk dukung ${botName}`
            }
          }

    if (type === "image" || type === "img") {
      let imageData = image

      try {
        if (!Buffer.isBuffer(image) && typeof image === "string" && /^https?:\/\//.test(image)) {
          const res = await fetch(image),
                arrayBuffer = await res.arrayBuffer()

          imageData = Buffer.from(arrayBuffer)
        }

        const payload = {
          image: imageData,
          caption: text,
          contextInfo
        }

        if (mentions) payload.mentions = mentions

        return await xp.sendMessage(id, payload, options)
      } catch (e) {
        throw e
      }
    }

    if (type === "priview" || type === "preview") {
      const payload = {
        text,
        contextInfo: {
          externalAdReply: {
            body: body || global.time.timeIndo("Asia/Jakarta", "HH:mm"),
            thumbnail: Buffer.isBuffer(image) ? image : fs.readFileSync("./set/dabi-thumb.png"),
            mediaType: 1,
            renderLargerThumbnail: !0
          },
          ...contextInfo
        }
      }

      if (mentions) payload.mentions = mentions

      return await xp.sendMessage(id, payload, options)
    }

    if (type === "text") {
      const payload = { text }

      if (mentions) payload.mentions = mentions

      return await xp.sendMessage(id, payload, options)
    }
  }
}

export {
  sendMsg,
  getMessageContent
}