'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/services/api'

export default function RegisterPage() {
  const router = useRouter()

  const [username,    setUsername]    = useState('')
  const [email,       setEmail]       = useState('')
  const [password,    setPassword]    = useState('')
  const [error,       setError]       = useState<string | null>(null)
  const [isSubmitting,setIsSubmitting]= useState(false)
  const [success,     setSuccess]     = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!username.trim() || !password.trim()) {
      setError('Please fill in all required fields.')
      return
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }

    setError(null)
    setIsSubmitting(true)

    try {
      await api.auth.register({ username: username.trim(), password })
      setSuccess(true)
      setTimeout(() => router.push('/login'), 2000)
    } catch {
      setError('Registration failed. Username may already be taken.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (success) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="bg-white rounded-lg shadow-md p-8 w-full max-w-md text-center">
          <div className="text-green-600 text-5xl mb-4">✓</div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            Account Created
          </h2>
          <p className="text-gray-500">
            Redirecting to login...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center h-screen bg-gray-50">
      <div className="bg-white rounded-lg shadow-md p-8 w-full max-w-md">

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            🌿 PeatSense
          </h1>
          <p className="text-gray-500 mt-2">
            Create your account
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700
                         px-4 py-3 rounded mb-6 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Username <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Choose a username"
              disabled={isSubmitting}
              className="w-full px-3 py-2 border border-gray-300 rounded-md
                         focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
              <span className="text-gray-400 text-xs ml-1">(optional)</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              disabled={isSubmitting}
              className="w-full px-3 py-2 border border-gray-300 rounded-md
                         focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
              disabled={isSubmitting}
              className="w-full px-3 py-2 border border-gray-300 rounded-md
                         focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2 px-4 bg-green-600 hover:bg-green-700
                       disabled:bg-green-400 disabled:cursor-not-allowed
                       text-white font-medium rounded-md
                       transition-colors duration-200"
          >
            {isSubmitting ? 'Creating account...' : 'Create Account'}
          </button>

        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          Already have an account?{' '}
          <a href="/login" className="text-green-600 hover:underline font-medium">
            Sign in
          </a>
        </p>

      </div>
    </div>
  )
}