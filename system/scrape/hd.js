import { fileTypeFromBuffer } from 'file-type'

async function hd(data) {
  log('[HD] Memulai proses enhance')

  try {
    const buffer = Buffer.isBuffer(data)
      ? data
      : Buffer.from(data, 'base64')

    if (!buffer.length)
      throw new Error('Input gambar kosong')

    const type = await fileTypeFromBuffer(buffer)

    if (!type?.mime?.startsWith('image/'))
      throw new TypeError('File harus berupa gambar')

    log('[HD] Format:', type.mime)

    const form = new FormData()

    form.append('method', '1')
    form.append('is_pro_version', 'false')
    form.append('is_enhancing_more', 'false')
    form.append('max_image_size', 'high')
    form.append('file', new Blob([buffer], {
      type: type.mime
    }), `image.${type.ext}`)

    log('[HD] Mengirim request ke API...')

    const res = await fetch('https://ihancer.com/api/enhance', {
      method: 'POST',
      headers: {
        'Accept-Encoding': 'gzip',
        'User-Agent': 'Dart/3.5 (dart:io)'
      },
      body: form,
      signal: AbortSignal.timeout(120000)
    })

    log('[HD] Response:', res.status, res.statusText)

    if (!res.ok)
      throw new Error(`HTTP ${res.status}: ${await res.text()}`)

    const result = Buffer.from(await res.arrayBuffer())

    if (!result.length)
      throw new Error('Hasil enhance kosong')

    const resultType = await fileTypeFromBuffer(result)

    if (!resultType?.mime?.startsWith('image/'))
      throw new Error('API tidak mengembalikan gambar valid')

    log('[HD] Berhasil:', {
      size: result.length,
      mime: resultType.mime
    })

    return result
  } catch (e) {
    log('[HD] PROSES GAGAL:', e)
    throw e
  }
}

export { hd }
