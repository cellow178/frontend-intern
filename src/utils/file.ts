export interface FileObjectInput {
  ext?: string
  url?: string
  tumbnail_url?: string
  filename?: string
  field_value?: string
}

export type FileSource = string | FileObjectInput | null | undefined

export const getFullFileUrl = (fileInput: FileSource): string | null => {
  if (!fileInput) return null

  // Ekstrak URL path dari String atau Object
  const urlPath =
    typeof fileInput === 'object'
      ? fileInput.url || fileInput.tumbnail_url || fileInput.field_value || ''
      : fileInput

  if (!urlPath) return null
  if (urlPath.startsWith('http://') || urlPath.startsWith('https://')) return urlPath

  const apiBaseUrl =
    import.meta.env.VITE_API_BASE_URL?.replace(/\/api\/?$/, '') || 'http://127.0.0.1:8000'
  const cleanUrl = urlPath.replace(/^\/+/, '')

  // Endpoint API (misal: "api/file/banners/...")
  if (cleanUrl.startsWith('api/')) {
    return `${apiBaseUrl}/${cleanUrl}`
  }

  // Storage Publik (misal: "2026/202609/...")
  if (!cleanUrl.startsWith('storage/')) {
    return `${apiBaseUrl}/storage/${cleanUrl}`
  }

  // Path yang sudah menyertakan /storage
  return `${apiBaseUrl}/${cleanUrl}`
}
