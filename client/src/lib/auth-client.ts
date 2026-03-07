import { createAuthClient } from 'better-auth/vue'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || ''

export const authClient = createAuthClient({
  baseURL: API_BASE_URL,
  fetchOptions: {
    credentials: 'include',
  },
})

export const {
  signIn,
  signUp,
  signOut,
  useSession,
  getSession,
} = authClient
