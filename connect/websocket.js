import WS from 'ws'

let url = 'wss://api.dabisoft.my.id/ws',
    ws

function connectWs(xp) {
  if (!xp?.user?.id?.split(':')[0]) return !1

  try {
    ws = new WS(url)

    ws.on('open', () => {})

    ws.on('message', async data => {
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

    ws.on('close', () => {
      setTimeout(() => connectWs(xp), 5 * 1e3)
    })

    ws.on('error', e => {
      log('ws error', e)
      saveErr(e, 'ws')
    })
  } catch (e) {
    saveErr(e, 'ws')
    log('ws error', e)
  }
}

function sendWs(data) {
  if (!ws || ws.readyState !== WS.OPEN) return !1

  ws.send(JSON.stringify(data))

  return !0
}

export { sendWs, connectWs }