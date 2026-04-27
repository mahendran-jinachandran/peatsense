'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { api, setTokens, clearTokens, getAccessToken } from '@/services/api'
import type { User, LoginCredentials } from '@/types'

export const useAuth = () => {
  const [user,      setUser]      = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const router = useRouter()

  const isAuthenticated = user !== null

  useEffect(() => {
    const checkAuth = async () => {
      const token = getAccessToken()

      if (!token) {
        setIsLoading(false)
        return
      }

      try {
        const userData = await api.auth.me()
        setUser(userData)
      } catch {
        clearTokens()
        setUser(null)
      } finally {
        setIsLoading(false)
      }
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