import type { AiNodeData, NodeKind, NodeMediaSize, NodeMediaUpload } from '@/types/canvas'
import { DEFAULT_NODE_BODY_SIZE } from '@/views/canvas/constants/nodeStyles'

export type MediaKind = 'image' | 'video'

const IMAGE_EXTENSIONS = new Set(['jpeg', 'jpg', 'png'])
const VIDEO_EXTENSIONS = new Set(['mp4', 'mov'])

const IMAGE_MIME_TYPES = new Set(['image/jpeg', 'image/png'])
const VIDEO_MIME_TYPES = new Set(['video/mp4', 'video/quicktime'])

/** 媒体节点展示区域尺寸上下限 */
export const MEDIA_SIZE_LIMITS = {
  maxWidth: 400,
  maxHeight: 280,
  minWidth: 120,
  minHeight: 120,
} as const

function getExtension(name: string): string {
  const parts = name.split('.')
  return (parts.length > 1 ? parts.pop() : '')?.toLowerCase() ?? ''
}

export function toMediaKind(kind: NodeKind): MediaKind | null {
  if (kind === 'image' || kind === 'video') return kind
  return null
}

export function getAcceptForKind(kind: MediaKind): string {
  if (kind === 'image') {
    return '.jpg,.jpeg,.png,image/jpeg,image/png'
  }
  return '.mp4,.mov,video/mp4,video/quicktime'
}

export function validateMediaFile(file: File, kind: MediaKind): string | null {
  const ext = getExtension(file.name)

  if (kind === 'image') {
    if (!IMAGE_EXTENSIONS.has(ext)) {
      return '仅支持 JPEG、JPG、PNG 格式图片'
    }
    if (file.type && !IMAGE_MIME_TYPES.has(file.type)) {
      return '仅支持 JPEG、JPG、PNG 格式图片'
    }
    return null
  }

  if (!VIDEO_EXTENSIONS.has(ext)) {
    return '仅支持 MP4、MOV 格式视频'
  }
  if (file.type && !VIDEO_MIME_TYPES.has(file.type)) {
    return '仅支持 MP4、MOV 格式视频'
  }
  return null
}

export function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(new Error('文件读取失败'))
    reader.readAsDataURL(file)
  })
}

export function getPrimaryMediaUpload(data?: AiNodeData): NodeMediaUpload | undefined {
  return data?.uploads?.[0]
}

export function getPrimaryMediaUrl(data?: AiNodeData): string | undefined {
  return getPrimaryMediaUpload(data)?.url ?? data?.mediaUrl
}

/** 按原始宽高比适配到节点展示区域 */
export function fitMediaSize(
  naturalWidth: number,
  naturalHeight: number,
  fallback: NodeMediaSize = DEFAULT_NODE_BODY_SIZE.image,
): NodeMediaSize {
  if (!naturalWidth || !naturalHeight) return { ...fallback }

  const { maxWidth, maxHeight, minWidth, minHeight } = MEDIA_SIZE_LIMITS
  let width: number = maxWidth
  let height = width / (naturalWidth / naturalHeight)

  if (height > maxHeight) {
    height = maxHeight
    width = height * (naturalWidth / naturalHeight)
  }
  if (width < minWidth) {
    width = minWidth
    height = width / (naturalWidth / naturalHeight)
  }
  if (height < minHeight) {
    height = minHeight
    width = height * (naturalWidth / naturalHeight)
  }

  return {
    width: Math.round(width),
    height: Math.round(height),
  }
}

export function getImageDimensions(url: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight })
    }
    img.onerror = () => reject(new Error('无法读取图片尺寸'))
    img.src = url
  })
}

export function getVideoDimensions(url: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video')
    video.preload = 'metadata'
    video.onloadedmetadata = () => {
      resolve({ width: video.videoWidth, height: video.videoHeight })
      video.removeAttribute('src')
      video.load()
    }
    video.onerror = () => reject(new Error('无法读取视频尺寸'))
    video.src = url
  })
}

export function createMediaUpload(
  file: File,
  url: string,
  dimensions: { width: number; height: number },
): NodeMediaUpload {
  return {
    id: `upload-${Date.now()}`,
    url,
    width: dimensions.width,
    height: dimensions.height,
    mimeType: file.type || undefined,
    fileName: file.name,
    uploadedAt: new Date().toISOString(),
  }
}

export async function buildMediaUploadPayload(
  file: File,
  kind: MediaKind,
  url: string,
): Promise<{
  upload: NodeMediaUpload
  mediaSize: NodeMediaSize
  mediaUrl: string
}> {
  const dimensions =
    kind === 'video' ? await getVideoDimensions(url) : await getImageDimensions(url)
  const fallback = DEFAULT_NODE_BODY_SIZE[kind]
  const mediaSize = fitMediaSize(dimensions.width, dimensions.height, fallback)
  const upload = createMediaUpload(file, url, dimensions)

  return { upload, mediaSize, mediaUrl: url }
}

/** 旧数据仅有 mediaUrl 时补齐 uploads */
export function normalizeNodeMediaData(data: AiNodeData): AiNodeData {
  if (data.uploads?.length) {
    const primary = data.uploads[0]!
    return {
      ...data,
      mediaUrl: data.mediaUrl ?? primary.url,
    }
  }

  if (!data.mediaUrl) return data

  const fallback = DEFAULT_NODE_BODY_SIZE[data.kind] ?? DEFAULT_NODE_BODY_SIZE.image
  return {
    ...data,
    uploads: [
      {
        id: 'legacy',
        url: data.mediaUrl,
        width: 0,
        height: 0,
      },
    ],
    mediaSize: data.mediaSize ?? { ...fallback },
  }
}
