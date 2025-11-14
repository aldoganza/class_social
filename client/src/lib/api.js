const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

async function request(path, options = {}) {
  const token = localStorage.getItem('token')
  const headers = options.headers ? { ...options.headers } : {}
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json'
  }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(`${BASE_URL}/api${path}`, {
    ...options,
    headers,
  })

  const contentType = res.headers.get('content-type') || ''
  const data = contentType.includes('application/json') ? await res.json() : await res.text()
  if (!res.ok) {
    let msg = 'Request failed'
    if (typeof data === 'string' && data.trim()) {
      msg = data
    } else if (data && typeof data === 'object') {
      if (data.error) msg = data.error
      else if (Array.isArray(data.errors) && data.errors.length) {
        // Express-validator: join messages
        msg = data.errors.map(e => e.msg || e.message || JSON.stringify(e)).join('\n')
      }
    }
    throw new Error(msg)
  }
  return data
}

export const api = {
  get: (path) => request(path),
  post: (path, body) => request(path, { method: 'POST', body: body instanceof FormData ? body : JSON.stringify(body) }),
  postForm: (path, formData) => request(path, { method: 'POST', body: formData }),
  put: (path, body) => request(path, { method: 'PUT', body: body instanceof FormData ? body : JSON.stringify(body) }),
  putForm: (path, formData) => request(path, { method: 'PUT', body: formData }),
  del: (path) => request(path, { method: 'DELETE' }),
  patch: (path, body) => request(path, { method: 'PATCH', body: body instanceof FormData ? body : JSON.stringify(body) }),
  patchForm: (path, formData) => request(path, { method: 'PATCH', body: formData }),
}
