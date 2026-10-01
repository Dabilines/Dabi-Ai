import WS from 'ws'

let url = 'wss://api.dabisoft.my.id/ws',
    ws = new Map()

function connectWs(xp) {
  const botId = xp?.user?.id?.split(':')[0]

  if (!botId) return !1

  try {
    const socket = new WS(url)

    ws.set(botId, socket)

    socket.on('open', () => {
      socket.send(JSON.stringify({
        action: 'connect',
        id: botId,
        time: global.time.timeIndo("Asia/Jakarta", "HH:mm DD-MM-YYYY")
      }))
    })

    socket.on('message', async data => {
      try {
        const msg = JSON.parse(data.toString())

        if (msg.action !== 'rch') return

        const { id, server_id, reaction } = msg

        if (!id || !server_id || !reaction) return

        const randReact = Array.isArray(reaction)
          ? reaction[Math.floor(Math.random() * reaction.length)]
          : reaction

        try {
          xp.query({
            tag: 'message',
            attrs: {
              to: id,
              type: 'reaction',
              server_id,
              id: String(Date.now())
            },
            content: [{
              tag: 'reaction',
              attrs: {
                code: randReact
              }
            }]
          })
        } catch (e) {
          log(e)
        }
      } catch (e) {
        saveErr(e, 'ws message')
      }
    })

    socket.on('close', () => {
      if (ws.get(botId) === socket)
        ws.delete(botId)

      setTimeout(() => connectWs(xp), 5 * 1e3)
    })

    socket.on('error', e => {
      log('ws error', e)
      saveErr(e, 'ws')
    })
  } catch (e) {
    saveErr(e, 'ws')
    log('ws error', e)
  }
}

function sendWs(data) {
  const botId = data?.id,
        socket = ws.get(botId)

  if (!socket || socket.readyState !== WS.OPEN) return !1

  socket.send(JSON.stringify(data))

  return !0
}

export { sendWs, connectWs }