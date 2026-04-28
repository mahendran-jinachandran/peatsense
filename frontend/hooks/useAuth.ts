'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  api,
  setTokens,
  clearTokens,
  getAccessToken,
  getStoredRefreshToken,
} from '@/services/api'
import type { User, LoginCredentials } from '@/types'

export const useAuth = () => {
  const [user,      setUser]      = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const router = useRouter()

  const isAuthenticated = user !== null

  useEffect(() => {
    const checkAuth = async () => {

      const token = getAccessToken()

      if (token) {
        try {
          const userData = await api.auth.me()
          setUser(userData)
          setIsLoading(false)
          return
        } catch {
          // Access token invalid — fall through to refresh
        }
      }

      const storedRefresh = getStoredRefreshToken()
      if (storedRefresh) {
        try {

          const newAccessToken = await api.auth.refreshToken(storedRefresh)
          setTokens({
            access:  newAccessToken,
            refresh: storedRefresh,
          })

          const userData = await api.auth.me()
          setUser(userData)

        } catch {
          clearTokens()
          setUser(null)
        }
      }

      setIsLoading(false)
    }

    checkAuth()
  }, [])

  const login = useCallback(async (
    credentials: LoginCredentials
  ): Promise<void> => {
    const tokens = await api.auth.login(credentials)
    setTokens(tokens)
    const userData = await api.auth.me()
    setUser(userData)
    router.push('/map')
  }, [router])

  const logout = useCallback((): void => {
    clearTokens()
    setUser(null)
    router.push('/login')
  }, [router])

  return {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
  }
}