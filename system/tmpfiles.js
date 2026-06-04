import axios from 'axios'
import Form from 'form-data'
import { fileTypeFromBuffer } from 'file-type'

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