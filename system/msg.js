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

export default getMessageContent