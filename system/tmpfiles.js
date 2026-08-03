import axios from 'axios'
import Form from 'form-data'
import { fileTypeFromBuffer } from 'file-type'

export const termup = async (file, name, time) => {
  const { ext } = await fileTypeFromBuffer(file),
        form = new Form()

  name ??= 'pengguna'
  time ??= `${Date.now()}`

  form.append('file', file, { filename: `${name}-${time}.` + ext })

  const url = await axios.post(`https://c.termai.cc/api/upload?key=AIzaBj7z2z3xBjsk`, form, { headers: form.getHeaders() })

  return url.data
}

export const tmpFiles = async buffer => {
  const { ext, mime } = await fileTypeFromBuffer(buffer),
        filename = `${Date.now()}.${ext}`

  try {
    const form = new Form()

    form.append('file', buffer, {
      filename,
      contentType: mime
    })

    const { data } = await axios.post(
      'https://tmpfiles.org/api/v1/upload',
      form,
      { headers: form.getHeaders() }
    )

    return data.data.url.replace('s.org/', 's.org/dl/')
  } catch {
    try {
      const form = new Form()

      form.append('file', buffer, {
        filename,
        contentType: mime
      })

      const { data } = await axios.post(
        'https://tmpfile.link/api/upload',
        form,
        { headers: form.getHeaders() }
      )

      return data.downloadLink
    } catch (err) {
      throw err
    }
  }
}