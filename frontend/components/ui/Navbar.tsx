'use client'

import type { User } from '@/types'

interface NavbarProps {
  user:      User | null
  onLogout:  () => void
  onUpload?: () => void
}

export default function Navbar({
  user,
  onLogout,
  onUpload,
}: NavbarProps) {

    console.log('Navbar user:', user)
  return (
    
    <nav className="h-14 bg-green-700 flex items-center
                    justify-between px-4 shrink-0 shadow-md">

      {/* Logo */}
      <div className="flex items-center gap-2">
        <span className="text-white font-bold text-xl">
          🌿 PeatSense Inc
        </span>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-3">

        {user?.is_staff && onUpload && (
          <button
            onClick={onUpload}
            className="px-3 py-1.5 bg-white text-green-700
                       rounded text-sm font-medium
                       hover:bg-green-50 transition-colors"
          >
            Upload Dataset
          </button>
        )}

        {user ? (
          <div className="flex items-center gap-3">
            <span className="text-green-100 text-sm">
              {user.username}
            </span>
            <button
              onClick={onLogout}
              className="px-3 py-1.5 bg-green-600 text-white
                         rounded text-sm font-medium
                         hover:bg-green-500 transition-colors"
            >
              Logout
            </button>
          </div>
        ) : (
          <a
            href="/login"
            className="px-3 py-1.5 bg-white text-green-700
                       rounded text-sm font-medium
                       hover:bg-green-50 transition-colors"
          >
            Login
          </a>
        )}

      </div>
    </nav>
  )
}