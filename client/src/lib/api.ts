import { ofetch, type FetchOptions } from 'ofetch'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || ''

// Custom error class for API errors
export class ApiError extends Error {
  status: number
  code?: string

  constructor(message: string, status: number, code?: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
  }
}

// API クライアント（ofetch ベース）
export const api = ofetch.create({
  baseURL: API_BASE_URL,
  credentials: 'include', // Cookie ベースの認証用
  headers: {
    'Content-Type': 'application/json',
  },
  async onResponseError({ response }) {
    const status = response.status

    // Handle different error statuses
    switch (status) {
      case 401:
        // Only redirect if not already on login page
        if (!window.location.pathname.includes('/login')) {
          const currentPath = window.location.pathname
          window.location.href = `/login?redirect=${encodeURIComponent(currentPath)}`
        }
        throw new ApiError('認証が必要です', 401, 'UNAUTHORIZED')

      case 403:
        throw new ApiError('アクセス権限がありません', 403, 'FORBIDDEN')

      case 404:
        throw new ApiError('リソースが見つかりません', 404, 'NOT_FOUND')

      case 429:
        throw new ApiError('リクエストが多すぎます。しばらく待ってから再試行してください', 429, 'TOO_MANY_REQUESTS')

      case 500:
      case 502:
      case 503:
        throw new ApiError('サーバーエラーが発生しました。しばらく待ってから再試行してください', status, 'SERVER_ERROR')

      default:
        throw new ApiError(`エラーが発生しました (${status})`, status, 'UNKNOWN_ERROR')
    }
  },
})

// 型付きAPI ヘルパー
export async function fetchApi<T>(
  endpoint: string,
  options?: FetchOptions<'json'>
): Promise<T> {
  return api<T>(endpoint, options)
}

// 共通レスポンス型
export interface ApiResponse<T> {
  data: T
  success: boolean
}

// ApiError class is exported above and provides message, status, and code properties

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  hasMore: boolean
}
