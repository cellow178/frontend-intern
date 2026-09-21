// src/utils/file.ts

export interface FileObjectInput {
  ext?: string
  url?: string
  tumbnail_url?: string
  filename?: string
  field_value?: string
}

export const getFullFileUrl = (
  fileInput: string | FileObjectInput | null | undefined,
): string | null => {
  if (!fileInput) return null

  // Jika input berupa objek, ambil properti url atau field_value
  let urlPath = ''
  if (typeof fileInput === 'object') {
    urlPath = fileInput.url || fileInput.field_value || ''
  } else {
    urlPath = fileInput
  }

  if (!urlPath) return null
  if (urlPath.startsWith('http://') || urlPath.startsWith('https://')) return urlPath

  const apiBaseUrl =
    import.meta.env.VITE_API_BASE_URL?.replace(/\/api\/?$/, '') || 'http://127.0.0.1:8000'

  const cleanUrl = urlPath.replace(/^\/+/, '')

  // 1. Jika path merujuk ke endpoint API (misal: "api/file/banners/...")
  if (cleanUrl.startsWith('api/')) {
    return `${apiBaseUrl}/${cleanUrl}`
  }

  // 2. Jika path merujuk ke file storage publik (misal: "2026/202609/...")
  if (!cleanUrl.startsWith('storage/')) {
    return `${apiBaseUrl}/storage/${cleanUrl}`
  }

  // 3. Jika path sudah memiliki /storage di depannya
  return `${apiBaseUrl}/${cleanUrl}`
}
